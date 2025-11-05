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
		if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
			val = val.slice(1, -1);
		}
		result[key] = val;
	}
	return result;
}

async function main() {
	const WEB_DIR = path.join(__dirname, '..');
	const env = loadEnv(path.join(WEB_DIR, '.env'));
	const uri = env.MONGODB_URI || process.env.MONGODB_URI;
	const dbName = env.MONGODB_DB || process.env.MONGODB_DB || 'auth';

	if (!uri) {
		console.error('❌ MONGODB_URI is not set.');
		process.exit(1);
	}

	const client = new MongoClient(uri);
	await client.connect();
	const db = client.db(dbName);
	console.log(`✅ Connected. Creating indexes in DB: ${dbName}`);

	const create = async (col, index, opts) => {
		try {
			const name = await db.collection(col).createIndex(index, opts);
			console.log(` - ${col}: created index ${name}`);
		} catch (e) {
			console.warn(` - ${col}: index skipped: ${e.message}`);
		}
	};

	// Users: phone and pension_number must be unique
	await create('users', { phone: 1 }, { unique: true, name: 'uniq_phone' });
	await create('users', { pension_number: 1 }, { unique: true, name: 'uniq_pension' });
	await create('users', { auth_user_id: 1 }, { unique: true, sparse: true, name: 'uniq_auth_user_id' });

	// Auth users: email unique, but allow multiple nulls via partial index
	await create('auth_users', { email: 1 }, {
		unique: true,
		partialFilterExpression: { email: { $type: 'string' } },
		name: 'uniq_email_non_null'
	});

	// Auth accounts: userId unique per provider
	await create('auth_accounts', { userId: 1, provider: 1 }, { unique: true, name: 'uniq_user_provider' });

	// Voice, documents, verification
	await create('voice_profiles', { user_id: 1 }, { unique: true, name: 'uniq_voice_user' });
	await create('documents', { user_id: 1, created_at: -1 }, { name: 'docs_user_created' });
	await create('verification_requests', { user_id: 1, status: 1 }, { name: 'verif_user_status' });
	await create('voice_enrollment_sessions', { user_id: 1, created_at: -1 }, { name: 'voice_session_user' });
	await create('audit_logs', { user_id: 1, created_at: -1 }, { name: 'audit_user_created' });

	// Notification devices
	await create('notification_devices', { token: 1 }, { unique: true, name: 'notif_token_unique' });
	await create('notification_devices', { user_id: 1, updated_at: -1 }, { name: 'notif_user_updated' });

	// Notifications inbox
	await create('notifications', { user_id: 1, created_at: -1 }, { name: 'notif_user_created' });
	await create('notifications', { read: 1, created_at: -1 }, { name: 'notif_read_created' });

	await client.close();
	console.log('✅ Index creation complete.');
}

main().catch((e) => {
	console.error('❌ Failed to create indexes:', e);
	process.exit(1);
});

