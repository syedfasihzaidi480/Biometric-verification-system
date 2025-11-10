# Railway Quick Start Deployment

## 🚀 Fast Track Deployment (5 Minutes)

### Step 1: Push to GitHub

```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### Step 2: Create Railway Project

1. Go to: https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Select: `syedfasihzaidi480/Biometric-verification-system`
4. Click **"Deploy Now"**

⚠️ **Railway will auto-create wrong services** (api, dashboard, mobile-app)

**See RAILWAY_CONFIGURATION_FIX.md for detailed fix instructions**

### Step 3: Delete Auto-Created Services & Create Correct Ones

Railway auto-detected wrong services. Delete them and create the right ones:

#### Delete Existing Services:
1. Click on **"api"** service → **Settings** → scroll down → **Delete Service**
2. Repeat for **"dashboard"** and **"mobile-app"** services
3. You should have an empty project now

#### Create Web Service:
1. Click **"+ New"** in Railway dashboard
2. Select **"GitHub Repo"**
3. Choose `syedfasihzaidi480/Biometric-verification-system`
4. Click **"Deploy Now"**
5. ⚠️ **IMPORTANT**: Immediately go to **Settings**
6. Set **Root Directory**: `apps/web`
7. Set **Service Name**: `biometric-web`
8. Click **"Redeploy"**

#### Create ML Service:
1. Click **"+ New"** in Railway dashboard
2. Select **"GitHub Repo"**
3. Choose same repository
4. Click **"Deploy Now"**
5. ⚠️ **IMPORTANT**: Immediately go to **Settings**
6. Set **Root Directory**: `ml-service`
7. Set **Service Name**: `biometric-ml`
8. Click **"Redeploy"**

### Step 4: Add Environment Variables

#### For Web Service (biometric-web):

Click **Variables** tab and add these one by one:

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://mamadoukkeita_db_user:y6otEOBIzNIs7iAm@biometricverificationsy.f96ecuj.mongodb.net/?retryWrites=true&w=majority&appName=BiometricVerificationSystem
MONGODB_DB=auth
CLOUDINARY_CLOUD_NAME=dzzaebsfc
CLOUDINARY_API_KEY=541276445497123
CLOUDINARY_API_SECRET=SnSoEdqRpc1LTzMkYzVlA_6phPE
ML_SERVICE_URL=http://biometric-ml.railway.internal:8000
```

**Generate AUTH_SECRET:**
```bash
# Run this locally
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy the output and add as AUTH_SECRET in Railway
```

#### For ML Service (biometric-ml):

Click **Variables** tab and add:

```bash
PORT=8000
PYTHONUNBUFFERED=1
```

### Step 5: Get Your Domain

1. Go to **biometric-web** service
2. Click **Settings** → **Networking**
3. Click **Generate Domain**
4. Copy the domain (e.g., `biometric-web-production.railway.app`)

### Step 6: Update AUTH_URL

1. In **biometric-web** variables
2. Add new variable:
   ```
   AUTH_URL=https://biometric-web-production.railway.app
   ```
   (Replace with your actual domain)

### Step 7: Redeploy

1. Click **Deployments** tab
2. Click **"Redeploy"** button
3. Wait for deployment to complete (2-3 minutes)

### Step 8: Create Database Indexes

After successful deployment:

```bash
# Option 1: Use Railway CLI
railway run --service biometric-web node utils/create-indexes.cjs

# Option 2: MongoDB Atlas
# 1. Go to MongoDB Atlas
# 2. Network Access → Add IP Address → 0.0.0.0/0 (Allow from anywhere)
# 3. Run locally:
cd apps/web
node utils/create-indexes.cjs
```

### Step 9: Test Your Deployment

```bash
# Test web service
curl https://your-domain.railway.app/api/health

# Test ML service (from web)
curl https://your-domain.railway.app/api/ml-health
```

### Step 10: Update Mobile App

In `apps/mobile/.env`:
```bash
API_URL=https://your-domain.railway.app
```

## ✅ Deployment Complete!

Your backend is now live at:
- **Web API**: https://your-domain.railway.app
- **ML Service**: Internal (accessed via web service)

## 🔍 Troubleshooting Quick Fixes

### Build Fails?
```bash
# Check logs in Railway dashboard
# Common fix: Clear build cache
Railway Dashboard → Service → Settings → Clear Cache → Redeploy
```

### Service Crashes?
```bash
# Check deployment logs
Railway Dashboard → Service → Deployments → View Logs

# Common issues:
# 1. Missing environment variables
# 2. MongoDB connection (check Atlas IP whitelist)
# 3. Port configuration (should be 4000 for web, 8000 for ML)
```

### MongoDB Connection Failed?
```bash
# Fix in MongoDB Atlas:
1. Network Access → Add IP → 0.0.0.0/0
2. Database Access → Verify user has readWrite permissions
```

### Can't Access ML Service?
```bash
# Update ML_SERVICE_URL in web service:
ML_SERVICE_URL=http://biometric-ml.railway.internal:8000

# Make sure both services are in the same Railway project
```

## 📊 Monitor Your Services

Railway Dashboard provides:
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, network usage
- **Deployments**: Build history and status
- **Settings**: Configuration and environment

## 💰 Cost Estimate

- **Development**: $5 credit (free trial)
- **Production**: ~$15-25/month
  - Web service: ~$5-10/month
  - ML service: ~$10-15/month

## 🎉 Next Steps

1. ✅ Test all API endpoints
2. ✅ Test mobile app connection
3. ✅ Monitor logs for errors
4. ✅ Set up custom domain (optional)
5. ✅ Configure alerts (optional)

## 📞 Need Help?

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Full Guide**: See `RAILWAY_DEPLOYMENT.md`

---

**Deployment Time**: ~5-10 minutes
**Status**: Your backend is production-ready! 🚀
