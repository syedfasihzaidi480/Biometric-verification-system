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

	const ensureIndex = async (col, keys, opts) => {
		const collection = db.collection(col);
		try {
			const indexes = await collection.indexes();
			const existing = indexes.find((i) => i.name === opts.name);
			if (existing) {
				// Compare key spec and important options; if mismatch, drop and recreate
				const keysMatch = JSON.stringify(existing.key) === JSON.stringify(keys);
				const uniqueMatch = !!existing.unique === !!opts.unique;
				const partialMatch = JSON.stringify(existing.partialFilterExpression || null) === JSON.stringify(opts.partialFilterExpression || null);
				if (keysMatch && uniqueMatch && partialMatch) {
					console.log(` - ${col}: index ${opts.name} up-to-date`);
					return;
				}
				await collection.dropIndex(opts.name);
				console.log(` - ${col}: dropped outdated index ${opts.name}`);
			}
			const name = await collection.createIndex(keys, opts);
			console.log(` - ${col}: created index ${name}`);
		} catch (e) {
			console.warn(` - ${col}: ensure index ${opts.name} skipped: ${e.message}`);
		}
	};

	// Users: phone and pension_number should be unique ONLY when present (non-null)
	// Drop legacy indexes that enforced uniqueness on nulls
	await dropIndexIfExists('users', 'uniq_phone');
	await dropIndexIfExists('users', 'uniq_pension');
	// Also drop any legacy email unique index on auth_users that didn't allow multiple nulls
	await dropIndexIfExists('auth_users', 'email_1');

	await ensureIndex('users', { phone: 1 }, {
		unique: true,
		name: 'uniq_phone_non_null',
		partialFilterExpression: { phone: { $type: 'string' } },
	});
	await ensureIndex('users', { pension_number: 1 }, {
		unique: true,
		name: 'uniq_pension_non_null',
		partialFilterExpression: { pension_number: { $type: 'string' } },
	});
	await ensureIndex('users', { auth_user_id: 1 }, { unique: true, sparse: true, name: 'uniq_auth_user_id' });

	// Auth users: email unique, but allow multiple nulls via partial index
	await ensureIndex('auth_users', { email: 1 }, {
		unique: true,
		partialFilterExpression: { email: { $type: 'string' } },
		name: 'uniq_email_non_null'
	});

	// Auth accounts: userId unique per provider
	await ensureIndex('auth_accounts', { userId: 1, provider: 1 }, { unique: true, name: 'uniq_user_provider' });

	// Voice, documents, verification
	await ensureIndex('voice_profiles', { user_id: 1 }, { unique: true, name: 'uniq_voice_user' });
	await ensureIndex('documents', { user_id: 1, created_at: -1 }, { name: 'docs_user_created' });
	await ensureIndex('verification_requests', { user_id: 1, status: 1 }, { name: 'verif_user_status' });
	await ensureIndex('voice_enrollment_sessions', { user_id: 1, created_at: -1 }, { name: 'voice_session_user' });
	await ensureIndex('audit_logs', { user_id: 1, created_at: -1 }, { name: 'audit_user_created' });

	// Notification devices
	await ensureIndex('notification_devices', { token: 1 }, { unique: true, name: 'notif_token_unique' });
	await ensureIndex('notification_devices', { user_id: 1, updated_at: -1 }, { name: 'notif_user_updated' });

	// Notifications inbox
	await ensureIndex('notifications', { user_id: 1, created_at: -1 }, { name: 'notif_user_created' });
	await ensureIndex('notifications', { read: 1, created_at: -1 }, { name: 'notif_read_created' });

	await client.close();
	console.log('✅ Index creation complete.');
}

main().catch((e) => {
	console.error('❌ Failed to create indexes:', e);
	process.exit(1);
});

