import { MongoClient } from 'mongodb';
let cachedClient = null;
let cachedDb = null;
if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}
if (!process.env.MONGODB_DB) {
    throw new Error('Please define the MONGODB_DB environment variable');
}
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
export async function connectToDatabase() {
    // If we already have a connection, use it
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
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
