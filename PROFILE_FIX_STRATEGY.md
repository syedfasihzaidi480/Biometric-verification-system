# Profile Save Fix - MongoDB-Only Strategy

## Problem Analysis

The mobile app shows "Profile updated successfully!" but:
1. Terminal shows errors
2. Data is NOT saved to MongoDB
3. Backend returns errors (likely 404 "User not found")

## Root Cause

The issue was in the complex upsert logic with `$setOnInsert` that was failing to properly create/update user documents. The code was:
1. Using complex `$set` and `$setOnInsert` operations
2. Had a fallback that was still failing
3. Returning "User not found" after the upsert claimed to succeed

## Solution Implemented

### Strategy: Simplified Direct Approach

Instead of complex upserts, use straightforward logic:

**PUT /api/profile:**
1. Check if user exists by `auth_user_id`
2. If exists: Update with `$set`
3. If not exists: Create new document with all required fields
4. Fetch the result to confirm
5. Return error if still not found

**GET /api/profile:**
1. Check if user exists by `auth_user_id`
2. If not exists: Create with defaults from session
3. Handle race conditions with try-catch
4. Return the user document

### Key Changes

#### 1. Removed Complex Upsert Logic
**Before:**
```javascript
await users.updateOne(
  { auth_user_id: authUserId },
  { $set: update.$set, $setOnInsert: onInsert },
  { upsert: true }
);
// Then fallback insertOne if not found...
```

**After:**
```javascript
let existingUser = await users.findOne({ auth_user_id: authUserId });

if (existingUser) {
  await users.updateOne({ auth_user_id: authUserId }, { $set: userData });
} else {
  const newUserDoc = { /* complete document */ };
  await users.insertOne(newUserDoc);
}
```

#### 2. Added Comprehensive Logging
Every operation now logs:
- `[Profile GET/PUT]` prefix for easy filtering
- Auth user ID being used
- Whether user was found or created
- Complete user data being saved
- Any errors with full stack traces

#### 3. Proper Error Handling
- Try-catch for insert operations
- Race condition handling (fetch again if insert fails)
- Detailed error messages in development mode
- Stack traces included in dev responses

## Testing Guide

### 1. Check Terminal Logs
When you save a profile, look for:
```
[Profile PUT] Auth user ID: <uuid>
[Profile PUT] Request body: {...}
[Profile PUT] User data to save: {...}
[Profile PUT] Existing user: Found / Not found
[Profile PUT] Creating new user: {...} OR [Profile PUT] Update result: X modified
[Profile PUT] Final user: {...}
```

### 2. Test Flow
1. **Start the backend:**
   ```powershell
   cd apps/web
   npm run dev
   ```

2. **Start mobile app:**
   ```powershell
   cd apps/mobile
   npx expo start -c
   ```

3. **On Mobile:**
   - Sign in with valid credentials
   - Navigate to "Register" tab
   - Fill in:
     - Full Name
     - Mobile Number
     - Date of Birth (DD/MM/YYYY)
     - ID Document Type
   - Optionally upload a document
   - Tap "Save Profile"

4. **Check Terminal:**
   - Look for `[Profile PUT]` logs
   - Should see "User created successfully" or "X modified"
   - Should NOT see "User still not found after upsert!"

5. **Verify in MongoDB:**
   ```javascript
   db.users.findOne({ auth_user_id: "<the-uuid-from-logs>" })
   ```
   Should return the user document with all saved fields.

### 3. Expected Outcomes

**Success Indicators:**
- ✅ Mobile shows "Profile updated successfully!"
- ✅ Terminal shows `[Profile PUT] Final user: {...}` with data
- ✅ No error logs in terminal
- ✅ MongoDB has the user document

**If Still Failing:**
Check for:
1. **MongoDB Connection:**
   - Ensure `MONGODB_URI` is set in `.env`
   - Check connection string is valid
   - Verify MongoDB server is running

2. **Session Issues:**
   - `[Profile PUT] No session or user ID` → Authentication failed
   - Check cookies are being sent from mobile
   - Verify `/api/auth/session` returns valid session

3. **Insert Failures:**
   - `[Profile PUT] Insert failed:` → MongoDB error
   - Check MongoDB user permissions
   - Ensure database name matches `MONGODB_DB` env var

## MongoDB Schema

The `users` collection should have documents like:

```javascript
{
  _id: ObjectId("..."),
  id: "uuid-v4",                    // Our internal ID
  auth_user_id: "uuid-v4",          // From Auth.js session
  name: "User Name",
  email: "user@example.com",
  phone: "+1234567890",
  date_of_birth: "1990-01-15",
  preferred_language: "en",
  role: "user",
  profile_completed: true,
  voice_verified: false,
  face_verified: false,
  document_verified: false,
  admin_approved: false,
  payment_released: false,
  created_at: "2024-11-01T12:00:00.000Z",
  updated_at: "2024-11-01T12:30:00.000Z"
}
```

## API Contract

### GET /api/profile
**Auth:** Required (cookie session)

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "auth_user_id": "...",
    "name": "...",
    // ... all user fields
  }
}
```

### PUT /api/profile
**Auth:** Required (cookie session)

**Request:**
```json
{
  "name": "Full Name",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-15",
  "preferred_language": "en",
  "profile_completed": true
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    // ... all user fields including updates
  }
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": "Stack trace (dev only)"
}
```

## Files Modified

1. **apps/web/src/app/api/profile/route.js**
   - Simplified PUT handler with direct findOne → update/insert
   - Enhanced GET handler with better creation logic
   - Added comprehensive logging throughout
   - Improved error handling with stack traces

## Next Steps

1. ✅ Test the save flow end-to-end
2. Monitor terminal logs during save
3. Verify MongoDB persistence
4. If issues persist, share the full terminal log output for debugging

## Rollback Plan

If this approach fails, the previous version with upsert logic can be restored from git history. The key insight is that the simpler approach should be more reliable and easier to debug.

## Environment Variables Required

```env
# MongoDB connection
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=auth

# Auth (should already be configured)
AUTH_SECRET=your-secret-key
```

---

**Last Updated:** 2024-11-01
**Status:** Ready for testing
