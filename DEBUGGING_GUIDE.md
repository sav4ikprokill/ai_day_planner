# 🔍 Task Creation Debugging Guide - AI Day Planner

## Problem Summary
Tasks are not being created when using the deployed application (Render + Vercel).

---

## 🎯 Root Cause Analysis

Based on the codebase analysis, task creation can fail at **5 critical points**:

### 1. **Authentication Failure** (Most Likely)
**Location**: `app/api/deps.py` - `get_current_user()`

**Symptoms**:
- 401 Unauthorized errors
- "X-Telegram-Init-Data header is required" error
- "Invalid Telegram init data" error

**Causes**:
- Missing or incorrect `X-Telegram-Init-Data` header from frontend
- `TELEGRAM_BOT_TOKEN` not set on Render (required for HMAC validation)
- `ALLOW_DEV_INIT_DATA_BYPASS` misconfigured
- Frontend not sending `VITE_DEMO_INIT_DATA` correctly

**Code Flow**:
```python
# deps.py line 25-50
async def get_current_user(...):
    if not x_telegram_init_data:
        raise HTTPException(401, "X-Telegram-Init-Data header is required")
    
    # Dev bypass check
    if (x_telegram_init_data == "dev-mode-init-data" 
        and settings.allow_dev_init_data_bypass 
        and settings.env in {"development", "staging"}):
        # Uses demo user (telegram_id=7777777)
    else:
        # Validates with TELEGRAM_BOT_TOKEN
        user_payload = validate_telegram_data(init_data, bot_token)
```

---

### 2. **CORS Configuration**
**Location**: `app/main.py` - CORS middleware

**Symptoms**:
- Network errors in browser console
- "CORS policy" errors
- Requests blocked before reaching the API

**Causes**:
- `CORS_ORIGINS` on Render doesn't include your Vercel URL
- Vercel URL has trailing slash but CORS config strips it
- Using wrong protocol (http vs https)

**Code**:
```python
# main.py line 21-28
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # Must match Vercel URL exactly
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### 3. **Database Connection**
**Location**: `app/db/session.py` + `app/core/config.py`

**Symptoms**:
- 500 Internal Server Error
- "Connection refused" in Render logs
- "Database connection failed" errors

**Causes**:
- `DATABASE_URL` not set or incorrect on Render
- PostgreSQL instance not running or not accessible
- Wrong database URL format (should be `postgresql+asyncpg://...`)

**Code**:
```python
# config.py line 10-20
def _normalize_database_url(raw_value: str | None) -> str:
    if raw_value.startswith("postgresql://"):
        return raw_value.replace("postgresql://", "postgresql+asyncpg://", 1)
    return raw_value
```

---

### 4. **Database Migrations Not Applied**
**Location**: `Dockerfile` CMD + Alembic

**Symptoms**:
- "Table does not exist" errors
- "Column not found" errors
- 500 errors with database-related stack traces

**Causes**:
- Migrations failed during deployment
- Database schema out of sync
- Alembic history corrupted

**Code**:
```dockerfile
# Dockerfile line 16
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

---

### 5. **Frontend API Configuration**
**Location**: `apps/web-platform/src/api/client.ts`

**Symptoms**:
- Requests going to localhost instead of Render
- Network timeout errors
- "Failed to fetch" errors

**Causes**:
- `VITE_API_BASE_URL` not set in Vercel
- Wrong Render URL configured
- Frontend not sending auth header

**Code**:
```typescript
// client.ts line 74-77
export const apiClient = createApiClient(
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,  // Falls back to localhost!
  getTelegramInitData,
);
```

---

## 🛠️ Step-by-Step Debugging Process

### **Step 1: Verify Render Environment Variables**

Check these in your Render API service dashboard:

```bash
# REQUIRED
DATABASE_URL=postgresql://planner:password@host/database
ENV=staging  # or "production"
CORS_ORIGINS=https://your-app.vercel.app

# REQUIRED for demo mode (no real Telegram auth)
ALLOW_DEV_INIT_DATA_BYPASS=true

# OPTIONAL but recommended
GEMINI_API_KEY=your_key_here
TELEGRAM_BOT_TOKEN=your_token_here  # Required if NOT using dev bypass
```

**Critical**: If using demo mode:
- `ALLOW_DEV_INIT_DATA_BYPASS=true`
- `ENV=staging` (NOT production)
- Frontend must send `dev-mode-init-data` as the header value

**Critical**: If using real Telegram auth:
- `ALLOW_DEV_INIT_DATA_BYPASS=false`
- `TELEGRAM_BOT_TOKEN=<your_bot_token>`
- Frontend must send real Telegram `initData`

---

### **Step 2: Verify Vercel Environment Variables**

Check these in your Vercel project settings:

```bash
# REQUIRED
VITE_API_BASE_URL=https://your-api.onrender.com

