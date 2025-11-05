#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Backfill users.admin_approved based on verification_requests status
 * - For each user with latest verification_requests.status === 'approved', set users.admin_approved=true
 * - For users with no approved verifications, leave as-is (do not force to false)
 *
 * Usage:
 *   node ./scripts/backfill-admin-approved.cjs [--dry]
 */
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

async function main() {
  const WEB_DIR = path.join(__dirname, '..');
  const ENV_PATH = path.join(WEB_DIR, '.env');
  const env = loadEnv(ENV_PATH);

  const DRY_RUN = process.argv.includes('--dry');
  const MONGODB_URI = env.MONGODB_URI || process.env.MONGODB_URI;
  const MONGODB_DB = env.MONGODB_DB || process.env.MONGODB_DB || 'auth';

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set. Configure it in apps/web/.env');
    process.exit(1);
  }

  console.log('🔗 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  console.log(`✅ Connected. DB: ${MONGODB_DB}`);

  try {
    const users = db.collection('users');
    const verifications = db.collection('verification_requests');

    // Find users whose latest verification is approved
    console.log('🔎 Aggregating approved verifications per user...');
    const pipeline = [
      { $sort: { user_id: 1, updated_at: -1, created_at: -1 } },
      { $group: { _id: '$user_id', latest: { $first: '$$ROOT' } } },
      { $match: { 'latest.status': 'approved' } },
      { $project: { user_id: '$_id', _id: 0 } },
    ];
    const approvedUsers = await verifications.aggregate(pipeline).toArray();
    console.log(`📋 Users with latest approved verification: ${approvedUsers.length}`);

    if (approvedUsers.length === 0) {
      console.log('ℹ️ Nothing to backfill. Exiting.');
      process.exit(0);
    }

    const now = new Date().toISOString();
    let updated = 0;
    for (const { user_id } of approvedUsers) {
      const res = DRY_RUN
        ? { modifiedCount: 0 }
        : await users.updateOne(
            { id: user_id, admin_approved: { $ne: true } },
            { $set: { admin_approved: true, updated_at: now } }
          );
      if (res.modifiedCount > 0) updated++;
    }

    console.log(DRY_RUN ? '🧪 DRY RUN complete.' : '✅ Backfill complete.');
    console.log(`🔧 Users updated: ${updated}/${approvedUsers.length}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Backfill failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
