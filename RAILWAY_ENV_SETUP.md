# Railway Environment Setup - Critical Fix

## ⚠️ Important: Database Configuration Issue Fixed

### The Problem
The application was trying to initialize Neon PostgreSQL even when using MongoDB, causing this error:
```
Error: Database connection string format for `neon()` should be: postgresql://user:password@host.tld/dbname?option=value
```

### The Fix
Updated `apps/web/__create/index.ts` to properly check if `DATABASE_URL` is set before trying to initialize PostgreSQL.

## Railway Environment Variables (Required)

### ✅ Set These in Railway Dashboard

Go to your Railway project → **biometric-web service** → **Variables** tab

**DO NOT set `DATABASE_URL`** - you're using MongoDB!

Set these variables:

```bash
# Authentication
AUTH_SECRET=YOUR_RANDOM_32_CHAR_SECRET_HERE
AUTH_URL=https://your-project.railway.app

# MongoDB (Your existing connection)
MONGODB_URI=mongodb+srv://mamadoukkeita_db_user:y6otEOBIzNIs7iAm@biometricverificationsy.f96ecuj.mongodb.net/?retryWrites=true&w=majority&appName=BiometricVerificationSystem
MONGODB_DB=auth

# Cloudinary  
CLOUDINARY_CLOUD_NAME=dzzaebsfc
CLOUDINARY_API_KEY=541276445497123
CLOUDINARY_API_SECRET=SnSoEdqRpc1LTzMkYzVlA_6phPE

# ML Service (use Railway internal network)
ML_SERVICE_URL=http://biometric-ml.railway.internal:8000

# Node Environment
NODE_ENV=production
PORT=4000
```

### ❌ Do NOT Set These:
- `DATABASE_URL` - Leave this UNSET! The app will use MongoDB instead.

## Verification

After deploying, the app should:
1. ✅ Start without Neon PostgreSQL errors
2. ✅ Connect to MongoDB successfully  
3. ✅ Health endpoint shows: `{"storage": "mongodb", "mongo": {"enabled": true, "ok": true}}`

## Troubleshooting

If you still see the Neon error:
1. Check Railway Variables - ensure `DATABASE_URL` is NOT set
2. Redeploy the service after removing `DATABASE_URL`
3. Check logs to verify MongoDB connection

## Local Development

For local development, ensure your `apps/web/.env` file has:
```bash
# Comment out or remove DATABASE_URL
# DATABASE_URL= 

# Keep MongoDB URI
MONGODB_URI=mongodb+srv://...
```

Then rebuild:
```bash
cd apps/web
npm run build
npm run start
```