# REQUIRED for demo mode only
VITE_DEMO_INIT_DATA=dev-mode-init-data
```

**Important**: 
- No trailing slash on `VITE_API_BASE_URL`
- Must be HTTPS (Render provides this)
- Redeploy Vercel after changing env vars

---

### **Step 3: Check Render Logs**

Go to Render dashboard → Your API service → Logs

Look for:

```bash
# ✅ Good signs:
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000

# ❌ Bad signs:
sqlalchemy.exc.OperationalError: could not connect to server
alembic.util.exc.CommandError: Can't locate revision
ERROR:    Exception in ASGI application
```

---

### **Step 4: Test API Health Endpoint**

```bash
# Test from your browser or terminal
curl https://your-api.onrender.com/health

# Expected response:
{"status":"ok"}
```

If this fails, your API is not running correctly.

---

### **Step 5: Test Authentication**

```bash
# Test with demo auth (if ALLOW_DEV_INIT_DATA_BYPASS=true)
curl -X GET https://your-api.onrender.com/tasks/ \
  -H "X-Telegram-Init-Data: dev-mode-init-data"

# Expected: 200 OK with task list (may be empty)
# If 401: Auth is broken
```

---

### **Step 6: Test Task Creation Directly**

```bash
# Test creating a task via API directly
curl -X POST https://your-api.onrender.com/tasks/ \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Init-Data: dev-mode-init-data" \
  -d '{
    "title": "Test Task",
    "category": "work",
    "duration_minutes": 30,
    "priority": "medium",
    "source": "manual"
  }'

# Expected: 201 Created with task object
# If 401: Auth problem
# If 500: Database or internal error
# If 422: Validation error (check request body)
```

---

### **Step 7: Check Browser Console**

Open your Vercel app → F12 Developer Tools → Console

Look for:

```javascript
// ❌ Bad signs:
Failed to fetch
CORS policy: No 'Access-Control-Allow-Origin' header
401 Unauthorized
Network Error

// ✅ Good signs:
POST https://your-api.onrender.com/tasks/ 201
```

Also check Network tab:
- Request Headers: Should include `X-Telegram-Init-Data`
- Response: Check status code and error message

---

### **Step 8: Verify Database Connection**

SSH into Render or check logs for:

```bash
# Database connection test
# Should see in startup logs:
INFO:sqlalchemy.engine.Engine:BEGIN (implicit)
INFO:sqlalchemy.engine.Engine:SELECT version()
```

If you see connection errors, verify:
- PostgreSQL service is running on Render
- `DATABASE_URL` is correct
- Database accepts connections from your API service

---

### **Step 9: Check Database Schema**

Verify migrations ran successfully:

```bash
# In Render logs, look for:
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade -> abc123, initial schema
```

If migrations failed:
1. Check Alembic version compatibility
2. Verify database permissions
3. Check for schema conflicts

---

## 🔧 Common Fixes

### Fix 1: Demo Mode Not Working

**Problem**: 401 errors even with `dev-mode-init-data`

**Solution**:
```bash
# On Render API service:
ALLOW_DEV_INIT_DATA_BYPASS=true
ENV=staging  # NOT "production"

# On Vercel:
VITE_DEMO_INIT_DATA=dev-mode-init-data

# Redeploy both services
```

---

### Fix 2: CORS Errors

**Problem**: "CORS policy" errors in browser

**Solution**:
```bash
# On Render, set CORS_ORIGINS to your EXACT Vercel URL:
CORS_ORIGINS=https://your-app.vercel.app

# No trailing slash!
# Use https:// not http://
# Get exact URL from Vercel dashboard
```

---

### Fix 3: Database Connection Failed

**Problem**: "could not connect to server" errors

**Solution**:
1. Go to Render → PostgreSQL service → Connection Info
2. Copy the **Internal Database URL**
3. Set on API service:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```
4. Render will auto-convert to `postgresql+asyncpg://`

---

### Fix 4: Frontend Pointing to Localhost

**Problem**: Requests going to `http://127.0.0.1:8000`

**Solution**:
```bash
# In Vercel, add environment variable:
VITE_API_BASE_URL=https://your-api.onrender.com

# Then redeploy Vercel (env vars require rebuild)
```

---

### Fix 5: Migrations Not Applied

**Problem**: "Table 'tasks' does not exist"

**Solution**:
1. Check Render logs for migration errors
2. If migrations failed, manually trigger:
   - Go to Render → API service → Shell
   - Run: `alembic upgrade head`
3. If that fails, check Alembic history:
   - Run: `alembic current`
   - Run: `alembic history`

