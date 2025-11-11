# 📝 Quick Reference: All Environment Variables

## 🌐 Web Backend (apps/web) - Railway Service 1

### Required Variables (Copy to Railway)

```bash
# ============================================
# DATABASE CONNECTION
# ============================================
MONGODB_URI=mongodb+srv://biometric_user:YOUR_PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=auth

# ============================================
# AUTHENTICATION
# ============================================
AUTH_SECRET=YOUR_RANDOM_32_CHAR_SECRET_HERE
AUTH_URL=https://your-app-name.railway.app

# ============================================
# CLOUDINARY (FILE STORAGE)
# ============================================
CLOUDINARY_CLOUD_NAME=dzzaebsfc
CLOUDINARY_API_KEY=541276445497123
CLOUDINARY_API_SECRET=SnSoEdqRpc1LTzMkYzVlA_6phPE

# ============================================
# ENVIRONMENT
# ============================================
NODE_ENV=production

# ============================================
# ML SERVICE (Optional - add after ML deployed)
# ============================================
ML_SERVICE_URL=http://biometric-ml.railway.internal:8000
```

### ❌ DO NOT SET THESE:
```bash
# DATABASE_URL  ← DO NOT ADD THIS! Causes errors with MongoDB
```

---

## 🤖 ML Service (ml-service) - Railway Service 2

### Required Variables

```bash
PORT=8000
PYTHONUNBUFFERED=1
```

---

## 📱 Mobile App (apps/mobile) - Local Development

### File: apps/mobile/.env

```bash
# Your Railway backend URL
EXPO_PUBLIC_API_URL=https://your-app-name.railway.app

# Optional (for legacy code compatibility)
EXPO_PUBLIC_BASE_URL=https://your-app-name.railway.app
```

---

## 🔧 How to Get Each Value

### MONGODB_URI
1. Go to MongoDB Atlas: https://cloud.mongodb.com
2. Click "Database" → "Connect" → "Connect your application"
3. Copy connection string
4. Replace `<password>` with your database password
5. **Format**: `mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority`

### AUTH_SECRET
Generate random string with this command:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Output example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

### AUTH_URL
1. Deploy web service to Railway first
2. Go to Service → Settings → Domains
3. Click "Generate Domain"
4. Copy the URL (e.g., `https://biometric-web-production-abc123.railway.app`)
5. Use with `https://` prefix

### Cloudinary Credentials
1. Go to Cloudinary Dashboard: https://cloudinary.com/console
2. Find on homepage:
   - **Cloud Name**: Under "Product Environment Credentials"
   - **API Key**: Same section
   - **API Secret**: Click "Reveal" to see it

---

## 🎯 Variable Checklist

### Before Railway Deployment

- [ ] MongoDB cluster created in Atlas
- [ ] MongoDB connection string copied
- [ ] Cloudinary account created
- [ ] Cloudinary credentials copied
- [ ] AUTH_SECRET generated

### During Railway Deployment

Web Backend Variables:
- [ ] MONGODB_URI added
- [ ] MONGODB_DB set to `auth`
- [ ] AUTH_SECRET added
- [ ] AUTH_URL added (after domain generated)
- [ ] CLOUDINARY_CLOUD_NAME added
- [ ] CLOUDINARY_API_KEY added
- [ ] CLOUDINARY_API_SECRET added
- [ ] NODE_ENV set to `production`
- [ ] DATABASE_URL NOT set (verified)

ML Service Variables (optional):
- [ ] PORT set to `8000`
- [ ] PYTHONUNBUFFERED set to `1`
- [ ] ML_SERVICE_URL added to web backend

Mobile App:
- [ ] .env file created
- [ ] EXPO_PUBLIC_API_URL set to Railway domain

---

## 🚨 Common Mistakes

### ❌ Wrong MONGODB_URI Format
```bash
# WRONG - Missing password
MONGODB_URI=mongodb+srv://user:<password>@cluster...

# WRONG - Using localhost
MONGODB_URI=mongodb://localhost:27017

# WRONG - HTTP instead of mongodb+srv
MONGODB_URI=http://cluster.mongodb.net

# ✅ CORRECT
MONGODB_URI=mongodb+srv://user:RealPassword123@cluster.mongodb.net/?retryWrites=true&w=majority
```

