import { connectToDatabase } from '../database/connection';
import Metric from '../models/metric';
/**
 * Create a new metric entry
 * @param metricData Metric data to create
 * @returns Created metric
 */
export async function createMetric(metricData) {
    await connectToDatabase();
    const metric = new Metric(Object.assign(Object.assign({}, metricData), { timestamp: new Date() }));
    await metric.save();
    return metric.toObject();
}
/**
 * Check if a session has already seen a notification
 * @param notificationId Notification ID
 * @param sessionId Session ID
 * @returns True if the session has already seen the notification
 */
export async function hasSessionSeenNotification(notificationId, sessionId) {
    if (!notificationId || !sessionId)
        return false;
    await connectToDatabase();
    const existingImpression = await Metric.findOne({
        notificationId,
        sessionId,
        type: 'impression'
    }).lean();
    return !!existingImpression;
}
