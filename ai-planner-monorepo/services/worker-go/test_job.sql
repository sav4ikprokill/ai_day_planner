INSERT INTO jobs (task_type, payload, status)
VALUES (
    'send_notification',
    '{
      "chat_id": 123456789,
      "message": "Тестовое уведомление из AI Planner worker"
    }'::jsonb,
    'pending'
);