### ❌ Wrong AUTH_URL Format
```bash
# WRONG - Missing protocol
AUTH_URL=my-app.railway.app

# WRONG - Using http instead of https
AUTH_URL=http://my-app.railway.app

# WRONG - Trailing slash
AUTH_URL=https://my-app.railway.app/

# ✅ CORRECT
AUTH_URL=https://my-app.railway.app
```

### ❌ Setting DATABASE_URL
```bash
# ❌ NEVER SET THIS when using MongoDB
DATABASE_URL=postgresql://...
DATABASE_URL=

# ✅ CORRECT - Don't add this variable at all!
# (Only use MONGODB_URI)
```

### ❌ Wrong ML_SERVICE_URL
```bash
# WRONG - Using public URL (slow, costs bandwidth)
ML_SERVICE_URL=https://biometric-ml-production.railway.app

# ✅ CORRECT - Using internal network (fast, free)
ML_SERVICE_URL=http://biometric-ml.railway.internal:8000
```

---

## 📋 Copy-Paste Template

### For Railway Web Backend

```bash
MONGODB_URI=
MONGODB_DB=auth
AUTH_SECRET=
AUTH_URL=
CLOUDINARY_CLOUD_NAME=dzzaebsfc
CLOUDINARY_API_KEY=541276445497123
CLOUDINARY_API_SECRET=SnSoEdqRpc1LTzMkYzVlA_6phPE
NODE_ENV=production
ML_SERVICE_URL=http://biometric-ml.railway.internal:8000
```

**Instructions**: 
1. Copy this template
2. Fill in the blank values (MONGODB_URI, AUTH_SECRET, AUTH_URL)
3. Paste each line as a separate variable in Railway

---

## 🔍 How to Verify Variables

### Check Railway Variables
1. Railway Dashboard → Your Service
2. Click "Variables" tab
3. Count: Should have 8-9 variables (not including DATABASE_URL)
4. No empty values
5. No `DATABASE_URL` variable

### Test Locally
```bash
# In apps/web directory
node scripts/check-env.cjs
```

This will check:
- ✅ Required variables present
- ✅ Correct format
- ❌ DATABASE_URL not set
- ✅ MongoDB connection works

### Test on Railway
Visit: `https://your-app.railway.app/api/health`

Should return:
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

---

## 💡 Pro Tips

### Tip 1: Keep Secrets Secure
- Never commit `.env` files to GitHub
- Store credentials in password manager
- Rotate AUTH_SECRET monthly

### Tip 2: Use Railway's Built-in Variables
Railway provides these automatically:
- `PORT` - Auto-assigned port
- `RAILWAY_ENVIRONMENT` - Current environment
- `RAILWAY_SERVICE_NAME` - Service name

No need to set these manually!

### Tip 3: Testing Before Deploy
Test variables locally:
```bash
cd apps/web
cp .env.example .env
# Fill in .env with test values
npm run dev
# Test at http://localhost:4000
```

### Tip 4: Update Variables Without Redeploying
1. Change variable in Railway dashboard
2. Railway auto-restarts the service
3. No need to redeploy!

---

## 🆘 Emergency Reset

If everything is broken:

1. **Delete all variables**
2. **Re-add one by one from this template**
3. **Verify after each addition**
4. **Check logs for errors**

```bash
# Minimum working set (start here):
MONGODB_URI=<your-uri>
MONGODB_DB=auth
AUTH_SECRET=<generate-new>
AUTH_URL=https://your-app.railway.app
NODE_ENV=production
```

Then add Cloudinary and ML service variables after verifying basic setup works.

---

## 📞 Quick Help

| Problem | Solution |
|---------|----------|
| 502 Error | Check MONGODB_URI, remove DATABASE_URL |
| Can't login | Check AUTH_SECRET and AUTH_URL |
| File upload fails | Check Cloudinary credentials |
| ML features don't work | Check ML_SERVICE_URL or deploy ML service |
| Mobile can't connect | Check EXPO_PUBLIC_API_URL in mobile .env |

---

**Last Updated**: Use values from COMPLETE_BEGINNER_RAILWAY_GUIDE.md for detailed explanations.
