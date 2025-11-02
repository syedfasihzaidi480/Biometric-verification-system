# Database Cleanup - Keep Super Admin Only

## Overview
This document describes the database cleanup process that removes all users and related data while preserving the super admin account.

## Script: `cleanup-except-superadmin.js`

### What it does:
✅ **Preserves:**
- Super admin user (`f219110@cfd.nu.edu.pk`)
- Super admin auth credentials
- Super admin's role and permissions

❌ **Deletes:**
- All regular users
- All admin accounts (except super admin)
- All auth_users (except super admin)
- All auth_accounts (except super admin)
- **ALL voice profiles** (including super admin's if exists)
- **ALL verification requests**
- **ALL documents**
- All sessions (except super admin's)
- All verification tokens
- All audit logs (except super admin's actions)

## Usage

```bash
cd apps/web
node cleanup-except-superadmin.js
```

The script will:
1. Give you 5 seconds to cancel (Ctrl+C)
2. Connect to MongoDB
3. Find the super admin
4. Delete all other users and related data
5. Show a summary of what was deleted
6. Verify the super admin is still present

## Collections Cleaned

| Collection | Action |
|------------|--------|
| `users` | Delete all except super admin |
| `auth_users` | Delete all except super admin |
| `auth_accounts` | Delete all except super admin |
| `voice_profiles` | Delete ALL |
| `verification_requests` | Delete ALL |
| `documents` | Delete ALL |
| `auth_sessions` | Delete all except super admin |
| `auth_verification_tokens` | Delete ALL |
| `audit_logs` | Delete all except super admin actions |

## After Running

### Expected State:
- **Users**: 1 (super admin only)
- **Auth Users**: 1 (super admin only)
- **Auth Accounts**: 1+ (super admin credentials)
- **Voice Profiles**: 0
- **Verification Requests**: 0
- **Documents**: 0
- **Sessions**: 0 (or super admin sessions)
- **Verification Tokens**: 0
- **Audit Logs**: 0 (or super admin actions only)

### Super Admin Credentials:
- **Email**: `f219110@cfd.nu.edu.pk`
- **Password**: `Fasih@123`
- **Role**: `super_admin`
- **Status**: Approved

## Verification

Check database state after cleanup:
```bash
node check-database.js
```

## Related Scripts

- `create-super-admin.cjs` - Create/restore super admin
- `check-super-admin.js` - Verify super admin exists
- `check-database.js` - View current database state
- `cleanup-database.js` - Delete ALL data (including super admin)
- `clear-mongodb.js` - Delete everything from all collections

## Safety Features

1. **5-second delay** before execution
2. **Super admin verification** before deletion
3. **Detailed logging** of all operations
4. **Summary report** at the end
5. **Verification** of remaining data

## When to Use

- Remove test users but keep super admin
- Clean up after testing
- Reset user base to super admin only
- Prepare for fresh user registrations

## Recovery

If you accidentally delete the super admin, recreate it:
```bash
node create-super-admin.cjs
```

## Last Run

**Date**: November 2, 2025  
**Result**: ✅ Success

### Summary:
- Deleted 2 users
- Deleted 1 auth user
- Deleted 1 auth account
- Deleted 1 voice profile
- Deleted 5 verification requests
- Deleted 1 document
- Deleted 5 audit logs
- Deleted 0 sessions
- Deleted 0 verification tokens

### Preserved:
- Super Admin: Fasih Zaidi (f219110@cfd.nu.edu.pk)
