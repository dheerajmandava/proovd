#!/usr/bin/env node

/**
 * Stale website cleanup script
 * 
 * This script cleans up websites that:
 * 1. Remain in 'pending' status for too long
 * 2. Have failed verification multiple times
 * 3. Are inactive and have not been updated
 * 
 * This script should be run periodically (e.g., via cron job)
 */

const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

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
    verifiedAt: Date,
    attempts: Number,
  },
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

// Add the collection name explicitly
const Website = mongoose.model('Website', websiteSchema, 'websites');

// Stale website cleanup
const cleanupStaleWebsites = async () => {
  const STALE_THRESHOLD_DAYS = 30; // Websites inactive for 30+ days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - STALE_THRESHOLD_DAYS);
  
  console.log(`Looking for websites inactive since: ${cutoffDate.toISOString()}`);

  // 1. Remove pending websites that haven't been verified for a long time
  const stalePendingWebsites = await Website.find({
    status: 'pending',
    createdAt: { $lt: cutoffDate }
  });
  
  console.log(`Found ${stalePendingWebsites.length} stale pending websites`);
  
  if (stalePendingWebsites.length > 0) {
    const pendingResult = await Website.deleteMany({
      status: 'pending',
      createdAt: { $lt: cutoffDate }
    });
    
    console.log(`Removed ${pendingResult.deletedCount} stale pending websites`);
  }

  // 2. Find websites with repeated verification failures
  const failedWebsites = await Website.find({
    status: 'failed',
    'verification.attempts': { $gte: 5 },
    updatedAt: { $lt: cutoffDate }
  });
  
  console.log(`Found ${failedWebsites.length} websites with repeated verification failures`);
  
  // We don't automatically delete these but log them for manual review
  if (failedWebsites.length > 0) {
    console.log('Websites with repeated verification failures:');
    failedWebsites.forEach(website => {
      console.log(`- ID: ${website._id}, Domain: ${website.domain}, Attempts: ${website.verification.attempts}, Last update: ${website.updatedAt}`);
    });
  }

  // 3. Identify completely inactive websites (no activity, verified but inactive)
  const inactiveWebsites = await Website.find({
    status: 'verified',
    updatedAt: { $lt: cutoffDate },
    // Add additional criteria if needed, such as zero page views
  }).limit(100); // Limit to prevent processing too many at once
  
  console.log(`Found ${inactiveWebsites.length} inactive verified websites`);
  
  if (inactiveWebsites.length > 0) {
    console.log('Inactive verified websites:');
    // Just log them for now, don't delete automatically
    inactiveWebsites.forEach(website => {
      console.log(`- ID: ${website._id}, Domain: ${website.domain}, Last update: ${website.updatedAt}`);
    });
  }

  console.log('Stale website cleanup completed successfully!');
};

// Main function
const main = async () => {
  try {
    await connectToDatabase();
    await cleanupStaleWebsites();
    
    console.log('All cleanup operations completed!');
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