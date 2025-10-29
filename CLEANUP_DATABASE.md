# Database Cleanup Guide

## Problem
You created an account BEFORE the fix was applied. This means:
- ✅ User exists in `users` collection
- ❌ NO auth credentials in `auth_users` collection
- ❌ NO auth credentials in `auth_accounts` collection
- **Result**: Can't sign in because credentials don't exist

## Solution Options

### Option 1: Delete Old User and Re-register (Recommended)

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com
2. **Browse Collections** → Select database: `auth`
3. **Delete from `users` collection**:
   ```javascript
   // Find your user
   { "email": "syed.hassan.shah4554@gmail.com" }
   
   // Delete it
   db.users.deleteOne({ "email": "syed.hassan.shah4554@gmail.com" })
   ```

4. **Delete from `auth_users` collection** (if exists):
   ```javascript
   db.auth_users.deleteOne({ "email": "syed.hassan.shah4554@gmail.com" })
   ```

5. **Delete from `auth_accounts` collection** (if exists):
   ```javascript
   // Find related accounts first
   db.auth_users.findOne({ "email": "syed.hassan.shah4554@gmail.com" })
   // Copy the "id" value
   
   db.auth_accounts.deleteMany({ "userId": "paste-id-here" })
   ```

6. **Delete related data**:
   ```javascript
   // Get user id from users collection first
   db.voice_profiles.deleteMany({ "user_id": "paste-user-id-here" })
   db.audit_logs.deleteMany({ "user_id": "paste-user-id-here" })
   ```

7. **Now register again** with the FIXED code

### Option 2: Manually Add Auth Credentials (Advanced)

If you want to keep the existing user, you need to manually create auth records.

**⚠️ This is complex and error-prone. Option 1 is easier!**

---

## Quick MongoDB Commands

### Check if user exists:
```javascript
// In users collection
db.users.find({ "email": "syed.hassan.shah4554@gmail.com" })

// In auth_users collection
db.auth_users.find({ "email": "syed.hassan.shah4554@gmail.com" })

// In auth_accounts collection
db.auth_accounts.find({})
```

### Count documents:
```javascript
db.users.countDocuments()
db.auth_users.countDocuments()
db.auth_accounts.countDocuments()
```

### Delete ALL test data (CAREFUL!):
```javascript
db.users.deleteMany({})
db.auth_users.deleteMany({})
db.auth_accounts.deleteMany({})
db.voice_profiles.deleteMany({})
db.audit_logs.deleteMany({ "action": "USER_REGISTERED" })
```

---

## After Cleanup: Steps to Test

1. **Restart the web server**:
   ```powershell
   # Stop current server (Ctrl+C)
   cd "g:\mamadou kiete\create-anything\apps\web"
   npm run dev
   ```

2. **Create a new account** (mobile or web):
   - Full Name: Hassan
   - Date of Birth: 08/02/2005
   - Pension Number: 626816
   - Phone: +923708270136
   - **Email**: syed.hassan.shah4554@gmail.com
   - **Password**: Test123!

3. **Verify in MongoDB** that ALL THREE collections have data:
   - ✅ `users` - has user profile
   - ✅ `auth_users` - has auth user
   - ✅ `auth_accounts` - has hashed password

4. **Sign in** with the email and password

---

## Expected Console Logs (After Fix)

### During Registration:
```
[REGISTER] Registration request received
[REGISTER] Using MongoDB for registration
[REGISTER] Creating user document...
[REGISTER] User created: abc-123
[REGISTER] Creating auth user...
[REGISTER] Auth user created: def-456
[REGISTER] Creating auth account with credentials...
[REGISTER] Auth account created
[REGISTER] Registration completed successfully
```

### During Sign In:
```
[SIGN-IN] Authorize called with email: syed.hassan.shah4554@gmail.com
[SIGN-IN] Looking up user by email...
[SIGN-IN] User found: def-456
[SIGN-IN] Verifying password...
[SIGN-IN] Authentication successful!
```

---

## Troubleshooting

### "Email already registered"
- The user already exists in `users` or `auth_users`
- Solution: Delete using Option 1 above

### "Incorrect email or password"
- Email doesn't exist in `auth_users`, OR
- Password is wrong, OR
- No password in `auth_accounts`
- Solution: Delete and re-register

### "No handler found for /api/auth/register"
- Server needs restart
- Solution: Stop and restart `npm run dev`

### TypeScript errors in route-builder.ts
- Already fixed
- Restart server to apply fix
