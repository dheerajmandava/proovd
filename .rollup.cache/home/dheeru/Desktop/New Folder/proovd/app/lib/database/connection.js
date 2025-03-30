import mongoose from 'mongoose';
// Helper to debug MongoDB connections
const debugMongo = (message, ...args) => {
    if (process.env.MONGODB_DEBUG === 'true') {
        console.log(`[MongoDB Debug] ${message}`, ...args);
    }
};
// Set strictQuery to false to suppress deprecation warnings
mongoose.set('strictQuery', false);
// Initialize global object if it doesn't exist
global.mongooseConnection = global.mongooseConnection || {
    promise: null,
    connection: null,
    isConnecting: false,
    connectionError: null,
    lastConnectionAttempt: 0,
    connectionRetries: 0,
};
// Track the connection status
let isConnected = mongoose.connection.readyState === 1;
let connectionPromise = null;
let retryCount = 0;
const MAX_RETRIES = 5;
/**
 * Get the delay time for reconnection based on retry count using exponential backoff
 */
function getReconnectDelay(retryCount) {
    // Ensure retryCount is at least 0
    const count = Math.max(0, retryCount);
    // Start with 500ms and increase exponentially, max 30 seconds
    const base = 500;
    const maxDelay = 30 * 1000;
    // Calculate delay with random jitter to prevent synchronized retries
    const delay = Math.min(base * Math.pow(2, count) * (0.5 + Math.random()), maxDelay);
    console.log(`Calculated reconnect delay: ${delay}ms for retry ${count}`);
    return delay;
}
/**
 * Connect to MongoDB using a singleton pattern to ensure one connection is reused
 */
export async function connectToDatabase() {
    // Use existing connection if it's already established
    if (isConnected) {
        debugMongo('Reusing existing MongoDB connection');
        return;
    }
    // If a connection is in progress, wait for it to complete
    if (connectionPromise) {
        debugMongo('Connection already in progress, waiting...');
        await connectionPromise;
        return;
    }
    // Check if we have a connection URI
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        throw new Error('Please define the MONGODB_URI environment variable');
    }
    // Create a promise for the connection attempt
    connectionPromise = (async () => {
        try {
            // Return if we're already connected (double-check in case status changed)
            if (mongoose.connection.readyState === 1) {
                isConnected = true;
                debugMongo('Already connected to MongoDB');
                return;
            }
            console.log(`Connecting to MongoDB (attempt ${retryCount + 1})...`);
            // Define connection options with appropriate timeouts
            const options = {
                connectTimeoutMS: 30000,
                socketTimeoutMS: 60000,
                serverSelectionTimeoutMS: 30000,
                maxPoolSize: 50, // Increased from 20 to 50
            };
            // Connect to MongoDB
            await mongoose.connect(MONGODB_URI, options);
            // Set connection status
            isConnected = true;
            // Reset retry count on successful connection
            retryCount = 0;
            // Monitor connection pool
            mongoose.connection.on('connected', () => {
                console.log('Mongoose connected to DB');
                isConnected = true;
            });
            mongoose.connection.on('error', (err) => {
                console.log('Mongoose connection error: ' + err);
                isConnected = false;
            });
            mongoose.connection.on('disconnected', () => {
                console.log('Mongoose disconnected');
                isConnected = false;
            });
            // Log the current connection stats
            const logConnectionStats = () => {
                if (mongoose.connection.readyState === 1) {
                    const stats = mongoose.connection.db.admin().serverStatus();
                    stats.then((data) => {
                        console.log('Current MongoDB connections:');
                        console.log('- Current: ', data.connections.current);
                        console.log('- Available: ', data.connections.available);
                        console.log('- Active: ', data.connections.active);
                    }).catch(err => {
                        console.error('Error getting MongoDB stats:', err);
                    });
                }
            };
            // Schedule regular logging of connection stats if debug is enabled
            if (process.env.MONGODB_DEBUG === 'true') {
                setInterval(logConnectionStats, 60000); // Log every minute in debug mode
                // Initial log
                setTimeout(logConnectionStats, 5000);
            }
            console.log('Connected to MongoDB');
        }
        catch (error) {
            console.error('MongoDB connection error:', error);
            // Increment retry count
            retryCount++;
            isConnected = false;
            if (retryCount <= MAX_RETRIES) {
                const delay = getReconnectDelay(retryCount);
                console.log(`Retrying connection in ${delay}ms (attempt ${retryCount} of ${MAX_RETRIES})...`);
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay));
                // Clear the connection promise so a new attempt can be made
                connectionPromise = null;
                // Try to connect again
                await connectToDatabase();
            }
            else {
                console.error(`Failed to connect after ${MAX_RETRIES} attempts`);
                throw error;
            }
        }
        finally {
            // Clear the connection promise
            connectionPromise = null;
        }
    })();
    // Wait for the connection attempt to complete
    await connectionPromise;
}
/**
 * Wrap a function with database connection handling
 */
export async function withDatabaseConnection(operation) {
    try {
        // Ensure database is connected
        await connectToDatabase();
        // Execute the operation
        return await operation();
    }
    catch (error) {
        console.error('Error during database operation:', error);
        // If the error is related to a connection issue, try to reconnect for future operations
        if (error instanceof Error &&
            (error.name === 'MongooseServerSelectionError' ||
                error.name === 'MongooseConnectionError' ||
                error.name === 'ConnectionTimeoutError' ||
                (error.message && error.message.includes('connection')))) {
            isConnected = false;
            console.log('Resetting database connection status for future operations');
        }
        throw error;
    }
}
/**
 * Get the mongoose connection instance for direct access
 */
export function getMongooseConnection() {
    return mongoose.connection;
}
/**
 * Close database connection (useful for tests and cleanup)
 */
export async function disconnectFromDatabase() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        isConnected = false;
        console.log('Disconnected from MongoDB');
    }
}
// Handle process termination gracefully
process.on('SIGINT', async () => {
    try {
        await disconnectFromDatabase();
        console.log('MongoDB connection closed due to application termination');
        process.exit(0);
    }
    catch (error) {
        console.error('Error during database disconnection:', error);
        process.exit(1);
    }
});
// Export the mongoose instance for use in other files
export { mongoose };
