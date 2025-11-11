# Railway Root Directory Configuration Fix

## ❌ Problem

You set Root Directory to `/apps` but Railway doesn't know which app to build (web or mobile).

Error:
```
✖ Railpack could not determine how to build the app.
```

## ✅ Solution: Set Correct Root Directory

### Step 1: Go to Railway Service Settings

1. Railway Dashboard → Your Project
2. Click on your **web service**
3. Click **Settings** tab
4. Scroll to "Build Configuration" section

### Step 2: Set Root Directory

**Change from:**
```
/apps
```

**To:**
```
apps/web
```

⚠️ **Important:** No leading slash! Use `apps/web` not `/apps/web`

### Step 3: Verify Other Settings

While in Settings, make sure:

**Build Configuration:**
- **Root Directory:** `apps/web`
- **Builder:** Nixpacks (should auto-detect)
- **Build Command:** Leave empty (nixpacks will use package.json)
- **Install Command:** Leave empty (uses `npm install`)

**Deploy Configuration:**
- **Start Command:** Leave empty (uses `npm start` from package.json)
- **Watch Paths:** Leave empty or set to `apps/web/**`

### Step 4: Save and Redeploy

1. Click "Save" (if there's a button) or changes auto-save
2. Go to **Deployments** tab
3. Click **Redeploy** or push a new commit

### Step 5: Verify Build Works

In the deploy logs you should see:

```
✓ Found Nixpacks configuration
✓ Installing dependencies
✓ Running build
✓ Starting app
🚀 Server started on port 4000
```

## Complete Railway Configuration

### Service: biometric-web

**Settings → Build:**
- Root Directory: `apps/web`
- Builder: Nixpacks
- Build Command: (empty)
- Install Command: (empty)

**Settings → Deploy:**
- Start Command: (empty)
- Custom Nixpacks Config File: (empty - uses apps/web/nixpacks.toml)

**Variables:**
```bash
MONGODB_URI=mongodb+srv://mamadoukkeita_db_user:y6otEOBIzNIs7iAm@biometricverificationsy.f96ecuj.mongodb.net/?retryWrites=true&w=majority&appName=BiometricVerificationSystem
MONGODB_DB=auth
AUTH_SECRET=<your-secret>
AUTH_URL=https://your-domain.railway.app
CLOUDINARY_CLOUD_NAME=dzzaebsfc
CLOUDINARY_API_KEY=541276445497123
CLOUDINARY_API_SECRET=SnSoEdqRpc1LTzMkYzVlA_6phPE
NODE_ENV=production
```

❌ **DO NOT HAVE:** `DATABASE_URL`

### Service: biometric-ml (if you want to deploy ML service)

**Settings → Build:**
- Root Directory: `ml-service`
- Builder: Nixpacks
- Build Command: (empty)
- Install Command: (empty)

**Variables:**
```bash
PORT=8000
PYTHONUNBUFFERED=1
```

## Why This Matters

Your repository structure is:
```
create-anything/
├── apps/
│   ├── web/          ← This is what you want to deploy
│   │   ├── package.json
│   │   ├── nixpacks.toml
│   │   └── ...
│   └── mobile/       ← Different app
│       └── ...
├── ml-service/       ← Another separate service
└── ...
```

Railway needs to know:
- **Root Directory:** Where to start (`apps/web`)
- **What to build:** Looks for `package.json` or other build files
- **How to run:** Uses `nixpacks.toml` and `package.json` scripts

## Quick Fix Command

If you want to trigger a redeploy after fixing the root directory:

```bash
git commit --allow-empty -m "Trigger Railway rebuild with correct root directory"
git push origin main
```

## Verification Checklist

After setting `apps/web` as root directory:

- [ ] Build starts successfully
- [ ] Dependencies install (npm install)
- [ ] Build completes (npm run build)
- [ ] Server starts (npm start)
- [ ] No 502 errors
- [ ] Can access your Railway URL
- [ ] Health endpoint works: `https://your-url.railway.app/api/health`
