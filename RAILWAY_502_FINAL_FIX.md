# Railway 502 Error - Final Fix Strategy

## Current Situation

Your server **IS starting successfully** on Railway:
```
[preflight] MongoDB ping ok
🚀 Server started on port 8080
```

BUT Railway's edge proxy returns 502 when accessing the app.

## Root Cause

Railway expects the app to bind to `0.0.0.0` and respond on the PORT they inject (8080 in your case). Even though the logs show the server started, Railway's health check or routing might be failing.

## Solution Applied

I've added two critical fixes:

### 1. Added `/ping` Endpoint (Minimal Health Check)

A super simple endpoint that bypasses all middleware/auth:

```typescript
app.get('/ping', (c) => {
  return c.json({ ok: true, time: new Date().toISOString(), adapter: persistenceType }, 200);
});
```

**Test this immediately after Railway redeploys:**
```powershell
Invoke-WebRequest -Uri "https://clever-encouragement-production-9767.up.railway.app/ping"
```

Expected: `200 OK` with `{"ok":true,"time":"...","adapter":"mongo"}`

### 2. Improved Server Binding Logs

The server now explicitly logs what it's binding to:

```
🚀 Server started on port 8080
🌍 Bound to: 0.0.0.0:8080 (accessible from all interfaces)
🔗 Public URL: https://clever-encouragement-production-9767.up.railway.app
✅ Ready to accept connections
```

This confirms the server is listening on ALL interfaces, not just localhost.

## Critical Railway Settings Checklist

### ✅ Environment Variables (ALREADY CORRECT)

Based on your deploy logs, these are SET correctly:
- ✅ `NODE_ENV=production`
- ✅ `AUTH_URL=https://clever-encouragement-production-9767.up.railway.app` (NO trailing slash)
- ✅ `MONGODB_URI=set`
- ✅ `MONGODB_DB=auth`
- ✅ `CLOUDINARY` vars set
- ✅ `DATABASE_URL=missing` (good, you're using MongoDB)
- ✅ `PORT=8080` (Railway injected)

### ⚠️ MUST VERIFY: Root Directory

**This is the #1 cause of 502 when the server starts but doesn't respond:**

1. Go to Railway Dashboard
2. Click your service: `clever-encouragement`
3. Go to: **Settings** → **Service Settings**
4. Look for: **Root Directory**
5. **It MUST be set to: `apps/web`**

If it's blank or wrong:
- Set it to `apps/web`
- Click "Save"
- Railway will automatically redeploy

### ⚠️ Check: Health Check Path (Railway Feature)

Some Railway deployments use health checks. If configured:

1. Go to: Settings → **Healthcheck**
2. If a path is set, change it to: `/ping`
3. Or set: `/api/health`

## Deployment Strategy

### Step 1: Verify Root Directory

Railway Settings → Root Directory = `apps/web`

### Step 2: Wait for Redeploy with Latest Code

The latest commit includes:
- `/ping` endpoint
- Better binding logs
- Explicit `0.0.0.0` confirmation

Watch Deploy Logs for:
```
🌍 Bound to: 0.0.0.0:8080 (accessible from all interfaces)
✅ Ready to accept connections
```

### Step 3: Test Endpoints in Order

Once "Ready to accept connections" appears:

```powershell
# Test 1: Simplest ping (no auth, no middleware)
Invoke-WebRequest -Uri "https://clever-encouragement-production-9767.up.railway.app/ping"
# Expected: 200 OK

# Test 2: Health endpoint (has MongoDB check)
Invoke-WebRequest -Uri "https://clever-encouragement-production-9767.up.railway.app/api/health"
# Expected: 200 OK with mongo.ok=true

# Test 3: Auth endpoint (full auth flow)
Invoke-WebRequest -Uri "https://clever-encouragement-production-9767.up.railway.app/api/auth/session"
# Expected: 200 OK or 401 (not 502)
```

## If Still 502 After These Fixes

### Scenario A: `/ping` returns 502

**Problem:** Railway can't route to your app container at all.

**Fix:**
1. Double-check Root Directory = `apps/web`
2. Check Railway "Networking" tab → ensure "Public Networking" is enabled
3. Try deleting and recreating the service with correct Root Directory from the start

### Scenario B: `/ping` works (200 OK) but `/api/*` returns 502

**Problem:** Routes are being swallowed or auth middleware is blocking.

**Fix:**
1. Check Deploy Logs for errors when accessing `/api/health`
2. Look for "[AUTH MIDDLEWARE]" or "[API 404]" logs
3. The /ping working proves the server is reachable; the issue is internal routing

### Scenario C: All endpoints return 502

**Problem:** Railway's edge proxy can't reach the container's port.

**Fix:**
1. Verify the PORT in logs matches what Railway expects (should be auto-injected)
2. Check if Railway is using a custom PORT variable vs their auto-injected one
3. Try removing any custom PORT variable you set and let Railway inject it

## Alternative: Use Railway CLI for Live Logs

Install Railway CLI:
```powershell
npm install -g @railway/cli
```

Login and attach to logs:
```powershell
railway login
railway link
railway logs
```

Then make a request and watch logs in real-time to see what's happening.

## Railway Specific Known Issues

### Issue 1: Stale Build Cache
Railway might be serving an old build. Force a fresh build:
1. Railway → Deployments → Click "..." on latest → "Redeploy"
2. Or push an empty commit: `git commit --allow-empty -m "Force Railway rebuild"`

### Issue 2: Region-Specific Edge Routing
Your logs show: `x-railway-edge: railway/asia-southeast1-eqsg3a`

Sometimes edge routing in specific regions has issues. Try:
1. Settings → Change deployment region (if available)
2. Or wait 5-10 minutes for edge cache to clear

### Issue 3: Port Binding Race Condition
Railway might be checking the port before the server finishes binding.

**Fix:** Add a startup delay:
```javascript
// In index.ts, after createServer
setTimeout(() => {
  console.log('Health check ready window opened');
}, 1000);
```

But the current code should handle this since we await the server start.

## Mobile App Update

After Railway is working, update mobile app to point to working service:

**File: `apps/mobile/.env`**
```bash
EXPO_PUBLIC_API_URL=https://clever-encouragement-production-9767.up.railway.app
EXPO_PUBLIC_BASE_URL=https://clever-encouragement-production-9767.up.railway.app
EXPO_PUBLIC_PROXY_BASE_URL=https://clever-encouragement-production-9767.up.railway.app
EXPO_PUBLIC_HOST=clever-encouragement-production-9767.up.railway.app
```

Restart Expo:
```powershell
cd apps/mobile
npx expo start -c
```

## Success Criteria

✅ Deploy logs show: "Bound to: 0.0.0.0:8080 (accessible from all interfaces)"
✅ `/ping` returns 200 OK
✅ `/api/health` returns 200 OK with mongo.ok=true
✅ `/api/auth/session` returns 200 or 401 (not 502)
✅ Mobile app can sign in without 502 errors

## Next Steps

1. **Verify Root Directory = `apps/web`** (most likely cause if server starts but 502 persists)
2. **Wait for redeploy with latest code** (includes /ping endpoint)
3. **Test `/ping` endpoint first**
4. **Share results:**
   - Does `/ping` work? (yes/no)
   - Deploy logs showing "Bound to: 0.0.0.0" line
   - Root Directory screenshot/value

The combination of the /ping endpoint + explicit 0.0.0.0 binding + correct Root Directory should resolve the 502.
