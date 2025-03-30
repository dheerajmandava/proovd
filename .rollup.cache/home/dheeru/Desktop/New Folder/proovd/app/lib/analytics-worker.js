/**
 * Analytics Worker Module
 *
 * This module handles background processing of analytics data to improve
 * dashboard performance by pre-calculating statistics.
 */
import { connectToDatabase } from './database/connection';
import Website from './models/website';
import Notification from './models/notification';
import Metric from './models/metric';
/**
 * Pre-calculate website statistics and store for faster dashboard loading
 */
export async function calculateWebsiteStats(websiteId) {
    try {
        await connectToDatabase();
        // Get all active websites, or specific one if ID provided
        const query = websiteId ? { _id: websiteId, status: 'active' } : { status: 'active' };
        const websites = await Website.find(query);
        console.log(`Processing stats for ${websites.length} websites`);
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        // Process each website
        for (const website of websites) {
            // Get base metrics
            const baseQuery = {
                siteId: website._id,
                isBot: false
            };
            // Get total metrics (all time)
            const totalImpressions = await Metric.countDocuments(Object.assign(Object.assign({}, baseQuery), { type: 'impression' }));
            const totalUniqueImpressions = await Metric.countDocuments(Object.assign(Object.assign({}, baseQuery), { type: 'impression', isUnique: true }));
            const totalClicks = await Metric.countDocuments(Object.assign(Object.assign({}, baseQuery), { type: 'click' }));
            // Calculate time-based metrics
            const last24HoursQuery = Object.assign(Object.assign({}, baseQuery), { timestamp: { $gte: oneDayAgo } });
            const last24HoursImpressions = await Metric.countDocuments(Object.assign(Object.assign({}, last24HoursQuery), { type: 'impression' }));
            const last24HoursUniqueImpressions = await Metric.countDocuments(Object.assign(Object.assign({}, last24HoursQuery), { type: 'impression', isUnique: true }));
            const last24HoursClicks = await Metric.countDocuments(Object.assign(Object.assign({}, last24HoursQuery), { type: 'click' }));
            // Last 7 days
            const last7DaysQuery = Object.assign(Object.assign({}, baseQuery), { timestamp: { $gte: sevenDaysAgo } });
            const last7DaysImpressions = await Metric.countDocuments(Object.assign(Object.assign({}, last7DaysQuery), { type: 'impression' }));
            const last7DaysUniqueImpressions = await Metric.countDocuments(Object.assign(Object.assign({}, last7DaysQuery), { type: 'impression', isUnique: true }));
            const last7DaysClicks = await Metric.countDocuments(Object.assign(Object.assign({}, last7DaysQuery), { type: 'click' }));
            // Last 30 days
            const last30DaysQuery = Object.assign(Object.assign({}, baseQuery), { timestamp: { $gte: thirtyDaysAgo } });
            const last30DaysImpressions = await Metric.countDocuments(Object.assign(Object.assign({}, last30DaysQuery), { type: 'impression' }));
            const last30DaysUniqueImpressions = await Metric.countDocuments(Object.assign(Object.assign({}, last30DaysQuery), { type: 'impression', isUnique: true }));
            const last30DaysClicks = await Metric.countDocuments(Object.assign(Object.assign({}, last30DaysQuery), { type: 'click' }));
            // Calculate conversion rates (safely handle division by zero)
            const calculateConversionRate = (clicks, impressions) => {
                if (impressions === 0)
                    return '0.00';
                return ((clicks / impressions) * 100).toFixed(2);
            };
            const stats = {
                totalImpressions,
                totalUniqueImpressions,
                totalClicks,
                conversionRate: calculateConversionRate(totalClicks, totalImpressions),
                metrics: {
                    last24Hours: {
                        impressions: last24HoursImpressions,
                        uniqueImpressions: last24HoursUniqueImpressions,
                        clicks: last24HoursClicks,
                        conversionRate: calculateConversionRate(last24HoursClicks, last24HoursImpressions)
                    },
                    last7Days: {
                        impressions: last7DaysImpressions,
                        uniqueImpressions: last7DaysUniqueImpressions,
                        clicks: last7DaysClicks,
                        conversionRate: calculateConversionRate(last7DaysClicks, last7DaysImpressions)
                    },
                    last30Days: {
                        impressions: last30DaysImpressions,
                        uniqueImpressions: last30DaysUniqueImpressions,
                        clicks: last30DaysClicks,
                        conversionRate: calculateConversionRate(last30DaysClicks, last30DaysImpressions)
                    }
                },
                lastUpdated: now
            };
            // Update website with calculated stats
            await Website.updateOne({ _id: website._id }, {
                $set: {
                    cachedStats: stats
                }
            });
            console.log(`Updated stats for website ${website._id}`);
        }
        return { success: true, message: `Processed stats for ${websites.length} websites` };
    }
    catch (error) {
        console.error('Error calculating website stats:', error);
        return { success: false, error: 'Failed to calculate website stats' };
    }
}
/**
 * Calculate notification-level statistics
 */
export async function calculateNotificationStats(websiteId) {
    try {
        await connectToDatabase();
        // Get all active notifications, or for specific website if ID provided
        const query = websiteId ? { siteId: websiteId, status: 'active' } : { status: 'active' };
        const notifications = await Notification.find(query);
        console.log(`Processing stats for ${notifications.length} notifications`);
        // Process each notification
        for (const notification of notifications) {
            // Get base metrics for this notification
            const baseQuery = {
                notificationId: notification._id,
                isBot: false
            };
            // Get total metrics
            const totalImpressions = await Metric.countDocuments(Object.assign(Object.assign({}, baseQuery), { type: 'impression' }));
            const totalUniqueImpressions = await Metric.countDocuments(Object.assign(Object.assign({}, baseQuery), { type: 'impression', isUnique: true }));
            const totalClicks = await Metric.countDocuments(Object.assign(Object.assign({}, baseQuery), { type: 'click' }));
            // Calculate conversion rate (safely handle division by zero)
            const conversionRate = totalImpressions === 0
                ? 0
                : parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2));
            // Update notification with accurate counts
            await Notification.updateOne({ _id: notification._id }, {
                $set: {
                    displayCount: totalImpressions,
                    uniqueImpressionCount: totalUniqueImpressions,
                    clickCount: totalClicks,
                    conversionRate
                }
            });
            console.log(`Updated stats for notification ${notification._id}`);
        }
        return { success: true, message: `Processed stats for ${notifications.length} notifications` };
    }
    catch (error) {
        console.error('Error calculating notification stats:', error);
        return { success: false, error: 'Failed to calculate notification stats' };
    }
}
/**
 * Run all background analytics processes
 */
export async function runAllAnalytics() {
    console.log('Starting analytics background processing...');
    await calculateWebsiteStats();
    await calculateNotificationStats();
    console.log('Completed analytics background processing');
}
// Export directly for serverless function execution
export default async function handler() {
    await runAllAnalytics();
    return { success: true };
}
