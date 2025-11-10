# Railway Deployment Guide - Biometric Verification System

## 🚂 Overview

This guide will help you deploy the complete backend (apps/web + ml-service) to Railway.

**What you'll deploy:**
- ✅ `apps/web` - Main backend API (Node.js + React Router)
- ✅ `ml-service` - ML service (Python + FastAPI)
- ✅ MongoDB Atlas - Database (external)
- ✅ Cloudinary - File storage (external)

## 📋 Prerequisites

1. **Railway Account**: Sign up at https://railway.app
2. **MongoDB Atlas**: Already have connection string
3. **Cloudinary Account**: Already configured
4. **GitHub Account**: For deployment

## 🎯 Deployment Strategy

Railway will run **2 services**:
1. **Web Service** (`apps/web`) - Port 4000
2. **ML Service** (`ml-service`) - Port 8000

## 📁 Step 1: Prepare Repository

### 1.1 Add Railway Configuration Files

I'll create these files for you:
- `railway.json` - Railway configuration
- `apps/web/Dockerfile` - Web service container
- `ml-service/Dockerfile` - ML service container
- `.dockerignore` - Files to exclude

### 1.2 Update Package Scripts

Add build and start scripts for production.

## 🔧 Step 2: Railway Project Setup

### 2.1 Create New Project

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub
5. Select repository: `syedfasihzaidi480/Biometric-verification-system`

### 2.2 Configure Services

Railway will detect your monorepo. You need to create 2 services:

#### Service 1: Web Backend

```
Name: biometric-web
Root Directory: apps/web
Build Command: npm install && npm run build
Start Command: npm start
Port: 4000
```

#### Service 2: ML Service

```
Name: biometric-ml
Root Directory: ml-service
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Port: 8000
```

## 🔐 Step 3: Environment Variables

### 3.1 Web Service Environment Variables

In Railway dashboard, go to **biometric-web** → **Variables**, add:

```bash
# Node Environment
NODE_ENV=production
PORT=4000

# Authentication
AUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
AUTH_SECRET=your-production-secret-change-this-random-string-min-32-chars

# MongoDB (Use your existing Atlas connection)
MONGODB_URI=mongodb+srv://mamadoukkeita_db_user:y6otEOBIzNIs7iAm@biometricverificationsy.f96ecuj.mongodb.net/?retryWrites=true&w=majority&appName=BiometricVerificationSystem
MONGODB_DB=auth

# Cloudinary
CLOUDINARY_CLOUD_NAME=dzzaebsfc
CLOUDINARY_API_KEY=541276445497123
CLOUDINARY_API_SECRET=SnSoEdqRpc1LTzMkYzVlA_6phPE

# ML Service URL (internal Railway network)
ML_SERVICE_URL=http://biometric-ml.railway.internal:8000

# CORS Origins (optional)
CORS_ORIGINS=${{RAILWAY_PUBLIC_DOMAIN}}
```

### 3.2 ML Service Environment Variables

In Railway dashboard, go to **biometric-ml** → **Variables**, add:

```bash
# Python Environment
PORT=8000
PYTHONUNBUFFERED=1
```

## 🌐 Step 4: Domain Configuration

### 4.1 Get Railway Domain

After deployment, Railway will give you:
- Web Service: `biometric-web.railway.app` (or custom domain)
- ML Service: `biometric-ml.railway.app`

### 4.2 Update AUTH_URL

1. Copy your Railway domain for web service
2. Update `AUTH_URL` environment variable
3. Redeploy the service

### 4.3 Custom Domain (Optional)

1. Go to **Settings** → **Networking**
2. Click **Generate Domain** or add custom domain
3. Update DNS records if using custom domain

## 🚀 Step 5: Deploy

### 5.1 Initial Deployment

Railway automatically deploys when you:
1. Push to your GitHub repository
2. Or click **Deploy** in Railway dashboard

### 5.2 Monitor Deployment

1. Go to **Deployments** tab
2. Click on latest deployment
3. View build logs
4. Check for errors

### 5.3 View Logs

```
Railway Dashboard → Your Service → Deployments → View Logs
```

## ✅ Step 6: Verify Deployment

### 6.1 Test Web Service

```bash
# Health check
curl https://your-domain.railway.app/api/health

# ML Service (from web backend)
curl https://your-domain.railway.app/api/liveness/check
```

### 6.2 Test ML Service

```bash
# Health check
curl https://biometric-ml.railway.app/health

# API docs
https://biometric-ml.railway.app/docs
```

### 6.3 Create Database Indexes

After first deployment, run:

```bash
# Via Railway CLI or SSH into container
node apps/web/utils/create-indexes.cjs
```

## 📦 Step 7: Post-Deployment

### 7.1 Database Indexes

Run this once to create MongoDB indexes:

```javascript
// Can be run from Railway console or local machine
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db('auth');

// Create indexes (or run create-indexes.cjs)
```

### 7.2 Test Mobile App Connection

Update mobile app API URL:

```typescript
// apps/mobile/.env
API_URL=https://your-domain.railway.app
```

