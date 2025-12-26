import { connectToDatabase, mongoose } from '../database/connection';
import { cache } from 'react';
import Notification from '../models/notification';
import { incrementWebsiteImpressions, incrementWebsiteClicks } from './website.service';

type NotificationType = {
  _id: string;
  name: string;
  message: string;
  url?: string;
  image?: string;
  status: string;
  siteId: string;
  impressions: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
  priority?: number;
  fakeTimestamp?: Date;
  timeAgo?: string;
  type?: string;
  location?: string;
  components?: any[];
  // New Campaign Fields
  content?: any;
  triggers?: any[];
  variants?: any[];
  position?: string;
  theme?: string;
  displayRules?: any;
  displayFrequency?: string;
};

/**
 * Get a notification by ID with cached results for server components
 * @param id Notification ID
 * @returns Notification data or null if not found
 */
export const getNotificationById = cache(async (id: string): Promise<NotificationType | null> => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  await connectToDatabase();
  const notification = await Notification.findById(id).lean();
  return notification as NotificationType;
});

/**
 * Get all notifications for a website with cached results for server components
 * @param websiteId Website ID
 * @param limit Maximum number of notifications to return
 * @returns Array of notifications
 */
export const getNotificationsByWebsiteId = cache(
  async (websiteId: string, limit = 10): Promise<NotificationType[]> => {
    if (!websiteId || !mongoose.Types.ObjectId.isValid(websiteId)) return [];

    await connectToDatabase();

    // Explicitly include components field and make sure it's returned
    try {
      // First try with explicit select
      const notifications = await Notification.find({
        siteId: websiteId,
        status: 'active'
      })
        .select('+components')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      console.log(`getNotificationsByWebsiteId found ${notifications.length} notifications`);

      // Add debug logging for components
      notifications.forEach((notification, index) => {
        if (notification.components) {
          console.log(`Notification #${index + 1} (${notification.name}) has ${notification.components.length} components`);
        } else {
          console.log(`Notification #${index + 1} (${notification.name}) has NO components array`);
        }
      });

      return notifications as NotificationType[];
    } catch (error) {
      console.error('Error getting notifications with components:', error);
      throw error;
    }
  }
);

/**
 * Get all notifications for a website
 * @param websiteId Website ID
 * @returns Array of notifications
 */
export async function getNotificationsByWebsite(websiteId: string): Promise<NotificationType[]> {
  if (!websiteId || !mongoose.Types.ObjectId.isValid(websiteId)) return [];

  await connectToDatabase();

  const notifications = await Notification.find({ siteId: websiteId })
    .sort({ createdAt: -1 })
    .lean();

  return notifications as NotificationType[];
}

/**
 * Create a new notification
 * @param notificationData Notification data to create
 * @returns Created notification
 */
export async function createNotification(notificationData: {
  name?: string;
  message?: string;
  siteId: string;
  url?: string;
  image?: string;
  status?: string;
  type?: string;
  priority?: number;
  fakeTimestamp?: Date;
  components?: any[];
  // New fields
  content?: any;
  triggers?: any[];
  variants?: any[];
  position?: string;
  theme?: string;
  displayRules?: any;
  displayFrequency?: string;
}): Promise<NotificationType> {
  await connectToDatabase();

  const name = notificationData.name;

  if (!name || name.trim() === '') {
    throw new Error('Notification name is required');
  }

  try {
    const notification = new Notification({
      name: name,
      message: notificationData.message || '',
      siteId: notificationData.siteId,
      url: notificationData.url,
      image: notificationData.image,
      status: notificationData.status || 'active',
      type: notificationData.type || 'custom',
      impressions: 0,
      clicks: 0,
      priority: notificationData.priority || 0,
      fakeTimestamp: notificationData.fakeTimestamp,
      components: notificationData.components || [],
      // New fields
      content: notificationData.content,
      triggers: notificationData.triggers || [],
      variants: notificationData.variants || [],
      position: notificationData.position,
      theme: notificationData.theme,
      displayRules: notificationData.displayRules,
      displayFrequency: notificationData.displayFrequency
    });

    await notification.save();
    return notification.toObject() as NotificationType;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Update a notification
 * @param id Notification ID
 * @param updateData Data to update
 * @param increment Whether to increment the fields instead of setting them
 * @returns Updated notification
 */
export async function updateNotification(
  id: string,
  updateData: Partial<NotificationType>,
  increment?: boolean
): Promise<NotificationType | null> {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  await connectToDatabase();

  // Remove _id from update data if present
  if (updateData._id) {
    delete updateData._id;
  }

  const updateOperation = increment ? { $inc: updateData } : { $set: updateData };

  const notification = await Notification.findByIdAndUpdate(
    id,
    updateOperation,
    { new: true }
  ).lean();

  return notification as NotificationType;
}

/**
 * Track an impression for a notification
 * @param id Notification ID
 * @param websiteId Website ID
 * @returns Updated notification or null if not found
 */
export async function trackNotificationImpression(
  id: string,
  websiteId: string
): Promise<NotificationType | null> {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
  if (!websiteId || !mongoose.Types.ObjectId.isValid(websiteId)) return null;

  await connectToDatabase();

  // Get notification
  const notification = await Notification.findOne({
    _id: id,
    siteId: websiteId
  });

  if (!notification) return null;

  // Increment impressions
  notification.impressions = (notification.impressions || 0) + 1;
  await notification.save();

  // Update website analytics
  await incrementWebsiteImpressions(websiteId);

  return notification.toObject() as NotificationType;
}

/**
 * Track a click for a notification
 * @param id Notification ID
 * @param websiteId Website ID
 * @returns Updated notification or null if not found
 */
export async function trackNotificationClick(
  id: string,
  websiteId: string
): Promise<NotificationType | null> {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
  if (!websiteId || !mongoose.Types.ObjectId.isValid(websiteId)) return null;

  await connectToDatabase();

  // Get notification
  const notification = await Notification.findOne({
    _id: id,
    siteId: websiteId
  });

  if (!notification) return null;

  // Increment clicks
  notification.clicks = (notification.clicks || 0) + 1;
  await notification.save();

  // Update website analytics
  await incrementWebsiteClicks(websiteId);

  return notification.toObject() as NotificationType;
}

/**
 * Delete a notification
 * @param id Notification ID
 * @returns True if deleted, false if not found
 */
export async function deleteNotification(id: string): Promise<boolean> {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return false;

  await connectToDatabase();
  const result = await Notification.deleteOne({ _id: id });
  return result.deletedCount > 0;
} 