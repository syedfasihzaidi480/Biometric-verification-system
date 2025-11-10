import { MongoClient } from 'mongodb';
import sql from '@/app/api/utils/sql';

const DEFAULT_TIMEOUT_MS = Number(process.env.HEALTHCHECK_TIMEOUT_MS ?? '4000');
let mongoClient;

function withTimeout(promise, timeoutMs, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(message ?? `Timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function getMongoDb() {
  if (!process.env.MONGODB_URI) return null;
  if (!mongoClient) {
    mongoClient = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: DEFAULT_TIMEOUT_MS,
    });
  }
  return mongoClient.db(process.env.MONGODB_DB || 'auth');
}

export async function GET() {
  const timeoutMs = DEFAULT_TIMEOUT_MS;
  const result = {
    storage: process.env.MONGODB_URI ? 'mongodb' : 'postgres',
    mongo: { enabled: Boolean(process.env.MONGODB_URI), ok: false },
    postgres: { enabled: Boolean(process.env.DATABASE_URL), ok: false },
  };

  try {
    const db = await getMongoDb();
    if (db) {
      await withTimeout(db.command({ ping: 1 }), timeoutMs, 'MongoDB ping timed out');
      result.mongo.ok = true;
    }
  } catch (e) {
    result.mongo.error = e.message;
  }

  try {
    if (process.env.DATABASE_URL) {
      await withTimeout(sql`select 1`, timeoutMs, 'Postgres ping timed out');
      result.postgres.ok = true;
    }
  } catch (e) {
    result.postgres.error = e.message;
  }

  return Response.json({ success: true, data: result });
}
