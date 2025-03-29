const { MongoClient, ObjectId } = require('mongodb');

let cachedDb = null;
let client = null;

// Function to establish a MongoDB connection
async function connectToDatabase() {
  console.log('Attempting to connect to MongoDB...');
  
  if (cachedDb && client.isConnected()) {
    console.log('Using cached MongoDB connection');
    return { db: cachedDb, client };
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  
  console.log('MONGODB_URI set:', !!uri);
  console.log('MONGODB_DB set:', !!dbName);
  
  if (!uri || !dbName) {
    console.error('Missing environment variables:', {
      MONGODB_URI: !!uri,
      MONGODB_DB: !!dbName
    });
    throw new Error('Missing MONGODB_URI or MONGODB_DB environment variables');
  }

  try {
    console.log('Creating new MongoDB connection...');
    client = await MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
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
    const { db } = await connectToDatabase();
    console.log('Connected to MongoDB');
    
    // Get the UserSessions collection
    const userSessionsCollection = db.collection('usersessions');
    console.log('Accessing usersessions collection');
    
    // Get current timestamp
    const now = new Date();
    
    // Try to find an existing session
    console.log('Finding existing session for:', { clientId, websiteId });
    let session = await userSessionsCollection.findOne({
      clientId,
      websiteId
    });
    
    console.log('Existing session found:', !!session);
    
    // If no session exists, create a new one
    if (!session) {
      console.log('Creating new session');
      const newSession = {
        clientId,
        websiteId,
        firstActive: now,
        lastActive: now,
        metrics: metrics || {
          scrollPercentage: 0,
          timeOnPage: 0,
          clickCount: 0
        },
        isActive: true
      };
      
      console.log('New session data:', newSession);
      const result = await userSessionsCollection.insertOne(newSession);
      console.log('Session created with ID:', result.insertedId);
      
      session = {
        ...newSession,
        id: result.insertedId.toString()
      };
    } else {
      // Update the existing session
      console.log('Updating existing session:', session._id);
      const updates = {
        lastActive: now,
        isActive: true
      };
      
      // If metrics were provided, update them
      if (metrics) {
        updates.metrics = metrics;
      }
      
      console.log('Updates to apply:', updates);
      
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
    }
    
    // After updating/creating the session, update the website stats
    console.log('Updating website stats for websiteId:', websiteId);
    await updateWebsiteStats(db, websiteId);
    
    // Return the session data
    const response = {
      id: session.id || session._id.toString(),
      clientId: session.clientId,
      websiteId: session.websiteId,
      lastActive: session.lastActive
    };
    
    console.log('Returning response:', response);
    return response;
  } catch (error) {
    console.error('Error in updateUserActivity resolver:', error);
    
    return {
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
    
    if (statsDoc) {
      console.log('Updating existing stats document');
      // Update existing stats
      await websiteStatsCollection.updateOne(
        { websiteId },
        {
          $set: {
            activeUsers,
            avgScrollPercentage,
            avgTimeOnPage,
            totalClicks,
            usersByCountry: JSON.stringify(usersByCountry),
            usersByCity: JSON.stringify(usersByCity),
            updatedAt: new Date()
          }
        }
      );
    } else {
      console.log('Creating new stats document');
      // Create new stats document
      await websiteStatsCollection.insertOne({
        websiteId,
        activeUsers,
        avgScrollPercentage,
        avgTimeOnPage,
        totalClicks,
        usersByCountry: JSON.stringify(usersByCountry),
        usersByCity: JSON.stringify(usersByCity),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log('Stats document updated successfully');
    
    // Publish to AppSync
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