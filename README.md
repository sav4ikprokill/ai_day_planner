# AI Day Planner

Современная система планирования задач на основе ИИ с микросервисной архитектурой.

## 🚀 Возможности

- **Естественный язык**: Создание задач через текстовые описания с ИИ-парсингом
- **Оптимизация расписания**: Автоматическая оптимизация порядка задач
- **Кросс-платформенность**: Telegram Mini App + PWA + веб-приложение
- **Асинхронная обработка**: Фоновые воркеры для уведомлений и обработки
- **Микросервисы**: Полилинговая архитектура (Python, Go, TypeScript, Java, C++)

## 🏗️ Архитектура

## System Architecture

```mermaid
graph TD
    subgraph Clients["🎯 Clients (Frontend)"]
        TelegramMiniApp["Telegram Mini App<br/>(React + TypeScript)"]
        PWA["Progressive Web App<br/>(React + TypeScript)"]
        WebPlatform["Web Platform<br/>(React + TypeScript)"]
    end

    subgraph CoreBackend["🔷 Core Backend"]
        APIGateway["Python FastAPI<br/>API Gateway<br/>(Auth, AI Parsing)"]
        Gemini["Google Gemini LLM<br/>(AI Parsing & Analysis)"]
    end

    subgraph DataLayer["💾 Data Layer"]
        PostgreSQL["PostgreSQL Database<br/>(Users, Tasks, Habits,<br/>Jobs Outbox)"]
    end

    subgraph Workers["⚙️ Microservices & Workers"]
        GoWorker["Go Worker<br/>(SKIP LOCKED Polling)<br/>→ SMTP Emails"]
        JavaReports["Java Reports Service<br/>(SKIP LOCKED Polling)<br/>→ Generate Reports"]
        CppScheduler["C++ Scheduler<br/>/optimize Endpoint<br/>(Task Sorting)"]
    end

    %% Client to Backend flows
    TelegramMiniApp -->|API Requests| APIGateway
    PWA -->|API Requests| APIGateway
    WebPlatform -->|API Requests| APIGateway

    %% Backend to External APIs
    APIGateway -->|Parse Tasks & Habits| Gemini
    Gemini -->|AI Results| APIGateway

    %% Backend to Database
    APIGateway -->|Read/Write User Data| PostgreSQL
    APIGateway -->|Enqueue Jobs| PostgreSQL

    %% Scheduler integration
    APIGateway -->|/optimize Request| CppScheduler
    CppScheduler -->|Sorted Tasks| APIGateway

    %% Workers polling Jobs table
    GoWorker -->|Poll Jobs SKIP LOCKED| PostgreSQL
    GoWorker -->|SMTP Send| Email["📧 Email Service"]
    
    JavaReports -->|Poll Jobs SKIP LOCKED| PostgreSQL
    JavaReports -->|Store Reports| PostgreSQL

    %% Database update feedback
    PostgreSQL -->|Job Status Updates| GoWorker
    PostgreSQL -->|Job Status Updates| JavaReports

    style Clients fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    style CoreBackend fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    style DataLayer fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    style Workers fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style Email fill:#ffebee,stroke:#b71c1c,stroke-width:2px
```

### Сервисы

- **api-python**: FastAPI backend с PostgreSQL
- **worker-go**: Go воркер для уведомлений
- **bot-js**: Telegram бот
- **web-platform**: React PWA frontend
- **miniapp-ts**: Telegram Mini App
- **reports-java**: Java сервис отчетов (экспериментальный)
- **scheduler-cpp**: C++ оптимизатор расписания (экспериментальный)

### Технологии

- **Frontend**: React 19, TypeScript, Vite, Emotion, PWA
- **Backend**: FastAPI, SQLAlchemy, asyncpg, Alembic
- **Database**: PostgreSQL с миграциями
- **Async**: Go воркеры, PostgreSQL как очередь
- **AI**: Google Gemini для парсинга текста
- **Deployment**: Docker Compose

## 📋 Быстрый запуск

### Предварительные требования

- Docker Desktop
- Node.js 20+ (для локальной разработки)
- Python 3.11+ (для локальной разработки)

### Запуск через Docker

```bash
# Из корня проекта
docker-compose up --build
```

После запуска:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: postgres://localhost:5432 (user: planner, pass: planner)

### Локальная разработка

#### Backend (Python)

```bash
cd ai-planner-monorepo/services/api-python
cp .env.example .env
# Отредактируйте .env при необходимости
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd ai-planner-monorepo
pnpm install
pnpm dev --filter web-platform
```

#### Worker (Go)

```bash
cd ai-planner-monorepo/services/worker-go
cp .env.example .env
go run main.go
```

## 🧪 Тестирование

```bash
# Python тесты
cd ai-planner-monorepo/services/api-python
pip install pytest
pytest

# Go тесты
cd ai-planner-monorepo/services/worker-go
go test -v

# TypeScript сборка
cd ai-planner-monorepo
pnpm build
```

## 📚 Документация

- [Архитектурный отчет](ai-planner-monorepo/ARCHITECTURE_REPORT.md)
- [API документация](http://localhost:8000/docs) (после запуска)

## 🎯 Демонстрация

1. Запустите `docker-compose up --build`
2. Откройте http://localhost:5173
3. Создайте задачу через текстовое описание
4. Просмотрите оптимизированное расписание
5. Проверьте Telegram интеграцию (опционально)

## 🔧 Конфигурация

### Переменные окружения

Скопируйте `.env.example` в `.env` для каждого сервиса и настройте:

- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: Google AI API key (опционально)
- `TELEGRAM_BOT_TOKEN`: Telegram bot token (опционально)
- `SMTP_*`: Email настройки (опционально)

### Development mode

Для демонстрации установите `ALLOW_DEV_INIT_DATA_BYPASS=true` в API .env

## 📈 Производственная готовность

- ✅ Health checks
- ✅ Graceful degradation
- ✅ Transactional job queue
- ✅ Cross-platform PWA
- ✅ Comprehensive logging
- ✅ Docker containerization
- ✅ CI/CD pipeline
- ⚠️  Monitoring/metrics (можно добавить)
- ⚠️  Security audit (рекомендуется)

## 🤝 Вклад

Проект разработан как дипломная работа. Для улучшений:

1. Fork репозиторий
2. Создайте feature branch
3. Добавьте тесты
4. Отправьте PR

## 📄 Лицензия

MIT License
