# Railway 502 Error Troubleshooting Guide

## Current Status

Your Railway backend is returning:
```json
{"status":"error","code":502,"message":"Application failed to respond"}
```

This means the app container is NOT responding to HTTP requests. The server may be:
1. Crashing on startup
2. Not binding to the correct port/host
3. Having database connection issues

## Quick Diagnostic Steps

### Step 1: Check Railway Deploy Logs

1. Go to Railway Dashboard → Your Service → Deployments tab
2. Click on the latest deployment
3. Look for these log lines in order:

**Expected successful startup sequence:**
```
[preflight] env summary: { ... }
[preflight] MongoDB ping ok
🚀 Server started on port 4000
🌍 http://0.0.0.0:4000
🏎️ Server started in XXXXms
```

**If you see errors:**
- MongoDB connection errors → Check MONGODB_URI
- Missing env vars → Add required variables
- Crash/exception → Share the error message

### Step 2: Verify Railway Environment Variables

Required variables:
```bash
# ✅ MUST be set:
AUTH_URL=https://biometric-verification-system-production.up.railway.app
NODE_ENV=production
MONGODB_URI=mongodb+srv://your-connection-string
MONGODB_DB=auth

# ✅ MUST be set for uploads:
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
# OR individual vars:
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ✅ MUST NOT be set (remove if present):
DATABASE_URL=   # ← DELETE THIS if you're using MongoDB

# ✅ Optional but recommended:
AUTH_SECRET=a-long-random-string-min-32-chars
DEBUG_TOKEN=another-random-string-for-diagnostics

# ❌ Don't set PORT - Railway injects this automatically
```

### Step 3: Check Service Settings

1. **Root Directory**: MUST be `apps/web`
   - Settings → Service → Root Directory
   - If it's blank or wrong, set it to `apps/web`

2. **Build Command**: Should auto-detect via Nixpacks
   - Should run: `npm install` then `npm run build`

3. **Start Command**: Should auto-detect from `package.json`
   - Should run: `npm start` (which runs `node ./build/server/index.js`)

### Step 4: Test Debug Endpoint (if DEBUG_TOKEN is set)

Once the server starts successfully:
```bash
# Generate a DEBUG_TOKEN first (32+ random chars)
# Add it to Railway variables
# Redeploy
# Then test:

curl -X GET "https://biometric-verification-system-production.up.railway.app/api/debug/env?token=YOUR_DEBUG_TOKEN"
```

Expected response:
```json
{
  "time": "2025-11-11T...",
  "adapter": "mongo",
  "preflight": {
    "ok": true,
    "mongo": { "ok": true },
    "env": {
      "MONGODB_URI": "set",
      "DATABASE_URL": "missing",
      ...
    }
  },
  "env": { ... }
}
```

## Common Issues & Fixes

### Issue 1: MongoDB Connection Failed

**Symptoms:**
```
[preflight] MongoDB ping failed: MongoServerSelectionError...
```

**Fix:**
- Verify MONGODB_URI is correct and accessible from Railway's network
- Check MongoDB Atlas Network Access allows Railway IPs (or allow all: `0.0.0.0/0`)
- Ensure user credentials in connection string are correct

### Issue 2: Neon/Postgres Error (when using MongoDB)

**Symptoms:**
```
NeonDbError: connection error
```

**Fix:**
- Remove `DATABASE_URL` from Railway variables completely
- The app will auto-detect MongoDB via `MONGODB_URI`

### Issue 3: AUTH_URL Mismatch

**Symptoms:**
- Cookies not working
- CSRF errors
- Sessions fail

**Fix:**
```bash
# AUTH_URL MUST match your Railway domain exactly:
AUTH_URL=https://biometric-verification-system-production.up.railway.app
# NOT: http://... (no http)
# NOT: localhost or 192.168.x.x
# NOT: missing/wrong domain
```

### Issue 4: Wrong Root Directory

**Symptoms:**
- Build fails
- Can't find package.json
- Deploy logs show "No such file or directory"

**Fix:**
- Railway Settings → Root Directory → `apps/web`
- Redeploy

### Issue 5: Port Binding Issues

**Symptoms:**
```
Server started on port 4000
🌍 http://127.0.0.1:4000   # ← Bad: 127.0.0.1
```

**Fix (already applied in latest code):**
- Latest code binds to `0.0.0.0` - you need to redeploy
- Commit hash `007e6dcd` or later has the fix

### Issue 6: Cloudinary Missing (non-blocking)

**Symptoms:**
```
CLOUDINARY: { URL: 'missing', CLOUD_NAME: 'set' }
```

**Impact:**
- Server starts OK
- File uploads will fail
- Media previews won't work

**Fix:**
```bash
# Option 1: Single URL
CLOUDINARY_URL=cloudinary://123456789:abcdefghijklmnop@your-cloud-name

# Option 2: Separate vars
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

## Mobile App CORS Setup (once server is healthy)

After the Railway server responds successfully, add mobile app support:

### Add CORS_ORIGINS to Railway

The mobile app needs permission to call your API:

```bash
# Add this variable to Railway:
CORS_ORIGINS=https://biometric-verification-system-production.up.railway.app,exp://localhost:8081

# For production mobile builds, add your domain if different
```

### Verify Auth Cookie Settings

The current code already handles this correctly:
- `secure: true` when AUTH_URL uses https
- `sameSite: 'none'` for cross-origin requests from mobile
- `credentials: 'include'` in mobile app's fetch

## Next Steps

1. **Check deploy logs right now:**
   - Go to Railway → Deployments → Latest
   - Find the first error line after "Starting Container"
   - Copy the error message

2. **Verify all environment variables:**
   - Especially AUTH_URL, MONGODB_URI, MONGODB_DB
   - Remove DATABASE_URL if present

3. **Confirm Root Directory = `apps/web`**

4. **Share the exact error from logs if server doesn't start**

5. **Once healthy:**
   - Test: `https://your-railway-url.railway.app/api/health`
   - Should return: `{"mongo":{"ok":true},"postgres":{"ok":false}}`
   - Then test mobile app again

## Useful Commands

### Generate DEBUG_TOKEN (PowerShell)
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test health endpoint
```powershell
Invoke-WebRequest -Uri "https://biometric-verification-system-production.up.railway.app/api/health" -Method GET
```

### Test debug endpoint (with token)
```powershell
Invoke-WebRequest -Uri "https://biometric-verification-system-production.up.railway.app/api/debug/env?token=YOUR_TOKEN" -Method GET
```

## Contact Points

If the server still won't start after these checks:
1. Share the first 30 lines of Railway Deploy Logs (from "Starting Container" onward)
2. List all your Railway environment variables (mask secrets, just show key names and "set"/"missing")
3. Confirm Root Directory value

The preflight checks added in the latest code will show exactly what's failing.
