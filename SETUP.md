# Complete Setup Guide - Voice Biometric Verification System

## Quick Start Summary

### Prerequisites
- Node.js (v18 or v20 recommended)
- For Android: Android Studio + Android SDK (or physical device with USB debugging)
- For iOS: macOS with Xcode (or physical device with Expo Go)
- MongoDB Atlas account (already configured with your connection string)

---

## Step 1: Install Dependencies

```powershell
# Install web dependencies
cd "g:\mamadou kiete\create-anything\apps\web"
npm install

# Install mobile dependencies
cd "g:\mamadou kiete\create-anything\apps\mobile"
npm install
```

---

## Step 2: Environment Configuration

### Web App (`apps/web/.env`)
Already configured with:
- `AUTH_URL=http://192.168.100.10:4000`
- `AUTH_SECRET=dev-secret-please-change-0f2f8e4c-4b5d-4e2f-9c1d-5a9a9ef5e4a2`
- `MONGODB_URI` pointing to your Atlas cluster
- `MONGODB_DB=auth`

### Mobile App (`apps/mobile/.env`)
Already configured with:
- `EXPO_PUBLIC_BASE_URL=http://192.168.100.10:4000`
- `EXPO_PUBLIC_PROXY_BASE_URL=http://192.168.100.10:4000`
- `EXPO_PUBLIC_PROJECT_GROUP_ID=create-anything-dev`
- `EXPO_PUBLIC_HOST=192.168.100.10:4000`

**Important**: These URLs point to `192.168.100.10:4000`. If your PC's IP changes, update both files.

---

## Step 3: Start the Applications

### Terminal 1 - Web Server (Port 4000)

```powershell
cd "g:\mamadou kiete\create-anything\apps\web"
npm run dev
```

**Verify**: You should see output like:
```
VITE v... ready in ...ms
➜  Local:   http://localhost:4000/
➜  Network: http://192.168.100.10:4000/
```

**Test in browser**: Open `http://192.168.100.10:4000` on your phone to verify it's reachable.

### Terminal 2 - Mobile App (Expo)

```powershell
cd "g:\mamadou kiete\create-anything\apps\mobile"
npx expo start -c
```

**Options**:
- Press `a` for Android emulator (if you have one running)
- Scan QR code with Expo Go app on your physical device
- If network issues, use tunnel mode: `npx expo start --tunnel`

---

## Step 4: Test Authentication Flow

### Option A: Sign Up (New User)

1. **Open Sign Up Page**:
   - Mobile: Tap "Sign In" button → modal opens → tap "Sign up" link at bottom
   - Browser: Navigate to `http://192.168.100.10:4000/account/signup`

2. **Fill the Form**:
   - Full Name: `Hassan`
   - Date of Birth: `09/12/2003` (DD/MM/YYYY)
   - Pension Number: `12345`
   - Phone Number: `+92304646645`
   - Email: `test@example.com` (required)
   - Password: `YourPassword123` (required)

3. **Submit**: Click "Create Account"
   - Profile is saved to MongoDB `users` collection
   - Credentials are created in `auth_users` and `auth_accounts` collections
   - You're automatically signed in and redirected

### Option B: Sign In (Existing User)

1. **Open Sign In Page**:
   - Mobile: Tap "Sign In" button
   - Browser: Navigate to `http://192.168.100.10:4000/account/signin`

2. **Enter Credentials**:
   - Email: The email you used during signup
   - Password: The password you created

3. **Submit**: Click "Sign In"
   - JWT token is created
   - Mobile app receives the token via WebView callback
   - You're redirected to the dashboard

---

## Troubleshooting

### "Bad Request" Error on Sign In

**Causes**:
1. Auth URL mismatch between mobile .env and web server
2. Web server not bound to the network interface
3. CSRF/cookie security issues

**Solutions**:
- Verify web server is running on port 4000 and shows Network URL
- Check `AUTH_URL` in `apps/web/.env` matches the actual server URL
- Ensure `trustHost: true` is set in auth config (already applied)
- Test directly in phone browser: `http://192.168.100.10:4000/account/signin`

### Blank White Screen in Mobile

**Causes**:
1. Mobile can't reach the web server
2. Android blocking cleartext HTTP traffic
3. WebView failing to load

**Solutions**:
- Verify `apps/mobile/app.json` has `usesCleartextTraffic: true` (already applied)
- Check Windows Firewall allows inbound on port 4000
- Test URL directly in phone browser before trying in app
- Watch mobile Metro bundler for console errors

### "Something went wrong" on Sign Up

**Causes**:
1. MongoDB connection failed
2. Missing required fields
3. Duplicate user (phone/email/pension already exists)

**Solutions**:
- Check MongoDB Atlas connection string is correct
- Verify all required fields are filled (name, phone, pension, email, password)
- Use a different email/phone if user already exists
- Check web terminal for detailed error logs

