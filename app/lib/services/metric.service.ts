import { connectToDatabase, mongoose } from '../database/connection';
import Metric from '../models/metric';

/**
 * Create a new metric entry
 * @param metricData Metric data to create
 * @returns Created metric
 */
export async function createMetric(metricData: {
  siteId: string;
  notificationId: string;
  type: string;
  url?: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  sessionId?: string;
  clientId?: string;
  isBot: boolean;
  isUnique: boolean;
}): Promise<any> {
  await connectToDatabase();
  
  const metric = new Metric({
    ...metricData,
    timestamp: new Date()
  });
  
  await metric.save();
  return metric.toObject();
}

/**
 * Check if a session has already seen a notification
 * @param notificationId Notification ID
 * @param sessionId Session ID
 * @returns True if the session has already seen the notification
 */
export async function hasSessionSeenNotification(
  notificationId: string, 
  sessionId: string
): Promise<boolean> {
  if (!notificationId || !sessionId) return false;
  
  await connectToDatabase();
  
  const existingImpression = await Metric.findOne({
    notificationId,
    sessionId,
    type: 'impression'
  }).lean();
  
  return !!existingImpression;
} 