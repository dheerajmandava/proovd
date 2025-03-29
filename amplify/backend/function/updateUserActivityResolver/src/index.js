const { MongoClient, ObjectId } = require('mongodb');

let cachedDb = null;
let client = null;

// Function to establish a MongoDB connection
async function connectToDatabase() {
  if (cachedDb && client.isConnected()) {
    return { db: cachedDb, client };
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  
  if (!uri || !dbName) {
    throw new Error('Missing MONGODB_URI or MONGODB_DB environment variables');
  }

  client = await MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  cachedDb = client.db(dbName);
  return { db: cachedDb, client };
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
    
    if (!clientId || !websiteId) {
      return {
        error: 'Missing required parameters: clientId or websiteId'
      };
    }
    
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    // Get the UserSessions collection
    const userSessionsCollection = db.collection('usersessions');
    
    // Get current timestamp
    const now = new Date();
    
    // Try to find an existing session
    let session = await userSessionsCollection.findOne({
      clientId,
      websiteId
    });
    
    // If no session exists, create a new one
    if (!session) {
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
      
      const result = await userSessionsCollection.insertOne(newSession);
      session = {
        ...newSession,
        id: result.insertedId.toString()
      };
    } else {
      // Update the existing session
      const updates = {
        lastActive: now,
        isActive: true
      };
      
      // If metrics were provided, update them
      if (metrics) {
        updates.metrics = metrics;
      }
      
      await userSessionsCollection.updateOne(
        { _id: new ObjectId(session._id) },
        { $set: updates }
      );
      
      session = {
        ...session,
        ...updates,
        id: session._id.toString()
      };
    }
    
    // After updating/creating the session, update the website stats
    await updateWebsiteStats(db, websiteId);
    
    // Return the session data
    return {
      id: session.id || session._id.toString(),
      clientId: session.clientId,
      websiteId: session.websiteId,
      lastActive: session.lastActive
    };
  } catch (error) {
    console.error('Error in updateUserActivity resolver:', error);
    
    return {
      error: error.message
    };
  }
};

/**
 * Update website statistics based on active sessions
 */
async function updateWebsiteStats(db, websiteId) {
  try {
    // Get collections
    const userSessionsCollection = db.collection('usersessions');
    const websiteStatsCollection = db.collection('websitestats');
    
    // Calculate cutoff time (5 minutes ago)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    // Count active sessions in last 5 minutes
    const activeSessions = await userSessionsCollection.find({
      websiteId,
      lastActive: { $gte: fiveMinutesAgo }
    }).toArray();
    
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
    
    // Find or create website stats document
    const statsDoc = await websiteStatsCollection.findOne({ websiteId });
    
    if (statsDoc) {
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