const { MongoClient, ObjectId } = require('mongodb');

let cachedDb = null;
let client = null;

// Function to establish a MongoDB connection
async function connectToDatabase() {
  console.log('Attempting to connect to MongoDB...');
  
  if (cachedDb && client.isConnected && client.isConnected()) {
    console.log('Using cached MongoDB connection');
    return { db: cachedDb, client };
  }

  // Get the MongoDB connection string from environment variables
  // or use a fallback for testing
  const uri = process.env.MONGODB_URI || 'mongodb+srv://test:test@cluster0.qh719.mongodb.net/proovd?retryWrites=true&w=majority&appName=Cluster0&socketTimeoutMS=30000&connectTimeoutMS=30000&serverSelectionTimeoutMS=15000';
  const dbName = process.env.MONGODB_DB || 'proovd';
  
  console.log('Connecting with database:', dbName);
  
  try {
    console.log('Creating new MongoDB connection...');
    client = await MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 15000
    });
    
    cachedDb = client.db(dbName);
    console.log('MongoDB connection successful');
    return { db: cachedDb, client };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Lambda resolver for AppSync updateUserActivity mutation
 * This function will:
 * 1. Connect to MongoDB
 * 2. Find an existing user session or create a new one
 * 3. Update the session with new metrics data
 * 4. Return the updated session
 */
exports.handler = async (event) => {
  try {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    // Extract parameters from the GraphQL mutation
    const { clientId, websiteId, metrics } = event.arguments;
    
    console.log('Parameters:', { clientId, websiteId, metrics });
    
    if (!clientId || !websiteId) {
      console.error('Missing required parameters:', { clientId, websiteId });
      return {
        error: 'Missing required parameters: clientId or websiteId'
      };
    }
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    let db;
    try {
      const result = await connectToDatabase();
      db = result.db;
      console.log('Connected to MongoDB successfully');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      return {
        id: 'error',
        clientId: clientId,
        websiteId: websiteId,
        lastActive: new Date().toISOString(),
        error: `Database connection failed: ${error.message}`
      };
    }
    
    // Get the UserSessions collection
    const userSessionsCollection = db.collection('usersessions');
    console.log('Accessing usersessions collection');
    
    // Get current timestamp
    const now = new Date();
    const timestamp = Math.floor(now.getTime() / 1000);
    
    // Try to find an existing session
    console.log('Finding existing session for:', { clientId, websiteId });
    let session;
    try {
      session = await userSessionsCollection.findOne({
        clientId,
        websiteId
      });
      console.log('Existing session found:', !!session);
    } catch (findError) {
      console.error('Error finding session:', findError);
      // Continue with a new session
    }
    
    // If no session exists, create a new one
    if (!session) {
      console.log('Creating new session');
      const newSession = {
        clientId,
        websiteId,
        firstActive: now,
        lastActive: now,
        lastActiveTimestamp: timestamp,
        metrics: metrics || {
          scrollPercentage: 0,
          timeOnPage: 0,
          clickCount: 0
        },
        isActive: true
      };
      
      console.log('New session data:', newSession);
      try {
        const result = await userSessionsCollection.insertOne(newSession);
        console.log('Session created with ID:', result.insertedId);
        
        session = {
          ...newSession,
          id: result.insertedId.toString(),
          _id: result.insertedId
        };
      } catch (insertError) {
        console.error('Error creating session:', insertError);
        return {
          id: 'error',
          clientId: clientId,
          websiteId: websiteId,
          lastActive: timestamp,
          error: `Failed to create session: ${insertError.message}`
        };
      }
    } else {
      // Update the existing session
      console.log('Updating existing session:', session._id);
      const updates = {
        lastActive: now,
        lastActiveTimestamp: timestamp,
        isActive: true
      };
      
      // If metrics were provided, update them
      if (metrics) {
        updates.metrics = metrics;
      }
      
      console.log('Updates to apply:', updates);
      
      try {
        await userSessionsCollection.updateOne(
          { _id: new ObjectId(session._id) },
          { $set: updates }
        );
        
        console.log('Session updated successfully');
        
        session = {
          ...session,
          ...updates,
          id: session._id.toString()
        };
      } catch (updateError) {
        console.error('Error updating session:', updateError);
        return {
          id: session._id.toString(),
          clientId: session.clientId,
          websiteId: session.websiteId,
          lastActive: timestamp,
          error: `Failed to update session: ${updateError.message}`
        };
      }
    }
    
    // After updating/creating the session, update the website stats
    console.log('Updating website stats for websiteId:', websiteId);
    try {
      await updateWebsiteStats(db, websiteId);
    } catch (statsError) {
      console.error('Error updating website stats:', statsError);
      // Continue despite stats error
    }
    
    // Return the session data
    const response = {
      id: session.id || session._id.toString(),
      clientId: session.clientId,
      websiteId: session.websiteId,
      lastActive: timestamp
    };
    
    console.log('Returning response:', response);
    return response;
  } catch (error) {
    console.error('Error in updateUserActivity resolver:', error);
    
    return {
      id: 'error',
      clientId: event.arguments?.clientId || 'unknown',
      websiteId: event.arguments?.websiteId || 'unknown',
      lastActive: Math.floor(new Date().getTime() / 1000),
      error: error.message || 'Unknown error occurred'
    };
  }
};

