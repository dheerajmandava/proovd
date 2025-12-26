import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  // If we already have a connection, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Check env vars at runtime, not at module load time (fixes build errors)
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  if (!dbName) {
    throw new Error('Please define the MONGODB_DB environment variable');
  }

  // Create a new connection
  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db(dbName);

  // Cache the connection
  cachedClient = client;
  cachedDb = db;

  return { client, db };
} 