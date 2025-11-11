# 🔴 502 Bad Gateway Error - Troubleshooting Guide

## What 502 Bad Gateway Means

Railway is trying to reach your app but it's **not running** or **crashing on startup**.

This is almost certainly because of the **Neon PostgreSQL error** we've been fixing!

## ✅ STEP-BY-STEP FIX

### Step 1: Check Railway Deployment Logs

1. Go to Railway Dashboard: https://railway.app
2. Click on your **web service** (biometric-web or similar)
3. Click on the **Deployments** tab
4. Click on the **latest deployment** (should show "Failed" or "Running")
5. Look at the **Deploy Logs**

You should see the Neon error there:
```
Error: Database connection string format for `neon()` should be: postgresql://...
```

### Step 2: Fix the DATABASE_URL Variable

**This is the root cause!**

1. While in your service, click **Variables** tab
2. **Look for `DATABASE_URL`**
3. **If it exists → DELETE IT!** (Click trash icon)
4. **Confirm deletion**

### Step 3: Verify Your Variables

Make sure you have these variables set (and ONLY these):

```bash
# Required for MongoDB
MONGODB_URI=mongodb+srv://mamadoukkeita_db_user:y6otEOBIzNIs7iAm@biometricverificationsy.f96ecuj.mongodb.net/?retryWrites=true&w=majority&appName=BiometricVerificationSystem
MONGODB_DB=auth

# Required for Auth
AUTH_SECRET=<generate-with-command-below>
AUTH_URL=https://your-railway-domain.railway.app

# Required for Cloudinary
CLOUDINARY_CLOUD_NAME=dzzaebsfc
CLOUDINARY_API_KEY=541276445497123
CLOUDINARY_API_SECRET=SnSoEdqRpc1LTzMkYzVlA_6phPE

# Optional but recommended
NODE_ENV=production
PORT=4000

# ❌ DO NOT HAVE:
# DATABASE_URL (delete if exists!)
```

**Generate AUTH_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Update AUTH_URL

1. Get your Railway public URL:
   - In Railway → Service → Settings → scroll to "Domains"
   - Copy the `.railway.app` domain
   
2. Set AUTH_URL to that domain:
   ```
   AUTH_URL=https://biometric-web-production-xxxx.railway.app
   ```

### Step 5: Redeploy

After fixing the variables:

**Option A: Redeploy from Dashboard**
1. Go to **Deployments** tab
2. Click **⋮** (three dots) on latest deployment
3. Click **Redeploy**

**Option B: Force redeploy from terminal**
```bash
git commit --allow-empty -m "Trigger Railway redeploy with fixed env vars"
git push origin main
```

### Step 6: Watch the Deployment

Monitor the deploy logs. You should see:

✅ **Success indicators:**
```
npm run build
✓ built in X seconds
npm start
🚀 Server started on port 4000
```

❌ **If you still see Neon error:**
- DATABASE_URL is still set in Railway
- Go back and double-check Variables tab

### Step 7: Test Your App

Once deployment shows "Success":

1. Visit your Railway URL: `https://your-app.railway.app`
   - Should show your app (not 502)

2. Test health endpoint: `https://your-app.railway.app/api/health`
   - Should return JSON with MongoDB status

## Common Issues

### Issue 1: "Still seeing 502 after removing DATABASE_URL"

**Solution:** Clear build cache
1. Railway Dashboard → Service → Settings
2. Scroll to "Danger Zone"  
3. Click "Clear Build Cache"
4. Redeploy

### Issue 2: "AUTH_URL not set correctly"

**Symptom:** App starts but authentication doesn't work

**Solution:** 
1. Get exact Railway domain from Settings → Domains
2. Set AUTH_URL to: `https://your-exact-domain.railway.app`
3. Must include `https://`
4. No trailing slash

### Issue 3: "Build succeeds but still crashes"

**Check logs for:**
- MongoDB connection errors → Check MONGODB_URI is correct
- Missing environment variables → Check all required vars are set
- Port binding issues → Make sure PORT=4000 or let Railway auto-set

## Quick Diagnostic

Run this in your terminal to check your local env:
```bash
node scripts/check-env.cjs
```

This will tell you if any variables are misconfigured.

## Expected Result

✅ **After fixing:**
- Railway deployment shows "Success" (green)
- Visiting your Railway URL shows your app
- No 502 errors
- No Neon PostgreSQL errors in logs
- Health endpoint returns MongoDB status

## Need More Help?

If you've done all the above and still see 502:

1. **Share your Railway deploy logs** (copy from Deployments tab)
2. **Share your Railway variables list** (just the names, not values)
3. Check if Railway service is actually running:
   - Dashboard → Service
   - Should show "Active" with green dot
