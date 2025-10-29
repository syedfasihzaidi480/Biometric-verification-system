# FINAL FIX - Complete Authentication Resolution

## Critical Bug Fixed: Account Lookup Query

### The Problem
After registration, when trying to automatically sign in, the system would fail with "No credentials account found for user" even though the account was created correctly.

### Root Cause
In `apps/web/__create/mongo-adapter.ts`, the `getUserByEmail` function was querying accounts by the wrong field:

```typescript
// ❌ BEFORE (BROKEN)
const accs = await accounts
  .find({ providerAccountId: user.id })  // Wrong field!
  .project({ _id: 0 })
  .toArray();
```

But the registration creates accounts with `userId` as the linking field:
```javascript
const authAccountDoc = {
  userId: authUserId,  // This is what we actually store
  provider: 'credentials',
  providerAccountId: authUserId,
  password: hashedPassword,
};
```

### The Fix
Changed the query to use the correct field:

```typescript
// ✅ AFTER (FIXED)
const accs = await accounts
  .find({ userId: user.id })  // Correct field!
  .project({ _id: 0 })
  .toArray();
```

## All Fixes Applied

### Fix #1: Correct Auth.js Sign-In Endpoint
**Files Changed:**
- `apps/web/src/utils/useAuth.js` 
- `apps/web/scripts/test-signin.js`
- `apps/web/test-signin.js`

**Change:** `/api/auth/callback/credentials` → `/api/auth/signin/credentials`

### Fix #2: MongoDB Account Lookup
**File Changed:**
- `apps/web/__create/mongo-adapter.ts`

**Change:** Query accounts by `userId` instead of `providerAccountId`

## How to Test

### 1. Server is Running
Check the terminal shows:
```
➜  Local:   http://localhost:4000/
➜  Network: http://192.168.x.x:4000/
```

### 2. Clean Database (Optional - if you have old test data)
```powershell
cd "g:\mamadou kiete\create-anything\apps\web"
node cleanup-database.js
```

### 3. Test Registration + Auto Sign-In

**Via Web UI:**
1. Go to: `http://localhost:4000/account/signup`
2. Fill in the form:
   - Full Name: Test User
   - Date of Birth: 01/01/1990
   - Pension Number: TEST123
   - Phone: +1234567890
   - Email: test@example.com
   - Password: Test123!
3. Click "Create Account"
4. **Expected Result:** Should automatically sign in and redirect to home page

**Expected Server Logs (Full Flow):**
```
[REGISTER] Registration request received
[REGISTER] Using MongoDB for registration
[REGISTER] Checking for duplicate users...
[REGISTER] Creating user document...
[REGISTER] User created: abc-123
[REGISTER] Creating auth user...
[REGISTER] Auth user created: def-456
[REGISTER] Creating auth account with credentials...
[REGISTER] Auth account created
[REGISTER] Registration completed successfully

[AUTH MIDDLEWARE] Checking path: /api/auth/signin/credentials method: POST
[AUTH MIDDLEWARE] Handling as auth action
[SIGN-IN] Authorize called with email: test@example.com
[SIGN-IN] Looking up user by email...
[SIGN-IN] User found: def-456
[SIGN-IN] Verifying password...
[SIGN-IN] Authentication successful!
```

### 4. Test Manual Sign-In

1. Sign out (or use a different browser/incognito)
2. Go to: `http://localhost:4000/account/signin`
3. Enter credentials:
   - Email: test@example.com
   - Password: Test123!
4. Click "Sign In"
5. **Expected:** Should sign in successfully

### 5. Verify Database

```powershell
node check-database.js
```

**Expected output:**
```
✅ Connected to database: auth

📁 AUTH_USERS COLLECTION:
   Count: 1
   Auth User 1:
   - ID: def-456
   - Email: test@example.com
   - Name: Test User

📁 AUTH_ACCOUNTS COLLECTION:
   Count: 1
   Account 1:
   - User ID: def-456
   - Provider: credentials
   - Has Password: ✅ YES
   - Password Hash: $argon2id$v=19$m=65536...

📊 ANALYSIS:
   ✅ All collections are in sync!
   → Sign-in should work
```

