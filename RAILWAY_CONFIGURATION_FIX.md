# Railway Configuration Guide - Fix Auto-Detection Issue

## 🚨 Problem: Railway Auto-Detected Wrong Services

Railway scanned your monorepo and created these incorrect services:
- ❌ `api` (old Express API)
- ❌ `dashboard` (unused)
- ❌ `mobile-app` (frontend, shouldn't be on Railway)

**You need:**
- ✅ `apps/web` (React Router backend with API routes)
- ✅ `ml-service` (Python FastAPI ML service)

---

## 🔧 Fix: Delete & Recreate Services

### Step 1: Delete Auto-Created Services

For **each** of these services (`api`, `dashboard`, `mobile-app`):

1. Click on the service card
2. Click **Settings** tab
3. Scroll all the way down
4. Find **"Danger"** section
5. Click **"Delete Service from All Environments"**
6. Type the service name to confirm
7. Click **"Delete"**

Repeat 3 times until project is empty.

---

### Step 2: Create Web Service (apps/web)

1. Click **"+ New"** button
2. Select **"GitHub Repo"**
3. Choose: `syedfasihzaidi480/Biometric-verification-system`
4. Click **"Deploy Now"**

⚠️ **DON'T WAIT FOR BUILD - Configure immediately!**

5. Click **Settings** tab (while it's building)
6. Find **"Root Directory"** field
7. Enter: `apps/web`
8. Find **"Service Name"** field
9. Enter: `biometric-web`
10. Click **"Redeploy"** button

**What this does:**
- Tells Railway to only build the `apps/web` folder
- Uses `apps/web/railway.json` configuration
- Uses `apps/web/nixpacks.toml` for Node.js build
- Uses `apps/web/package.json` scripts

---

### Step 3: Create ML Service (ml-service)

1. Click **"+ New"** button again
2. Select **"GitHub Repo"**
3. Choose same repository: `syedfasihzaidi480/Biometric-verification-system`
4. Click **"Deploy Now"**

⚠️ **Again, configure immediately!**

5. Click **Settings** tab
6. Find **"Root Directory"** field
7. Enter: `ml-service`
8. Find **"Service Name"** field
9. Enter: `biometric-ml`
10. Click **"Redeploy"** button

**What this does:**
- Builds only the `ml-service` folder
- Uses `ml-service/railway.json` configuration
- Uses `ml-service/nixpacks.toml` for Python build
- Installs from `ml-service/requirements.txt`

---

## ✅ Verification

After both services are created and redeployed, you should see:

### biometric-web Service:
```
Root Directory: apps/web
Status: Building...
Build Command: npm install --legacy-peer-deps && npm run build
Start Command: npm start
Port: 4000
```

### biometric-ml Service:
```
Root Directory: ml-service
Status: Building...
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port 8000
Port: 8000
```

---

## 🎯 Why Root Directory Matters

Railway is trying to build from the **root** of your monorepo by default, which contains:
- Multiple workspaces (api, dashboard, mobile-app, ml-service)
- No main application
- No clear start command

**With Root Directory set:**
- Railway only sees one folder
- Finds correct package.json/requirements.txt
- Uses the right build configuration
- Deploys only what you need

---

## 🐛 Troubleshooting

### Build Still Failing?

1. **Check Root Directory is set correctly**
   - Settings → Root Directory → `apps/web` or `ml-service`
   - Must match exactly (case-sensitive)

2. **Clear build cache**
   - Settings → Scroll to "Danger" section
   - Click "Clear Build Cache"
   - Click "Redeploy"

3. **Check logs**
   - Click on deployment
   - View "Build Logs"
   - Look for errors in install/build phase

### Wrong Files Being Built?

- **Symptom**: Logs show "Cannot find module '@react-router/node'"
- **Cause**: Root directory not set, building from monorepo root
- **Fix**: Set Root Directory to `apps/web`, then redeploy

### Python Service Won't Start?

- **Symptom**: "ModuleNotFoundError: No module named 'app'"
- **Cause**: Root directory not set, looking in wrong folder
- **Fix**: Set Root Directory to `ml-service`, then redeploy

---

## 📋 Quick Reference

| Service | Root Directory | Port | Start Command |
|---------|---------------|------|---------------|
| biometric-web | `apps/web` | 4000 | `npm start` |
| biometric-ml | `ml-service` | 8000 | `uvicorn app.main:app --host 0.0.0.0 --port 8000` |

---

## ⏭️ Next Steps

Once both services show **"Active"** status:

1. ✅ Add environment variables (see RAILWAY_QUICKSTART.md Step 4)
2. ✅ Generate domain for web service
3. ✅ Test deployment
4. ✅ Create database indexes

---

**🎉 Your Railway project should now have 2 services with correct configurations!**
