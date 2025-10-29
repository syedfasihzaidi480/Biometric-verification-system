# Registration Bug Fix Summary

## Problem
Account registration was failing with a 404 error:
```
[AUTH MIDDLEWARE] Checking path: /api/auth/register
[AUTH MIDDLEWARE] Skipping, not an auth action
[API 404] No handler found for: /api/auth/register
```

## Root Cause
The route builder (`apps/web/__create/route-builder.ts`) had **two critical bugs** preventing API routes from being registered properly:

### Bug #1: Path Separator Issues on Windows
The `getHonoPath()` function was not handling Windows backslash path separators properly:

```typescript
// BEFORE (BROKEN)
const relativePath = routeFile.replace(__dirname, '');
const parts = relativePath.split('/').filter(Boolean);
```

On Windows, `routeFile.replace(__dirname, '')` returns a path with backslashes (`\auth\register\route.js`), but the code was splitting on forward slashes (`/`), resulting in no parts being found and all routes being registered as `/` instead of their proper paths like `/auth/register`.

**Fix**: Normalize backslashes to forward slashes:
```typescript
// AFTER (FIXED)
const relativePath = routeFile.replace(__dirname, '').replace(/\\/g, '/');
const parts = relativePath.split('/').filter(Boolean);
```

### Bug #2: Dynamic Route Import Errors with Special Characters
Routes with dynamic segments (e.g., `[id]`) were failing to import because Windows file paths with square brackets couldn't be resolved:

```typescript
// BEFORE (BROKEN)
const route = await import(/* @vite-ignore */ `${routeFile}?update=${Date.now()}`);
```

Error: `Cannot find module 'G:\...\[id]\route.js?update=...'`

**Fix**: Convert Windows paths to file:// URLs:
```typescript
// AFTER (FIXED)
const fileUrl = `file:///${routeFile.replace(/\\/g, '/')}?update=${Date.now()}`;
const route = await import(/* @vite-ignore */ fileUrl);
```

## Verification
After the fixes, the route builder now correctly:
1. Finds all route files (12 routes discovered)
2. Registers them with proper paths:
   ```
   [ROUTE BUILDER] Registering POST /auth/register
   [ROUTE BUILDER] Registering POST /auth/login
   [ROUTE BUILDER] Registering GET /admin/verifications/:id
   ...etc
   ```
3. Mounts them under `/api` prefix for final paths like `/api/auth/register`

## Testing
To test the fix:
1. Web server is now running properly on http://192.168.100.10:4000
2. Try registration from the mobile app
3. Check the web terminal logs for successful registration flow

## Files Modified
- `apps/web/__create/route-builder.ts` - Fixed path handling and import URLs
- `apps/web/__create/index.ts` - Removed temporary debug routes

## Status
✅ **FIXED** - Registration endpoint `/api/auth/register` is now accessible
