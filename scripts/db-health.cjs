#!/usr/bin/env node
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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

const EXPECTED_INDEXES = [
  { collection: 'users', name: 'uniq_phone_non_null', key: { phone: 1 }, options: { unique: true, partialFilterExpression: { phone: { $type: 'string' } } } },
  { collection: 'users', name: 'uniq_pension_non_null', key: { pension_number: 1 }, options: { unique: true, partialFilterExpression: { pension_number: { $type: 'string' } } } },
  { collection: 'users', name: 'uniq_auth_user_id', key: { auth_user_id: 1 }, options: { unique: true, sparse: true } },
  { collection: 'auth_users', name: 'uniq_email_non_null', key: { email: 1 }, options: { unique: true, partialFilterExpression: { email: { $type: 'string' } } } },
  { collection: 'auth_accounts', name: 'uniq_user_provider', key: { userId: 1, provider: 1 }, options: { unique: true } },
  { collection: 'voice_profiles', name: 'uniq_voice_user', key: { user_id: 1 }, options: { unique: true } },
  { collection: 'documents', name: 'docs_user_created', key: { user_id: 1, created_at: -1 }, options: {} },
  { collection: 'verification_requests', name: 'verif_user_status', key: { user_id: 1, status: 1 }, options: {} },
  { collection: 'voice_enrollment_sessions', name: 'voice_session_user', key: { user_id: 1, created_at: -1 }, options: {} },
  { collection: 'audit_logs', name: 'audit_user_created', key: { user_id: 1, created_at: -1 }, options: {} },
  { collection: 'notification_devices', name: 'notif_token_unique', key: { token: 1 }, options: { unique: true } },
  { collection: 'notification_devices', name: 'notif_user_updated', key: { user_id: 1, updated_at: -1 }, options: {} },
  { collection: 'notifications', name: 'notif_user_created', key: { user_id: 1, created_at: -1 }, options: {} },
  { collection: 'notifications', name: 'notif_read_created', key: { read: 1, created_at: -1 }, options: {} },
];

const LEGACY_INDEXES = [
  { collection: 'users', name: 'uniq_phone' },
  { collection: 'users', name: 'uniq_pension' },
  { collection: 'auth_users', name: 'email_1' },
  // Optional legacy on users (kept as suggestion only)
  { collection: 'users', name: 'email_1' },
];

function comparable(obj) {
  return JSON.parse(JSON.stringify(obj || null));
}

function indexMatches(existing, expectedKey, expectedOptions = {}) {
  const keysMatch = JSON.stringify(existing.key) === JSON.stringify(expectedKey);
  const uniqueMatch = Boolean(existing.unique) === Boolean(expectedOptions.unique);
  const partialMatch = JSON.stringify(comparable(existing.partialFilterExpression)) === JSON.stringify(comparable(expectedOptions.partialFilterExpression));
  const sparseMatch = Boolean(existing.sparse) === Boolean(expectedOptions.sparse);
  return keysMatch && uniqueMatch && partialMatch && sparseMatch;
}

