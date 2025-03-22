import mongoose from 'mongoose';

// MongoDB connection string from environment variable
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/socialproofify';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface GlobalWithMongoose {
  mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

// Declare a global variable
declare const global: GlobalWithMongoose;

// Initialize the global mongoose object if it doesn't exist
global.mongoose = global.mongoose || {
  conn: null,
  promise: null,
};

/**
 * Connect to MongoDB
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
export async function connectToDatabase(): Promise<mongoose.Connection> {
  if (global.mongoose.conn) {
    // Use existing database connection
    return global.mongoose.conn;
  }

  if (!global.mongoose.promise) {
    // Create new promise if not available
    const opts = {
      bufferCommands: false,
    };

    global.mongoose.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose.connection;
    });
  }

  // Wait for the connection to be established
  const conn = await global.mongoose.promise;
  global.mongoose.conn = conn;

  return conn;
}

/**
 * Disconnect from MongoDB
 * Mostly used for testing
 */
export async function disconnectFromDatabase(): Promise<void> {
  if (global.mongoose.conn) {
    await mongoose.disconnect();
    global.mongoose.conn = null;
    global.mongoose.promise = null;
  }
}

// Export the mongoose instance for use in other files
export { mongoose }; 