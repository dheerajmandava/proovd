const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    // Get all website IDs
    const websitesResponse = await documentClient.scan({
      TableName: process.env.WEBSITE_TABLE_NAME,
      ProjectionExpression: "id"
    }).promise();
    
    const websites = websitesResponse.Items || [];
    console.log(`Found ${websites.length} websites to update`);
    
    // For each website, update stats
    for (const website of websites) {
      await updateStatsForWebsite(website.id);
    }
    
    return { 
      statusCode: 200,
      body: JSON.stringify({ 
        status: 'success',
        websitesUpdated: websites.length
      }) 
    };
  } catch (error) {
    console.error('Error updating website stats:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function updateStatsForWebsite(websiteId) {
  try {
    console.log(`Updating stats for website: ${websiteId}`);
    
    // Get active sessions from the last 5 minutes
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutesAgo = now - 300;
    
    // Query active sessions
    const sessionsResponse = await documentClient.query({
      TableName: process.env.USERSESSION_TABLE,
      IndexName: "byWebsite",
      KeyConditionExpression: "websiteId = :websiteId",
      FilterExpression: "lastActive >= :fiveMinutesAgo",
      ExpressionAttributeValues: {
        ":websiteId": websiteId,
        ":fiveMinutesAgo": fiveMinutesAgo
      }
    }).promise();
    
    const sessions = sessionsResponse.Items || [];
    console.log(`Found ${sessions.length} active sessions for website ${websiteId}`);
    
    // Calculate stats
    const activeUsers = Math.max(1, sessions.length);
    
    // User locations
    const countryMap = {};
    const cityMap = {};
    let totalTimeOnPage = 0;
    let totalScrollPercentage = 0;
    let totalClicks = 0;
    
    sessions.forEach(session => {
      // Count locations
      if (session.location?.country_code) {
        countryMap[session.location.country_code] = 
          (countryMap[session.location.country_code] || 0) + 1;
      }
      if (session.location?.city) {
        cityMap[session.location.city] = 
          (cityMap[session.location.city] || 0) + 1;
      }
      
      // Aggregate metrics
      totalTimeOnPage += (session.metrics?.timeOnPage || 0);
      totalScrollPercentage += (session.metrics?.scrollPercentage || 0);
      totalClicks += (session.metrics?.clickCount || 0);
    });
    
    // Calculate averages
    const avgTimeOnPage = activeUsers > 0 ? Math.round(totalTimeOnPage / activeUsers) : 0;
    const avgScrollPercentage = activeUsers > 0 ? Math.round(totalScrollPercentage / activeUsers) : 0;
    
    // Update website stats
    const websiteStats = {
      id: websiteId,
      activeUsers,
      usersByCountry: JSON.stringify(countryMap),
      usersByCity: JSON.stringify(cityMap),
      avgTimeOnPage,
      avgScrollPercentage,
      totalClicks
    };
    
    await documentClient.put({
      TableName: process.env.WEBSITESTATS_TABLE,
      Item: websiteStats
    }).promise();
    
    console.log(`Successfully updated stats for website ${websiteId}`);
    return websiteStats;
  } catch (error) {
    console.error(`Error updating stats for website ${websiteId}:`, error);
    return null;
  }
} 