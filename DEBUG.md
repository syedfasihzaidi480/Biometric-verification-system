# 🔧 Debugging Authentication Issues

## ✅ Current Status

All configuration is complete! Both sign-in and sign-up now have detailed logging.

---

## 🚀 NEXT STEPS - Start Testing

### 1. Restart Web Server

```powershell
cd "g:\mamadou kiete\create-anything\apps\web"
npm run dev
```

**What to look for:**
```
VITE v... ready in ...ms
➜  Local:   http://localhost:4000/
➜  Network: http://192.168.100.10:4000/
```

### 2. Restart Mobile App (in new terminal)

```powershell
cd "g:\mamadou kiete\create-anything\apps\mobile"
npx expo start -c
```

**Note:** The `-c` flag clears cache and reloads environment variables.

### 3. Test Sign-Up Flow

**On your physical device:**
1. Open the app (scan QR code from Expo)
2. Tap "Sign In" → Tap "Sign up" link
3. Fill in the form:
  - Name: `Example User`
   - Date of Birth: `09/12/2003`
   - Pension Number: `12345`
   - Phone: `+92304646645`
   - Email: `test@example.com`
   - Password: `Test123!`
4. Click "Create Account"

**Watch the web terminal for logs:**
```
[REGISTER] Registration request received
[REGISTER] Request body: { name: 'Example User', ... }
[REGISTER] Using MongoDB for registration
[REGISTER] Checking for duplicate users...
[REGISTER] Creating user document...
[REGISTER] User created: <uuid>
[REGISTER] Creating voice profile...
[REGISTER] Logging audit event...
[REGISTER] Registration completed successfully
[SIGN-UP] Authorize called with email: test@example.com
[SIGN-UP] Checking if user exists...
[SIGN-UP] User already exists with this email
```

### 4. Test Sign-In Flow

**After sign-up succeeds:**
1. Return to sign-in screen
2. Enter:
   - Email: `test@example.com`
   - Password: `Test123!`
3. Click "Sign In"

**Watch the web terminal for logs:**
```
[SIGN-IN] Authorize called with email: test@example.com
[SIGN-IN] Looking up user by email...
[SIGN-IN] User found: <uuid>
[SIGN-IN] Verifying password...
[SIGN-IN] Authentication successful!
```

---

## 🐛 Troubleshooting with Logs

### "Bad Request" Error

**Logs to check:**
- If you see `[SIGN-IN]` logs, the request is reaching the server
- If NO logs appear, the mobile app can't reach http://192.168.100.10:4000

**Solutions:**
1. **Test directly in phone browser first:**
   - Open Safari/Chrome on your phone
   - Go to: `http://192.168.100.10:4000/account/signin`
   - If this works, the WebView should too
   - If this fails, check firewall/network

2. **Verify AUTH_URL matches:**
   ```powershell
   cd "g:\mamadou kiete\create-anything\apps\web"
   cat .env | findstr AUTH_URL
   ```
   Should show: `AUTH_URL=http://192.168.100.10:4000`

3. **Check Windows Firewall:**
   - Open Windows Defender Firewall
   - Allow inbound TCP on port 4000
   - Or temporarily disable for testing

### "Something went wrong" Error

**Check these logs:**
- `[REGISTER] Registration request received` - Request arrived
- `[REGISTER] Using MongoDB for registration` - Database selected
- `[REGISTER] User created: <uuid>` - Profile saved
- `[SIGN-UP] Authorize called` - Credentials creation started

**If missing any of these:**
- Registration failed before credentials were created
- User exists in `users` collection but not in `auth_users`
- Check for duplicate phone/pension/email in MongoDB

### No Logs Appearing

**Possible causes:**
1. Web server not running - restart it
2. Mobile pointing to wrong URL - check .env
3. Network disconnected - verify phone on same WiFi
4. Request not reaching server - test in phone browser first

---

