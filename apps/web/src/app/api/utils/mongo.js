import { MongoClient } from 'mongodb';

// Cache the client and database across hot reloads in dev environments.
let clientPromise;
let dbCache;

export async function getMongoClient() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set.');
  }

  if (!clientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI);
    clientPromise = client.connect();
  }

  return clientPromise;
}

export async function getMongoDb() {
  if (dbCache) {
    return dbCache;
  }

  const client = await getMongoClient();
  dbCache = client.db(process.env.MONGODB_DB || 'auth');
  return dbCache;
}

export async function getMongoCollections(collectionNames) {
  const db = await getMongoDb();
  return collectionNames.reduce((accumulator, name) => {
    accumulator[name] = db.collection(name);
    return accumulator;
  }, {});
}
