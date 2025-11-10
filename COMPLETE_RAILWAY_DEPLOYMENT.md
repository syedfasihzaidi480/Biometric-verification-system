# Complete Railway Deployment - All Services

## 🎯 What You're Deploying

Your biometric verification system has **3 services** that need to be deployed to Railway:

```
┌─────────────────────────────────────────────────┐
│           Railway Cloud Platform                │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │  1. biometric-mobile (apps/mobile)      │   │
│  │     - Expo web frontend                 │   │
│  │     - User interface (web version)      │   │
│  │     - Port: 8081                        │   │
│  │     - Public URL for users              │   │
│  └──────────────┬──────────────────────────┘   │
│                 │ API Calls                     │
│                 ▼                               │
│  ┌─────────────────────────────────────────┐   │
│  │  2. biometric-web (apps/web)            │   │
│  │     - React Router backend              │   │
│  │     - API server + authentication       │   │
│  │     - Port: 4000                        │   │
│  │     - Handles all business logic        │   │
│  └──────────────┬──────────────────────────┘   │
│                 │ Internal ML Calls             │
│                 ▼                               │
│  ┌─────────────────────────────────────────┐   │
│  │  3. biometric-ml (ml-service)           │   │
│  │     - Python FastAPI service            │   │
│  │     - Voice/face/document verification  │   │
│  │     - Port: 8000                        │   │
│  │     - Internal only                     │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## 🚀 Step-by-Step Deployment

### Prerequisites

1. ✅ GitHub account with repository: `syedfasihzaidi480/Biometric-verification-system`
2. ✅ Railway account: https://railway.app (sign up free)
3. ✅ All code committed and pushed to GitHub

### Step 1: Create Railway Project

1. Go to: https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Select: `syedfasihzaidi480/Biometric-verification-system`
4. Click **"Deploy Now"**

⚠️ **Railway will auto-create wrong services - we'll fix this!**

### Step 2: Delete Auto-Created Services

Railway detected wrong workspaces. Delete ALL auto-created services:

1. Click on each service card (api, dashboard, mobile-app)
2. Go to **Settings** tab
3. Scroll to **"Danger"** section
4. Click **"Delete Service from All Environments"**
5. Confirm deletion

Do this until your project is **completely empty**.

### Step 3: Create Mobile Frontend Service

1. Click **"+ New"** in Railway dashboard
2. Select **"GitHub Repo"**
3. Choose `syedfasihzaidi480/Biometric-verification-system`
4. Click **"Deploy Now"**

**⚠️ Immediately configure (don't wait for build):**

5. Click **Settings** tab
6. **Root Directory**: `apps/mobile`
7. **Service Name**: `biometric-mobile`
8. **Port**: `8081` (add in Variables tab)
9. Click **"Redeploy"**

### Step 4: Create Backend API Service

1. Click **"+ New"** again
2. Select **"GitHub Repo"**
3. Choose same repository
4. Click **"Deploy Now"**

**Configure immediately:**

5. Click **Settings** tab
6. **Root Directory**: `apps/web`
7. **Service Name**: `biometric-web`
8. **Port**: `4000` (add in Variables tab)
9. Click **"Redeploy"**

### Step 5: Create ML Service

1. Click **"+ New"** again
2. Select **"GitHub Repo"**
3. Choose same repository
4. Click **"Deploy Now"**

**Configure immediately:**

5. Click **Settings** tab
6. **Root Directory**: `ml-service`
7. **Service Name**: `biometric-ml`
8. **Port**: `8000` (add in Variables tab)
9. Click **"Redeploy"**

---

## 🔐 Step 6: Configure Environment Variables

### For biometric-mobile (apps/mobile):

Click **Variables** tab and add:

```bash
PORT=8081
NODE_ENV=production

# Point to backend API
EXPO_PUBLIC_API_URL=https://biometric-web-production.railway.app
EXPO_PUBLIC_BASE_URL=https://biometric-web-production.railway.app
EXPO_PUBLIC_PROXY_BASE_URL=https://biometric-web-production.railway.app
EXPO_PUBLIC_PROJECT_GROUP_ID=create-anything-prod
```

**Note:** You'll update these URLs after backend service gets its domain (Step 7)

---

### For biometric-web (apps/web):

Click **Variables** tab and add:

```bash
NODE_ENV=production
PORT=4000

# MongoDB Configuration
MONGODB_URI=mongodb+srv://mamadoukkeita_db_user:y6otEOBIzNIs7iAm@biometricverificationsy.f96ecuj.mongodb.net/?retryWrites=true&w=majority&appName=BiometricVerificationSystem
MONGODB_DB=auth

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dzzaebsfc
CLOUDINARY_API_KEY=541276445497123
CLOUDINARY_API_SECRET=SnSoEdqRpc1LTzMkYzVlA_6phPE

# ML Service (internal Railway networking)
ML_SERVICE_URL=http://biometric-ml.railway.internal:8000

# Auth Secret (generate new one for production)
AUTH_SECRET=REPLACE_WITH_RANDOM_STRING_32_CHARS_MIN
```

**Generate AUTH_SECRET:**
```powershell
# Run in PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```
Copy output and replace `AUTH_SECRET` value.

---

### For biometric-ml (ml-service):

Click **Variables** tab and add:

```bash
PORT=8000
PYTHONUNBUFFERED=1
```

---

## 🌐 Step 7: Generate Public Domains

### For biometric-web (Backend API):

1. Click on **biometric-web** service
2. Go to **Settings** → **Networking**
3. Click **"Generate Domain"**
4. Copy the domain (e.g., `biometric-web-production.railway.app`)
5. Go back to **Variables** tab
6. Add new variable:
   ```
   AUTH_URL=https://biometric-web-production.railway.app
   ```
