import { connectToDatabase, mongoose } from '../database/connection';
import Notification from '../models/notification';
import Metric from '../models/metric';
import { getMetricsTimeSeries as getMetricsTimeSeriesUtil, getTopNotifications as getTopNotificationsUtil } from '@/app/lib/analytics';
/**
 * Get summary metrics for a website
 * @param websiteId Website ID
 * @returns Summary metrics
 */
export async function getWebsiteMetricsSummary(websiteId) {
    if (!websiteId || !mongoose.Types.ObjectId.isValid(websiteId)) {
        return {
            totalImpressions: 0,
            totalClicks: 0,
            conversionRate: '0.00',
            totalNotifications: 0
        };
    }
    await connectToDatabase();
    // Get total impressions
    const totalImpressions = await Metric.countDocuments({
        siteId: websiteId,
        type: 'impression'
    });
    // Get total clicks
    const totalClicks = await Metric.countDocuments({
        siteId: websiteId,
        type: 'click'
    });
    // Calculate conversion rate
    const conversionRate = totalImpressions > 0
        ? ((totalClicks / totalImpressions) * 100).toFixed(2)
        : '0.00';
    // Get total notifications
    const totalNotifications = await Notification.countDocuments({
        siteId: websiteId
    });
    return {
        totalImpressions,
        totalClicks,
        conversionRate,
        totalNotifications
    };
}
/**
 * Get time series metrics for a website
 * @param websiteId Website ID
 * @param timeRange Time range (day, week, month, year)
 * @param groupBy Group by (hour, day, week, month)
 * @returns Time series data
 */
export async function getWebsiteTimeSeries(websiteId, timeRange = 'week', groupBy = 'day') {
    if (!websiteId || !mongoose.Types.ObjectId.isValid(websiteId)) {
        return [];
    }
    // Convert string ID to mongoose ObjectId
    const websiteObjectId = new mongoose.Types.ObjectId(websiteId);
    // Validate and convert timeRange
    const validTimeRange = ['day', 'week', 'month', 'year'].includes(timeRange)
        ? timeRange
        : 'week';
    // Validate and convert groupBy
    const validGroupBy = ['hour', 'day', 'week', 'month'].includes(groupBy)
        ? groupBy
        : 'day';
    return await getMetricsTimeSeriesUtil(websiteObjectId, validTimeRange, validGroupBy);
}
/**
 * Get top performing notifications for a website
 * @param websiteId Website ID
 * @param limit Maximum number of notifications to return
 * @returns Top notifications
 */
export async function getTopNotifications(websiteId, limit = 5) {
    if (!websiteId || !mongoose.Types.ObjectId.isValid(websiteId)) {
        return [];
    }
    // Convert string ID to mongoose ObjectId
    const websiteObjectId = new mongoose.Types.ObjectId(websiteId);
    return await getTopNotificationsUtil(websiteObjectId, limit);
}
/**
 * Get user analytics summary
 * @param userId User ID
 * @returns Summary data
 */
export async function getAnalyticsSummary(userId) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return {
            totalNotifications: 0,
            totalDisplays: 0,
            totalClicks: 0
        };
    }
    await connectToDatabase();
    // Get total notifications
    const totalNotifications = await Notification.countDocuments({ userId });
    // Get total displays and clicks
    const stats = await Notification.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                totalDisplays: { $sum: "$displays" },
                totalClicks: { $sum: "$clicks" }
            }
        }
    ]);
    const totalDisplays = stats.length > 0 ? stats[0].totalDisplays : 0;
    const totalClicks = stats.length > 0 ? stats[0].totalClicks : 0;
    return {
        totalNotifications,
        totalDisplays,
        totalClicks
    };
}
/**
 * Get notification type breakdown
 * @param userId User ID
 * @returns Array of notification types with counts
 */
export async function getNotificationTypeBreakdown(userId) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return [];
    }
    await connectToDatabase();
    // Get notification types breakdown
    const typeBreakdown = await Notification.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    return typeBreakdown;
}
/**
 * Get daily analytics data
 * @param userId User ID
 * @param days Number of days to include
 * @returns Daily analytics data
 */
export async function getAnalyticsDaily(userId, days = 7) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return [];
    }
    await connectToDatabase();
    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    // Get daily stats
    const dailyStats = await Notification.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                },
                displays: { $sum: "$displays" },
                clicks: { $sum: "$clicks" }
            }
        },
        { $sort: { _id: 1 } }
    ]);
    return dailyStats;
}
