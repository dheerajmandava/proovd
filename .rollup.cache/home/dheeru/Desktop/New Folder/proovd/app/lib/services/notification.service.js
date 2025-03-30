import { connectToDatabase, mongoose } from '../database/connection';
import { cache } from 'react';
import Notification from '../models/notification';
import { incrementWebsiteImpressions, incrementWebsiteClicks } from './website.service';
/**
 * Get a notification by ID with cached results for server components
 * @param id Notification ID
 * @returns Notification data or null if not found
 */
export const getNotificationById = cache(async (id) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
        return null;
    await connectToDatabase();
    const notification = await Notification.findById(id).lean();
    return notification;
});
/**
 * Get all notifications for a website with cached results for server components
 * @param websiteId Website ID
 * @param limit Maximum number of notifications to return
 * @returns Array of notifications
 */
export const getNotificationsByWebsiteId = cache(async (websiteId, limit = 10) => {
    if (!websiteId || !mongoose.Types.ObjectId.isValid(websiteId))
        return [];
    await connectToDatabase();
    const notifications = await Notification.find({ siteId: websiteId, status: 'active' })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    return notifications;
});
/**
 * Get all notifications for a website
 * @param websiteId Website ID
 * @returns Array of notifications
 */
export async function getNotificationsByWebsite(websiteId) {
    if (!websiteId || !mongoose.Types.ObjectId.isValid(websiteId))
        return [];
    await connectToDatabase();
    const notifications = await Notification.find({ siteId: websiteId })
        .sort({ createdAt: -1 })
        .lean();
    return notifications;
}
/**
 * Create a new notification
 * @param notificationData Notification data to create
 * @returns Created notification
 */
export async function createNotification(notificationData) {
    await connectToDatabase();
    const notification = new Notification({
        title: notificationData.title,
        message: notificationData.message,
        siteId: notificationData.siteId,
        link: notificationData.link,
        image: notificationData.image,
        status: 'active',
        impressions: 0,
        clicks: 0,
        priority: notificationData.priority || 0,
        fakeTimestamp: notificationData.fakeTimestamp
    });
    await notification.save();
    return notification.toObject();
}
/**
 * Update a notification
 * @param id Notification ID
 * @param updateData Data to update
 * @param increment Whether to increment the fields instead of setting them
 * @returns Updated notification
 */
export async function updateNotification(id, updateData, increment) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
        return null;
    await connectToDatabase();
    // Remove _id from update data if present
    if (updateData._id) {
        delete updateData._id;
    }
    const updateOperation = increment ? { $inc: updateData } : { $set: updateData };
    const notification = await Notification.findByIdAndUpdate(id, updateOperation, { new: true }).lean();
    return notification;
}
/**
 * Track an impression for a notification
 * @param id Notification ID
 * @param websiteId Website ID
 * @returns Updated notification or null if not found
 */
export async function trackNotificationImpression(id, websiteId) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
        return null;
    if (!websiteId || !mongoose.Types.ObjectId.isValid(websiteId))
        return null;
    await connectToDatabase();
    // Get notification
    const notification = await Notification.findOne({
        _id: id,
        siteId: websiteId
    });
    if (!notification)
        return null;
    // Increment impressions
    notification.impressions = (notification.impressions || 0) + 1;
    await notification.save();
    // Update website analytics
    await incrementWebsiteImpressions(websiteId);
    return notification.toObject();
}
/**
 * Track a click for a notification
 * @param id Notification ID
 * @param websiteId Website ID
 * @returns Updated notification or null if not found
 */
export async function trackNotificationClick(id, websiteId) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
        return null;
    if (!websiteId || !mongoose.Types.ObjectId.isValid(websiteId))
        return null;
    await connectToDatabase();
    // Get notification
    const notification = await Notification.findOne({
        _id: id,
        siteId: websiteId
    });
    if (!notification)
        return null;
    // Increment clicks
    notification.clicks = (notification.clicks || 0) + 1;
    await notification.save();
    // Update website analytics
    await incrementWebsiteClicks(websiteId);
    return notification.toObject();
}
/**
 * Delete a notification
 * @param id Notification ID
 * @returns True if deleted, false if not found
 */
export async function deleteNotification(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
        return false;
    await connectToDatabase();
    const result = await Notification.deleteOne({ _id: id });
    return result.deletedCount > 0;
}
