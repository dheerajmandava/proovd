#!/usr/bin/env node

/**
 * Empty websites database script
 * 
 * This script deletes ALL websites from the database.
 * USE WITH CAUTION - THIS CANNOT BE UNDONE!
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

// Define Website schema
const websiteSchema = new mongoose.Schema({}, { strict: false });
const Website = mongoose.model('Website', websiteSchema, 'websites');

// Empty the websites collection
const emptyWebsitesCollection = async () => {
  console.log('⚠️  WARNING: This will delete ALL websites from the database! ⚠️');
  console.log('Waiting 5 seconds before proceeding...');
  
  // Wait 5 seconds to give a chance to cancel
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('Proceeding with deletion...');
  
  try {
    // Delete all documents from the websites collection
    const result = await Website.deleteMany({});
    console.log(`✅ Successfully deleted ${result.deletedCount} websites from the database`);
    return result.deletedCount;
  } catch (error) {
    console.error('❌ Error deleting websites:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    await connectToDatabase();
    await emptyWebsitesCollection();
    
    console.log('Operation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during operation:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
main(); 