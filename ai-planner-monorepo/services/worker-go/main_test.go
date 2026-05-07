package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

func TestProcessJob(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelError}))

	smtpConfig := SMTPConfig{}

	botServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Fatalf("expected POST request, got %s", r.Method)
		}
		w.WriteHeader(http.StatusNoContent)
	}))
	defer botServer.Close()

	botNotifyURL := botServer.URL

	tests := []struct {
		name        string
		job         Job
		expectError bool
		errorMsg    string
	}{
		{
			name: "valid email notification payload",
			job: Job{
				ID:       1,
				TaskName: "send_notification",
				Payload:  json.RawMessage(`{"email": "test@example.com", "message": "Test message"}`),
			},
			expectError: false,
		},
		{
			name: "missing email in notification payload",
			job: Job{
				ID:       2,
				TaskName: "send_notification",
				Payload:  json.RawMessage(`{"message": "Test message"}`),
			},
			expectError: true,
			errorMsg:    "notification payload has empty email",
		},
		{
			name: "malformed JSON payload",
			job: Job{
				ID:       3,
				TaskName: "send_notification",
				Payload:  json.RawMessage(`invalid json`),
			},
			expectError: true,
			errorMsg:    "failed to decode notification payload",
		},
		{
			name: "valid telegram notification payload",
			job: Job{
				ID:       4,
				TaskName: "send_telegram_notification",
				Payload:  json.RawMessage(`{"telegram_id": 123456, "message": "Test message"}`),
			},
			expectError: false,
		},
		{
			name: "missing telegram_id in payload",
			job: Job{
				ID:       5,
				TaskName: "send_telegram_notification",
				Payload:  json.RawMessage(`{"message": "Test message"}`),
			},
			expectError: true,
			errorMsg:    "telegram notification payload has empty telegram_id",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := processJob(tt.job, logger, smtpConfig, botNotifyURL)
			if tt.expectError {
				if err == nil {
					t.Errorf("expected error but got none")
				} else if tt.errorMsg != "" && !contains(err.Error(), tt.errorMsg) {
					t.Errorf("expected error message to contain %q, got %q", tt.errorMsg, err.Error())
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
				}
			}
		})
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && (s[:len(substr)] == substr || s[len(s)-len(substr):] == substr || contains(s[1:], substr)))
}
