import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Notification from '@/app/lib/models/notification';
import Website from '@/app/lib/models/website';
import { sanitizeInput } from '@/app/lib/server-utils';
import Metric from '@/app/lib/models/metric';
import { isBot } from '@/app/lib/bot-detection';

/**
 * API endpoint for tracking impressions and clicks on notifications
 */
export async function POST(request: NextRequest) {
  // Allow requests from any origin
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { 
      status: 204,
      headers
    });
  }

  try {
    // Parse request body
    const body = await request.json();
    const { apiKey, notificationId, action, url, sessionId, clientId } = body;

    // Validate required fields
    if (!apiKey || !notificationId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { 
          status: 400,
          headers 
        }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Validate API key and get website
    const website = await Website.findOne({ apiKey, status: 'active' });
    if (!website) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { 
          status: 401,
          headers 
        }
      );
    }

    // Find notification
    const notification = await Notification.findOne({ 
      _id: notificationId,
      siteId: website._id
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { 
          status: 404,
          headers 
        }
      );
    }

    // Get request information for bot detection
    const userAgent = request.headers.get('user-agent');
    const ip = request.headers.get('x-forwarded-for') || '';
    const referrer = request.headers.get('referer');

    // Detect if this is a bot
    const botDetectionData = {
      userAgent,
      ip,
      referrer
    };
    const detectedAsBot = isBot(botDetectionData);

    // Determine if this is a unique impression or click
    let isUnique = true;
    
    // For impressions, check if this session has already seen this notification
    if (action === 'impression' && sessionId) {
      const existingImpression = await Metric.findOne({
        notificationId,
        sessionId,
        type: 'impression'
      });
      
      isUnique = !existingImpression;
    }

    // Create metric entry
    const metric = await Metric.create({
      siteId: website._id,
      notificationId: notification._id,
      type: action === 'impression' ? 'impression' : 'click',
      url: url ? sanitizeInput(url) : undefined,
      userAgent,
      ipAddress: ip,
      referrer,
      sessionId,
      clientId,
      isBot: detectedAsBot,
      isUnique,
      timestamp: new Date()
    });

    // Only update notification counts for non-bot traffic and unique impressions for impressions
    if (!detectedAsBot && (action !== 'impression' || isUnique)) {
      // Update notification counts
      if (action === 'impression') {
        notification.displayCount = (notification.displayCount || 0) + 1;
        // Also track unique impression count
        if (isUnique) {
          notification.uniqueImpressionCount = (notification.uniqueImpressionCount || 0) + 1;
        }
      } else if (action === 'click') {
        notification.clickCount = (notification.clickCount || 0) + 1;
      }
      await notification.save();
    }

    return NextResponse.json(
      { success: true },
      { 
        status: 200,
        headers 
      }
    );
  } catch (error) {
    console.error('Error tracking event:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { 
        status: 500,
        headers 
      }
    );
  }
}

// Disable body parsing to increase performance for high-volume endpoint
export const config = {
  api: {
    bodyParser: false,
  },
}; 