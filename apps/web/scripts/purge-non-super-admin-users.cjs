#!/usr/bin/env node
/**
 * Purge all users and auth/session/account related records EXCEPT the Super Admin (and optional whitelist).
 *
 * Differences vs cleanup-preserve-super-admin.cjs:
 *  - Uses the correct Auth collections: auth_sessions, auth_verification_token
 *  - Supports a DRY RUN mode (default) – pass --force to actually delete
 *  - Supports an email whitelist via PRESERVE_USER_EMAILS (comma-separated) in env
 *  - Emits a JSON summary file (purge-summary.json) for auditing
 *
 * Safety:
 *  - Will abort if Super Admin cannot be resolved
 *  - Will abort if --force not supplied (dry-run only)
 *  - Refuses to run if more than 10,000 auth_users unless --allow-large is passed (prevent accidental prod wipe)
 */
/* eslint-disable no-console */
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

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

function parseArgs(argv) {
  const flags = new Set();
  const kv = {};
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [key, val] = arg.slice(2).split('=');
      if (val === undefined) flags.add(key); else kv[key] = val;
    }
  }
  return { flags, kv };
}

async function main() {
  const { flags } = parseArgs(process.argv);
  const FORCE = flags.has('force');
  const ALLOW_LARGE = flags.has('allow-large');
  const WEB_DIR = path.join(__dirname, '..');
  const ENV_PATH = path.join(WEB_DIR, '.env');
  const env = loadEnv(ENV_PATH);

  const MONGODB_URI = env.MONGODB_URI || process.env.MONGODB_URI;
  const MONGODB_DB = env.MONGODB_DB || process.env.MONGODB_DB || 'auth';
  const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'f219110@cfd.nu.edu.pk';
  const WHITELIST = (process.env.PRESERVE_USER_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  if (!WHITELIST.includes(SUPER_ADMIN_EMAIL.toLowerCase())) {
    WHITELIST.push(SUPER_ADMIN_EMAIL.toLowerCase());
  }

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set. Configure it in apps/web/.env');
    process.exit(1);
  }

  console.log('🔗 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  console.log(`✅ Connected. DB: ${MONGODB_DB}`);

  const col = name => db.collection(name);

  const collections = {
    app: [
      'users',
      'voice_profiles',
      'documents',
      'verification_requests',
      'voice_enrollment_sessions',
      'audit_logs',
    ],
    auth: [
      'auth_users',
      'auth_accounts',
      'auth_sessions',
      'auth_verification_token',
    ],
  };

  const allCollectionNames = [...collections.app, ...collections.auth];

  function nowIso() { return new Date().toISOString(); }

  const summary = {
    started_at: nowIso(),
    dry_run: !FORCE,
    super_admin_email: SUPER_ADMIN_EMAIL,
    whitelist: WHITELIST,
    preserved_ids: {},
    deletions: {},
    before_counts: {},
    after_counts: {},
  };

  try {
    console.log('\n🔎 Resolving Super Admin user...');
    let superAuthUser = await col('auth_users').findOne({ email: SUPER_ADMIN_EMAIL });
    let superUser = null;
    if (!superAuthUser) {
      superUser = await col('users').findOne({ role: 'super_admin' });
      if (superUser) {
        superAuthUser = await col('auth_users').findOne({ id: superUser.auth_user_id });
      }
    } else {
      superUser = await col('users').findOne({ auth_user_id: superAuthUser.id });
    }
    if (!superAuthUser || !superUser) {
      console.error('❌ Unable to locate Super Admin (auth_users/users). Aborting.');
      process.exit(1);
    }
    summary.preserved_ids.auth_user_id = superAuthUser.id;
    summary.preserved_ids.user_id = superUser.id;
    console.log('👑 Super Admin resolved:', {
      auth_user_id: superAuthUser.id,
      user_id: superUser.id,
      email: superAuthUser.email,
    });

    // Large safety check
    const totalAuthUsers = await col('auth_users').countDocuments();
    if (totalAuthUsers > 10000 && !ALLOW_LARGE) {
      console.error('⚠️ Refusing to run: more than 10,000 auth_users detected. Pass --allow-large to override.');
      process.exit(1);
    }

    // Count before
    for (const name of allCollectionNames) {
      try {
        summary.before_counts[name] = await col(name).countDocuments();
      } catch (e) {
        summary.before_counts[name] = 0;
      }
    }
    console.log('\n📊 Counts before:', summary.before_counts);

    // Build queries
    const authUserId = superAuthUser.id;
    const userId = superUser.id;
    const whitelistEmails = WHITELIST;

    // Resolve whitelist auth_user IDs (if more than just super admin)
    const whitelistAuthUsers = await col('auth_users')
      .find({ email: { $in: whitelistEmails } })
      .project({ id: 1, email: 1, _id: 0 })
      .toArray();
    const whitelistAuthIds = whitelistAuthUsers.map(u => u.id);
    if (!whitelistAuthIds.includes(authUserId)) whitelistAuthIds.push(authUserId);

    // Resolve corresponding profile user IDs for whitelist
    const whitelistProfileUsers = await col('users')
      .find({ auth_user_id: { $in: whitelistAuthIds } })
      .project({ id: 1, auth_user_id: 1, _id: 0 })
      .toArray();
    const whitelistUserIds = whitelistProfileUsers.map(u => u.id);
    if (!whitelistUserIds.includes(userId)) whitelistUserIds.push(userId);

    summary.preserved_ids.whitelist_auth_user_ids = whitelistAuthIds;
    summary.preserved_ids.whitelist_user_ids = whitelistUserIds;

    console.log('\n🛡️ Whitelist resolved:', {
      emails: whitelistEmails,
      auth_user_ids: whitelistAuthIds,
      user_ids: whitelistUserIds,
    });

    // Deletion specs
    const deletionSpecs = [
      { name: 'users', filter: { id: { $nin: whitelistUserIds } } },
      { name: 'auth_users', filter: { id: { $nin: whitelistAuthIds } } },
      { name: 'auth_accounts', filter: { userId: { $nin: whitelistAuthIds } } },
      { name: 'auth_sessions', filter: { userId: { $nin: whitelistAuthIds } } },
      { name: 'auth_verification_token', filter: { userId: { $nin: whitelistAuthIds } } },
      { name: 'voice_profiles', filter: { user_id: { $nin: whitelistUserIds } } },
      { name: 'documents', filter: { user_id: { $nin: whitelistUserIds } } },
      { name: 'verification_requests', filter: { user_id: { $nin: whitelistUserIds } } },
      { name: 'voice_enrollment_sessions', filter: { user_id: { $nin: whitelistUserIds } } },
      { name: 'audit_logs', filter: { user_id: { $nin: whitelistUserIds } } },
    ];

    console.log('\n🧪 Dry-run evaluation (no deletions will occur unless --force):');
    for (const spec of deletionSpecs) {
      const count = await col(spec.name).countDocuments(spec.filter);
      summary.deletions[spec.name] = { would_delete: count, actually_deleted: 0 };
      console.log(`   - ${spec.name}: WOULD delete ${count}`);
    }

    if (!FORCE) {
      console.log('\n⚠️ Dry run complete. Re-run with --force to execute deletions.');
    } else {
      console.log('\n🚨 FORCE mode enabled. Executing deletions...');
      for (const spec of deletionSpecs) {
        try {
          const res = await col(spec.name).deleteMany(spec.filter);
          summary.deletions[spec.name].actually_deleted = res.deletedCount || 0;
          console.log(`   - ${spec.name}: deleted ${res.deletedCount || 0}`);
        } catch (err) {
          console.log(`   - ${spec.name}: ERROR ${err.message}`);
          summary.deletions[spec.name].error = err.message;
        }
      }
    }

    // Count after
    for (const name of allCollectionNames) {
      try {
        summary.after_counts[name] = await col(name).countDocuments();
      } catch (e) {
        summary.after_counts[name] = 0;
      }
    }

    summary.finished_at = nowIso();
    summary.success = true;

    const outPath = path.join(__dirname, 'purge-summary.json');
    fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
    console.log(`\n📝 Summary written to ${outPath}`);
    console.log('\n✅ Operation complete.');
    if (!FORCE) {
      console.log('   (Nothing deleted; this was a dry run)');
    }
  } catch (err) {
    summary.error = err.message;
    summary.success = false;
    console.error('❌ Purge failed:', err);
    process.exitCode = 1;
  } finally {
    try { await client.close(); } catch {}
  }
}

main();