/**
 * Update website statistics based on active sessions
 */
async function updateWebsiteStats(db, websiteId) {
  try {
    console.log('Starting updateWebsiteStats for websiteId:', websiteId);
    
    // Get collections
    const userSessionsCollection = db.collection('usersessions');
    const websiteStatsCollection = db.collection('websitestats');
    
    // Calculate cutoff time (5 minutes ago)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    // Count active sessions in last 5 minutes
    console.log('Finding active sessions from the last 5 minutes');
    const activeSessions = await userSessionsCollection.find({
      websiteId,
      lastActive: { $gte: fiveMinutesAgo }
    }).toArray();
    
    console.log('Found active sessions:', activeSessions.length);
    
    const activeUsers = activeSessions.length;
    
    // Calculate average metrics
    let totalScrollPercentage = 0;
    let totalTimeOnPage = 0;
    let totalClicks = 0;
    
    // Process location data
    const usersByCountry = {};
    const usersByCity = {};
    
    activeSessions.forEach(session => {
      if (session.metrics) {
        totalScrollPercentage += session.metrics.scrollPercentage || 0;
        totalTimeOnPage += session.metrics.timeOnPage || 0;
        totalClicks += session.metrics.clickCount || 0;
      }
      
      // Process location data if available
      if (session.location) {
        const country = session.location.country || 'Unknown';
        const city = session.location.city || 'Unknown';
        
        usersByCountry[country] = (usersByCountry[country] || 0) + 1;
        usersByCity[city] = (usersByCity[city] || 0) + 1;
      }
    });
    
    const avgScrollPercentage = activeUsers > 0 ? Math.round(totalScrollPercentage / activeUsers) : 0;
    const avgTimeOnPage = activeUsers > 0 ? Math.round(totalTimeOnPage / activeUsers) : 0;
    
    console.log('Calculated metrics:', {
      activeUsers,
      avgScrollPercentage,
      avgTimeOnPage,
      totalClicks,
      countries: Object.keys(usersByCountry).length,
      cities: Object.keys(usersByCity).length
    });
    
    // Find or create website stats document
    console.log('Looking for existing stats document');
    const statsDoc = await websiteStatsCollection.findOne({ websiteId });
    
    const statsUpdate = {
      websiteId,
      activeUsers,
      avgScrollPercentage,
      avgTimeOnPage,
      totalClicks,
      usersByCountry: JSON.stringify(usersByCountry),
      usersByCity: JSON.stringify(usersByCity),
      updatedAt: new Date()
    };
    
    if (statsDoc) {
      console.log('Updating existing stats document');
      // Update existing stats
      await websiteStatsCollection.updateOne(
        { websiteId },
        { $set: statsUpdate }
      );
    } else {
      console.log('Creating new stats document');
      // Create new stats document
      await websiteStatsCollection.insertOne({
        ...statsUpdate,
        createdAt: new Date()
      });
    }
    
    console.log('Stats document updated successfully');
    
    // Return stats for subscription
    return {
      id: websiteId,
      activeUsers,
      avgScrollPercentage,
      avgTimeOnPage,
      totalClicks,
      usersByCountry: JSON.stringify(usersByCountry),
      usersByCity: JSON.stringify(usersByCity)
    };
  } catch (error) {
    console.error('Error updating website stats:', error);
    throw error;
  }
} 