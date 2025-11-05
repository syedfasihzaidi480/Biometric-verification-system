#!/usr/bin/env node
/**
 * Cleanup Database: Remove all users and related records except Super Admin
 *
 * Preserves the Super Admin identified by email (default: f219110@cfd.nu.edu.pk)
 * and removes all other documents from auth- and user-related collections.
 *
 * Collections covered:
 * - users
 * - auth_users
 * - auth_accounts
 * - accounts (Auth.js)
 * - sessions (Auth.js)
 * - verification_tokens (Auth.js)
 * - voice_profiles
 * - documents
 * - verification_requests
 * - voice_enrollment_sessions
 * - audit_logs
 */

/* eslint-disable no-console */
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load env from apps/web/.env without adding a dependency
function loadEnv(envPath) {
  const result = {};
  if (!fs.existsSync(envPath)) return result;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

async function main() {
  const WEB_DIR = path.join(__dirname, '..');
  const ENV_PATH = path.join(WEB_DIR, '.env');
  const env = loadEnv(ENV_PATH);

  const MONGODB_URI = env.MONGODB_URI || process.env.MONGODB_URI;
  const MONGODB_DB = env.MONGODB_DB || process.env.MONGODB_DB || 'auth';
  const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'f219110@cfd.nu.edu.pk';

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set. Please configure it in apps/web/.env');
    process.exit(1);
  }

  console.log('🔗 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  console.log(`✅ Connected. DB: ${MONGODB_DB}`);

  const col = (name) => db.collection(name);

  try {
    // Identify Super Admin
    console.log('\n🔎 Locating Super Admin...');
    let superAuthUser = await col('auth_users').findOne({ email: SUPER_ADMIN_EMAIL });
    let superUser = null;

    if (!superAuthUser) {
      // Fallback: find by users.role = 'super_admin'
      superUser = await col('users').findOne({ role: 'super_admin' });
      if (superUser) {
        superAuthUser = await col('auth_users').findOne({ id: superUser.auth_user_id });
      }
    } else {
      superUser = await col('users').findOne({ auth_user_id: superAuthUser.id });
    }

    if (!superUser || !superAuthUser) {
      console.error('❌ Could not determine Super Admin. Ensure one exists before cleanup.');
      console.error('   Expected email:', SUPER_ADMIN_EMAIL);
      process.exit(1);
    }

    const SUPER_AUTH_USER_ID = superAuthUser.id;
    const SUPER_USER_ID = superUser.id;

    console.log('👑 Super Admin identified:');
    console.log('   auth_users.id   =', SUPER_AUTH_USER_ID);
    console.log('   users.id        =', SUPER_USER_ID);
    console.log('   email           =', superAuthUser.email);

    // Compute counts before cleanup
    const collections = [
      'users',
      'auth_users',
      'auth_accounts',
      'accounts',
      'sessions',
      'verification_tokens',
      'voice_profiles',
      'documents',
      'verification_requests',
      'voice_enrollment_sessions',
      'audit_logs',
    ];

    async function countAll() {
      const result = {};
      for (const name of collections) {
        try {
          result[name] = await col(name).countDocuments();
        } catch {
          result[name] = 0;
        }
      }
      return result;
    }

    const before = await countAll();
    console.log('\n📊 Counts before cleanup:', before);

    // Perform deletions
    const deletions = [];
    deletions.push(col('users').deleteMany({ id: { $ne: SUPER_USER_ID } }));
    deletions.push(col('auth_users').deleteMany({ id: { $ne: SUPER_AUTH_USER_ID } }));
    deletions.push(col('auth_accounts').deleteMany({ userId: { $ne: SUPER_AUTH_USER_ID } }));

    // Optional collections (Auth.js + app domain)
    deletions.push(col('accounts').deleteMany({ userId: { $ne: SUPER_AUTH_USER_ID } }));
    deletions.push(col('sessions').deleteMany({ userId: { $ne: SUPER_AUTH_USER_ID } }));
    deletions.push(col('verification_tokens').deleteMany({ userId: { $ne: SUPER_AUTH_USER_ID } }));

    deletions.push(col('voice_profiles').deleteMany({ user_id: { $ne: SUPER_USER_ID } }));
    deletions.push(col('documents').deleteMany({ user_id: { $ne: SUPER_USER_ID } }));
    deletions.push(col('verification_requests').deleteMany({ user_id: { $ne: SUPER_USER_ID } }));
    deletions.push(col('voice_enrollment_sessions').deleteMany({ user_id: { $ne: SUPER_USER_ID } }));
    deletions.push(col('audit_logs').deleteMany({ user_id: { $ne: SUPER_USER_ID } }));

    const results = await Promise.allSettled(deletions);
    console.log('\n🧹 Cleanup results:');
    for (const [i, res] of results.entries()) {
      const name = collections[i];
      if (res.status === 'fulfilled') {
        console.log(`   - ${name}: deleted ${res.value?.deletedCount ?? 0}`);
      } else {
        console.log(`   - ${name}: skipped (${res.reason?.message || res.reason})`);
      }
    }

    const after = await countAll();
    console.log('\n📊 Counts after cleanup:', after);

    console.log('\n✅ Cleanup completed. Only Super Admin remains.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
