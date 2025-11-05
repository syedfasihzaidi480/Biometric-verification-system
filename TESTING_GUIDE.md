# Testing Guide - Authentication Fix

## Quick Test Steps

### Step 1: Start the Servers

**Terminal 1 - Web App:**
```powershell
cd "g:\mamadou kiete\create-anything\apps\web"
npm run dev
```

**Terminal 2 - Mobile App:**
```powershell
cd "g:\mamadou kiete\create-anything\apps\mobile"
npx expo start -c
```

### Step 2: Test Registration

#### On Mobile App:
1. Scan QR code from Expo
2. Navigate to Registration screen
3. Fill in the form:
  - **Full Name**: Example User
   - **Date of Birth**: 08/02/2005
   - **Pension Number**: 626816
   - **Phone Number**: +923708270136
  - **Email**: example@example.com
   - **Password**: Test123!
4. Click "Create Account"
5. **Expected**: Should redirect to voice enrollment (no error)

#### On Web Browser:
1. Navigate to: `http://localhost:4000/account/signup`
2. Fill in the same form
3. Click "Create Account"
4. **Expected**: Should be signed in and redirected to home

### Step 3: Test Sign In

#### On Mobile:
1. Go to Sign In screen
2. Enter:
   - **Email**: syed.hassan.shah4554@gmail.com
   - **Password**: Test123!
3. Click "Sign In"
4. **Expected**: Should successfully authenticate

#### On Web:
1. Navigate to: `http://localhost:4000/account/signin`
2. Enter same credentials
3. Click "Sign In"
4. **Expected**: Should be signed in

### Step 4: Verify Database

#### Check MongoDB Atlas:
1. Go to https://cloud.mongodb.com
2. Browse Collections → Database: `auth`
3. Verify these collections have data:

**auth_users:**
```json
{
  "id": "some-uuid",
  "email": "syed.hassan.shah4554@gmail.com",
  "emailVerified": null,
  "name": "Hassan"
}
```

**auth_accounts:**
```json
{
  "userId": "same-uuid-as-above",
  "provider": "credentials",
  "type": "credentials",
  "providerAccountId": "same-uuid",
  "password": "$argon2id$v=19$..." // hashed password
}
```

**users:**
```json
{
  "id": "different-uuid",
  "name": "Hassan",
  "phone": "+923708270136",
  "email": "syed.hassan.shah4554@gmail.com",
  "pension_number": "626816",
  "date_of_birth": "2005-02-08"
}
```

## What to Look For

### ✅ Success Indicators:
- No error messages during registration
- User is automatically signed in after registration
- Can sign out and sign back in successfully
- Console shows: `[REGISTER] Registration completed successfully`
- Console shows: `[SIGN-IN] Authentication successful!`

### ❌ If You See Errors:

**"Email is required for authentication"**
- Make sure you filled in the email field

**"Password is required for authentication"**
- Make sure you filled in the password field

**"Email already registered"**
- This email is already in use, try a different one
- Or delete the existing user from MongoDB

**"User with this phone number already exists"**
- This phone is already registered
- Delete from MongoDB or use different phone number

## Logs to Watch

### During Registration:
```
[REGISTER] Registration request received
[REGISTER] Request body: { name: 'Hassan', phone: '+923708270136', email: '***', ... }
[REGISTER] Using MongoDB for registration
[REGISTER] Checking for duplicate users...
[REGISTER] Creating user document...
[REGISTER] User created: abc-123
[REGISTER] Creating auth user...
[REGISTER] Auth user created: def-456
[REGISTER] Creating auth account with credentials...
[REGISTER] Auth account created
[REGISTER] Creating voice profile...
[REGISTER] Logging audit event...
[REGISTER] Registration completed successfully
```

### During Sign In:
```
[SIGNUP] Registration successful, signing in...
[CLIENT] Sign-in attempt: { email: '***' }
[SIGN-IN] Authorize called with email: ***
[SIGN-IN] Looking up user by email...
[SIGN-IN] User found: def-456
[SIGN-IN] Verifying password...
[SIGN-IN] Authentication successful!
```

## Clean Up Test Data

To reset and test again, delete from MongoDB:

```javascript
// In MongoDB Atlas or Compass
db.users.deleteMany({ email: "<user email>" })
db.auth_users.deleteMany({ email: "<user email>" })
db.auth_accounts.deleteMany({ }) // Be careful with this!
db.voice_profiles.deleteMany({ })
db.audit_logs.deleteMany({ action: "USER_REGISTERED" })
```

## Troubleshooting

### Issue: "Cannot read property 'id' of null"
**Solution:** Email doesn't exist in auth_users. Re-register.

### Issue: Registration completes but can't sign in
**Solution:** Check that auth_accounts has a record with the correct userId and password hash.

### Issue: "Network error" on mobile
**Solution:** 
- Check that web server is running
- Verify EXPO_PUBLIC_BASE_URL in mobile .env file
- Ensure phone and computer are on same WiFi

### Issue: Password verification fails
**Solution:**
- Ensure password has at least 6 characters
- Check that argon2 is properly installed on server
- Verify password was hashed during registration

## Environment Variables to Check

### Mobile (.env):
```
EXPO_PUBLIC_BASE_URL=http://192.168.x.x:4000
EXPO_PUBLIC_PROXY_BASE_URL=http://192.168.x.x:4000
EXPO_PUBLIC_PROJECT_GROUP_ID=your-id
EXPO_PUBLIC_HOST=your-host
```

### Web (.env):
```
MONGODB_URI=mongodb+srv://...
MONGODB_DB=auth
AUTH_SECRET=your-secret-key
DATABASE_URL=postgresql://... (optional)
```
