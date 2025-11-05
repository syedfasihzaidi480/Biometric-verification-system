# Voice Verification "User Not Found" Fix

## Problem
During registration, after creating an account, users would see a "User not found" error when trying to complete voice verification. The error occurred at the first sample recording in the voice verification flow.

## Root Cause Analysis

### The Issue
There was a **mismatch between the userId passed from the mobile app and the userId expected by the backend API routes**.

### The Flow

1. **Registration** (`/api/auth/register`):
   - Creates a user in the `users` collection with `id: "abc-123"`
   - Creates an auth user in `auth_users` collection with `id: "def-456"`
   - Links them: `users.auth_user_id = "def-456"`
   - **Returns to mobile app**: `user.id = "abc-123"` (the users collection id)

2. **Mobile App** (`RegistrationScreen.jsx`):
   - Receives `result.data.user.id = "abc-123"`
   - Navigates to voice enrollment with: `userId: result.data.user.id`
   - Passes this `userId = "abc-123"` to all voice verification screens

3. **Voice Verification API Routes** (`/api/voice/verify`, `/api/voice/enroll`, etc.):
   - Expected: `userId` should be the `auth_user_id` (e.g., "def-456")
   - Received: `userId = "abc-123"` (the users collection id)
   - Query: `users.findOne({ auth_user_id: "abc-123" })` ❌ NOT FOUND
   - Should have been: `users.findOne({ id: "abc-123" })` ✅ FOUND

### Why This Happened
The API routes were designed to work with authenticated sessions where `session.user.id` contains the `auth_user_id`. During registration flow (before full authentication), the mobile app passes the `user.id` from the users collection instead.

## Solution

Updated the following API routes to accept **EITHER** `auth_user_id` **OR** `id` for user lookup:

### 1. `/api/voice/verify/route.js`
```javascript
// OLD: Only looked up by auth_user_id
const user = await users.findOne({ auth_user_id: userId });

// NEW: Try auth_user_id first, then id
let user = await users.findOne({ auth_user_id: userId });
if (!user) {
  user = await users.findOne({ id: userId });
}
```

### 2. `/api/voice/enroll/route.js`
Same pattern - added fallback to lookup by `id` if `auth_user_id` fails.

### 3. `/api/voice/enrollment-status/route.js`
Same pattern - added fallback to lookup by `id` if `auth_user_id` fails.

### 4. `/api/liveness/check/route.js`
Same pattern - added fallback to lookup by `id` if `auth_user_id` fails.

## Verification

### Test Case 1: New Registration
1. Register a new account with email `test@example.com`
2. Auto-navigate to voice enrollment screen
3. Click "Start Recording" for first sample
4. Record voice saying the phrase
5. Submit recording
6. **Expected**: Recording processes successfully
7. **Previous**: "User not found" error

### Test Case 2: Authenticated User
1. Sign in with existing account
2. Navigate to voice verification
3. Complete voice samples
4. **Expected**: Works as before (uses `auth_user_id` from session)

## Technical Details

### User ID Types
- **`user.id`**: Primary key in `users` collection (e.g., "user-1234567890")
- **`auth_user.id`**: Primary key in `auth_users` collection (e.g., UUID)
- **`user.auth_user_id`**: Foreign key linking users → auth_users

### When Each Is Used
- **Registration flow**: Mobile app receives `user.id` and passes it around
- **Authenticated sessions**: `session.user.id` contains `auth_user.id`
- **Database queries**: Need to handle both scenarios

## Files Modified
1. `apps/web/src/app/api/voice/verify/route.js`
2. `apps/web/src/app/api/voice/enroll/route.js`
3. `apps/web/src/app/api/voice/enrollment-status/route.js`
4. `apps/web/src/app/api/liveness/check/route.js`

## Impact
✅ Fixes registration flow voice verification
✅ Maintains backward compatibility with authenticated sessions
✅ Applies to all biometric verification endpoints (voice, face, liveness)
✅ No database schema changes required

## Related Issues
- Voice enrollment "User not found" error
- Liveness check "User not found" error during registration
- Any verification flow immediately after registration

## Testing Status
- [x] Code changes applied
- [ ] Manual testing with new registration (needs user verification)
- [ ] Manual testing with existing authenticated user
- [ ] Verify all 3 voice samples can be recorded
- [ ] Verify liveness check works after voice enrollment

## Notes
- The `/api/document/upload` route already had fallback user creation logic, so it was not affected
- The `/api/profile` route has upsert logic and was not affected
- Admin routes use authenticated sessions only, so they remain unchanged
