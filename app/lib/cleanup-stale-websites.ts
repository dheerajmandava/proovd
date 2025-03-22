import { connectToDatabase } from './db';
import Website from './models/website';

/**
 * Cleanup threshold in days - websites that remain in 'pending' status
 * longer than this will be considered stale/abandoned
 */
const STALE_WEBSITE_THRESHOLD_DAYS = 30;

/**
 * Finds and removes stale websites that have been in 'pending' status
 * for longer than the threshold period.
 * 
 * This function should be called periodically via a scheduled job.
 */
export async function cleanupStaleWebsites() {
  console.log('Starting stale website cleanup process');
  
  try {
    // Connect to database
    await connectToDatabase();
    
    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - STALE_WEBSITE_THRESHOLD_DAYS);
    
    // Find stale websites
    const staleWebsites = await Website.find({
      status: 'pending',
      createdAt: { $lt: cutoffDate }
    });
    
    console.log(`Found ${staleWebsites.length} stale websites to clean up`);
    
    if (staleWebsites.length === 0) {
      return { success: true, removed: 0 };
    }
    
    // Remove the stale websites
    const result = await Website.deleteMany({
      status: 'pending',
      createdAt: { $lt: cutoffDate }
    });
    
    console.log(`Successfully removed ${result.deletedCount} stale websites`);
    
    return {
      success: true,
      removed: result.deletedCount
    };
  } catch (error) {
    console.error('Error cleaning up stale websites:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * Finds websites with status 'failed' that repeatedly failed verification
 * and have not been updated for the threshold period.
 */
export async function identifyProblemWebsites() {
  console.log('Identifying problem websites with repeated verification failures');
  
  try {
    // Connect to database
    await connectToDatabase();
    
    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - STALE_WEBSITE_THRESHOLD_DAYS);
    
    // Find problem websites - those with:
    // 1. Failed status
    // 2. Multiple verification attempts
    // 3. No updates in the threshold period
    const problemWebsites = await Website.find({
      status: 'failed',
      'verification.attempts': { $gte: 3 },
      updatedAt: { $lt: cutoffDate }
    });
    
    console.log(`Found ${problemWebsites.length} problem websites`);
    
    // Return basic info about the problem websites
    return {
      success: true,
      count: problemWebsites.length,
      websites: problemWebsites.map(website => ({
        id: website._id,
        domain: website.domain,
        userId: website.userId,
        attempts: website.verification.attempts,
        lastUpdated: website.updatedAt
      }))
    };
  } catch (error) {
    console.error('Error identifying problem websites:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
} 