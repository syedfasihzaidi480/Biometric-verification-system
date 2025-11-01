import { MongoClient } from 'mongodb';
import sql from '@/app/api/utils/sql';

let mongoClient;
async function getMongoDb() {
  if (!process.env.MONGODB_URI) return null;
  if (!mongoClient) mongoClient = new MongoClient(process.env.MONGODB_URI);
  return mongoClient.db(process.env.MONGODB_DB || 'auth');
}

export async function GET() {
  const result = {
    storage: process.env.MONGODB_URI ? 'mongodb' : 'postgres',
    mongo: { enabled: Boolean(process.env.MONGODB_URI), ok: false },
    postgres: { enabled: Boolean(process.env.DATABASE_URL), ok: false },
  };
  try {
    const db = await getMongoDb();
    if (db) {
      await db.command({ ping: 1 });
      result.mongo.ok = true;
    }
  } catch (e) {
    result.mongo.error = e.message;
  }

  try {
    if (process.env.DATABASE_URL) {
      await sql`select 1`;
      result.postgres.ok = true;
    }
  } catch (e) {
    result.postgres.error = e.message;
  }

  return Response.json({ success: true, data: result });
}
