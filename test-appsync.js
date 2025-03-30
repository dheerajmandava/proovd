#!/usr/bin/env node

// Test script to verify AppSync and MongoDB connections
require('dotenv').config({ path: '.env.local' });
const https = require('https');
const { MongoClient } = require('mongodb');

const API_ENDPOINT = process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT;
const API_KEY = process.env.NEXT_PUBLIC_APPSYNC_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

const WEBSITE_ID = process.argv[2]; // Pass websiteId as command line argument
if (!WEBSITE_ID) {
  console.error('❌ ERROR: Please provide websiteId as an argument');
  console.error('Usage: node test-appsync.js <websiteId>');
  process.exit(1);
}

console.log('=== ProovdPulse Configuration Test ===');
console.log('AppSync Endpoint:', API_ENDPOINT ? '✅ Configured' : '❌ Missing');
console.log('AppSync API Key:', API_KEY ? '✅ Configured' : '❌ Missing');
console.log('MongoDB URI:', MONGODB_URI ? '✅ Configured' : '❌ Missing');
console.log('MongoDB DB:', MONGODB_DB ? '✅ Configured' : '❌ Missing');
console.log('Website ID:', WEBSITE_ID);
console.log('=======================================');

if (!API_ENDPOINT || !API_KEY) {
  console.error('❌ ERROR: AppSync not properly configured!');
  process.exit(1);
}

if (!MONGODB_URI || !MONGODB_DB) {
  console.error('❌ ERROR: MongoDB not properly configured!');
  process.exit(1);
}

// Test MongoDB connection
async function testMongoDB() {
  console.log('\n🔍 Testing MongoDB connection...');
  try {
    const client = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 15000
    });
    
    console.log('✅ MongoDB connection successful!');
    const db = client.db(MONGODB_DB);
    
    // Check if usersessions collection exists
    const collections = await db.listCollections().toArray();
    const hasUserSessions = collections.some(c => c.name === 'usersessions');
    console.log(`Collection 'usersessions': ${hasUserSessions ? '✅ Exists' : '❌ Missing'}`);
    
    // Check if websitestats collection exists
    const hasWebsiteStats = collections.some(c => c.name === 'websitestats');
    console.log(`Collection 'websitestats': ${hasWebsiteStats ? '✅ Exists' : '❌ Missing'}`);
    
    // Close connection
    await client.close();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  }
}

// Test AppSync API with a simple query
async function testAppSync() {
  console.log('\n🔍 Testing AppSync API...');
  
  // GraphQL query to get website stats
  const query = `
    query GetWebsiteStats($id: ID!) {
      getWebsiteStats(id: $id) {
        id
        activeUsers
      }
    }
  `;
  
  const variables = { id: WEBSITE_ID };
  const data = JSON.stringify({ query, variables });
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(API_ENDPOINT, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          console.log('✅ AppSync API request successful!');
          console.log('Response:', JSON.stringify(result, null, 2));
          resolve(result);
        } catch (error) {
          console.error('❌ Error parsing response:', error.message);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ AppSync API request failed:', error.message);
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

// Test updateUserActivity mutation
async function testUpdateActivity() {
  console.log('\n🔍 Testing updateUserActivity mutation...');
  
  const mutation = `
    mutation UpdateUserActivity($clientId: String!, $websiteId: ID!, $metrics: MetricsInput) {
      updateUserActivity(clientId: $clientId, websiteId: $websiteId, metrics: $metrics) {
        id
        clientId
        websiteId
        lastActive
      }
    }
  `;
  
  const clientId = `test_client_${Date.now()}`;
  const variables = {
    clientId,
    websiteId: WEBSITE_ID,
    metrics: {
      scrollPercentage: 50,
      timeOnPage: 60,
      clickCount: 5
    }
  };
  
  const data = JSON.stringify({ query: mutation, variables });
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(API_ENDPOINT, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (result.data && result.data.updateUserActivity) {
            console.log('✅ updateUserActivity mutation successful!');
            console.log('Response:', JSON.stringify(result, null, 2));
          } else if (result.errors) {
            console.error('❌ GraphQL errors:', JSON.stringify(result.errors, null, 2));
          } else {
            console.error('❌ Unexpected response:', JSON.stringify(result, null, 2));
          }
          resolve(result);
        } catch (error) {
          console.error('❌ Error parsing response:', error.message);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Mutation request failed:', error.message);
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

async function runTests() {
  try {
    await testMongoDB();
    await testAppSync();
    await testUpdateActivity();
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
  }
}

runTests(); 