### TypeScript Errors in node_modules

**Solution**: Already fixed by:
- Setting `"skipLibCheck": true` in tsconfig
- Adding `"ignoreDeprecations": "6.0"`
- Removing deprecated `baseUrl` option

---

## MongoDB Collections Structure

Your MongoDB database (`auth`) will have these collections:

### `auth_users` (Auth.js users)
```json
{
  "id": "uuid",
  "email": "test@example.com",
  "emailVerified": null,
  "name": null,
  "image": null
}
```

### `auth_accounts` (Linked credentials)
```json
{
  "userId": "uuid",
  "provider": "credentials",
  "type": "credentials",
  "providerAccountId": "uuid",
  "password": "hashed_argon2_password"
}
```

### `users` (Profile data)
```json
{
  "id": "uuid",
  "name": "Hassan",
  "phone": "+92304646645",
  "email": "test@example.com",
  "date_of_birth": "2003-12-09",
  "pension_number": "12345",
  "preferred_language": "en",
  "created_at": "2025-10-29T..."
}
```

### `voice_profiles` (Voice enrollment data)
```json
{
  "user_id": "uuid"
}
```

### `audit_logs` (Activity tracking)
```json
{
  "user_id": "uuid",
  "action": "USER_REGISTERED",
  "details": {...},
  "ip_address": "...",
  "created_at": "2025-10-29T..."
}
```

---

## Platform-Specific Notes

### Android (Physical Device)
- Ensure phone and PC are on **same Wi-Fi network**
- Use the actual LAN IP (`192.168.100.10` in your case)
- Enable USB debugging if connecting via cable
- Allow cleartext traffic (already configured in app.json)

### Android (Emulator)
- Use `10.0.2.2` instead of LAN IP to reach host machine
- Update `apps/mobile/.env`:
  ```
  EXPO_PUBLIC_BASE_URL=http://10.0.2.2:4000
  EXPO_PUBLIC_PROXY_BASE_URL=http://10.0.2.2:4000
  EXPO_PUBLIC_HOST=10.0.2.2:4000
  ```
- Restart Expo with `npx expo start -c`

### iOS (Physical Device - Windows)
- Cannot use iOS Simulator on Windows
- Install Expo Go app on iPhone
- Use tunnel mode if LAN doesn't work: `npx expo start --tunnel`
- Scan QR code with Camera app to open in Expo Go

### iOS (macOS)
- Press `i` in Expo terminal to launch iOS Simulator
- Or use `npx expo run:ios` for native build

---

## Next Steps After Authentication Works

1. **Voice Enrollment**: Complete voice samples recording
2. **Liveness Check**: Facial verification with camera
3. **Document Upload**: ID document verification
4. **Admin Dashboard**: Review and approve verifications at `/admin`

---

## Support Commands

### Check What's Running
```powershell
# See if port 4000 is in use
netstat -ano | findstr :4000
```

### Clear All Caches
```powershell
# Mobile
cd "g:\mamadou kiete\create-anything\apps\mobile"
npx expo start -c

# Web
cd "g:\mamadou kiete\create-anything\apps\web"
rm -r .react-router
npm run dev
```

### View MongoDB Data
- Login to MongoDB Atlas: https://cloud.mongodb.com
- Navigate to your cluster → Collections
- Database: `auth`
- Check `users`, `auth_users`, `auth_accounts` collections

---

## Environment Variables Reference

### Required for Web (`apps/web/.env`)
- `AUTH_URL` - Base URL where the web app is served
- `AUTH_SECRET` - Secret key for JWT signing (min 32 characters)
- `MONGODB_URI` - MongoDB Atlas connection string
- `MONGODB_DB` - Database name (default: `auth`)

### Required for Mobile (`apps/mobile/.env`)
- `EXPO_PUBLIC_BASE_URL` - Web server URL (must match AUTH_URL)
- `EXPO_PUBLIC_PROXY_BASE_URL` - Same as BASE_URL
- `EXPO_PUBLIC_PROJECT_GROUP_ID` - Project identifier
- `EXPO_PUBLIC_HOST` - Host portion of BASE_URL

---

## Common Workflow

```powershell
# Daily development workflow:

# 1. Start web server
cd "g:\mamadou kiete\create-anything\apps\web"
npm run dev

# 2. Start mobile (in new terminal)
cd "g:\mamadou kiete\create-anything\apps\mobile"
npx expo start

# 3. Test on device
# - Scan QR code
# - Tap "Sign In"
# - Complete auth flow

# 4. Make changes
# - Web: Hot reload automatic
# - Mobile: Press `r` to reload, `R` to restart
```

---

**Status**: All configuration complete. Auth flow ready to test!
