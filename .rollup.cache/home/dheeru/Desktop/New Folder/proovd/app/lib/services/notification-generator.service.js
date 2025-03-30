import Event from '@/app/lib/models/event';
import Notification from '@/app/lib/models/notification';
import { connectToDatabase } from '@/app/lib/database/connection';
import mongoose from 'mongoose';
// Ensure database connection
connectToDatabase();
/**
 * Generate a notification from a signup event
 */
export async function generateSignupNotification(event) {
    try {
        const { siteId, data } = event;
        // Check if a notification should be created
        // You might want to implement additional rules here
        // Create the notification
        const notification = new Notification({
            siteId,
            name: 'New Signup',
            type: 'signup',
            status: 'active',
            location: (data === null || data === void 0 ? void 0 : data.location) || 'global',
            message: createSignupMessage(data),
            displayRules: {
                frequency: 'always',
                delay: 0,
            },
            displayFrequency: 'always',
            displayDuration: 5,
            timeAgo: 'just now',
            priority: 2,
        });
        await notification.save();
        return notification;
    }
    catch (error) {
        console.error('Error generating signup notification:', error);
        throw error;
    }
}
/**
 * Generate a notification from a purchase event
 */
export async function generatePurchaseNotification(event) {
    try {
        const { siteId, data } = event;
        // Create the notification
        const notification = new Notification({
            siteId,
            name: 'New Purchase',
            type: 'purchase',
            status: 'active',
            location: (data === null || data === void 0 ? void 0 : data.location) || 'global',
            productName: data === null || data === void 0 ? void 0 : data.productName,
            message: createPurchaseMessage(data),
            displayRules: {
                frequency: 'always',
                delay: 0,
            },
            displayFrequency: 'always',
            displayDuration: 5,
            timeAgo: 'just now',
            priority: 1, // Higher priority for purchases
        });
        await notification.save();
        return notification;
    }
    catch (error) {
        console.error('Error generating purchase notification:', error);
        throw error;
    }
}
/**
 * Generate a notification for current viewers
 */
export async function generateViewersNotification(siteId, pageUrl, count) {
    if (count < 2)
        return null; // Don't show for less than 2 viewers
    try {
        // Convert string ID to ObjectId
        const objectId = new mongoose.Types.ObjectId(siteId);
        // Create the notification
        const notification = new Notification({
            siteId: objectId,
            name: 'Current Viewers',
            type: 'custom',
            status: 'active',
            location: pageUrl,
            message: createViewersMessage(count),
            displayRules: {
                pages: [pageUrl],
                frequency: 'once',
                delay: 5,
            },
            displayFrequency: 'once_per_session',
            displayDuration: 5,
            timeAgo: 'right now',
            priority: 3,
        });
        await notification.save();
        return notification;
    }
    catch (error) {
        console.error('Error generating viewers notification:', error);
        throw error;
    }
}
/**
 * Process recent events to generate notifications
 */
export async function processEventsForNotifications(siteId) {
    try {
        // Convert string ID to ObjectId
        const objectId = new mongoose.Types.ObjectId(siteId);
        // Get recent events that haven't been processed
        const recentEvents = await Event.find({
            siteId: objectId,
            isBot: false,
            // Add a flag or field to track if the event has been processed for notifications
        }).sort({ eventTime: -1 }).limit(10);
        // Process each event
        for (const event of recentEvents) {
            // Generate notification based on event type
            if (event.type === 'signup') {
                await generateSignupNotification(event);
            }
            else if (event.type === 'purchase') {
                await generatePurchaseNotification(event);
            }
            // Mark as processed
            // You might want to add a field to track this
        }
        return { processed: recentEvents.length };
    }
    catch (error) {
        console.error('Error processing events for notifications:', error);
        throw error;
    }
}
// Helper functions to create notification messages
function createSignupMessage(data) {
    const name = (data === null || data === void 0 ? void 0 : data.userName) || 'Someone';
    return `${name} just signed up`;
}
function createPurchaseMessage(data) {
    const name = (data === null || data === void 0 ? void 0 : data.userName) || 'Someone';
    const product = (data === null || data === void 0 ? void 0 : data.productName) || 'an item';
    return `${name} just purchased ${product}`;
}
function createViewersMessage(count) {
    return `${count} people are viewing this page right now`;
}
