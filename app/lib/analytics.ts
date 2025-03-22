import mongoose from 'mongoose';
import Metric from './models/metric';

type TimeRange = 'day' | 'week' | 'month' | 'year';
type GroupBy = 'hour' | 'day' | 'week' | 'month';

/**
 * Get metrics aggregated by time period
 */
export async function getMetricsTimeSeries(
  siteId: mongoose.Types.ObjectId,
  timeRange: TimeRange = 'week',
  groupBy: GroupBy = 'day'
) {
  // Set date range
  const now = new Date();
  let startDate = new Date();
  
  switch (timeRange) {
    case 'day':
      startDate.setDate(now.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  // Determine the group format
  let groupFormat;
  let dateFormat;
  
  switch (groupBy) {
    case 'hour':
      groupFormat = { 
        year: { $year: '$timestamp' }, 
        month: { $month: '$timestamp' }, 
        day: { $dayOfMonth: '$timestamp' }, 
        hour: { $hour: '$timestamp' } 
      };
      dateFormat = '%Y-%m-%d %H:00';
      break;
    case 'day':
      groupFormat = { 
        year: { $year: '$timestamp' }, 
        month: { $month: '$timestamp' }, 
        day: { $dayOfMonth: '$timestamp' } 
      };
      dateFormat = '%Y-%m-%d';
      break;
    case 'week':
      groupFormat = { 
        year: { $year: '$timestamp' }, 
        week: { $week: '$timestamp' } 
      };
      dateFormat = '%Y-W%U';
      break;
    case 'month':
      groupFormat = { 
        year: { $year: '$timestamp' }, 
        month: { $month: '$timestamp' } 
      };
      dateFormat = '%Y-%m';
      break;
  }

  // Get impression metrics
  const impressions = await Metric.aggregate([
    { 
      $match: { 
        siteId, 
        type: 'impression',
        timestamp: { $gte: startDate, $lte: now }
      } 
    },
    {
      $group: {
        _id: groupFormat,
        count: { $sum: 1 },
        formattedDate: { $first: { $dateToString: { format: dateFormat, date: '$timestamp' } } }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 }
    },
    {
      $project: {
        _id: 0,
        date: '$formattedDate',
        count: 1
      }
    }
  ]);

  // Get click metrics
  const clicks = await Metric.aggregate([
    { 
      $match: { 
        siteId, 
        type: 'click',
        timestamp: { $gte: startDate, $lte: now }
      } 
    },
    {
      $group: {
        _id: groupFormat,
        count: { $sum: 1 },
        formattedDate: { $first: { $dateToString: { format: dateFormat, date: '$timestamp' } } }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 }
    },
    {
      $project: {
        _id: 0,
        date: '$formattedDate',
        count: 1
      }
    }
  ]);

  // Merge the results
  const dateMap = new Map();
  
  // Fill in the impressions
  impressions.forEach(item => {
    dateMap.set(item.date, { date: item.date, impressions: item.count, clicks: 0 });
  });
  
  // Add the clicks
  clicks.forEach(item => {
    if (dateMap.has(item.date)) {
      const record = dateMap.get(item.date);
      record.clicks = item.count;
    } else {
      dateMap.set(item.date, { date: item.date, impressions: 0, clicks: item.count });
    }
  });
  
  // Convert to array and sort by date
  const result = Array.from(dateMap.values());
  result.sort((a, b) => a.date.localeCompare(b.date));
  
  // Add conversion rate
  result.forEach(item => {
    item.conversionRate = item.impressions > 0 
      ? Number(((item.clicks / item.impressions) * 100).toFixed(2)) 
      : 0;
  });
  
  return result;
}

/**
 * Get top performing notifications
 */
export async function getTopNotifications(
  siteId: mongoose.Types.ObjectId,
  limit: number = 5
) {
  const topNotifications = await Metric.aggregate([
    {
      $match: {
        siteId,
        type: 'impression'
      }
    },
    {
      $group: {
        _id: '$notificationId',
        impressions: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'metrics',
        let: { notificationId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$notificationId', '$$notificationId'] },
                  { $eq: ['$type', 'click'] }
                ]
              }
            }
          },
          {
            $count: 'clicks'
          }
        ],
        as: 'clickData'
      }
    },
    {
      $addFields: {
        clicks: { $ifNull: [{ $arrayElemAt: ['$clickData.clicks', 0] }, 0] }
      }
    },
    {
      $lookup: {
        from: 'notifications',
        localField: '_id',
        foreignField: '_id',
        as: 'notificationData'
      }
    },
    {
      $addFields: {
        notification: { $arrayElemAt: ['$notificationData', 0] }
      }
    },
    {
      $project: {
        _id: 1,
        notificationId: '$_id',
        impressions: 1,
        clicks: 1,
        conversionRate: {
          $cond: [
            { $gt: ['$impressions', 0] },
            { $multiply: [{ $divide: ['$clicks', '$impressions'] }, 100] },
            0
          ]
        },
        type: '$notification.type',
        name: '$notification.name',
        productName: '$notification.productName',
        location: '$notification.location',
        timestamp: '$notification.timestamp'
      }
    },
    {
      $sort: { impressions: -1 }
    },
    {
      $limit: limit
    }
  ]);

  return topNotifications;
} 