### 7.3 Test Voice Enrollment

1. Open mobile app
2. Try voice enrollment
3. Check Cloudinary for uploaded files
4. Check MongoDB for stored data

## 🔄 Continuous Deployment

Railway automatically redeploys when you push to GitHub:

```bash
git add .
git commit -m "Update backend"
git push origin main
```

Railway will:
1. Detect changes
2. Build both services
3. Deploy automatically
4. Zero-downtime deployment

## 🛠️ Troubleshooting

### Issue: Build Fails

**Check:**
1. Build logs in Railway dashboard
2. Package.json scripts are correct
3. All dependencies are listed
4. Node version compatibility

**Solution:**
```bash
# Add to package.json
"engines": {
  "node": "18.x",
  "npm": "9.x"
}
```

### Issue: Service Crashes

**Check:**
1. Deployment logs
2. Environment variables set correctly
3. MongoDB connection string valid
4. Port configuration

**Solution:**
```bash
# Check logs
railway logs --service biometric-web

# Restart service
railway restart --service biometric-web
```

### Issue: MongoDB Connection Failed

**Check:**
1. MongoDB Atlas IP whitelist (add 0.0.0.0/0 for Railway)
2. Connection string is correct
3. Database user has permissions

**Solution:**
1. Go to MongoDB Atlas
2. Network Access → Add IP Address → Allow from anywhere (0.0.0.0/0)
3. Database Access → Verify user has read/write permissions

### Issue: Cloudinary Upload Fails

**Check:**
1. Environment variables are set
2. API credentials are correct
3. Cloudinary account is active

**Solution:**
```bash
# Test Cloudinary in Railway console
curl -X POST https://your-domain.railway.app/api/test-cloudinary
```

### Issue: ML Service Not Reachable

**Check:**
1. ML service is running (check logs)
2. Internal URL is correct: `http://biometric-ml.railway.internal:8000`
3. Both services are in same project

**Solution:**
Update `ML_SERVICE_URL` to use Railway internal networking:
```
ML_SERVICE_URL=http://biometric-ml.railway.internal:8000
```

## 💰 Pricing

Railway offers:
- **Free Trial**: $5 credit (enough for testing)
- **Developer Plan**: $5/month
- **Team Plan**: $20/month

**Estimated costs:**
- Web Service: ~$5-10/month (512MB RAM, shared CPU)
- ML Service: ~$10-15/month (1GB RAM, shared CPU)
- Total: ~$15-25/month

## 📊 Monitoring

### Built-in Metrics

Railway provides:
- CPU usage
- Memory usage
- Network traffic
- Request count
- Response times

### Custom Monitoring

Add health checks:

```javascript
// apps/web/src/app/api/health/route.js
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: 'connected',
      cloudinary: 'configured',
      ml: 'reachable'
    }
  });
}
```

## 🔒 Security Checklist

- [ ] Change `AUTH_SECRET` to strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Enable MongoDB Atlas IP whitelist
- [ ] Use HTTPS for all URLs
- [ ] Set CORS_ORIGINS to your domain
- [ ] Rotate API keys regularly
- [ ] Enable Railway 2FA
- [ ] Review environment variables

## 🚀 Production Optimizations

### 1. Scale Services

```
Railway Dashboard → Service → Settings → Resources
- Increase memory (1GB → 2GB)
- Increase CPU (shared → dedicated)
```

### 2. Add Redis (Optional)

For session storage:
```
Railway → New → Database → Redis
```

### 3. Enable Logging

Add structured logging:
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});
```

### 4. Database Backups

MongoDB Atlas automatic backups:
1. Atlas Dashboard → Backup
2. Enable Continuous Backup
3. Set retention policy

## 📝 Deployment Checklist

Before deploying:

- [ ] All environment variables configured
- [ ] MongoDB Atlas IP whitelist updated
- [ ] Cloudinary credentials verified
- [ ] Railway.json configured
- [ ] Dockerfiles created
- [ ] Build scripts tested locally
- [ ] Health check endpoints working
- [ ] Mobile app API URL updated

After deploying:

- [ ] Web service accessible
- [ ] ML service accessible
- [ ] Database connection working
- [ ] File uploads to Cloudinary working
- [ ] Voice enrollment working
- [ ] Liveness check working
- [ ] Document upload working
- [ ] Database indexes created
- [ ] Mobile app connected successfully

## 📞 Support

**Railway Support:**
- Documentation: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

**Project Issues:**
- Check deployment logs
- Review environment variables
- Test each service independently
- Monitor resource usage

## 🎉 Success!

Once deployed:
1. Your backend is running 24/7
2. Automatic deployments on git push
3. HTTPS enabled automatically
4. Global CDN for static files
5. Built-in monitoring and logs

**Next Steps:**
1. Test all API endpoints
2. Update mobile app with production URL
3. Monitor logs for errors
4. Set up alerts for downtime
5. Add custom domain (optional)

---

**Need Help?** Check the troubleshooting section or Railway documentation.