7. Click **"Redeploy"**

### For biometric-mobile (Frontend):

1. Click on **biometric-mobile** service
2. Go to **Settings** → **Networking**
3. Click **"Generate Domain"**
4. Copy the domain (e.g., `biometric-mobile-production.railway.app`)

### Update biometric-mobile Variables:

Now that you have the backend domain, update mobile service variables:

1. Click **biometric-mobile** → **Variables**
2. Update these variables with actual backend domain:
   ```bash
   EXPO_PUBLIC_API_URL=https://biometric-web-production.railway.app
   EXPO_PUBLIC_BASE_URL=https://biometric-web-production.railway.app
   EXPO_PUBLIC_PROXY_BASE_URL=https://biometric-web-production.railway.app
   EXPO_PUBLIC_HOST=biometric-web-production.railway.app
   ```
3. Click **"Redeploy"**

### For biometric-ml (ML Service):

**Do NOT generate a public domain** - this service should only be accessible internally.

---

## 🗄️ Step 8: Create Database Indexes

After all services are deployed and running:

**Option 1: Using Railway CLI**
```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run index creation
railway run --service biometric-web node utils/create-indexes.cjs
```

**Option 2: From MongoDB Atlas**
1. Go to MongoDB Atlas → Network Access
2. Add IP Address → `0.0.0.0/0` (Allow from anywhere)
3. Run locally:
   ```powershell
   cd apps/web
   node utils/create-indexes.cjs
   ```

---

## ✅ Step 9: Verify Deployment

### Test Backend API:
```powershell
# Health check
curl https://biometric-web-production.railway.app/api/health

# Should return: {"status":"ok"}
```

### Test ML Service (via backend):
```powershell
curl https://biometric-web-production.railway.app/api/ml-health
```

### Test Frontend:
Open browser: `https://biometric-mobile-production.railway.app`

You should see your app's UI.

---

## 📱 Step 10: Native Mobile App Configuration

If you also want native mobile apps (iOS/Android), update their config:

In `apps/mobile/.env` (for local builds):
```bash
EXPO_PUBLIC_API_URL=https://biometric-web-production.railway.app
EXPO_PUBLIC_BASE_URL=https://biometric-web-production.railway.app
EXPO_PUBLIC_PROXY_BASE_URL=https://biometric-web-production.railway.app
EXPO_PUBLIC_HOST=biometric-web-production.railway.app
```

Then build:
```powershell
cd apps/mobile

# For testing
npx expo start

# For production
eas login
eas build --platform android --profile production
```

---

## 🎯 Service Summary

After deployment, you'll have:

| Service | URL | Purpose |
|---------|-----|---------|
| **biometric-mobile** | `https://biometric-mobile-production.railway.app` | Web UI (public) |
| **biometric-web** | `https://biometric-web-production.railway.app` | API Backend (public) |
| **biometric-ml** | `http://biometric-ml.railway.internal:8000` | ML Service (internal) |

---

## 🐛 Troubleshooting

### Mobile Frontend Can't Connect to Backend

**Check mobile service variables:**
```bash
EXPO_PUBLIC_API_URL=https://biometric-web-production.railway.app
```

**Must use actual backend URL**, not placeholder!

### Backend Build Fails

**Check Root Directory is set:**
- Settings → Root Directory → `apps/web`

**Clear build cache:**
- Settings → Danger → Clear Build Cache → Redeploy

### ML Service Unreachable

**Check internal URL in backend:**
```bash
ML_SERVICE_URL=http://biometric-ml.railway.internal:8000
```

**Must use `.railway.internal` domain** for internal networking.

### MongoDB Connection Failed

**Update MongoDB Atlas:**
1. Network Access → Add IP → `0.0.0.0/0`
2. Database Access → Verify user has `readWrite` permissions

### Expo Metro Bundler Not Starting

**Check mobile service logs:**
- Deployments → View Logs
- Look for port binding errors

**Verify PORT environment variable:**
```bash
PORT=8081
```

---

## 💰 Cost Estimate

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| biometric-mobile | ~500MB RAM, light CPU | $3-5 |
| biometric-web | ~1GB RAM, moderate CPU | $5-10 |
| biometric-ml | ~2GB RAM, heavy CPU | $10-15 |
| **Total** | | **$18-30/month** |

**Free Trial:** Railway gives $5 credit to start.

---

## 📊 Monitoring

### Check Service Health:

**Railway Dashboard:**
- Click each service
- View **Deployments** tab
- Check **Metrics** for CPU/Memory usage
- Review **Logs** for errors

**Health Endpoints:**
```powershell
# Backend
curl https://biometric-web-production.railway.app/api/health

# ML Service (via backend)
curl https://biometric-web-production.railway.app/api/ml-health

# Frontend
curl https://biometric-mobile-production.railway.app
```

---

## 🎉 You're Live!

Your complete biometric verification system is now running on Railway:

✅ **Frontend**: Web UI accessible from anywhere  
✅ **Backend**: API handling all business logic  
✅ **ML Service**: Processing voice, face, document verification  
✅ **Database**: MongoDB Atlas for persistence  
✅ **Storage**: Cloudinary for media files  

**Access your app:** `https://biometric-mobile-production.railway.app`

---

## 🚨 Important Notes

1. **Update EXPO_PUBLIC_API_URL** after backend deployment
2. **Generate new AUTH_SECRET** for production security
3. **Whitelist Railway IPs** in MongoDB Atlas
4. **Monitor costs** in Railway dashboard
5. **Set up custom domain** (optional) for professional URLs

---

## 📞 Need Help?

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Expo Docs**: https://docs.expo.dev

---

**Deployment Time:** ~15-20 minutes for all 3 services  
**Status:** Production-ready! 🚀
