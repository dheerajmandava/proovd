import { connectToDatabase, mongoose } from '../database/connection';
import Notification from '../models/notification';
import Metric from '../models/metric';
import { 
  getMetricsTimeSeries as getMetricsTimeSeriesUtil, 
  getTopNotifications as getTopNotificationsUtil 
} from '@/app/lib/analytics';
import { AnalyticsEvent, AnalyticsSummary } from '../models/analytics';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';

// Types from analytics.ts
type TimeRange = 'day' | 'week' | 'month' | 'year';
type GroupBy = 'hour' | 'day' | 'week' | 'month';

/**
 * Get summary metrics for a website
 * @param websiteId Website ID
 * @returns Summary metrics
 */
export async function getWebsiteMetricsSummary(websiteId: string): Promise<{
  totalImpressions: number;
  totalClicks: number;
  conversionRate: string;
  totalNotifications: number;
}> {
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
export async function getWebsiteTimeSeries(
  websiteId: string,
  timeRange: string = 'week',
  groupBy: string = 'day'
): Promise<any> {
  if (!websiteId || !mongoose.Types.ObjectId.isValid(websiteId)) {
    return [];
  }
  
  // Convert string ID to mongoose ObjectId
  const websiteObjectId = new mongoose.Types.ObjectId(websiteId);
  
  // Validate and convert timeRange
  const validTimeRange = ['day', 'week', 'month', 'year'].includes(timeRange) 
    ? timeRange as TimeRange 
    : 'week';
    
  // Validate and convert groupBy
  const validGroupBy = ['hour', 'day', 'week', 'month'].includes(groupBy) 
    ? groupBy as GroupBy 
    : 'day';
    
  return await getMetricsTimeSeriesUtil(websiteObjectId, validTimeRange, validGroupBy);
}

/**
 * Get top performing notifications for a website
 * @param websiteId Website ID
 * @param limit Maximum number of notifications to return
 * @returns Top notifications
 */
export async function getTopNotifications(
  websiteId: string,
  limit: number = 5
): Promise<any> {
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
export async function getAnalyticsSummary(userId: string): Promise<{
  totalNotifications: number;
  totalDisplays: number;
  totalClicks: number;
}> {
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
export async function getNotificationTypeBreakdown(userId: string): Promise<any[]> {
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
export async function getAnalyticsDaily(userId: string, days: number = 7): Promise<any[]> {
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

/**
 * Track an analytics event (impression or click)
 */
export async function trackEvent(data: {
  websiteId: string;
  notificationId: string;
  type: 'impression' | 'click';
  metadata?: {
    url?: string;
    referrer?: string;
    userAgent?: string;
    deviceType?: string;
    country?: string;
  };
}) {
  await connectToDatabase();

  // Create event
  const event = new AnalyticsEvent({
    websiteId: data.websiteId,
    notificationId: data.notificationId,
    type: data.type,
    metadata: data.metadata || {}
  });
  await event.save();

  // Update summaries
  await Promise.all([
    updateSummary('daily', data),
    updateSummary('weekly', data),
    updateSummary('monthly', data)
  ]);

  return event;
}

/**
 * Update analytics summary for a specific granularity
 */
async function updateSummary(
  granularity: 'daily' | 'weekly' | 'monthly',
  data: {
    websiteId: string;
    notificationId: string;
    type: 'impression' | 'click';
  }
) {
  // Get start of period based on granularity
  const now = new Date();
  const periodStart = {
    daily: startOfDay(now),
    weekly: startOfWeek(now),
    monthly: startOfMonth(now)
  }[granularity];

  // Find or create summary
  let summary = await AnalyticsSummary.findOne({
    websiteId: data.websiteId,
    date: periodStart,
    granularity
  });

  if (!summary) {
    summary = new AnalyticsSummary({
      websiteId: data.websiteId,
      date: periodStart,
      granularity,
      metrics: {
        impressions: 0,
        clicks: 0,
        uniqueImpressions: 0,
        uniqueClicks: 0,
        conversionRate: 0
      },
      notificationMetrics: []
    });
  }

  // Update metrics
  if (data.type === 'impression') {
    summary.metrics.impressions++;
  } else if (data.type === 'click') {
    summary.metrics.clicks++;
  }

  // Update conversion rate
  if (summary.metrics.impressions > 0) {
    summary.metrics.conversionRate = (summary.metrics.clicks / summary.metrics.impressions) * 100;
  }

  // Update notification metrics
  let notificationMetric = summary.notificationMetrics.find(
    m => m.notificationId.toString() === data.notificationId
  );

  if (!notificationMetric) {
    notificationMetric = {
      notificationId: new mongoose.Types.ObjectId(data.notificationId),
      impressions: 0,
      clicks: 0,
      conversionRate: 0
    };
    summary.notificationMetrics.push(notificationMetric);
  }

  if (data.type === 'impression') {
    notificationMetric.impressions++;
  } else if (data.type === 'click') {
    notificationMetric.clicks++;
  }

  if (notificationMetric.impressions > 0) {
    notificationMetric.conversionRate = (notificationMetric.clicks / notificationMetric.impressions) * 100;
  }

  await summary.save();
  return summary;
}

/**
 * Get analytics for a website
 */
export async function getWebsiteAnalytics(websiteId: string, options: {
  granularity: 'daily' | 'weekly' | 'monthly';
  startDate?: Date;
  endDate?: Date;
}) {
  await connectToDatabase();

  const { granularity, startDate, endDate } = options;

  // Default to last 30 days if no dates provided
  const end = endDate || new Date();
  const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  const summaries = await AnalyticsSummary.find({
    websiteId,
    granularity,
    date: { $gte: start, $lte: end }
  }).sort({ date: 1 });

  return summaries;
}

/**
 * Get analytics for a specific notification
 */
export async function getNotificationAnalytics(notificationId: string, options: {
  granularity: 'daily' | 'weekly' | 'monthly';
  startDate?: Date;
  endDate?: Date;
}) {
  await connectToDatabase();

  const { granularity, startDate, endDate } = options;

  // Default to last 30 days if no dates provided
  const end = endDate || new Date();
  const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  const summaries = await AnalyticsSummary.find({
    'notificationMetrics.notificationId': notificationId,
    granularity,
    date: { $gte: start, $lte: end }
  }).sort({ date: 1 });

  return summaries.map(summary => {
    const notificationMetric = summary.notificationMetrics.find(
      m => m.notificationId.toString() === notificationId
    );
    return {
      date: summary.date,
      metrics: notificationMetric || {
        impressions: 0,
        clicks: 0,
        conversionRate: 0
      }
    };
  });
}

/**
 * Get top performing notifications
 */
export async function getTopNotifications(websiteId: string, options: {
  metric: 'impressions' | 'clicks' | 'conversionRate';
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  await connectToDatabase();

  const { metric, limit = 10, startDate, endDate } = options;

  // Default to last 30 days if no dates provided
  const end = endDate || new Date();
  const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  const summaries = await AnalyticsSummary.aggregate([
    {
      $match: {
        websiteId: new mongoose.Types.ObjectId(websiteId),
        date: { $gte: start, $lte: end }
      }
    },
    { $unwind: '$notificationMetrics' },
    {
      $group: {
        _id: '$notificationMetrics.notificationId',
        impressions: { $sum: '$notificationMetrics.impressions' },
        clicks: { $sum: '$notificationMetrics.clicks' },
        conversionRate: { 
          $avg: '$notificationMetrics.conversionRate'
        }
      }
    },
    { $sort: { [metric]: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'notifications',
        localField: '_id',
        foreignField: '_id',
        as: 'notification'
      }
    },
    { $unwind: '$notification' }
  ]);

  return summaries;
} 