async function run() {
  // Resolve repo root (scripts/..)
  const ROOT = path.resolve(__dirname, '..');
  // Prefer apps/web/.env, fallback to repo root .env if present
  const WEB_ENV = fs.existsSync(path.join(ROOT, 'apps', 'web', '.env'))
    ? path.join(ROOT, 'apps', 'web', '.env')
    : path.join(ROOT, '.env');
  const env = loadEnv(WEB_ENV);
  const uri = env.MONGODB_URI || process.env.MONGODB_URI;
  const dbName = env.MONGODB_DB || process.env.MONGODB_DB || 'auth';
  const args = new Set(process.argv.slice(2));
  const fix = args.has('--fix');

  if (!uri) {
    console.error('❌ MONGODB_URI is not set. Configure apps/web/.env or environment variable.');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  console.log(`🔎 Checking DB indexes for ${dbName}`);

  const byCollection = {};
  const collections = [...new Set(EXPECTED_INDEXES.map((e) => e.collection))];
  for (const col of collections) {
    const coll = db.collection(col);
    const indexes = await coll.indexes();
    const presentByName = Object.fromEntries(indexes.map((i) => [i.name, i]));
    const expected = EXPECTED_INDEXES.filter((e) => e.collection === col);

    const missing = [];
    const mismatched = [];
    const ok = [];
    for (const spec of expected) {
      const existing = presentByName[spec.name];
      if (!existing) missing.push(spec);
      else if (!indexMatches(existing, spec.key, spec.options)) mismatched.push({ spec, existing });
      else ok.push(spec);
    }
    const legacyPresent = LEGACY_INDEXES.filter((l) => l.collection === col && presentByName[l.name]).map((l) => l.name);
    byCollection[col] = { ok: ok.map((s) => s.name), missing: missing.map((s) => s.name), mismatched: mismatched.map((m) => m.spec.name), legacyPresent, present: indexes.map((i) => i.name) };
  }

  const suggestions = [];
  for (const [col, info] of Object.entries(byCollection)) {
    for (const n of info.missing) suggestions.push(`Create missing index ${n} on ${col}.`);
    for (const n of info.mismatched) suggestions.push(`Drop and recreate mismatched index ${n} on ${col}.`);
    for (const n of info.legacyPresent) suggestions.push(`Drop legacy index ${n} on ${col}.`);
  }

  let exitOk = suggestions.length === 0;
  console.log(JSON.stringify({ ok: exitOk, byCollection, suggestions }, null, 2));

  if (fix) {
    console.log('🛠️ Applying fixes directly...');

    const dropIndexIfExists = async (col, name) => {
      try {
        const indexes = await db.collection(col).indexes();
        if (indexes.some((i) => i.name === name)) {
          await db.collection(col).dropIndex(name);
          console.log(` - ${col}: dropped index ${name}`);
        }
      } catch (e) {
        console.warn(` - ${col}: drop index ${name} skipped: ${e.message}`);
      }
    };

    const ensureIndex = async (col, spec) => {
      const collection = db.collection(col);
      const { key, options = {}, name } = spec;
      try {
        let indexes = await collection.indexes();
        const existing = indexes.find((i) => i.name === name);
        if (existing) {
          if (!indexMatches(existing, key, options)) {
            await collection.dropIndex(name);
            console.log(` - ${col}: dropped outdated index ${name}`);
          } else {
            console.log(` - ${col}: index ${name} up-to-date`);
            return;
          }
        }
        try {
          const created = await collection.createIndex(key, { ...options, name });
          console.log(` - ${col}: created index ${created}`);
        } catch (e) {
          if (/already exists with a different name/i.test(e.message || '')) {
            // Find and drop the index with same key but different name
            indexes = await collection.indexes();
            const byKey = indexes.find((i) => JSON.stringify(i.key) === JSON.stringify(key));
            if (byKey) {
              await collection.dropIndex(byKey.name);
              console.log(` - ${col}: dropped same-key index ${byKey.name}`);
              const created = await collection.createIndex(key, { ...options, name });
              console.log(` - ${col}: created index ${created}`);
            } else {
              console.warn(` - ${col}: could not locate same-key index to drop for ${name}`);
            }
          } else {
            throw e;
          }
        }
      } catch (e) {
        console.warn(` - ${col}: ensure index ${name} skipped: ${e.message}`);
      }
    };

    // Drop legacy indexes that are present
    for (const [col, info] of Object.entries(byCollection)) {
      for (const legacy of info.legacyPresent) {
        await dropIndexIfExists(col, legacy);
      }
    }

    // Recreate mismatched and missing indexes
    const expectedByName = EXPECTED_INDEXES.reduce((acc, s) => {
      acc[`${s.collection}:${s.name}`] = s;
      return acc;
    }, {});

    for (const [col, info] of Object.entries(byCollection)) {
      for (const name of info.mismatched) {
        const spec = expectedByName[`${col}:${name}`];
        if (spec) await ensureIndex(col, spec);
      }
      for (const name of info.missing) {
        const spec = expectedByName[`${col}:${name}`];
        if (spec) await ensureIndex(col, spec);
      }
    }

    // Re-check and print final status
    const final = await (async () => {
      const result = {};
      for (const col of Object.keys(byCollection)) {
        const indexes = await db.collection(col).indexes();
        const presentByName = Object.fromEntries(indexes.map((i) => [i.name, i]));
        const expected = EXPECTED_INDEXES.filter((e) => e.collection === col);
        const missing = [];
        const mismatched = [];
        const ok = [];
        for (const spec of expected) {
          const existing = presentByName[spec.name];
          if (!existing) missing.push(spec.name);
          else if (!indexMatches(existing, spec.key, spec.options)) mismatched.push(spec.name);
          else ok.push(spec.name);
        }
        const legacyPresent = LEGACY_INDEXES.filter((l) => l.collection === col && presentByName[l.name]).map((l) => l.name);
        result[col] = { ok, missing, mismatched, legacyPresent, present: indexes.map((i) => i.name) };
      }
      const suggestions = [];
      for (const [col, info] of Object.entries(result)) {
        for (const n of info.missing) suggestions.push(`Create missing index ${n} on ${col}.`);
        for (const n of info.mismatched) suggestions.push(`Drop and recreate mismatched index ${n} on ${col}.`);
        for (const n of info.legacyPresent) suggestions.push(`Drop legacy index ${n} on ${col}.`);
      }
      return { ok: suggestions.length === 0, byCollection: result, suggestions };
    })();

    console.log('✅ Post-fix status:');
    console.log(JSON.stringify(final, null, 2));

    if (!final.ok) {
      console.warn('⚠️ Some issues remain after fix. Please review suggestions above.');
    }
    exitOk = final.ok;
  }

  await client.close();
  process.exit(exitOk ? 0 : 2);
}

run().catch((e) => {
  console.error('❌ DB health check failed:', e);
  process.exit(1);
});
