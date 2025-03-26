import { connectToDatabase } from '@/app/lib/database/connection';
import Event from '@/app/lib/models/event';
import Website from '@/app/lib/models/website';
import mongoose from 'mongoose';
import { sanitizeInput } from '@/app/lib/server-utils';

// Ensure database connection
connectToDatabase();

// Interface for event creation
interface EventData {
  siteId: string | mongoose.Types.ObjectId;
  type: 'signup' | 'purchase' | 'view' | 'custom';
  name?: string;
  data?: {
    productName?: string;
    productId?: string;
    price?: number;
    currency?: string;
    userEmail?: string;
    userName?: string;
    pageUrl?: string;
    pageTitle?: string;
    location?: string;
    customData?: any;
  };
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  sessionId?: string;
  clientId?: string;
  isBot?: boolean;
  eventTime?: Date;
}

/**
 * Create a new event
 */
export async function createEvent(eventData: EventData) {
  try {
    // Convert string ID to ObjectId if needed
    let siteId = eventData.siteId;
    if (typeof siteId === 'string') {
      siteId = new mongoose.Types.ObjectId(siteId);
    }

    // Verify website exists
    const website = await Website.findById(siteId);
    if (!website) {
      throw new Error('Website not found');
    }

    // Sanitize inputs
    const sanitizedData = {
      ...eventData,
      siteId,
      name: eventData.name ? sanitizeInput(eventData.name) : undefined,
      data: eventData.data ? {
        productName: eventData.data.productName ? sanitizeInput(eventData.data.productName) : undefined,
        productId: eventData.data.productId ? sanitizeInput(eventData.data.productId) : undefined,
        price: eventData.data.price,
        currency: eventData.data.currency ? sanitizeInput(eventData.data.currency) : undefined,
        userEmail: eventData.data.userEmail ? sanitizeInput(eventData.data.userEmail) : undefined,
        userName: eventData.data.userName ? sanitizeInput(eventData.data.userName) : undefined,
        pageUrl: eventData.data.pageUrl ? sanitizeInput(eventData.data.pageUrl) : undefined,
        pageTitle: eventData.data.pageTitle ? sanitizeInput(eventData.data.pageTitle) : undefined,
        location: eventData.data.location ? sanitizeInput(eventData.data.location) : undefined,
        customData: eventData.data.customData,
      } : undefined,
    };

    // Create the event
    const event = new Event(sanitizedData);
    await event.save();

    return event;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

/**
 * Get events by website ID
 */
export async function getEventsBySiteId(siteId: string, limit = 20, skip = 0, type?: string) {
  try {
    // Convert string ID to ObjectId
    const objectId = new mongoose.Types.ObjectId(siteId);

    // Create query
    const query: any = { siteId: objectId };
    if (type) {
      query.type = type;
    }

    // Fetch events
    const events = await Event
      .find(query)
      .sort({ eventTime: -1 })
      .skip(skip)
      .limit(limit);

    return events;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

/**
 * Get event count by website ID and type
 */
export async function getEventCountBySiteId(siteId: string, type?: string) {
  try {
    // Convert string ID to ObjectId
    const objectId = new mongoose.Types.ObjectId(siteId);

    // Create query
    const query: any = { siteId: objectId };
    if (type) {
      query.type = type;
    }

    // Count events
    const count = await Event.countDocuments(query);

    return count;
  } catch (error) {
    console.error('Error counting events:', error);
    throw error;
  }
}

/**
 * Get recent events for notifications
 */
export async function getRecentEventsForNotifications(siteId: string, limit = 5) {
  try {
    // Convert string ID to ObjectId
    const objectId = new mongoose.Types.ObjectId(siteId);

    // Fetch recent events
    const events = await Event
      .find({ 
        siteId: objectId,
        isBot: false // Exclude bot events
      })
      .sort({ eventTime: -1 })
      .limit(limit);

    return events;
  } catch (error) {
    console.error('Error fetching recent events:', error);
    throw error;
  }
}

/**
 * Delete events for a website
 */
export async function deleteEventsBySiteId(siteId: string) {
  try {
    // Convert string ID to ObjectId
    const objectId = new mongoose.Types.ObjectId(siteId);

    // Delete events
    await Event.deleteMany({ siteId: objectId });
  } catch (error) {
    console.error('Error deleting events:', error);
    throw error;
  }
} 