import mongoose from 'mongoose';



// Helper to debug MongoDB connections
const debugMongo = (message: string, ...args: any[]) => {
  if (process.env.MONGODB_DEBUG === 'true') {
    console.log(`[MongoDB Debug] ${message}`, ...args);
  }
};


// Set strictQuery to false to suppress deprecation warnings
mongoose.set('strictQuery', false);

// Cache connection
let cachedConnection: { isConnected?: number; db?: any; client?: any } = {};

// Connection options with improved parameters
const connectionOptions = {
  bufferCommands: true,
  autoIndex: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  family: 4,
  connectTimeoutMS: 30000,
};

export async function connectToDatabase() {
  // If already connected, use the existing connection
  if (cachedConnection.isConnected) {
    debugMongo('Using existing connection', {
      connectionState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    });
    return { db: mongoose.connection.db, client: mongoose.connection.getClient() };
  }

  try {
    // Get MongoDB URI from environment with fallback
    const MONGODB_URI = process.env.MONGODB_URI;
    
    const dbName = process.env.MONGODB_DB;
    
    debugMongo('Connecting to MongoDB...', {
      uri: MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'), // Hide credentials in logs
      dbName: dbName,
      options: connectionOptions,
    });

    // Enable mongoose debug mode if debug is enabled
    if (process.env.MONGODB_DEBUG === 'true') {
      mongoose.set('debug', true);
    }

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      ...connectionOptions,
      dbName: dbName,
    });

    const connection = mongoose.connection;
    
    // Log connected state
    debugMongo('MongoDB connected successfully', {
      connectionState: connection.readyState,
      host: connection.host,
      port: connection.port,
      name: connection.name,
    });

    // List all collections in the database
    const collections = await connection.db.listCollections().toArray();
    debugMongo('Available collections:', collections.map(c => c.name));

    // Update cache
    cachedConnection.isConnected = connection.readyState;
    cachedConnection.db = connection.db;
    cachedConnection.client = connection.getClient();

    // Return connection
    return { db: connection.db, client: connection.getClient() };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Utility to log connection status
export function getConnectionStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized',
  };
  
  const status = {
    readyState: mongoose.connection.readyState,
    readyStateText: states[mongoose.connection.readyState as keyof typeof states] || 'unknown',
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    models: Object.keys(mongoose.models),
  };
  
  debugMongo('Current connection status:', status);
  return status;
}

// Safely disconnect from MongoDB
export async function disconnectFromDatabase() {
  try {
    await mongoose.disconnect();
    cachedConnection = {};
    debugMongo('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
}

// Export the mongoose instance for use in other files
export { mongoose }; 