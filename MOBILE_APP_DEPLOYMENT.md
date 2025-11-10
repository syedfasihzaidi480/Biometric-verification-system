# Mobile App Configuration & Deployment Guide

## 🎯 Understanding the Architecture

```
┌──────────────────────────┐
│   User's Phone           │
│                          │
│   Mobile App             │  ← Runs on device (iOS/Android)
│   (React Native/Expo)    │  ← Downloads from App Store
│                          │
└────────────┬─────────────┘
             │
             │ HTTP API Calls
             │ (fetch/axios)
             │
             ▼
┌──────────────────────────────┐
│   Railway.app (Cloud)        │
│                              │
│   ┌────────────────────┐    │
│   │  biometric-web     │    │  ← Your Backend API
│   │  (apps/web)        │    │  ← https://your-app.railway.app
│   │  Port: 4000        │    │
│   └──────────┬─────────┘    │
│              │               │
│              │ Internal      │
│              ▼               │
│   ┌────────────────────┐    │
│   │  biometric-ml      │    │  ← ML Processing
│   │  (ml-service)      │    │  ← Internal only
│   │  Port: 8000        │    │
│   └────────────────────┘    │
└──────────────────────────────┘
```

## ❌ Mobile App Does NOT Go on Railway

**Why?**
- Mobile app is a **client application**
- Runs on user's phone/tablet
- Downloaded from App Store/Play Store
- Not a server/backend service

