# Authentication Issues Fix Summary

## Issues Resolved

### 1. **"Created profile, but failed to create login" Error**
**Problem:** When users registered, the `/api/auth/register` endpoint created a user profile in the `users` collection, but didn't create the corresponding authentication credentials in `auth_users` and `auth_accounts` collections. This caused the signup flow to fail when trying to create login credentials.

**Solution:** Modified `/api/auth/register` to create all necessary records in a single transaction:
- User profile in `users` collection
- Auth user in `auth_users` collection  
- Auth account with hashed password in `auth_accounts` collection
- Voice profile and audit log entries

### 2. **"Incorrect email or password" Error on Sign In**
**Problem:** Since authentication credentials weren't created during registration, users couldn't sign in even with correct credentials.

**Solution:** With the fix above, credentials are now properly created during registration, allowing users to sign in successfully.

## Changes Made

### 1. `/apps/web/src/app/api/auth/register/route.js`
- Added `argon2` import for password hashing
- Made `email` and `password` required fields (previously email was optional)
- Added password validation (minimum 6 characters)
- Updated MongoDB registration flow to create:
  - `auth_users` document with email and name
  - `auth_accounts` document with hashed password
- Updated Postgres/Neon registration flow with same logic
- Changed email duplicate check to query `auth_users` table instead of `users`

### 2. `/apps/web/src/app/account/signup/page.jsx`
- Changed from using `signUpWithCredentials` to `signInWithCredentials` after registration
- Registration now creates credentials automatically, so we just sign in afterward
- Improved error messages and logging
- Updated flow: Register → Sign In (instead of Register → Create Auth Credentials)

### 3. `/apps/mobile/src/screens/RegistrationScreen.jsx`
- Added `Lock` icon import from lucide-react-native
- Added `email` and `password` fields to form state
- Added email validation (required, valid format)
- Added password validation (required, minimum 6 characters)
- Added Email input field to UI
- Added Password input field to UI (with secure text entry)
- Updated API call to include email and password

## Testing the Fix

### On Web (Browser):
1. Go to `http://localhost:4000/account/signup` (or your server URL)
2. Fill in all fields including email and password
3. Click "Create Account"
4. You should be automatically signed in and redirected

### On Mobile:
1. Open the registration screen
2. Fill in all required fields:
   - Full Name
   - Date of Birth (DD/MM/YYYY)
   - Pension Number
   - Phone Number
   - Email (now required)
   - Password (now required)
3. Click "Create Account"
4. Should redirect to voice enrollment screen

### Sign In After Registration:
1. Go to sign in page
2. Enter the email and password used during registration
3. Should successfully authenticate

## Database Structure

After successful registration, you should see:

### MongoDB Collections:
1. **users** - User profile with personal info
2. **auth_users** - Auth user with email
3. **auth_accounts** - Credentials with hashed password
4. **voice_profiles** - Voice biometric profile
5. **audit_logs** - Registration event log

### Key Fields:
- `auth_users.email` matches `users.email`
- `auth_accounts.userId` references `auth_users.id`
- `auth_accounts.password` contains argon2 hashed password
- `auth_accounts.provider` = "credentials"

## What Changed in the Flow

### Before (Broken):
```
User fills form → POST /api/auth/register → Creates user in 'users' collection
                                          ↓
                  Try to create auth via signUpWithCredentials() 
                                          ↓
                              [FAILS - No credentials created]
                                          ↓
                  Error: "Created profile, but failed to create login"
```

### After (Fixed):
```
User fills form → POST /api/auth/register → Creates EVERYTHING:
                                            - User profile in 'users'
                                            - Auth user in 'auth_users'
                                            - Auth account in 'auth_accounts'
                                            - Voice profile
                                            - Audit log
                                          ↓
                  POST /api/auth/signin/credentials
                                          ↓
                              [SUCCESS - Sign in works!]
                                          ↓
                  Redirect to dashboard/home
```

## Important Notes

1. **Email is now REQUIRED** - Users must provide an email address for authentication
2. **Password is now REQUIRED** - Users must create a password during registration
3. **Backward Compatibility** - Existing users in the database may not have auth credentials. They would need to be manually migrated or re-registered
4. **Password Security** - Passwords are hashed using argon2 before storage

## Files Modified

1. `apps/web/src/app/api/auth/register/route.js` - Main registration logic
2. `apps/web/src/app/account/signup/page.jsx` - Web signup form
3. `apps/mobile/src/screens/RegistrationScreen.jsx` - Mobile registration screen

## Verification Steps

To verify the fix is working:

1. **Check Logs** - Look for these console logs:
   ```
   [REGISTER] Registration request received
   [REGISTER] Using MongoDB for registration
   [REGISTER] Creating auth user...
   [REGISTER] Auth user created: <uuid>
   [REGISTER] Creating auth account with credentials...
   [REGISTER] Auth account created
   [REGISTER] Registration completed successfully
   ```

2. **Check Database** - Verify three collections have matching records:
   - `users` has the profile
   - `auth_users` has the email
   - `auth_accounts` has the hashed password

3. **Test Sign In** - After registration, sign in should work immediately

## Next Steps

If you encounter any issues:
1. Check server logs for error messages
2. Verify environment variables (MONGODB_URI, AUTH_SECRET, etc.)
3. Ensure both web and mobile apps are using the latest code
4. Clear any cached data or old sessions
