#!/usr/bin/env node

/**
 * Database cleanup script
 * 
 * This script cleans up the MongoDB database:
 * 1. Removes any test websites (example.com)
 * 2. Updates website schema to remove API key fields
 * 3. Ensures proper verification tokens exist
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
  status: String,
  verification: {
    status: String,
    method: String,
    token: String,
    verifiedAt: String,
    attempts: Number,
  }
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

  // 2. Remove old API key fields from all websites
  console.log('Removing API key fields from websites...');
  
  try {
    // Remove the apiKey field if it exists
    const removeApiKeyField = await Website.updateMany(
      { apiKey: { $exists: true } },
      { $unset: { apiKey: "" } }
    );
    
    console.log(`Removed apiKey field from ${removeApiKeyField.modifiedCount} websites`);
    
    // Remove the apiKeys array if it exists
    const removeApiKeysArray = await Website.updateMany(
      { apiKeys: { $exists: true } },
      { $unset: { apiKeys: "" } }
    );
    
    console.log(`Removed apiKeys array from ${removeApiKeysArray.modifiedCount} websites`);
    
    // Try to drop any API key related indexes
    try {
      await mongoose.connection.db.collection('websites').dropIndex('apiKey_1');
      console.log('Successfully dropped the apiKey_1 index');
    } catch (error) {
      console.log('No apiKey_1 index found or error dropping index:', error.message);
    }
    
    try {
      await mongoose.connection.db.collection('websites').dropIndex('apiKeys.key_1');
      console.log('Successfully dropped the apiKeys.key_1 index');
    } catch (error) {
      console.log('No apiKeys.key_1 index found or error dropping index:', error.message);
    }
  } catch (error) {
    console.error('Error removing API key fields:', error);
  }

  // 3. Update existing schema/documents to the proper structure
  try {
    // Create indexes for domain uniqueness per user
    await mongoose.connection.db.collection('websites').createIndex(
      { userId: 1, domain: 1 },
      { unique: true }
    );
    console.log('Added compound index for userId and domain');

    // 4. Fix websites missing verification tokens
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
    console.error('Error updating database structure:', error);
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