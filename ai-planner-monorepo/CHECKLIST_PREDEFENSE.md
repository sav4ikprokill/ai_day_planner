# Checklist for pre-defense

## За 1–2 дня до показа

- проверить `docker compose config`
- проверить запуск core stack
- проверить `http://127.0.0.1:5173`
- проверить `http://127.0.0.1:8000/docs`
- проверить создание задачи текстом
- проверить создание задачи голосом в Chrome или Edge
- проверить изменение статуса задачи
- проверить создание привычки
- проверить, что fallback без Gemini не ломает core flow
- проверить `pnpm build`
- проверить `pnpm typecheck`
- перечитать [README.md](/C:/Users/bital/OneDrive/Desktop/ai_day_planner/ai-planner-monorepo/README.md)
- перечитать [DEMO_PREDEFENSE.md](/C:/Users/bital/OneDrive/Desktop/ai_day_planner/ai-planner-monorepo/DEMO_PREDEFENSE.md)
- подготовить [PARSER_EVALUATION.md](/C:/Users/bital/OneDrive/Desktop/ai_day_planner/ai-planner-monorepo/PARSER_EVALUATION.md) к ручному заполнению
- подготовить [USABILITY_FEEDBACK.md](/C:/Users/bital/OneDrive/Desktop/ai_day_planner/ai-planner-monorepo/USABILITY_FEEDBACK.md) к мини-тесту на 3–5 людях

## Накануне

- прогнать demo 2–3 раза подряд
- подготовить короткий fallback-сценарий без Gemini
- решить заранее, показывать ли голосовой ввод на комиссии
- если показывать голос, проверить микрофон именно на том ноутбуке и в том браузере, где будет демонстрация
- сделать скриншоты frontend, Swagger и `docker compose ps`
- подготовить ответы на вопросы про качество parser и UX

## В день предзащиты

- не вносить новые изменения в код
- заранее открыть проект и дождаться полного запуска
- открыть:
  - frontend
  - Swagger
  - терминал с `docker compose ps`
- иметь под рукой короткие фразы для demo:
  - `купить продукты завтра в 18:00`
  - `добавь тренировку завтра в 19:00`
- если голосовой ввод не сработал, сразу перейти на текстовый ввод
- отдельно проговорить, что Java/C++ — experimental

## Что не забыть проговорить

- core MVP: FastAPI + PostgreSQL + web demo + Go worker
- AI parsing может работать через Gemini или через fallback
- голосовой ввод идёт только на клиенте через Web Speech API
- аудио на сервер не отправляется и не хранится
- качество parser оценивалось на небольшом ручном evaluation-наборе
- понятность сценария проверялась через маленький qualitative usability test
