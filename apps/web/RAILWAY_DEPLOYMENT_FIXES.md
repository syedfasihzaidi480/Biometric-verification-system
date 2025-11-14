# Railway Deployment Issues & Fixes

This document outlines the authentication issues encountered on Railway deployment and the solutions implemented.

## Issues Identified

### 1. ⚠️ `env-url-basepath-redundant` Warning

**Symptom:**
```
[auth][warn][env-url-basepath-redundant] Read more: https://warnings.authjs.dev#env-url-basepath-redundant
```

**Cause:**
The application was configured with both:
- `AUTH_URL` environment variable including the basePath (e.g., `https://domain.com/api/auth`)
- `basePath: '/api/auth'` in the Auth.js configuration

Auth.js only needs one of these, not both.

**Solution:**
Set `AUTH_URL` to the base domain only:
```bash
# ✅ CORRECT
AUTH_URL=https://clever-encouragement-production-9767.up.railway.app

# ❌ INCORRECT
AUTH_URL=https://clever-encouragement-production-9767.up.railway.app/api/auth
```

The `basePath` is already configured in `apps/web/__create/index.ts` line 210.

---

### 2. ⚠️ `csrf-disabled` Warning

**Symptom:**
```
[auth][warn][csrf-disabled] Read more: https://warnings.authjs.dev#csrf-disabled
GET /api/auth/csrf 404
```

**Cause:**
The application intentionally uses `skipCSRFCheck` in the Auth.js configuration (line 219 of `__create/index.ts`).

**Impact:**
- CSRF token endpoint returns 404 (expected behavior)
- Frontend gracefully handles missing CSRF token
- **Security consideration:** CSRF protection is disabled

**Solution:**
This is working as intended. If you need CSRF protection, remove `skipCSRFCheck` from the auth configuration.

---

### 3. 🔴 Authentication Success but Session Not Created (CRITICAL)

**Symptom:**
```
[SIGN-IN] Authentication successful!
POST /api/admin/auth/signin 200
POST /api/auth/callback/credentials 302
GET /api/admin/auth/check
[Admin Auth Check] Session: undefined
[Admin Auth Check] No session or user ID found
```

**Cause:**
The frontend was sending the wrong field name to Auth.js. The credentials provider expects `identifier` but the code was sending `email`.

**Location of Bug:**
1. `apps/web/src/app/admin/signin/page.jsx` (line 81) - was sending `email`
2. `apps/web/src/utils/useAuth.js` (line 21) - was sending `email`

**Auth.js Configuration Expects:**
From `apps/web/__create/index.ts` line 251-274:
```javascript
Credentials({
  credentials: {
    identifier: {  // <-- expects "identifier"
      label: 'Email or Phone',
      type: 'text',
    },
    password: { ... }
  }
})
```

**Solution Applied:**
✅ Fixed in commit:
- Changed `addField("email", email)` to `addField("identifier", email)` in admin signin
- Changed `formData.append('email', email)` to `formData.append('identifier', email)` in useAuth hook

---

## Required Railway Environment Variables

Ensure these are set in your Railway project:

### 1. AUTH_URL (Required)
```bash
AUTH_URL=https://your-app.up.railway.app
```
⚠️ **Do NOT include `/api/auth` in the URL**

### 2. AUTH_SECRET (Required)
```bash
AUTH_SECRET=your-secure-random-secret-here
```

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Example output:
```bash
AUTH_SECRET=ue+i4KGUIRIeqyFNsAcVEb9vJCmjv/Se3FHZ8GvFRKg=
```

### 3. Database Configuration (Required)
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB=your-database-name
```

### 4. Other Required Variables
```bash
NODE_ENV=production
PORT=3000
```

---

## Cookie/Session Configuration

The auth configuration in `__create/index.ts` automatically handles secure cookies based on `AUTH_URL`:

```javascript
cookies: {
  sessionToken: {
    options: {
      secure: Boolean(process.env.AUTH_URL?.startsWith('https')),
      sameSite: Boolean(process.env.AUTH_URL?.startsWith('https')) ? 'none' : 'lax',
    },
  },
  // ... same for csrfToken and callbackUrl
}
```

When `AUTH_URL` starts with `https://`:
- ✅ Cookies are `secure: true`
- ✅ SameSite is set to `none` (for cross-origin scenarios)

---

## Testing the Fix

After deploying these changes:

1. **Verify Environment Variables:**
   ```bash
   # In Railway dashboard or via CLI
   railway variables
   ```

2. **Test Admin Login:**
   - Go to `/admin/signin`
   - Enter super admin credentials
   - Check browser DevTools Network tab for:
     - `POST /api/admin/auth/signin` → should return 200
     - `POST /api/auth/callback/credentials` → should return 302 redirect
     - `GET /api/admin/auth/check` → should return session with user data

3. **Check Cookies:**
   - Open DevTools → Application → Cookies
   - Look for: `authjs.session-token` or similar
   - Verify it's set with proper domain and path

4. **Test Regular User Login:**
   - Go to `/account/signin`
   - Sign in with regular user credentials
   - Should redirect to home page with session

---

## Debugging Tips

### View Railway Logs:
```bash
railway logs
```

### Check Session in Browser Console:
```javascript
fetch('/api/auth/session', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

### Verify Auth Configuration:
Check the server logs on startup for:
```
[preflight] env summary: { AUTH_URL: '...', AUTH_SECRET: 'set', ... }
```

---

## Files Modified

1. ✅ `apps/web/src/app/admin/signin/page.jsx` - Fixed field name from `email` to `identifier`
2. ✅ `apps/web/src/utils/useAuth.js` - Fixed field name from `email` to `identifier`

---

## Additional Notes

### Why "identifier" instead of "email"?
The Credentials provider is configured to accept both email and phone number authentication. The field is named `identifier` to support both use cases:
- Email: `identifier = "user@example.com"`
- Phone: `identifier = "+1234567890"`

The backend logic in the authorize function handles both cases and looks up the user accordingly.

### Session Strategy
The application uses JWT-based sessions (`session: { strategy: 'jwt' }`), which means:
- No database session storage needed
- Sessions are encoded in signed JWT tokens stored in cookies
- The `AUTH_SECRET` is used to sign/verify these tokens

---

## Rollback Instructions

If issues persist, you can rollback the changes:

```bash
git revert <commit-hash>
railway up
```

Or manually revert the two lines changed in the files listed above.