---

## 📋 Complete Checklist

Use this checklist to verify everything:

### Render API Service
- [ ] `DATABASE_URL` is set and correct
- [ ] `ENV=staging` (for demo) or `ENV=production`
- [ ] `ALLOW_DEV_INIT_DATA_BYPASS=true` (for demo mode)
- [ ] `CORS_ORIGINS` includes exact Vercel URL (https, no trailing slash)
- [ ] Service is running (check status)
- [ ] Logs show "Application startup complete"
- [ ] Logs show migrations ran successfully
- [ ] Health endpoint returns `{"status":"ok"}`

### Render PostgreSQL
- [ ] Service is running
- [ ] Database is accessible from API service
- [ ] Connection string is correct

### Vercel Frontend
- [ ] `VITE_API_BASE_URL` is set to Render API URL
- [ ] `VITE_DEMO_INIT_DATA=dev-mode-init-data` (for demo mode)
- [ ] Latest deployment is successful
- [ ] Environment variables are set for production deployment

### Browser Testing
- [ ] No CORS errors in console
- [ ] Network tab shows requests going to Render (not localhost)
- [ ] `X-Telegram-Init-Data` header is present in requests
- [ ] API returns 200/201, not 401/500

---

## 🚨 Emergency Debugging Commands

If nothing works, run these tests:

```bash
# 1. Test API is reachable
curl https://your-api.onrender.com/

# 2. Test health endpoint
curl https://your-api.onrender.com/health

# 3. Test auth with demo mode
curl -H "X-Telegram-Init-Data: dev-mode-init-data" \
  https://your-api.onrender.com/tasks/

# 4. Test task creation
curl -X POST https://your-api.onrender.com/tasks/parse \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Init-Data: dev-mode-init-data" \
  -d '{"text":"Buy groceries tomorrow","source":"text"}'

# 5. Check CORS preflight
curl -X OPTIONS https://your-api.onrender.com/tasks/ \
  -H "Origin: https://your-app.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

---

## 📞 What to Check in Logs

### Render API Logs - Look For:

**Startup Issues**:
```
❌ ModuleNotFoundError
❌ ImportError
❌ sqlalchemy.exc.OperationalError
❌ alembic.util.exc.CommandError
```

**Runtime Issues**:
```
❌ 401 Unauthorized
❌ HTTPException: X-Telegram-Init-Data header is required
❌ HTTPException: Invalid Telegram init data
❌ HTTPException: Telegram bot token is not configured
```

**Database Issues**:
```
❌ could not connect to server
❌ relation "tasks" does not exist
❌ column "user_id" does not exist
```

---

## 🎯 Most Likely Issues (Ranked)

1. **Authentication misconfiguration** (70% probability)
   - Missing `ALLOW_DEV_INIT_DATA_BYPASS=true`
   - Wrong `ENV` setting
   - Missing `VITE_DEMO_INIT_DATA` in Vercel

2. **CORS misconfiguration** (15% probability)
   - Wrong Vercel URL in `CORS_ORIGINS`
   - Trailing slash mismatch

3. **Frontend not pointing to Render** (10% probability)
   - Missing `VITE_API_BASE_URL` in Vercel

4. **Database connection** (3% probability)
   - Wrong `DATABASE_URL`

5. **Migrations not applied** (2% probability)
   - Alembic errors during deployment

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ `curl https://your-api.onrender.com/health` returns `{"status":"ok"}`
2. ✅ Browser console shows no CORS errors
3. ✅ Network tab shows 201 Created for POST /tasks/
4. ✅ Tasks appear in the task list immediately after creation
5. ✅ Render logs show successful requests with 201 status codes

---

## 📚 Files to Review

If you need to make code changes:

1. **Authentication**: `services/api-python/app/api/deps.py`
2. **CORS**: `services/api-python/app/main.py`
3. **Config**: `services/api-python/app/core/config.py`
4. **Task Routes**: `services/api-python/app/api/routes_tasks.py`
5. **Frontend Client**: `apps/web-platform/src/api/client.ts`
6. **Deployment Guide**: `DEPLOYMENT_FREE.md`

---

## 🆘 Still Not Working?

If you've checked everything and it still doesn't work:

1. **Enable verbose logging**: Add `LOG_LEVEL=DEBUG` to Render
2. **Check Render service status**: Ensure it's not sleeping/restarting
3. **Test with Postman/Insomnia**: Rule out frontend issues
4. **Check PostgreSQL logs**: Verify database is accepting connections
5. **Redeploy everything**: Sometimes a fresh deploy fixes issues
6. **Check Render free tier limits**: You may have hit resource limits

---

Good luck! 🚀
