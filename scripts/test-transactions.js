#!/usr/bin/env node

/**
 * Test MongoDB Transaction Support
 * 
 * This script tests if your MongoDB deployment supports transactions.
 * Transactions require a replica set or mongos deployment.
 * 
 * Usage:
 * 1. Make sure your Docker MongoDB replica set is running:
 *    npm run db:start
 * 
 * 2. Run this script:
 *    node scripts/test-transactions.js
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

// Connect to the MongoDB replica set with direct connection
const uri = 'mongodb://localhost:27018/proovd?directConnection=true';

async function testTransactions() {
  console.log(`Testing MongoDB connection: ${uri}`);
  const client = new MongoClient(uri);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('transaction_tests');
    
    // Clean up from previous test runs
    await collection.deleteMany({});
    
    console.log('Starting transaction test...');
    
    // Start a session and transaction
    const session = client.startSession();
    try {
      session.startTransaction();
      console.log('✅ Transaction started successfully');
      
      // Insert a test document within the transaction
      const testDoc = { 
        test: true, 
        timestamp: new Date(), 
        environment: process.env.NODE_ENV || 'development' 
      };
      
      await collection.insertOne(testDoc, { session });
      console.log('✅ Document inserted in transaction');
      
      // Commit the transaction
      await session.commitTransaction();
      console.log('✅ Transaction committed successfully');
      
      // Verify the document exists
      const savedDoc = await collection.findOne({ test: true });
      if (savedDoc) {
        console.log('✅ Document verification successful');
      } else {
        console.error('❌ Document not found after transaction commit');
      }
      
      console.log('\n✅✅✅ TRANSACTION SUPPORT CONFIRMED! ✅✅✅');
      console.log('Your MongoDB deployment supports transactions.');
    } catch (error) {
      // If the transaction fails, log the error and abort
      await session.abortTransaction().catch(console.error);
      
      console.error('\n❌❌❌ TRANSACTION TEST FAILED! ❌❌❌');
      console.error('Error:', error.message);
      
      if (error.codeName === 'IllegalOperation' && error.code === 20) {
        console.error('\nYour MongoDB deployment does not support transactions.');
        console.error('For production use, MongoDB must be set up as a replica set or sharded cluster.');
        console.error('Please see the "mongodb-production-setup.md" document for instructions.');
      }
      
      process.exit(1);
    } finally {
      // End the session
      await session.endSession();
    }
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the test
testTransactions().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 