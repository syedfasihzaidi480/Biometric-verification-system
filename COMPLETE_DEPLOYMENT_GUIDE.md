# Complete Deployment Guide - Both Web & Mobile

## 🎯 Overview: What Gets Deployed Where

```
┌─────────────────────────────────────────┐
│         Your Application                │
├─────────────────────────────────────────┤
│                                         │
│  1. Backend API (apps/web)              │
│     ├─ Node.js API routes               │
│     ├─ Authentication                   │
│     ├─ Voice/Face/Doc verification      │
│     └─ Deploy to: Railway               │
│                                         │
│  2. ML Service (ml-service)             │
│     ├─ Python FastAPI                   │
│     ├─ ML processing                    │
│     └─ Deploy to: Railway               │
│                                         │
│  3. Mobile Web App (apps/mobile)        │
│     ├─ Expo web build                   │
│     ├─ React Native Web                 │
│     ├─ User-facing frontend             │
│     └─ Deploy to: Vercel/Netlify        │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🚀 Part 1: Deploy Backend to Railway

### Service 1: Backend API (`apps/web`)

Follow **RAILWAY_QUICKSTART.md** - Summary:

1. **Create Railway project**
2. **Add service** with Root Directory: `apps/web`
3. **Environment variables:**
   ```bash
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://mamadoukkeita_db_user:y6otEOBIzNIs7iAm@biometricverificationsy.f96ecuj.mongodb.net/?retryWrites=true&w=majority&appName=BiometricVerificationSystem
   MONGODB_DB=auth
   CLOUDINARY_CLOUD_NAME=dzzaebsfc
   CLOUDINARY_API_KEY=541276445497123
   CLOUDINARY_API_SECRET=SnSoEdqRpc1LTzMkYzVlA_6phPE
   AUTH_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   ML_SERVICE_URL=http://biometric-ml.railway.internal:8000
   ```
4. **Generate domain** (e.g., `biometric-web-production.railway.app`)
5. **Add AUTH_URL** variable with your domain
6. **Redeploy**

Result: ✅ API available at `https://biometric-web-production.railway.app`

---

### Service 2: ML Service (`ml-service`)

1. **Add another service** to same Railway project
2. **Root Directory:** `ml-service`
3. **Service Name:** `biometric-ml`
4. **Environment variables:**
   ```bash
   PORT=8000
   PYTHONUNBUFFERED=1
   ```
5. **Deploy**

Result: ✅ ML service available internally to web service

---

## 🌐 Part 2: Deploy Mobile Web to Vercel/Netlify

Your `apps/mobile` has **web support** via Expo, so you can deploy it as a Progressive Web App (PWA)!

### Option A: Deploy to Vercel (Recommended)

#### Step 1: Add Build Scripts

First, let's add build scripts to `apps/mobile/package.json`:

<function_calls>
<invoke name="read_file">
<parameter name="filePath">g:\create-anything\apps\mobile\package.json