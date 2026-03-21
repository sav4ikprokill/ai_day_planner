# AI Day Planner

Минимально рабочая версия проекта сейчас состоит из двух основных частей:

- `api-python`: FastAPI + SQLite backend для задач и привычек
- `web-platform`: React + Vite frontend для просмотра задач, быстрого добавления и управления привычками

Дополнительно в репозитории есть:

- `bot-js`: Telegram-бот, который можно запустить отдельно после указания реального токена
- `miniapp-ts`: черновой scaffold без полноценного runtime
- `packages/contracts`: общие Zod-схемы
- `packages/db-ts`: отдельная Postgres/Drizzle-заготовка, не участвующая в минимальном запуске

## Что реально работает сейчас

Минимальный конвейер:

1. `web-platform` отправляет запросы в `api-python`
2. `api-python` обрабатывает `/tasks/parse`, `/tasks/`, `/habits/`
3. данные сохраняются в SQLite-файл `planner.db`
4. frontend отображает сохранённые задачи и привычки

## Быстрый запуск через Docker Compose

Из корня проекта:

```powershell
docker compose up --build
```

После запуска:

- frontend: [http://localhost:5173](http://localhost:5173)
- backend: [http://localhost:8000](http://localhost:8000)

## Локальный запуск без Docker

### Backend

Рабочая директория:

```text
ai-planner-monorepo/services/api-python
```

Команды:

```powershell
Copy-Item .env.example .env
C:\Users\bital\OneDrive\Desktop\ai_day_planner\.venv\Scripts\pip.exe install -r requirements.txt
C:\Users\bital\OneDrive\Desktop\ai_day_planner\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

Рабочая директория:

```text
ai-planner-monorepo
```

Команды:

```powershell
Copy-Item .\apps\web-platform\.env.example .\apps\web-platform\.env
corepack enable
pnpm install
pnpm --filter @ai-planner/web-platform dev
```

## Bot

Рабочая директория:

```text
ai-planner-monorepo/services/bot-js
```

Команды:

```powershell
Copy-Item .env.example .env
node src/bot.js
```

Для запуска нужен реальный `TELEGRAM_BOT_TOKEN`.

## Статус частей проекта

- `api-python`: рабочая минимальная реализация
- `web-platform`: рабочая минимальная реализация
- `bot-js`: рабочий при наличии Telegram токена и доступного backend
- `miniapp-ts`: незавершённое
- `mobile-flutter`: незавершённое
- `admin-django`: незавершённое
- `worker-go`: незавершённое
- `reports-java`: незавершённое
- `scheduler-cpp`: незавершённое
