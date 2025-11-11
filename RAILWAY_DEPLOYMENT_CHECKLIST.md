# Railway Deployment Checklist - Print This!

## ⚡ BEFORE You Start

- [ ] MongoDB Atlas account created
- [ ] MongoDB cluster is running
- [ ] Database user created with password
- [ ] Network access allows 0.0.0.0/0
- [ ] Connection string copied (with real password!)
- [ ] Cloudinary account created
- [ ] Cloudinary credentials copied
- [ ] Railway account connected to GitHub

---

## 🎯 Railway Service Configuration

### Service Settings Tab

- [ ] **Root Directory**: `apps/web` ✅ CRITICAL!
- [ ] **Build Command**: `npm run build` (or empty)
- [ ] **Start Command**: `npm start` (or empty)
- [ ] Builder: NIXPACKS (auto-detected)

### Variables Tab - Required

```
Variable Name          | Example Value                           | Status
-----------------------|-----------------------------------------|--------
MONGODB_URI            | mongodb+srv://user:pass@cluster...      | [ ]
MONGODB_DB             | auth                                    | [ ]
AUTH_SECRET            | a1b2c3d4e5f6... (32+ chars)            | [ ]
AUTH_URL               | https://your-app.railway.app            | [ ]
CLOUDINARY_CLOUD_NAME  | dzzaebsfc                               | [ ]
CLOUDINARY_API_KEY     | 541276445497123                         | [ ]
CLOUDINARY_API_SECRET  | SnSoEdqRpc1LTzMkYzVlA_6phPE            | [ ]
NODE_ENV               | production                              | [ ]
```

### Variables Tab - Must NOT Have

- [ ] **DATABASE_URL** is NOT in the list ✅ CRITICAL!
- [ ] No empty variables
- [ ] No variables with `<password>` or `<placeholder>`

---

## 🔍 Deployment Verification

### In Railway Logs (Deployments → Latest → Deploy Logs)

Look for these SUCCESS indicators:
- [ ] `✓ built in X seconds`
- [ ] `npm start`
- [ ] `🚀 Server started on port 4000` (or other port)
- [ ] No Neon/PostgreSQL errors
- [ ] No MongoDB connection errors
- [ ] Deployment status: "Active" (green)

### Check for these ERRORS (should NOT see):

- [ ] ❌ `Error: Database connection string format for neon()`
- [ ] ❌ `DATABASE_URL`
- [ ] ❌ `postgresql://`
- [ ] ❌ `MongoServerError: Authentication failed`
- [ ] ❌ `ECONNREFUSED`
- [ ] ❌ `Module not found`

---

## 🌐 Test Your Deployment

### Test 1: Health Endpoint

URL: `https://your-app.railway.app/api/health`

Expected Response:
```json
{
  "success": true,
  "data": {
    "storage": "mongodb",
    "mongo": { "enabled": true, "ok": true },
    "postgres": { "enabled": false }
  }
}
```

- [ ] Returns 200 OK (not 502)
- [ ] Shows `"storage": "mongodb"`
- [ ] Shows `"ok": true` for mongo
- [ ] Shows `"enabled": false` for postgres

### Test 2: Admin Pages

- [ ] `https://your-app.railway.app/admin/signin` loads
- [ ] `https://your-app.railway.app/admin/signup` loads
- [ ] Can create admin user
- [ ] Can login

### Test 3: Home Page

- [ ] `https://your-app.railway.app/` loads (no 502)
- [ ] No console errors
- [ ] Page renders correctly

---

## 📱 Mobile App Configuration

### File: apps/mobile/.env

- [ ] File exists (copy from .env.example if not)
- [ ] `EXPO_PUBLIC_API_URL=https://your-app.railway.app`
- [ ] URL matches Railway domain exactly
- [ ] Starts with `https://`
- [ ] No trailing slash

### Test Mobile Connection

- [ ] Run `npx expo start` in apps/mobile
- [ ] Scan QR code with Expo Go
- [ ] App connects (no network errors)
- [ ] Can register new user
- [ ] Can login

---

## 🐛 Common Issues Quick Fix

| Issue | Check This | Fix |
|-------|------------|-----|
| 502 Error | DATABASE_URL in Variables | Delete it |
| 502 Error | Root Directory | Set to `apps/web` |
| Build Fails | Root Directory | Must be `apps/web` |
| MongoDB Error | MONGODB_URI | Check password, URL |
| Auth Fails | AUTH_SECRET | Generate new 32+ char string |
| Auth Fails | AUTH_URL | Must match Railway domain |
| File Upload Fails | Cloudinary vars | Check all 3 credentials |
| App Crashes | Deployment logs | Read first error message |

---

## 🔄 Quick Redeploy Steps

1. Make changes in Railway dashboard
2. Click "Deployments" tab
3. Click ⋮ (three dots) on latest deployment
4. Click "Redeploy"
5. Watch logs for errors
6. Test health endpoint

---

## 💾 Save These Values

Write down and keep secure:

```
PROJECT NAME: Biometric-verification-system
RAILWAY URL: https://_________________________.railway.app
MONGODB_URI: mongodb+srv://_____________________________
AUTH_SECRET: _____________________________________________
CLOUDINARY_CLOUD_NAME: dzzaebsfc
CLOUDINARY_API_KEY: 541276445497123
CLOUDINARY_API_SECRET: SnSoEdqRpc1LTzMkYzVlA_6phPE
```

---

## ✅ Final Verification

ALL must be checked:

- [ ] Service deployed successfully
- [ ] No errors in deployment logs
- [ ] Health endpoint returns 200 OK
- [ ] Admin login page loads
- [ ] Mobile app can connect
- [ ] No 502 errors anywhere
- [ ] Service shows "Active" status in Railway
- [ ] MongoDB connection working (mongo.ok = true)
- [ ] Cloudinary credentials verified
- [ ] AUTH_URL matches actual domain

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Railway service status: **Active** (green dot)
✅ Health endpoint: **Returns JSON with mongo.ok = true**
✅ Admin pages: **Load without errors**
✅ Mobile app: **Connects and registers users**
✅ No 502 errors: **All pages accessible**
✅ Files upload: **Voice/face/documents save to Cloudinary**

**Deployment time**: ~30 minutes first time, ~5 minutes for redeployments

**Cost**: $0/month (using free tiers)

---

## 📞 Emergency Contacts

- Railway Docs: https://docs.railway.app
- MongoDB Atlas Support: https://www.mongodb.com/cloud/atlas/support
- Cloudinary Docs: https://cloudinary.com/documentation

---

**Print this page and check off each item as you complete it!**

Last updated: 2025-11-11
