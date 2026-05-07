package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
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

const (
	defaultPollDelay   = 2 * time.Second
	defaultBotNotifyURL = "http://bot-js:3001/notify"
)

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

type TelegramNotificationPayload struct {
	TelegramID int64  `json:"telegram_id"`
	Message    string `json:"message"`
}

type SMTPConfig struct {
	Host string
	Port string
	User string
	Pass string
}

type Habit struct {
	UserID        int64
	Category      string
	PreferredTime time.Time
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

	botNotifyURL := os.Getenv("BOT_NOTIFY_URL")
	if strings.TrimSpace(botNotifyURL) == "" {
		botNotifyURL = defaultBotNotifyURL
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
	go runHabitScheduler(ctx, pool, logger)

	if err := runWorker(ctx, pool, logger, pollDelay, smtpConfig, botNotifyURL); err != nil && !errors.Is(err, context.Canceled) {
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
	botNotifyURL string,
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

		processErr := processJob(job, logger, smtpConfig, botNotifyURL)
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
      AND task_type IN ('send_notification', 'send_telegram_notification')
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

func processJob(job Job, logger *slog.Logger, smtpConfig SMTPConfig, botNotifyURL string) error {
	payload := map[string]any{}
	if len(job.Payload) > 0 {
		if err := json.Unmarshal(job.Payload, &payload); err != nil {
			payload["raw"] = string(job.Payload)
		}
	}

	logger.Info("processing job", "job_id", job.ID, "task_name", job.TaskName, "payload", payload)

	switch job.TaskName {
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
	case "send_telegram_notification":
		var notificationPayload TelegramNotificationPayload
		if err := json.Unmarshal(job.Payload, &notificationPayload); err != nil {
			return fmt.Errorf("failed to decode telegram notification payload: %w", err)
		}

		if notificationPayload.TelegramID == 0 {
			return errors.New("telegram notification payload has empty telegram_id")
		}

		if notificationPayload.Message == "" {
			return errors.New("telegram notification payload has empty message")
		}

		if err := sendTelegramNotification(botNotifyURL, notificationPayload); err != nil {
			return fmt.Errorf("failed to send telegram notification: %w", err)
		}

		logger.Info("telegram notification sent", "job_id", job.ID, "telegram_id", notificationPayload.TelegramID)
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

func sendTelegramNotification(botNotifyURL string, payload TelegramNotificationPayload) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	client := &http.Client{Timeout: 10 * time.Second}
	request, err := http.NewRequest(http.MethodPost, botNotifyURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	request.Header.Set("Content-Type", "application/json")

	response, err := client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()

	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return fmt.Errorf("bot notify endpoint returned status %d", response.StatusCode)
	}

	return nil
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

func runHabitScheduler(ctx context.Context, pool *pgxpool.Pool, logger *slog.Logger) {
	for {
		waitDuration := durationUntilNextHabitRun(time.Now())
		logger.Info("habit scheduler sleeping", "wait", waitDuration.String())
		if err := sleepWithContext(ctx, waitDuration); err != nil {
			return
		}

		runCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		if err := createHabitTasks(runCtx, pool, logger); err != nil && !errors.Is(err, context.Canceled) {
			logger.Error("habit scheduler failed", "error", err)
		}
		cancel()
	}
}

func durationUntilNextHabitRun(now time.Time) time.Duration {
	nextRun := time.Date(now.Year(), now.Month(), now.Day(), 0, 5, 0, 0, now.Location())
	if !now.Before(nextRun) {
		nextRun = nextRun.Add(24 * time.Hour)
	}
	return nextRun.Sub(now)
}

func createHabitTasks(ctx context.Context, pool *pgxpool.Pool, logger *slog.Logger) error {
	habits, err := loadHabits(ctx, pool)
	if err != nil {
		return err
	}

	for _, habit := range habits {
		exists, err := hasHabitTaskToday(ctx, pool, habit.UserID, habit.Category)
		if err != nil {
			return err
		}
		if exists {
			continue
		}

		scheduledAt := time.Date(
			time.Now().Year(),
			time.Now().Month(),
			time.Now().Day(),
			habit.PreferredTime.Hour(),
			habit.PreferredTime.Minute(),
			0,
			0,
			time.Now().Location(),
		)

		taskID, err := insertHabitTask(ctx, pool, habit, scheduledAt)
		if err != nil {
			return err
		}

		logger.Info(
			"created recurring habit task",
			"task_id", taskID,
			"user_id", habit.UserID,
			"category", habit.Category,
		)
	}

	return nil
}

func loadHabits(ctx context.Context, pool *pgxpool.Pool) ([]Habit, error) {
	const query = `
SELECT user_id, category, preferred_time
FROM habits
ORDER BY id ASC;
`

	rows, err := pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	habits := make([]Habit, 0)
	for rows.Next() {
		var habit Habit
		if err := rows.Scan(&habit.UserID, &habit.Category, &habit.PreferredTime); err != nil {
			return nil, err
		}
		habits = append(habits, habit)
	}

	return habits, rows.Err()
}

func hasHabitTaskToday(ctx context.Context, pool *pgxpool.Pool, userID int64, category string) (bool, error) {
	const query = `
SELECT EXISTS(
    SELECT 1
    FROM tasks
    WHERE user_id = $1
      AND category = $2
      AND DATE(scheduled_at) = CURRENT_DATE
);
`

	var exists bool
	err := pool.QueryRow(ctx, query, userID, category).Scan(&exists)
	return exists, err
}

func insertHabitTask(ctx context.Context, pool *pgxpool.Pool, habit Habit, scheduledAt time.Time) (int64, error) {
	const query = `
INSERT INTO tasks (user_id, title, category, scheduled_at, duration_minutes, status, priority, source, created_at)
VALUES ($1, $2, $3, $4, 30, 'PLANNED', 'MEDIUM', 'HABIT', NOW())
RETURNING id;
`

	var taskID int64
	err := pool.QueryRow(
		ctx,
		query,
		habit.UserID,
		fmt.Sprintf("Привычка: %s", habit.Category),
		habit.Category,
		scheduledAt,
	).Scan(&taskID)
	return taskID, err
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
