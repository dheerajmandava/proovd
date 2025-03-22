#!/usr/bin/env node

const { MongoClient } = require('mongodb');

// Use directConnection option to bypass replica set discovery
const uri = 'mongodb://localhost:27018/?directConnection=true';
console.log(`Connecting to: ${uri}`);

const client = new MongoClient(uri);

async function run() {
  try {
    console.log('Attempting connection...');
    await client.connect();
    console.log('Connection successful!');
    
    // Display basic database info
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    console.log(`Available databases: ${dbs.databases.map(db => db.name).join(', ')}`);
    
    // Try to create a test database and collection
    const db = client.db('test_db');
    const collection = db.collection('test_collection');
    
    // Insert a document
    console.log('Inserting a test document...');
    const result = await collection.insertOne({ test: true, timestamp: new Date() });
    console.log(`Document inserted with ID: ${result.insertedId}`);
    
    await client.close();
    console.log('Connection closed');
  } catch (err) {
    console.error('Error details:');
    console.error(err);
  }
}

run().catch(console.error); 