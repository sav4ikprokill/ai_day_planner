package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/smtp"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

const defaultPollDelay = 2 * time.Second

type Job struct {
	ID       int64
	TaskName string
	Payload  json.RawMessage
	Status   string
}

type NotificationPayload struct {
	Email   string `json:"email"`
	Message string `json:"message"`
}

type SMTPConfig struct {
	Host string
	Port string
	User string
	Pass string
}

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	if err := godotenv.Load(); err != nil {
		logger.Info(".env file not found, using process environment")
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		logger.Error("DATABASE_URL is required")
		os.Exit(1)
	}

	smtpConfig := SMTPConfig{
		Host: os.Getenv("SMTP_HOST"),
		Port: os.Getenv("SMTP_PORT"),
		User: os.Getenv("SMTP_USER"),
		Pass: os.Getenv("SMTP_PASS"),
	}
	if !smtpConfig.IsConfigured() {
		logger.Warn("SMTP credentials are not fully configured, email notifications will be simulated")
	}

	pollDelay := loadPollDelay()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	pool, err := newPool(ctx, databaseURL)
	if err != nil {
		logger.Error("failed to connect to PostgreSQL", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	logger.Info("worker started", "poll_delay", pollDelay.String())

	if err := runWorker(ctx, pool, logger, pollDelay, smtpConfig); err != nil && !errors.Is(err, context.Canceled) {
		logger.Error("worker stopped with error", "error", err)
		os.Exit(1)
	}

	logger.Info("worker stopped gracefully")
}

func newPool(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}

	config.MaxConnLifetime = 30 * time.Minute
	config.MaxConnIdleTime = 5 * time.Minute
	config.HealthCheckPeriod = 30 * time.Second

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, err
	}

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, err
	}

	return pool, nil
}

func runWorker(
	ctx context.Context,
	pool *pgxpool.Pool,
	logger *slog.Logger,
	pollDelay time.Duration,
	smtpConfig SMTPConfig,
) error {
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		job, err := claimNextJob(ctx, pool)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				logger.Debug("no pending jobs found")
				if err := sleepWithContext(ctx, pollDelay); err != nil {
					return err
				}
				continue
			}

			logger.Error("failed to claim job", "error", err)
			if err := sleepWithContext(ctx, pollDelay); err != nil {
				return err
			}
			continue
		}

		logger.Info("claimed job", "job_id", job.ID, "task_name", job.TaskName)

		processErr := processJob(job, logger, smtpConfig)
		finalizeCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)

		if processErr != nil {
			logger.Error("job failed", "job_id", job.ID, "error", processErr)
			if err := markJobFailed(finalizeCtx, pool, job.ID); err != nil {
				logger.Error("failed to mark job as failed", "job_id", job.ID, "error", err)
			}
			cancel()
			continue
		}

		if err := markJobCompleted(finalizeCtx, pool, job.ID); err != nil {
			logger.Error("failed to mark job as completed", "job_id", job.ID, "error", err)
			cancel()
			continue
		}

		cancel()
		logger.Info("job completed", "job_id", job.ID)
	}
}

func claimNextJob(ctx context.Context, pool *pgxpool.Pool) (Job, error) {
	const query = `
UPDATE jobs
SET status = 'processing', updated_at = NOW()
WHERE id = (
    SELECT id
    FROM jobs
    WHERE status = 'pending'
      AND task_type = 'send_notification'
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
)
RETURNING id, task_type AS task_name, payload, status;
`

	var job Job

	err := pool.QueryRow(ctx, query).Scan(
		&job.ID,
		&job.TaskName,
		&job.Payload,
		&job.Status,
	)
	if err != nil {
		return Job{}, err
	}

	return job, nil
}

func processJob(job Job, logger *slog.Logger, smtpConfig SMTPConfig) error {
	payload := map[string]any{}
	if len(job.Payload) > 0 {
		if err := json.Unmarshal(job.Payload, &payload); err != nil {
			return err
		}
	}

	logger.Info("processing job", "job_id", job.ID, "task_name", job.TaskName, "payload", payload)

	switch job.TaskName {
	case "generate_report":
		time.Sleep(2 * time.Second)
		logger.Info("report generated", "job_id", job.ID)
	case "send_notification":
		var notificationPayload NotificationPayload
		if err := json.Unmarshal(job.Payload, &notificationPayload); err != nil {
			return fmt.Errorf("failed to decode notification payload: %w", err)
		}

		if strings.TrimSpace(notificationPayload.Email) == "" {
			return errors.New("notification payload has empty email")
		}

		if notificationPayload.Message == "" {
			return errors.New("notification payload has empty message")
		}

		if !smtpConfig.IsConfigured() {
			logger.Warn(
				"simulating email notification because SMTP credentials are not configured",
				"job_id", job.ID,
				"email", notificationPayload.Email,
			)
			return nil
		}

		if err := sendEmailNotification(
			smtpConfig.Host,
			smtpConfig.Port,
			smtpConfig.User,
			smtpConfig.Pass,
			notificationPayload.Email,
			notificationPayload.Message,
		); err != nil {
			return fmt.Errorf("failed to send email notification: %w", err)
		}

		logger.Info("notification sent", "job_id", job.ID, "email", notificationPayload.Email)
	default:
		time.Sleep(500 * time.Millisecond)
		logger.Info("generic job processed", "job_id", job.ID)
	}

	return nil
}

func sendEmailNotification(host, port, user, pass, to, message string) error {
	auth := smtp.PlainAuth("", user, pass, host)
	subject := "Subject: New Task Scheduled\r\n"
	fromHeader := fmt.Sprintf("From: %s\r\n", user)
	toHeader := fmt.Sprintf("To: %s\r\n", to)
	mimeHeader := "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=\"UTF-8\"\r\n"

	body := fromHeader + toHeader + subject + mimeHeader + "\r\n" + message

	return smtp.SendMail(
		host+":"+port,
		auth,
		user,
		[]string{to},
		[]byte(body),
	)
}

func (config SMTPConfig) IsConfigured() bool {
	return strings.TrimSpace(config.Host) != "" &&
		strings.TrimSpace(config.Port) != "" &&
		strings.TrimSpace(config.User) != "" &&
		strings.TrimSpace(config.Pass) != ""
}

func markJobCompleted(ctx context.Context, pool *pgxpool.Pool, jobID int64) error {
	return updateJobStatus(ctx, pool, jobID, "completed")
}

func markJobFailed(ctx context.Context, pool *pgxpool.Pool, jobID int64) error {
	return updateJobStatus(ctx, pool, jobID, "failed")
}

func updateJobStatus(ctx context.Context, pool *pgxpool.Pool, jobID int64, status string) error {
	const query = `
UPDATE jobs
SET status = $2, updated_at = NOW()
WHERE id = $1;
`

	_, err := pool.Exec(ctx, query, jobID, status)
	return err
}

func sleepWithContext(ctx context.Context, delay time.Duration) error {
	timer := time.NewTimer(delay)
	defer timer.Stop()

	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-timer.C:
		return nil
	}
}

func loadPollDelay() time.Duration {
	rawValue := os.Getenv("POLL_INTERVAL_SECONDS")
	if rawValue == "" {
		return defaultPollDelay
	}

	seconds, err := strconv.Atoi(rawValue)
	if err != nil || seconds <= 0 {
		return defaultPollDelay
	}

	return time.Duration(seconds) * time.Second
}
