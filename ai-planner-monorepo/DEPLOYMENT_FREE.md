# Free staging deployment

## Architecture
- Vercel: web frontend (`apps/web-platform`)
- Render: FastAPI backend (`services/api-python`)
- Render PostgreSQL
- Render background worker (`services/worker-go`)

This setup is intended for a free or near-free staging/demo environment for pre-defense, not for production traffic.

## What not to deploy
- Java reports experimental (`experimental/reports-java`)
- C++ scheduler experimental (`experimental/scheduler-cpp`)
- Telegram bot unless `TELEGRAM_BOT_TOKEN` is configured

## Required env variables

### Frontend
- `VITE_API_BASE_URL=https://<render-api-url>`
- `VITE_DEMO_INIT_DATA=dev-mode-init-data` only for hosted demo without real Telegram `initData`

### Backend
- `DATABASE_URL`
- `ENV=staging` for demo staging or `ENV=production` for production-like validation
- `ALLOW_DEV_INIT_DATA_BYPASS=false` for production-like mode
- `ALLOW_DEV_INIT_DATA_BYPASS=true` only for demo mode without real Telegram auth
- `GEMINI_API_KEY` optional
- `TELEGRAM_BOT_TOKEN` optional
- `CORS_ORIGINS=https://<vercel-frontend-url>`

Notes:
- The API accepts both `postgresql+asyncpg://...` and Render-style `postgresql://...` values for `DATABASE_URL`.
- Demo bypass uses a single shared demo user (`telegram_id=7777777`).
- In production, bypass must stay disabled.
- Frontend auth source order is: real `Telegram.WebApp.initData` -> `VITE_DEMO_INIT_DATA` -> no auth header.

### Worker
- `DATABASE_URL`
- `SMTP_HOST` optional
- `SMTP_PORT` optional
- `SMTP_USER` optional
- `SMTP_PASS` optional
- `BOT_NOTIFY_URL` optional
- `POLL_INTERVAL_SECONDS` optional

## Vercel setup
1. Import the GitHub repository into Vercel.
2. Set the root directory to `ai-planner-monorepo/apps/web-platform`.
3. Use the build command `pnpm build`.
4. Use the output directory `dist`.
5. Add the environment variable `VITE_API_BASE_URL=https://<render-api-url>`.
6. For hosted demo only, add `VITE_DEMO_INIT_DATA=dev-mode-init-data`.
7. Confirm auto-deploy is enabled for GitHub pushes. Every push to the tracked branch triggers a new frontend deployment automatically.

If the Vercel project needs monorepo context from the repository root, set the root directory to `ai-planner-monorepo`, then use:
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm --filter @ai-planner/web-platform build`
- Output directory: `apps/web-platform/dist`

## Render setup
1. Create a PostgreSQL service in Render.
2. Copy the database connection string from Render.
3. Create a Web Service for `services/api-python`.
4. Set the build method to Docker using `services/api-python/Dockerfile`.
5. Set backend environment variables:
   - `DATABASE_URL=<Render PostgreSQL URL>`
   - `ENV=staging` for demo mode or `ENV=production` for production-like mode
   - `ALLOW_DEV_INIT_DATA_BYPASS=true` only for demo mode without Telegram
   - `ALLOW_DEV_INIT_DATA_BYPASS=false` for production-like mode
   - `CORS_ORIGINS=https://<vercel-frontend-url>`
   - `GEMINI_API_KEY` optional
   - `TELEGRAM_BOT_TOKEN` optional
6. The API container runs `alembic upgrade head` on startup, so migrations are applied during deploy.
7. Create a Background Worker for `services/worker-go`.
8. Set the worker build method to Docker using `services/worker-go/Dockerfile`.
9. Set worker environment variables:
   - `DATABASE_URL=<Render PostgreSQL URL>`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` optional
   - `BOT_NOTIFY_URL` optional
   - `POLL_INTERVAL_SECONDS=2` optional
10. Check Render logs for startup success, migration output, and worker connection status.

## Demo mode warning
- If the demo runs without Telegram authentication, you may use `ENV=staging` and `ALLOW_DEV_INIT_DATA_BYPASS=true`.
- In the hosted demo frontend, set `VITE_DEMO_INIT_DATA=dev-mode-init-data`.
- This bypass always authenticates as one shared demo user.
- For production-like verification, set `ALLOW_DEV_INIT_DATA_BYPASS=false`.
- For production-like verification, do not set `VITE_DEMO_INIT_DATA` in Vercel.
- Do not enable bypass in production.

## Update workflow
1. Edit code locally.
2. Run `git add`, `git commit`, and `git push`.
3. Vercel rebuilds and redeploys the frontend automatically.
4. Render rebuilds and redeploys the API and worker automatically if auto-deploy is enabled for the connected branch.
5. Check Vercel deployment logs, Render deploy logs, and Render runtime logs.

## Rollback
- Revert the last bad commit and push again.
- In Vercel, redeploy or promote a previous successful deployment.
- In Render, redeploy a previous commit if that option is available for the service.

## Risks
- Free PostgreSQL tiers are often limited in storage, throughput, or retention, and may change over time.
- Free services may sleep, cold start, or respond slowly after inactivity.
- Gemini quota or external API quotas may block AI-related features.
- CORS misconfiguration can make the frontend appear broken even when the API is healthy.
- Wrong env values can break auth, DB connectivity, or worker notifications.
- Startup migrations can fail if the database state diverges from the expected Alembic history.
- A Render background worker may not fit permanently inside a truly free plan, depending on current Render pricing and availability.

## URLs to check after deploy
- Frontend: `https://<vercel-frontend-url>`
- API root: `https://<render-api-url>/`
- API health: `https://<render-api-url>/health`