**What Railway Hosts:**
- ✅ `apps/web` - Backend API server
- ✅ `ml-service` - ML processing service
- ❌ `apps/mobile` - NOT hosted (it's a mobile app)

---

## 🔧 Development Configuration (Local Testing)

### Step 1: Configure Local Backend

In `apps/web/.env`:
```bash
AUTH_URL=http://192.168.x.x:4000  # Your PC's LAN IP
AUTH_SECRET=your-dev-secret
MONGODB_URI=mongodb+srv://...
MONGODB_DB=auth
```

### Step 2: Configure Mobile App

In `apps/mobile/.env`:
```bash
# Primary API URL (recommended)
EXPO_PUBLIC_API_URL=http://192.168.x.x:4000

# Legacy compatibility (if needed)
EXPO_PUBLIC_BASE_URL=http://192.168.x.x:4000
EXPO_PUBLIC_PROXY_BASE_URL=http://192.168.x.x:4000
EXPO_PUBLIC_PROJECT_GROUP_ID=create-anything-dev
EXPO_PUBLIC_HOST=192.168.x.x:4000
```

**For Android Emulator:**
Replace `192.168.x.x` with `10.0.2.2`

**For iOS Simulator:**
Use `localhost` or your LAN IP

### Step 3: Test Locally

```bash
# Terminal 1: Start backend
cd apps/web
npm run dev -- --host

# Terminal 2: Start mobile app
cd apps/mobile
npx expo start -c
```

---

## 🚀 Production Configuration (After Railway Deployment)

### Step 1: Deploy Backend to Railway

Follow **RAILWAY_QUICKSTART.md** to deploy:
- ✅ `apps/web` service
- ✅ `ml-service` service

You'll get a domain like: `https://biometric-web-production.railway.app`

### Step 2: Update Mobile App for Production

In `apps/mobile/.env`:
```bash
# Production API URL (from Railway)
EXPO_PUBLIC_API_URL=https://biometric-web-production.railway.app

# Legacy compatibility
EXPO_PUBLIC_BASE_URL=https://biometric-web-production.railway.app
EXPO_PUBLIC_PROXY_BASE_URL=https://biometric-web-production.railway.app
EXPO_PUBLIC_PROJECT_GROUP_ID=create-anything-prod
EXPO_PUBLIC_HOST=biometric-web-production.railway.app
```

### Step 3: Build & Test Mobile App

```bash
cd apps/mobile

# Test with Expo Go (development)
npx expo start

# Or build production APK/IPA
npx expo build:android
npx expo build:ios
```

---

## 📱 Mobile App Deployment Options

### Option 1: Expo Go (Development/Testing)

**For testing only - not for production!**

```bash
cd apps/mobile
npx expo start
```

Users scan QR code with Expo Go app to test.

**Limitations:**
- Limited to Expo Go app
- Cannot use custom native modules
- Not suitable for production

---

### Option 2: Expo EAS Build (Recommended for Production)

**Builds standalone APK/IPA files**

#### Setup EAS:
```bash
cd apps/mobile

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure
```

#### Build Android:
```bash
# Development build (for testing)
eas build --platform android --profile development

# Production build (for Play Store)
eas build --platform android --profile production
```

#### Build iOS:
```bash
# Requires Apple Developer Account ($99/year)
eas build --platform ios --profile production
```

**EAS handles:**
- ✅ Code signing
- ✅ Build optimization
- ✅ OTA updates
- ✅ Distribution

**Cost:**
- Free tier: Limited builds
- Paid: Unlimited builds (~$29/month)

---

### Option 3: Manual Build (Free but Complex)

#### Android APK:
```bash
cd apps/mobile

# Create Android build
npx expo prebuild --platform android
cd android
./gradlew assembleRelease

# APK will be in: android/app/build/outputs/apk/release/app-release.apk
```

#### iOS IPA:
```bash
cd apps/mobile

# Create iOS build (macOS only)
npx expo prebuild --platform ios
cd ios
xcodebuild -workspace YourApp.xcworkspace -scheme YourApp archive
```

**Requirements:**
- Android Studio (for Android)
- Xcode (for iOS - macOS only)
- Java Development Kit
- Signing keys/certificates

---

### Option 4: Over-The-Air (OTA) Updates

**After publishing to stores, push updates without resubmission:**

```bash
cd apps/mobile

# Publish update
npx expo publish

# Or with EAS
eas update
```

**Users get updates:**
- ✅ Automatically on next app launch
- ✅ No App Store/Play Store review
- ✅ Instant bug fixes

**Limitations:**
- Only for JavaScript/assets
- Cannot update native code
- Requires EAS Update service

---

## 🔐 Environment Variables Reference

### Development (Local Backend)

```bash
# apps/mobile/.env
EXPO_PUBLIC_API_URL=http://192.168.x.x:4000
EXPO_PUBLIC_BASE_URL=http://192.168.x.x:4000
EXPO_PUBLIC_PROXY_BASE_URL=http://192.168.x.x:4000
EXPO_PUBLIC_PROJECT_GROUP_ID=create-anything-dev
EXPO_PUBLIC_HOST=192.168.x.x:4000
```

### Production (Railway Backend)

```bash
# apps/mobile/.env
EXPO_PUBLIC_API_URL=https://your-app.railway.app
EXPO_PUBLIC_BASE_URL=https://your-app.railway.app
EXPO_PUBLIC_PROXY_BASE_URL=https://your-app.railway.app
EXPO_PUBLIC_PROJECT_GROUP_ID=create-anything-prod
EXPO_PUBLIC_HOST=your-app.railway.app
```

---

## 🎯 Complete Deployment Workflow

### Phase 1: Backend (Railway) ✅

1. Deploy `apps/web` to Railway
2. Deploy `ml-service` to Railway
3. Configure environment variables
4. Get production domain
5. Test backend APIs

**See: RAILWAY_QUICKSTART.md**

### Phase 2: Mobile App Configuration 📱

1. Update `apps/mobile/.env` with Railway URL
2. Test mobile app locally with production backend
3. Verify all API calls work
4. Check authentication flow
5. Test voice/face/document uploads

### Phase 3: Mobile App Build & Distribution 🚀

**Option A: Quick Testing (Expo Go)**
```bash
cd apps/mobile
npx expo start
# Share QR code with testers
```

**Option B: Production (EAS Build)**
```bash
cd apps/mobile
eas login
eas build:configure
eas build --platform android --profile production
eas build --platform ios --profile production
```

**Option C: App Store Submission**
1. Build with EAS
2. Download IPA/APK
3. Submit to Apple App Store / Google Play Store
4. Wait for approval (1-7 days)
5. Publish to users

---

## 🐛 Troubleshooting

### Mobile App Can't Connect to Backend

**Symptom:** "Network request failed" or timeout errors

**Solutions:**

1. **Check URL in .env:**
   ```bash
   # Development
   EXPO_PUBLIC_API_URL=http://192.168.x.x:4000
   
   # Production
   EXPO_PUBLIC_API_URL=https://your-app.railway.app
   ```

2. **Restart Expo with cache clear:**
   ```bash
   npx expo start -c
   ```

3. **Check backend is running:**
   ```bash
   # Test with curl
   curl https://your-app.railway.app/api/health
   ```

4. **Android emulator network:**
   - Use `10.0.2.2` instead of `localhost`
   - Not `127.0.0.1` or `localhost`

5. **HTTPS required for production:**
   - Railway provides HTTPS by default
   - Mobile apps require HTTPS for API calls (except localhost)

### API Calls Return 404

**Check endpoint paths:**
- Backend: `/api/auth/register`
- Mobile: Should call full URL: `https://your-app.railway.app/api/auth/register`

### Authentication Not Working

**Check JWT token storage:**
```javascript
// In mobile app code
import * as SecureStore from 'expo-secure-store';

// Token should be stored securely
const token = await SecureStore.getItemAsync('auth-token');
```

### CORS Errors

**Update backend CORS settings in `apps/web/src/app.ts`:**
```javascript
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));
```

---

## 💰 Cost Summary

### Backend (Railway):
- **Development**: Free trial ($5 credit)
- **Production**: ~$15-25/month
  - Web service: $5-10/month
  - ML service: $10-15/month

### Mobile App:
- **Development Testing**: Free (Expo Go)
- **EAS Build**: 
  - Free tier: Limited builds
  - Paid: $29/month (unlimited)
- **App Store Fees**:
  - Apple: $99/year
  - Google Play: $25 one-time
- **Alternative**: Manual build = Free (but time-consuming)

**Total Monthly Cost (Production):**
- Backend: $20/month
- Mobile build service: $29/month (optional)
- Total: ~$50/month + $124/year for app stores

---

## 📋 Quick Reference

### What Goes Where:

| Component | Platform | Access |
|-----------|----------|--------|
| `apps/web` | Railway | Public HTTPS |
| `ml-service` | Railway | Internal only |
| `apps/mobile` | User devices | App Stores |
| MongoDB | Atlas Cloud | Private |
| Cloudinary | Cloud CDN | Public URLs |

### API Endpoints Mobile App Uses:

| Endpoint | Purpose |
|----------|---------|
| `/api/auth/register` | User registration |
| `/api/auth/login` | User login |
| `/api/voice/enroll` | Voice enrollment |
| `/api/voice/verify` | Voice verification |
| `/api/liveness/check` | Face liveness |
| `/api/document/upload` | Document verification |
| `/api/account/profile` | User profile |

---

## ⏭️ Next Steps

1. ✅ Deploy backend to Railway (RAILWAY_QUICKSTART.md)
2. ✅ Update mobile app `.env` with Railway URL
3. ✅ Test mobile app with production backend
4. ✅ Build mobile app (choose Expo Go, EAS, or manual)
5. ✅ Distribute to testers or submit to stores

---

**🎉 Your mobile app will connect to Railway backend - no separate mobile server needed!**
