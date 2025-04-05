/**
 * Analytics Worker Module
 * 
 * This module handles background processing of analytics data to improve
 * dashboard performance by pre-calculating statistics.
 */

import mongoose from 'mongoose';
import { connectToDatabase } from './database/connection';
import Website from './models/website';
import Notification from './models/notification';
import Metric from './models/metric';
import { AnalyticsEvent, AnalyticsSummary } from './models/analytics';
import { startOfDay, startOfWeek, startOfMonth, subDays } from 'date-fns';

interface StatsSummary {
  totalImpressions: number;
  totalUniqueImpressions: number;
  totalClicks: number;
  conversionRate: string;
  metrics: {
    last24Hours: {
      impressions: number;
      uniqueImpressions: number;
      clicks: number;
      conversionRate: string;
    };
    last7Days: {
      impressions: number;
      uniqueImpressions: number;
      clicks: number;
      conversionRate: string;
    };
    last30Days: {
      impressions: number;
      uniqueImpressions: number;
      clicks: number;
      conversionRate: string;
    };
  };
  lastUpdated: Date;
}

/**
 * Pre-calculate website statistics and store for faster dashboard loading
 */
export async function calculateWebsiteStats(websiteId?: string) {
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
      const totalImpressions = await Metric.countDocuments({ 
        ...baseQuery, 
        type: 'impression' 
      });
      
      const totalUniqueImpressions = await Metric.countDocuments({ 
        ...baseQuery, 
        type: 'impression',
        isUnique: true
      });
      
      const totalClicks = await Metric.countDocuments({ 
        ...baseQuery, 
        type: 'click' 
      });
      
      // Calculate time-based metrics
      const last24HoursQuery = { 
        ...baseQuery, 
        timestamp: { $gte: oneDayAgo } 
      };
      
      const last24HoursImpressions = await Metric.countDocuments({ 
        ...last24HoursQuery, 
        type: 'impression' 
      });
      
      const last24HoursUniqueImpressions = await Metric.countDocuments({ 
        ...last24HoursQuery, 
        type: 'impression',
        isUnique: true
      });
      
      const last24HoursClicks = await Metric.countDocuments({ 
        ...last24HoursQuery, 
        type: 'click' 
      });
      
      // Last 7 days
      const last7DaysQuery = { 
        ...baseQuery, 
        timestamp: { $gte: sevenDaysAgo } 
      };
      
      const last7DaysImpressions = await Metric.countDocuments({ 
        ...last7DaysQuery, 
        type: 'impression' 
      });
      
      const last7DaysUniqueImpressions = await Metric.countDocuments({ 
        ...last7DaysQuery, 
        type: 'impression',
        isUnique: true
      });
      
      const last7DaysClicks = await Metric.countDocuments({ 
        ...last7DaysQuery, 
        type: 'click' 
      });
      
      // Last 30 days
      const last30DaysQuery = { 
        ...baseQuery, 
        timestamp: { $gte: thirtyDaysAgo } 
      };
      
      const last30DaysImpressions = await Metric.countDocuments({ 
        ...last30DaysQuery, 
        type: 'impression' 
      });
      
      const last30DaysUniqueImpressions = await Metric.countDocuments({ 
        ...last30DaysQuery, 
        type: 'impression',
        isUnique: true
      });
      
      const last30DaysClicks = await Metric.countDocuments({ 
        ...last30DaysQuery, 
        type: 'click' 
      });
      
      // Calculate conversion rates (safely handle division by zero)
      const calculateConversionRate = (clicks: number, impressions: number): string => {
        if (impressions === 0) return '0.00';
        return ((clicks / impressions) * 100).toFixed(2);
      };
      
      const stats: StatsSummary = {
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
      await Website.updateOne(
        { _id: website._id },
        { 
          $set: { 
            cachedStats: stats
          }
        }
      );
      
      console.log(`Updated stats for website ${website._id}`);
    }
    
    return { success: true, message: `Processed stats for ${websites.length} websites` };
  } catch (error) {
    console.error('Error calculating website stats:', error);
    return { success: false, error: 'Failed to calculate website stats' };
  }
}

/**
 * Calculate notification-level statistics
 */
export async function calculateNotificationStats(websiteId?: string) {
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
      const totalImpressions = await Metric.countDocuments({ 
        ...baseQuery, 
        type: 'impression' 
      });
      
      const totalUniqueImpressions = await Metric.countDocuments({ 
        ...baseQuery, 
        type: 'impression',
        isUnique: true
      });
      
      const totalClicks = await Metric.countDocuments({ 
        ...baseQuery, 
        type: 'click' 
      });
      
      // Calculate conversion rate (safely handle division by zero)
      const conversionRate = totalImpressions === 0 
        ? 0 
        : parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2));
      
      // Update notification with accurate counts
      await Notification.updateOne(
        { _id: notification._id },
        { 
          $set: { 
            displayCount: totalImpressions,
            uniqueImpressionCount: totalUniqueImpressions,
            clickCount: totalClicks,
            conversionRate
          }
        }
      );
      
      console.log(`Updated stats for notification ${notification._id}`);
    }
    
    return { success: true, message: `Processed stats for ${notifications.length} notifications` };
  } catch (error) {
    console.error('Error calculating notification stats:', error);
    return { success: false, error: 'Failed to calculate notification stats' };
  }
}

