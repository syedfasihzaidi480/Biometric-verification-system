import { getMongoDb } from '@/app/api/utils/mongo';

// Define expected index specifications mirroring create-indexes.cjs
const EXPECTED_INDEXES = [
  // users
  {
    collection: 'users',
    name: 'uniq_phone_non_null',
    key: { phone: 1 },
    options: { unique: true, partialFilterExpression: { phone: { $type: 'string' } } },
  },
  {
    collection: 'users',
    name: 'uniq_pension_non_null',
    key: { pension_number: 1 },
    options: { unique: true, partialFilterExpression: { pension_number: { $type: 'string' } } },
  },
  {
    collection: 'users',
    name: 'uniq_auth_user_id',
    key: { auth_user_id: 1 },
    options: { unique: true, sparse: true },
  },

  // auth_users
  {
    collection: 'auth_users',
    name: 'uniq_email_non_null',
    key: { email: 1 },
    options: { unique: true, partialFilterExpression: { email: { $type: 'string' } } },
  },

  // auth_accounts
  {
    collection: 'auth_accounts',
    name: 'uniq_user_provider',
    key: { userId: 1, provider: 1 },
    options: { unique: true },
  },

  // voice, documents, verification
  { collection: 'voice_profiles', name: 'uniq_voice_user', key: { user_id: 1 }, options: { unique: true } },
  { collection: 'documents', name: 'docs_user_created', key: { user_id: 1, created_at: -1 }, options: {} },
  { collection: 'verification_requests', name: 'verif_user_status', key: { user_id: 1, status: 1 }, options: {} },
  { collection: 'voice_enrollment_sessions', name: 'voice_session_user', key: { user_id: 1, created_at: -1 }, options: {} },
  { collection: 'audit_logs', name: 'audit_user_created', key: { user_id: 1, created_at: -1 }, options: {} },

  // notifications
  { collection: 'notification_devices', name: 'notif_token_unique', key: { token: 1 }, options: { unique: true } },
  { collection: 'notification_devices', name: 'notif_user_updated', key: { user_id: 1, updated_at: -1 }, options: {} },
  { collection: 'notifications', name: 'notif_user_created', key: { user_id: 1, created_at: -1 }, options: {} },
  { collection: 'notifications', name: 'notif_read_created', key: { read: 1, created_at: -1 }, options: {} },
];

// Known legacy indexes we want to avoid
const LEGACY_INDEXES = [
  { collection: 'users', name: 'uniq_phone' },
  { collection: 'users', name: 'uniq_pension' },
  { collection: 'auth_users', name: 'email_1' },
];

export function comparable(obj) {
  // Normalize undefined vs missing
  return JSON.parse(JSON.stringify(obj || null));
}

export function indexMatches(existing, expectedKey, expectedOptions = {}) {
  const keysMatch = JSON.stringify(existing.key) === JSON.stringify(expectedKey);
  const uniqueMatch = Boolean(existing.unique) === Boolean(expectedOptions.unique);
  const partialMatch = JSON.stringify(comparable(existing.partialFilterExpression)) === JSON.stringify(comparable(expectedOptions.partialFilterExpression));
  const sparseMatch = Boolean(existing.sparse) === Boolean(expectedOptions.sparse);
  return keysMatch && uniqueMatch && partialMatch && sparseMatch;
}

export async function checkDbIndexes() {
  if (!process.env.MONGODB_URI) {
    return {
      ok: false,
      error: 'MONGODB_URI is not configured',
      suggestions: ['Set MONGODB_URI in apps/web/.env and restart the server.'],
    };
  }

  const db = await getMongoDb();
  const byCollection = {};

  // Group expected by collection for faster lookups
  const expectedByCol = EXPECTED_INDEXES.reduce((acc, spec) => {
    acc[spec.collection] = acc[spec.collection] || [];
    acc[spec.collection].push(spec);
    return acc;
  }, {});

  const collections = Object.keys(expectedByCol);
  for (const col of collections) {
    const coll = db.collection(col);
    const indexes = await coll.indexes();
    const presentByName = indexes.reduce((acc, idx) => {
      acc[idx.name] = idx;
      return acc;
    }, {});

    const expected = expectedByCol[col];
    const missing = [];
    const mismatched = [];
    const ok = [];

    for (const spec of expected) {
      const existing = presentByName[spec.name];
      if (!existing) {
        missing.push(spec.name);
      } else if (!indexMatches(existing, spec.key, spec.options)) {
        mismatched.push({ name: spec.name, existing: { key: existing.key, unique: existing.unique, sparse: existing.sparse, partialFilterExpression: existing.partialFilterExpression || null }, expected: { key: spec.key, ...spec.options } });
      } else {
        ok.push(spec.name);
      }
    }

    const legacyPresent = LEGACY_INDEXES.filter((l) => l.collection === col && presentByName[l.name]).map((l) => l.name);

    byCollection[col] = {
      ok,
      missing,
      mismatched,
      legacyPresent,
      present: indexes.map((i) => i.name),
    };
  }

  const suggestions = [];
  for (const [col, res] of Object.entries(byCollection)) {
    for (const name of res.missing) {
      suggestions.push(`Create missing index ${name} on ${col}.`);
    }
    for (const m of res.mismatched) {
      suggestions.push(`Drop and recreate mismatched index ${m.name} on ${col}.`);
    }
    for (const legacy of res.legacyPresent) {
      suggestions.push(`Drop legacy index ${legacy} on ${col}.`);
    }
  }

  return {
    ok: suggestions.length === 0,
    byCollection,
    suggestions,
  };
}

export default checkDbIndexes;