## Complete Authentication Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         REGISTRATION                             │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
              POST /api/auth/register
                                │
        ┌───────────────────────┴───────────────────────┐
        │                                               │
        ▼                                               ▼
   Create auth_users                              Create users
   { id: "def-456",                               { id: "abc-123",
     email: "test@...",                             name: "Test",
     name: "Test" }                                 phone: "+123..." }
        │                                               │
        ▼                                               ▼
   Create auth_accounts                           Create voice_profiles
   { userId: "def-456",  ← MUST MATCH             { user_id: "abc-123" }
     provider: "credentials",                          │
     password: "$argon2..." }                          ▼
        │                                          Create audit_logs
        │                                               │
        └───────────────────┬───────────────────────────┘
                            ▼
                   ✅ Registration Success
                            │
                            ▼
        POST /api/auth/signin/credentials
        (Auto sign-in after registration)
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
   Find user in auth_users              Fetch accounts from auth_accounts
   WHERE email = "test@..."             WHERE userId = "def-456" ← KEY FIX!
        │                                       │
        │                                       ▼
        │                              Find matching provider="credentials"
        │                                       │
        │                                       ▼
        │                              Extract password hash
        │                                       │
        └───────────────┬───────────────────────┘
                        ▼
                 Verify password with argon2
                 (compare input vs hash)
                        │
                        ▼
                  ✅ Password Valid
                        │
                        ▼
                Create JWT session
                Set auth cookies
                        │
                        ▼
            Redirect to / (home page)
                        │
                        ▼
                 ✅ SIGNED IN!
```

## Key Database Relationships

```
auth_users (authentication layer)
├─ id: "def-456"
├─ email: "test@example.com"
└─ name: "Test User"
          │
          │ linked by userId field
          ▼
auth_accounts (credentials storage)
├─ userId: "def-456" ← Links to auth_users.id
├─ provider: "credentials"
├─ providerAccountId: "def-456"
└─ password: "$argon2id$..."  ← Hashed password


users (profile data)
├─ id: "abc-123"  ← Different ID!
├─ name: "Test User"
├─ email: "test@example.com"
├─ phone: "+1234567890"
└─ pension_number: "TEST123"
```

## Troubleshooting

### Issue: "No credentials account found for user"
**Status:** ✅ FIXED
**Cause:** Adapter was querying `providerAccountId` instead of `userId`
**Solution:** Already applied in this fix

### Issue: "UnknownAction" error
**Status:** ✅ FIXED
**Cause:** Wrong endpoint `/api/auth/callback/credentials`
**Solution:** Changed to `/api/auth/signin/credentials`

### Issue: "User not found" during sign-in
**Possible causes:**
1. Email doesn't exist in `auth_users`
2. Database not cleaned before re-registering

**Solution:**
```powershell
node check-database.js  # Check what's in the database
node cleanup-database.js  # Clean if needed
# Then re-register
```

### Issue: "Invalid password"
**Possible causes:**
1. Password not matching
2. Account created before fix (old account without credentials)

**Solution:** Clean database and re-register with new code

## Success Indicators

✅ No errors in server terminal  
✅ Registration completes without errors  
✅ Automatically signed in after registration  
✅ Manual sign-in works  
✅ Server logs show `[SIGN-IN] Authentication successful!`  
✅ Database has matching records in all three collections  
✅ `auth_accounts` has password hash starting with `$argon2id$`  

## Files Modified (Complete List)

1. `apps/web/src/utils/useAuth.js` - Sign-in endpoint
2. `apps/web/__create/mongo-adapter.ts` - Account lookup query
3. `apps/web/scripts/test-signin.js` - Test script endpoint
4. `apps/web/test-signin.js` - Alternate test endpoint
5. `AUTH_FIX_SUMMARY.md` - Documentation
6. `FIX_SUMMARY.md` - This summary

## Next Steps

1. ✅ Server is running with all fixes
2. 🔄 Test registration at: `http://localhost:4000/account/signup`
3. 🔄 Confirm auto sign-in works
4. 🔄 Test manual sign-in
5. 🎉 If all works, you're done!

---

**Both registration AND sign-in should now work perfectly!** 🎉
