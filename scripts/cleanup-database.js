#!/usr/bin/env node

/**
 * Database cleanup script
 * 
 * This script cleans up the MongoDB database:
 * 1. Removes any test websites (example.com)
 * 2. Removes invalid API keys
 * 3. Ensures no duplicate API keys exist
 * 4. Makes API keys website-specific
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// MongoDB connection
const connectToDatabase = async () => {
  try {
    const connectionString = process.env.MONGODB_URI;
    if (!connectionString) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    await mongoose.connect(connectionString);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define Website schema for cleanup operations
const websiteSchema = new mongoose.Schema({
  name: String,
  domain: String,
  userId: mongoose.Schema.Types.ObjectId,
  apiKey: String,
  status: String,
  verification: {
    status: String,
    method: String,
    token: String,
    verifiedAt: String,
    attempts: Number,
  },
  apiKeys: [{
    id: String,
    key: String,
    name: String,
    allowedOrigins: [String],
    createdAt: String,
    lastUsed: String,
  }],
});

const Website = mongoose.models.Website || mongoose.model('Website', websiteSchema);

// Clean up database
const cleanupDatabase = async () => {
  console.log('Starting database cleanup...');

  // 1. Remove test websites (example.com and similar)
  const testWebsites = await Website.find({
    domain: { $regex: /example\.(com|org|net)$|test\.(com|org|net)$/ }
  });
  
  console.log(`Found ${testWebsites.length} test websites to remove`);
  
  if (testWebsites.length > 0) {
    await Website.deleteMany({
      domain: { $regex: /example\.(com|org|net)$|test\.(com|org|net)$/ }
    });
    console.log('Removed test websites');
  }

  // 2. Fix the API key schema issue - remove the old apiKey field and drop the index
  console.log('Updating schema to use website-specific API keys...');
  
  // Drop the problematic apiKey_1 index
  try {
    await mongoose.connection.db.collection('websites').dropIndex('apiKey_1');
    console.log('Successfully dropped the apiKey_1 index');
  } catch (error) {
    console.log('No apiKey_1 index found or error dropping index:', error.message);
  }
  
  const websitesWithOldApiKey = await Website.find({
    apiKey: { $exists: true }
  });
  
  console.log(`Found ${websitesWithOldApiKey.length} websites with old API key structure`);
  
  // Update each website to use the new model and remove the old apiKey field
  for (const website of websitesWithOldApiKey) {
    // We'll remove the apiKey field completely
    await Website.updateOne(
      { _id: website._id },
      { $unset: { apiKey: "" } }
    );
  }
  
  // 3. Fix any websites with null apiKeys by converting to empty array
  const fixNull = await Website.updateMany(
    { apiKeys: null },
    { $set: { apiKeys: [] } }
  );
  
  console.log(`Fixed ${fixNull.modifiedCount} websites with null apiKeys`);

  // 4. Update any existing schema/documents to the new structure
  try {
    // Add indexes for validation
    await mongoose.connection.db.collection('websites').createIndex(
      { 'apiKeys.key': 1 },
      { unique: true, sparse: true } // sparse ensures uniqueness only applies to documents that have the field
    );
    console.log('Added sparse unique index for apiKeys.key');
    
    // Create indexes for domain uniqueness per user
    await mongoose.connection.db.collection('websites').createIndex(
      { userId: 1, domain: 1 },
      { unique: true }
    );
    console.log('Added compound index for userId and domain');

    // 5. Fix websites missing verification tokens
    const websitesWithoutToken = await Website.find({
      $or: [
        { 'verification.token': { $exists: false } },
        { 'verification.token': null },
        { 'verification.token': '' }
      ]
    });

    console.log(`Found ${websitesWithoutToken.length} websites missing verification tokens`);

    for (const website of websitesWithoutToken) {
      const token = require('crypto').randomBytes(16).toString('hex');
      
      // Set default verification details if missing
      if (!website.verification) {
        website.verification = {
          status: 'pending',
          method: 'DNS',
          token: token,
          attempts: 0
        };
      } else {
        website.verification.token = token;
      }
      
      await Website.updateOne(
        { _id: website._id },
        { $set: { verification: website.verification } }
      );
    }
    
    console.log(`Fixed ${websitesWithoutToken.length} websites with missing verification tokens`);
  } catch (error) {
    console.error('Error updating database indexes:', error);
  }

  console.log('Database cleanup completed successfully!');
};

// Main function
const main = async () => {
  try {
    await connectToDatabase();
    await cleanupDatabase();
    
    console.log('All operations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
main(); 