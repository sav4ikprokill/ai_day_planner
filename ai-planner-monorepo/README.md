# AI Day Planner

AI Day Planner — дипломный MVP ИИ-помощника планирования дня. Пользователь вводит задачу естественным языком, система преобразует её в структурированную запись, сохраняет в PostgreSQL и обрабатывает фоновые действия через jobs queue и worker.

## Тема диплома

**«Разработка ИИ-помощника планирования дня с голосовым вводом и автоподбором задач по привычкам»**

## Что входит в core MVP

- `services/api-python` — FastAPI backend
- `apps/web-platform` — основной web demo
- `services/worker-go` — фоновый worker
- PostgreSQL — основная база данных и jobs queue
- AI parsing через Gemini, если настроен `GEMINI_API_KEY`
- local fallback parser, если Gemini недоступен
- привычки как отдельный пользовательский сценарий
- голосовой ввод в web demo через браузерный Web Speech API

## Что не является core MVP

- `experimental/reports-java`
- `experimental/scheduler-cpp`
- Telegram bot без настроенного `TELEGRAM_BOT_TOKEN`

Эти части лучше подавать как experimental extensions, а не как обязательную часть базового сценария предзащиты.

## Главный пользовательский сценарий

1. Пользователь открывает web demo.
2. Создаёт задачу естественной фразой.
3. При желании использует голосовой ввод, после чего проверяет распознанный текст.
4. Подтверждает создание задачи вручную.
5. Видит задачу в списке.
6. Меняет статус задачи.
7. Создаёт привычку.

## Голосовой ввод

- Голосовой ввод реализован на клиентской стороне через Web Speech API: браузер распознаёт речь и передаёт backend уже текстовую команду.
- Аудио на сервер не отправляется и не хранится.
- Голосовой ввод не делает автосабмит: пользователь сначала видит текст в поле, потом сам нажимает создание задачи.
- Поддержка голосового ввода зависит от браузера и доступа к микрофону. При недоступности пользователь вводит команду текстом.
- Для demo лучше использовать Chrome или Edge.

## Что реально работает в MVP

- запуск core stack через Docker Compose
- FastAPI `/health` и `/docs`
- создание задач естественным языком
- fallback parser без Gemini
- сохранение задач в PostgreSQL
- создание jobs в PostgreSQL
- обработка jobs через Go worker
- web demo для предзащиты
- создание привычек
- изменение статуса задач
- голосовой ввод в web demo

## Ограничения

- Это MVP, а не production-grade planner.
- Качество fallback parser ниже, чем потенциальное качество внешнего LLM.
- Голосовой ввод зависит от браузера и прав на микрофон.
- Без SMTP и Telegram часть интеграционных сценариев остаётся demo-only.
- Experimental Java/C++ сервисы не должны быть центром демонстрации.
- Без load tests нельзя честно заявлять production-scale нагрузку.

## Как запустить core stack

```bash
docker compose up --build -d postgres api worker web-platform
```

## Как открыть demo

- Web demo: `http://127.0.0.1:5173`
- Swagger: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/health`

Важно:
- `api:8000` работает только внутри Docker network.
- В браузере на ноутбуке нужно использовать `127.0.0.1` или реальный LAN IP.

## Что проверять перед предзащитой

- `docker compose config`
- `docker compose up --build -d postgres api worker web-platform`
- открывается `http://127.0.0.1:5173`
- открывается `http://127.0.0.1:8000/docs`
- создаётся задача текстом
- создаётся задача голосом в поддерживаемом браузере
- задача видна в списке
- статус задачи меняется
- создаётся привычка
- `pnpm build`
- `pnpm typecheck`

## Полезные документы для предзащиты

- [DEMO_PREDEFENSE.md](/C:/Users/bital/OneDrive/Desktop/ai_day_planner/ai-planner-monorepo/DEMO_PREDEFENSE.md) — краткий сценарий показа
- [CHECKLIST_PREDEFENSE.md](/C:/Users/bital/OneDrive/Desktop/ai_day_planner/ai-planner-monorepo/CHECKLIST_PREDEFENSE.md) — чеклист подготовки
- [TEST_CASES_PREDEFENSE.md](/C:/Users/bital/OneDrive/Desktop/ai_day_planner/ai-planner-monorepo/TEST_CASES_PREDEFENSE.md) — smoke/test cases
- [PREDEFENSE_USER_REVIEW.md](/C:/Users/bital/OneDrive/Desktop/ai_day_planner/ai-planner-monorepo/PREDEFENSE_USER_REVIEW.md) — UX и пользовательский взгляд
- [DEPLOYMENT_FREE.md](/C:/Users/bital/OneDrive/Desktop/ai_day_planner/ai-planner-monorepo/DEPLOYMENT_FREE.md) — free staging deployment
- [PARSER_EVALUATION.md](/C:/Users/bital/OneDrive/Desktop/ai_day_planner/ai-planner-monorepo/PARSER_EVALUATION.md) — ручная оценка качества парсинга
- [USABILITY_FEEDBACK.md](/C:/Users/bital/OneDrive/Desktop/ai_day_planner/ai-planner-monorepo/USABILITY_FEEDBACK.md) — мини-юзабилити тестирование

## Что говорить комиссии коротко

AI Day Planner — это дипломный MVP системы, где пользователь может создать задачу текстом или голосом, backend превращает её в структурированную задачу, сохраняет в PostgreSQL и запускает фоновые действия через jobs queue и worker. Важная часть проекта — не только AI parsing, но и устойчивость сценария при недоступности внешнего AI за счёт fallback parser.