## 📊 Verify MongoDB Data

### After successful sign-up, check MongoDB Atlas:

1. Go to: https://cloud.mongodb.com
2. Browse Collections → Database: `auth`
3. Check collections:

**auth_users** (should have 1 document):
```json
{
  "id": "uuid",
  "email": "test@example.com",
  "emailVerified": null
}
```

**auth_accounts** (should have 1 document):
```json
{
  "userId": "uuid",
  "provider": "credentials",
  "type": "credentials",
  "providerAccountId": "uuid",
  "password": "$argon2id$v=19$..."
}
```

**users** (should have 1 document):
```json
{
  "id": "uuid",
  "name": "Example User",
  "phone": "+92304646645",
  "email": "test@example.com",
  "pension_number": "12345",
  "date_of_birth": "2003-12-09",
  "preferred_language": "en",
  "created_at": "2025-..."
}
```

**voice_profiles** (should have 1 document):
```json
{
  "user_id": "uuid"
}
```

**audit_logs** (should have 1 document):
```json
{
  "user_id": "uuid",
  "action": "USER_REGISTERED",
  "details": {...},
  "created_at": "2025-..."
}
```

---

## 🔍 Common Log Patterns

### ✅ Successful Sign-Up
```
[REGISTER] Registration request received
[REGISTER] Using MongoDB for registration
[REGISTER] Checking for duplicate users...
[REGISTER] Creating user document...
[REGISTER] User created: abc-123
[REGISTER] Creating voice profile...
[REGISTER] Logging audit event...
[REGISTER] Registration completed successfully
[SIGN-UP] Authorize called with email: test@example.com
[SIGN-UP] Checking if user exists...
[SIGN-UP] Creating new auth user...
[SIGN-UP] Linking credentials account...
[SIGN-UP] User created successfully: def-456
```

### ✅ Successful Sign-In
```
[SIGN-IN] Authorize called with email: test@example.com
[SIGN-IN] Looking up user by email...
[SIGN-IN] User found: abc-123
[SIGN-IN] Verifying password...
[SIGN-IN] Authentication successful!
```

### ❌ Invalid Password
```
[SIGN-IN] Authorize called with email: test@example.com
[SIGN-IN] Looking up user by email...
[SIGN-IN] User found: abc-123
[SIGN-IN] Verifying password...
[SIGN-IN] Invalid password
```

### ❌ User Not Found
```
[SIGN-IN] Authorize called with email: notfound@example.com
[SIGN-IN] Looking up user by email...
[SIGN-IN] User not found: notfound@example.com
```

### ❌ Duplicate Registration
```
[REGISTER] Registration request received
[REGISTER] Using MongoDB for registration
[REGISTER] Checking for duplicate users...
[REGISTER] Duplicate user found: abc-123
```

---

## 🎯 Quick Test Checklist

- [ ] Web server shows Network URL: http://192.168.100.10:4000
- [ ] Phone browser can access http://192.168.100.10:4000
- [ ] Mobile app shows sign-in modal (not blank screen)
- [ ] Sign-up form has email + password fields
- [ ] Web terminal shows `[REGISTER]` logs during sign-up
- [ ] Web terminal shows `[SIGN-UP]` logs after registration
- [ ] MongoDB collections populated with new documents
- [ ] Sign-in form works with created credentials
- [ ] Web terminal shows `[SIGN-IN]` logs during sign-in
- [ ] Mobile app receives auth token and redirects

---

## 📝 Report Issues

If problems persist, share:
1. **Web terminal output** (copy all `[REGISTER]`, `[SIGN-UP]`, `[SIGN-IN]` logs)
2. **Mobile error message** (screenshot or exact text)
3. **Network test result** (does http://192.168.100.10:4000 work in phone browser?)
4. **MongoDB data** (does `auth_users` collection have documents?)

---

**Ready to test!** Run the two commands above and follow the sign-up flow. 🚀
