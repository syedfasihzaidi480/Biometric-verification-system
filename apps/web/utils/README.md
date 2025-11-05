# Production Utilities

This folder contains essential production utilities for database management.

## Available Scripts

### `create-super-admin.cjs`
Creates a super admin user in the database.

**Usage:**
```bash
node utils/create-super-admin.cjs
**Required Environment Variables:**
- `MONGODB_URI` - MongoDB connection string
- Creates a super admin user with full system access
- Should only be run once during initial setup

---

### `create-indexes.cjs`
Creates database indexes for optimal query performance.

**Usage:**
```bash
node utils/create-indexes.cjs
- Creates indexes on documents collection (user_id)
- Creates indexes on verification_requests collection (user_id, status)
- During initial database setup
- When query performance degrades

---

- These scripts should only be run in controlled environments
- Always backup your database before running any utilities
- Never commit `.env` files with real credentials
- Use environment variables for all sensitive data
- All scripts log their operations
Important:
 - Keep one Super Admin only (created via `create-super-admin.cjs`).
 - To purge all non-super users and their related records, run from apps/web:

	npm run cleanup:preserve-superadmin

This will remove records from users, auth_users, auth_accounts, accounts, sessions, verification_tokens, voice_profiles, documents, verification_requests, voice_enrollment_sessions, audit_logs — while preserving the Super Admin (by email f219110@cfd.nu.edu.pk or role `super_admin`).
- Check console output for success/error messages
- Monitor database state after running scripts
