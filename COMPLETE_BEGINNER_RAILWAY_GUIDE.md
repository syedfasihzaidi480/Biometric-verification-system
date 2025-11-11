# 🚀 Complete Beginner's Guide to Deploy on Railway

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [What You're Deploying](#what-youre-deploying)
3. [Prerequisites](#prerequisites)
4. [Environment Variables Explained](#environment-variables-explained)
5. [Step-by-Step Railway Deployment](#step-by-step-railway-deployment)
6. [Testing Your Deployment](#testing-your-deployment)
7. [Connecting Mobile App](#connecting-mobile-app)
8. [Troubleshooting](#troubleshooting)

---

## 📱 System Overview

### How Your System Works

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR BIOMETRIC SYSTEM                     │
└─────────────────────────────────────────────────────────────┘

1. MOBILE APP (React Native + Expo)
   📱 apps/mobile/
   - User interface on phone
   - Takes photos, records voice, scans documents
   - Sends data to backend

2. WEB BACKEND (Node.js + React Router)
   🌐 apps/web/
   - Receives requests from mobile
   - Processes authentication
   - Stores data in MongoDB
   - Uploads files to Cloudinary
   - Calls ML Service for verification
   - Has admin dashboard

3. ML SERVICE (Python + FastAPI)
   🤖 ml-service/
   - Voice recognition
   - Face liveness detection
   - Document OCR & verification
   - Returns scores/results

4. DATABASES & STORAGE
   💾 MongoDB Atlas (Cloud Database)
   - Stores user data, voice profiles, verification records
   
   ☁️ Cloudinary (Cloud Storage)
   - Stores voice audio files
   - Stores face images
   - Stores document scans
```

### Data Flow Example: Voice Verification

```
📱 Mobile App                  🌐 Web Backend                 🤖 ML Service
   |                              |                              |
   | 1. Record Voice             |                              |
   |    (3 audio samples)        |                              |
   |                              |                              |
   | 2. POST /api/voice/enroll   |                              |
   |---------------------------->|                              |
   |                              | 3. Upload to Cloudinary      |
   |                              |    (Get CDN URLs)            |
   |                              |                              |
   |                              | 4. Send audio to ML          |
   |                              |---------------------------->|
   |                              |                              | 5. Process Audio
   |                              |                              |    Extract Features
   |                              |                              |
   |                              | 6. Return enrollment_id      |
   |                              |<----------------------------|
   |                              |                              |
   |                              | 7. Save to MongoDB:          |
   |                              |    - User ID                 |
   |                              |    - Cloudinary URLs         |
   |                              |    - enrollment_id           |
   |                              |    - Timestamp               |
   |                              |                              |
   | 8. Success Response          |                              |
   |<----------------------------|                              |
   |                              |                              |
```

---

## 🎯 What You're Deploying

You need to deploy **2 services** on Railway:

### Service 1: Web Backend (apps/web) - PRIMARY
- **Purpose**: Main backend API + Admin dashboard
- **Port**: 4000 (or Railway auto-assigns)
- **Tech**: Node.js, React Router
- **Dependencies**: MongoDB, Cloudinary
- **What it does**:
  - Handles mobile app requests
  - User authentication
  - Data storage (MongoDB)
  - File uploads (Cloudinary)
  - Calls ML service
  - Admin web interface

### Service 2: ML Service (ml-service) - OPTIONAL
- **Purpose**: Machine learning operations
- **Port**: 8000
- **Tech**: Python, FastAPI
- **What it does**:
  - Voice verification
  - Face liveness detection
  - Document OCR

> **Note**: ML Service is optional for initial deployment. The backend works without it (will return mock data).

---

## 📦 Prerequisites

### 1. Accounts You Need (All FREE!)

#### A. GitHub Account
- Go to: https://github.com/signup
- Sign up (if you don't have one)
- You already have this since your code is on GitHub!

#### B. Railway Account
- Go to: https://railway.app
- Click "Login" → "Login with GitHub"
- Authorize Railway to access GitHub
- **Free Tier**: $5 free credit/month

#### C. MongoDB Atlas Account
- Go to: https://www.mongodb.com/cloud/atlas/register
- Sign up for free
- **Free Tier**: 512 MB storage (enough for testing)

#### D. Cloudinary Account
- Go to: https://cloudinary.com/users/register_free
- Sign up for free
- **Free Tier**: 25 GB storage, 25 GB bandwidth/month

### 2. Tools You Need

- ✅ Git (already have it)
- ✅ Node.js (already have it)
- ✅ Code editor (VS Code, already have it)
- ✅ Terminal/PowerShell (already have it)

---

## 🔑 Environment Variables Explained

### What Are Environment Variables?

Environment variables are like "settings" for your app. They store:
- Database passwords
- API keys
- URLs
- Secrets

Think of them as a configuration file that's NOT stored in code (for security).

### Variables You Need

#### For Web Backend (apps/web)

| Variable | What It Does | Example | Where to Get It |
|----------|--------------|---------|-----------------|
| `MONGODB_URI` | Database connection | `mongodb+srv://user:pass@cluster...` | MongoDB Atlas dashboard |
| `MONGODB_DB` | Database name | `auth` | You choose (use "auth") |
| `AUTH_SECRET` | Encryption key for login | `a1b2c3d4e5f6...` (32+ chars) | Generate randomly |
| `AUTH_URL` | Your app's URL | `https://your-app.railway.app` | Railway provides this |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary account | `dzzaebsfc` | Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary access key | `541276445497123` | Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary secret | `SnSoEdqRpc1LTz...` | Cloudinary dashboard |
| `ML_SERVICE_URL` | ML service address | `http://ml-service.railway.internal:8000` | After ML deployment |
| `NODE_ENV` | Environment mode | `production` | Always use "production" |
| `PORT` | Server port | `4000` | Railway auto-sets (optional) |

#### For ML Service (ml-service)

| Variable | What It Does | Example |
|----------|--------------|---------|
| `PORT` | Server port | `8000` |
| `PYTHONUNBUFFERED` | Python logging | `1` |

---

## 🛠️ Step-by-Step Railway Deployment

### PHASE 1: Setup MongoDB (15 minutes)

#### Step 1: Create MongoDB Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Log in
3. Click "Build a Database"
4. Choose **FREE** tier (M0 Sandbox)
5. Choose a cloud provider:
   - **AWS** recommended
   - Region: Choose closest to you (e.g., us-east-1)
6. Cluster Name: `BiometricCluster` (or any name)
7. Click "Create"
8. **Wait 3-5 minutes** for cluster creation

#### Step 2: Create Database User

1. Click "Database Access" (left sidebar)
2. Click "Add New Database User"
3. Authentication: **Password**
4. Username: `biometric_user` (write this down!)
5. Password: Click "Autogenerate Secure Password" (COPY IT!)
   - Or create your own (write it down!)
6. Database User Privileges: **Read and write to any database**
7. Click "Add User"

#### Step 3: Allow Network Access

1. Click "Network Access" (left sidebar)
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for Railway)
   - This adds `0.0.0.0/0`
4. Click "Confirm"

#### Step 4: Get Connection String

1. Click "Database" (left sidebar)
2. Click "Connect" button on your cluster
3. Choose "Connect your application"
4. Driver: **Node.js**
5. Version: 4.1 or later
6. Copy the connection string:
   ```
   mongodb+srv://biometric_user:<password>@biometriccluster...mongodb.net/?retryWrites=true&w=majority
   ```
7. **IMPORTANT**: Replace `<password>` with your actual password!
8. **Save this string** - you'll need it for Railway!

Example final string:
```
mongodb+srv://biometric_user:MySecurePass123@biometriccluster.abc123.mongodb.net/?retryWrites=true&w=majority
```

---

### PHASE 2: Setup Cloudinary (5 minutes)

#### Step 1: Get Cloudinary Credentials

1. Go to https://cloudinary.com/console
2. Log in
3. You'll see your dashboard with:
   - **Cloud Name**: `dzzaebsfc` (yours will be different)
   - **API Key**: `541276445497123`
   - **API Secret**: `SnSoEdqRpc1LTzMkYzVlA_6phPE` (click to reveal)
4. **Copy all three** values - you'll need them!

---

### PHASE 3: Deploy to Railway (20 minutes)

#### Step 1: Create Railway Project

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. If asked, authorize Railway to access GitHub
4. Search for: `Biometric-verification-system`
5. Click your repository
6. Railway will show service options

#### Step 2: Deploy Web Backend Service

1. Railway detects it's a monorepo
2. Click "Add Service" → "GitHub Repo"
3. Configure service:
   - **Name**: `biometric-web`
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

4. Click "Add Service"

#### Step 3: Configure Web Backend Environment Variables

1. Click on `biometric-web` service
2. Click "Variables" tab
3. Click "Add Variable" for each of these:

```bash
# Click "Add Variable" then paste EACH line separately:

MONGODB_URI=mongodb+srv://biometric_user:YourPassword@cluster...mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=auth
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=dzzaebsfc
CLOUDINARY_API_KEY=541276445497123
CLOUDINARY_API_SECRET=SnSoEdqRpc1LTzMkYzVlA_6phPE
```

**Generate AUTH_SECRET:**
1. Open PowerShell/Terminal
2. Run this command:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Copy the output (looks like: `a1b2c3d4e5f6g7h8...`)
4. Add to Railway:
   ```
   AUTH_SECRET=<paste-the-generated-value>
   ```

**Get AUTH_URL:**
1. In Railway service, click "Settings" tab
2. Scroll to "Domains"
3. Click "Generate Domain"
4. Copy the generated URL (like: `biometric-web-production-abc123.railway.app`)
5. Add to Variables:
   ```
   AUTH_URL=https://biometric-web-production-abc123.railway.app
   ```

#### Step 4: Verify Deployment

1. Click "Deployments" tab
2. Watch the build logs
3. Should see:
   ```
   ✓ built in X seconds
   🚀 Server started on port 4000
   ```
4. If you see errors, check the [Troubleshooting](#troubleshooting) section

#### Step 5: Deploy ML Service (OPTIONAL)

1. Click project name (top left) to go back
2. Click "New" → "GitHub Repo"
3. Same repo, but:
   - **Name**: `biometric-ml`
   - **Root Directory**: `ml-service`
   - **Build Command**: Leave empty (Railway auto-detects Python)
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. Add Variables:
   ```
   PORT=8000
   PYTHONUNBUFFERED=1
   ```

5. After ML service deploys, update Web Backend:
   - Go to `biometric-web` service
   - Click "Variables"
   - Add:
     ```
     ML_SERVICE_URL=http://biometric-ml.railway.internal:8000
     ```
   - This uses Railway's internal network (faster, free)

---

### PHASE 4: Verify Everything Works

#### Test 1: Health Check

1. Get your web service URL from Railway
2. Open browser, go to:
   ```
   https://your-app.railway.app/api/health
   ```
3. Should see JSON response:
   ```json
   {
     "success": true,
     "data": {
       "storage": "mongodb",
       "mongo": {
         "enabled": true,
         "ok": true
       }
     }
   }
   ```

#### Test 2: Admin Dashboard

1. Go to:
   ```
   https://your-app.railway.app/admin/signin
   ```
2. Should see login page
3. Create first admin user:
   - Go to `/admin/signup`
   - Fill form
   - Login

#### Test 3: ML Service (if deployed)

1. Go to:
   ```
   https://your-ml-service.railway.app/health
   ```
2. Should see:
   ```json
   {
     "success": true,
     "data": {
       "status": "ok"
     }
   }
   ```

---

## 📱 Connecting Mobile App

### Step 1: Update Mobile App Environment

1. On your computer, go to `apps/mobile/`
2. Copy `.env.example` to `.env`:
   ```bash
   cd apps/mobile
   copy .env.example .env
   ```

3. Edit `.env`:
   ```bash
   EXPO_PUBLIC_API_URL=https://your-app.railway.app
   ```

### Step 2: Test Mobile App Locally

1. Start mobile app:
   ```bash
   cd apps/mobile
   npx expo start
   ```

2. Scan QR code with Expo Go app on your phone
3. App should connect to Railway backend!

### Step 3: Test Features

Try these in your mobile app:

1. **Sign Up**: Create a new user account
2. **Voice Enrollment**:
   - Go to voice enrollment screen
   - Record 3 voice samples
   - Should upload to Railway → Cloudinary → MongoDB
3. **Voice Verification**:
   - Record voice
   - Should verify against enrolled samples
4. **Face Liveness**:
   - Take a selfie
   - Should check if live person
5. **Document Upload**:
   - Scan an ID card
   - Should upload and extract text

---

## 🐛 Troubleshooting

### Error: "502 Bad Gateway"

**Problem**: App crashed on startup

**Solutions**:
1. Check Railway deployment logs
2. Look for these common issues:
   - ❌ `DATABASE_URL` is set (remove it!)
   - ❌ `MONGODB_URI` is wrong (check password, URL)
   - ❌ `AUTH_SECRET` is missing
   - ❌ Build failed (check logs for errors)

**Fix**:
1. Go to Variables tab
2. Verify all variables are correct
3. If `DATABASE_URL` exists → DELETE IT
4. Click Deployments → Redeploy

### Error: "Cannot connect to MongoDB"

**Problem**: MongoDB connection failed

**Solutions**:
1. Check MongoDB Atlas:
   - Is cluster running?
   - Is IP address `0.0.0.0/0` whitelisted?
   - Is database user created?
2. Check `MONGODB_URI`:
   - Did you replace `<password>`?
   - Is password correct (no special chars without encoding)?
   - Try connection from MongoDB Compass locally first

### Error: "Cloudinary upload failed"

**Problem**: File upload to Cloudinary failed

**Solutions**:
1. Check Cloudinary credentials:
   - `CLOUDINARY_CLOUD_NAME` correct?
   - `CLOUDINARY_API_KEY` correct?
   - `CLOUDINARY_API_SECRET` correct (with no spaces)?
2. Check Cloudinary dashboard:
   - Did you reach free tier limits?
   - Is API access enabled?

### Error: "ML Service not responding"

**Problem**: Voice/face verification fails

**Solutions**:
1. Check if ML service is deployed
2. Check `ML_SERVICE_URL` in web backend
3. Should be: `http://biometric-ml.railway.internal:8000`
4. Test ML health: `https://your-ml.railway.app/health`

### Mobile App Can't Connect

**Problem**: App shows network errors

**Solutions**:
1. Check `EXPO_PUBLIC_API_URL` in `apps/mobile/.env`
2. Must be: `https://your-app.railway.app` (with https!)
3. Test in browser first: `https://your-app.railway.app/api/health`
4. Restart Expo: Stop and run `npx expo start` again
5. Clear Expo cache: `npx expo start -c`

### Railway Build Fails

**Common Issues**:

1. **"Cannot find module"**
   - Check `package.json` has all dependencies
   - Try: `npm install` locally to test

2. **"Build command failed"**
   - Check Railway's "Root Directory" is set correctly
   - Web: `apps/web`
   - ML: `ml-service`

3. **"Out of memory"**
   - Railway free tier has limits
   - Try reducing dependencies
   - Use Railway Pro if needed

---

## 📊 Monitoring Your Deployment

### Railway Dashboard

1. **Deployments**: See build history, logs
2. **Metrics**: CPU, Memory, Network usage
3. **Variables**: Manage environment variables
4. **Settings**: Domains, deployment settings

### MongoDB Atlas Dashboard

1. **Metrics**: Database operations, storage
2. **Collections**: View your data
3. **Performance**: Query performance, indexes

### Cloudinary Dashboard

1. **Media Library**: View uploaded files
2. **Usage**: Check storage and bandwidth
3. **Transformations**: See image processing

---

## 💰 Cost Estimation

### Free Tier Limits

| Service | Free Tier | What It Includes |
|---------|-----------|------------------|
| Railway | $5/month credit | ~500 hours of usage |
| MongoDB Atlas | Forever free | 512 MB storage, shared cluster |
| Cloudinary | Forever free | 25 GB storage, 25 GB bandwidth/month |
| GitHub | Forever free | Unlimited public repos |

### Estimated Monthly Usage (Light Use)

- Railway: $0-3 (within free credit)
- MongoDB: $0 (free tier enough)
- Cloudinary: $0 (free tier enough)
- **Total: $0 per month!**

### When You'll Need to Pay

- **Railway**: $20+/month if you exceed free credits (heavy traffic)
- **MongoDB**: $9/month for more storage/performance
- **Cloudinary**: $99/month if you exceed 25 GB

---

## 🎓 Next Steps

### 1. Secure Your Deployment

- [ ] Change default admin password
- [ ] Enable 2FA on Railway
- [ ] Rotate `AUTH_SECRET` regularly
- [ ] Set up MongoDB backup

### 2. Add Custom Domain (Optional)

1. Buy domain (Namecheap, GoDaddy, etc.)
2. In Railway → Settings → Domains
3. Click "Custom Domain"
4. Add DNS records (Railway provides instructions)
5. Update `AUTH_URL` to your domain

### 3. Monitor & Optimize

- Check Railway metrics daily
- Monitor MongoDB slow queries
- Optimize Cloudinary transformations
- Set up error tracking (Sentry, etc.)

### 4. Scale When Needed

- Upgrade Railway plan for more resources
- Add MongoDB replica set for reliability
- Use CDN for static files
- Add Redis for caching

---

## 📞 Getting Help

### Resources

- **Railway Docs**: https://docs.railway.app
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **Cloudinary Docs**: https://cloudinary.com/documentation
- **Expo Docs**: https://docs.expo.dev

### Common Commands

```bash
# Check environment variables locally
node scripts/check-env.cjs

# Test MongoDB connection
npm run db:health

# Build and test locally
cd apps/web
npm run build
npm start

# Deploy changes to Railway
git add .
git commit -m "Your changes"
git push origin main
# Railway auto-deploys!
```

---

## ✅ Deployment Checklist

### Before Deployment
- [ ] MongoDB Atlas account created
- [ ] Cloudinary account created
- [ ] Railway account connected to GitHub
- [ ] Code pushed to GitHub
- [ ] All environment variables documented

### During Deployment
- [ ] Web backend deployed to Railway
- [ ] Environment variables added
- [ ] `DATABASE_URL` NOT set (using MongoDB)
- [ ] AUTH_URL updated with Railway domain
- [ ] ML service deployed (optional)
- [ ] Internal network configured

### After Deployment
- [ ] `/api/health` returns success
- [ ] Admin login works
- [ ] Mobile app connects
- [ ] Voice enrollment works
- [ ] Face detection works
- [ ] Document upload works

### Monitoring Setup
- [ ] Railway dashboard bookmarked
- [ ] MongoDB Atlas alerts enabled
- [ ] Cloudinary usage monitored
- [ ] Error tracking configured

---

## 🎉 Congratulations!

You now have a complete biometric verification system deployed to the cloud!

Your system can:
- ✅ Register users from mobile app
- ✅ Verify voice biometrics
- ✅ Detect face liveness
- ✅ Process document uploads
- ✅ Store data securely in MongoDB
- ✅ Store files in Cloudinary
- ✅ Manage users via admin dashboard

**Total time**: 1-2 hours
**Total cost**: $0 (using free tiers)

Need help? Check the troubleshooting section or review Railway deployment logs!
