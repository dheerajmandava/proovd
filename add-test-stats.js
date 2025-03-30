// Script to add test data to MongoDB for the ProovdPulse widget
// Run this script once to ensure data appears in the widget
const { MongoClient } = require('mongodb');

// Configuration
const MONGODB_URI = 'mongodb+srv://test:test@cluster0.qh719.mongodb.net/proovd?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_DB = 'proovd';
const WEBSITE_ID = '67e0e2226fd66457ee2d2549'; // Your website ID

async function addTestData() {
  let client;
  try {
    console.log('Connecting to MongoDB...');
    client = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 15000
    });
    
    console.log('Connected to MongoDB successfully!');
    const db = client.db(MONGODB_DB);
    
    // Add dummy sessions
    const usersessions = db.collection('usersessions');
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    // Create or update 5 sample sessions
    for (let i = 1; i <= 5; i++) {
      const sessionId = `test_session_${i}`;
      const update = {
        clientId: `test_client_${i}`,
        websiteId: WEBSITE_ID,
        firstActive: fiveMinutesAgo,
        lastActive: now,
        lastActiveTimestamp: Math.floor(now.getTime() / 1000),
        metrics: {
          scrollPercentage: Math.floor(Math.random() * 100),
          timeOnPage: Math.floor(Math.random() * 180 + 30),
          clickCount: Math.floor(Math.random() * 10)
        },
        isActive: true,
        location: {
          country: 'India',
          city: 'Mumbai',
          region: 'Maharashtra'
        }
      };
      
      await usersessions.updateOne(
        { clientId: update.clientId, websiteId: update.websiteId },
        { $set: update },
        { upsert: true }
      );
      
      console.log(`Added/updated test session ${i}`);
    }
    
    // Calculate stats
    console.log('Calculating website stats...');
    
    const sessions = await usersessions.find({
      websiteId: WEBSITE_ID,
      lastActive: { $gte: fiveMinutesAgo }
    }).toArray();
    
    console.log(`Found ${sessions.length} active sessions`);
    
    // Aggregate metrics
    let totalScrollPercentage = 0;
    let totalTimeOnPage = 0;
    let totalClicks = 0;
    
    // Process location data
    const usersByCountry = {};
    const usersByCity = {};
    
    sessions.forEach(session => {
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
    
    const activeUsers = sessions.length;
    const avgScrollPercentage = activeUsers > 0 ? Math.round(totalScrollPercentage / activeUsers) : 0;
    const avgTimeOnPage = activeUsers > 0 ? Math.round(totalTimeOnPage / activeUsers) : 0;
    
    console.log('Stats calculated:', {
      activeUsers,
      avgScrollPercentage,
      avgTimeOnPage,
      totalClicks
    });
    
    // Update website stats
    const websitestats = db.collection('websitestats');
    
    const statsUpdate = {
      websiteId: WEBSITE_ID,
      activeUsers,
      avgScrollPercentage,
      avgTimeOnPage,
      totalClicks,
      usersByCountry: JSON.stringify(usersByCountry),
      usersByCity: JSON.stringify(usersByCity),
      updatedAt: new Date()
    };
    
    await websitestats.updateOne(
      { websiteId: WEBSITE_ID },
      { $set: statsUpdate },
      { upsert: true }
    );
    
    console.log('Website stats updated successfully!');
    console.log('Done! Your ProovdPulse widget should now show activity.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the function
addTestData().catch(console.error);

/*
USAGE INSTRUCTIONS:

1. Run this script with Node.js:
   node add-test-stats.js

2. It will add test data directly to your MongoDB
   so your widget will show activity immediately.

3. If you need to customize the WEBSITE_ID:
   - Edit this file and change the WEBSITE_ID value
   - Run the script again

This is a one-time operation to ensure your widget
displays data while you troubleshoot the Lambda function.
*/ 