/**
 * Process analytics events and update analytics summaries
 * This function aggregates analytics events into summary records for faster dashboard queries
 */
export async function processAnalyticsEvents(websiteId?: string, days: number = 30) {
  try {
    await connectToDatabase();
    
    console.log(`Processing analytics events${websiteId ? ` for website ${websiteId}` : ''}`);
    
    const startDate = subDays(new Date(), days);
    
    // Get all websites or a specific one
    const websiteQuery = websiteId 
      ? { _id: new mongoose.Types.ObjectId(websiteId) } 
      : {};
    
    const websites = await Website.find(websiteQuery);
    
    for (const website of websites) {
      console.log(`Processing events for website ${website._id}`);
      
      // Get all events for this website in the time range
      const events = await AnalyticsEvent.find({
        websiteId: website._id,
        timestamp: { $gte: startDate }
      }).sort({ timestamp: 1 });
      
      if (events.length === 0) {
        console.log(`No events found for website ${website._id}`);
        continue;
      }
      
      console.log(`Found ${events.length} events for website ${website._id}`);
      
      // Group events by day
      const dailyEvents = groupEventsByTimeframe(events, 'day');
      // Group events by week
      const weeklyEvents = groupEventsByTimeframe(events, 'week');
      // Group events by month
      const monthlyEvents = groupEventsByTimeframe(events, 'month');
      
      // Process daily summaries
      await processTimeframeSummaries(website._id, dailyEvents, 'daily');
      // Process weekly summaries
      await processTimeframeSummaries(website._id, weeklyEvents, 'weekly');
      // Process monthly summaries
      await processTimeframeSummaries(website._id, monthlyEvents, 'monthly');
      
      console.log(`Completed processing for website ${website._id}`);
    }
    
    return { success: true, message: 'Analytics events processed successfully' };
  } catch (error) {
    console.error('Error processing analytics events:', error);
    return { success: false, error: 'Failed to process analytics events' };
  }
}

/**
 * Group events by a specific timeframe (day, week, month)
 */
function groupEventsByTimeframe(events: any[], timeframe: 'day' | 'week' | 'month') {
  const grouped = new Map();
  
  for (const event of events) {
    let key;
    const timestamp = new Date(event.timestamp);
    
    if (timeframe === 'day') {
      key = startOfDay(timestamp).toISOString();
    } else if (timeframe === 'week') {
      key = startOfWeek(timestamp, { weekStartsOn: 1 }).toISOString();
    } else if (timeframe === 'month') {
      key = startOfMonth(timestamp).toISOString();
    }
    
    if (!grouped.has(key)) {
      grouped.set(key, {
        date: new Date(key),
        events: [],
        byNotification: new Map()
      });
    }
    
    const group = grouped.get(key);
    group.events.push(event);
    
    // Group by notification as well
    const notificationId = event.notificationId.toString();
    if (!group.byNotification.has(notificationId)) {
      group.byNotification.set(notificationId, []);
    }
    
    group.byNotification.get(notificationId).push(event);
  }
  
  return grouped;
}

/**
 * Process summaries for a specific timeframe
 */
async function processTimeframeSummaries(
  websiteId: mongoose.Types.ObjectId, 
  groupedEvents: Map<string, any>, 
  granularity: 'daily' | 'weekly' | 'monthly'
) {
  for (const [key, group] of groupedEvents.entries()) {
    const { date, events, byNotification } = group;
    
    // Count impressions and clicks
    const impressions = events.filter(e => e.type === 'impression').length;
    const clicks = events.filter(e => e.type === 'click').length;
    
    // Calculate conversion rate
    const conversionRate = impressions > 0 ? (clicks / impressions) * 100 : 0;
    
    // Prepare notification metrics
    const notificationMetrics = [];
    
    for (const [notificationId, notificationEvents] of byNotification.entries()) {
      const notificationImpressions = notificationEvents.filter(e => e.type === 'impression').length;
      const notificationClicks = notificationEvents.filter(e => e.type === 'click').length;
      const notificationConversionRate = notificationImpressions > 0 
        ? (notificationClicks / notificationImpressions) * 100 
        : 0;
      
      notificationMetrics.push({
        notificationId: new mongoose.Types.ObjectId(notificationId),
        impressions: notificationImpressions,
        clicks: notificationClicks,
        conversionRate: notificationConversionRate
      });
    }
    
    // Upsert the summary document
    await AnalyticsSummary.updateOne(
      {
        websiteId,
        date,
        granularity
      },
      {
        $set: {
          metrics: {
            impressions,
            clicks,
            conversionRate
          },
          notificationMetrics
        }
      },
      { upsert: true }
    );
  }
}

/**
 * Run all analytics processing functions
 */
export async function runAllAnalytics(websiteId?: string) {
  try {
    await connectToDatabase();
    
    console.log('Starting analytics processing jobs...');
    
    // Process legacy metrics
    await calculateWebsiteStats(websiteId);
    await calculateNotificationStats(websiteId);
    
    // Process new analytics events
    await processAnalyticsEvents(websiteId);
    
    console.log('All analytics processing jobs completed successfully');
    
    return { success: true, message: 'Analytics processed successfully' };
  } catch (error) {
    console.error('Error running analytics jobs:', error);
    return { success: false, error: 'Failed to process analytics: ' + error.message };
  }
}

// Export directly for serverless function execution
export default async function handler() {
  return await runAllAnalytics();
} 