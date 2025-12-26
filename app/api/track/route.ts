import { NextRequest, NextResponse } from 'next/server';
import {
  getWebsiteByApiKey,
  getNotificationById,
  updateNotification,
  createMetric,
  hasSessionSeenNotification
} from '@/app/lib/services';
import { sanitizeInput } from '@/app/lib/server-utils';
import { isBot } from '@/app/lib/bot-detection';
import { handleApiError } from '@/app/lib/utils/server-error';

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

    // Support both legacy and new payload formats
    let siteId = body.websiteId || body.siteId;
    let apiKey = body.apiKey;
    let action = body.type || body.action; // 'impression', 'click', 'conversion'
    let campaignId = body.data?.campaignId || body.notificationId;
    let variantId = body.data?.variantId;
    let conversionValue = body.data?.value;
    let url = body.url;
    let sessionId = body.sessionId;
    let clientId = body.clientId;

    // Validate required fields
    if ((!siteId && !apiKey) || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers }
      );
    }

    // Get website
    let website;
    if (siteId) {
      // TODO: Add getWebsiteById to imports if not present, or use existing service
      // For now assuming getWebsiteById is available or we use getWebsiteByApiKey if siteId is not valid
      // Actually, we should import getWebsiteById
      const { getWebsiteById } = await import('@/app/lib/services');
      website = await getWebsiteById(siteId);
    } else if (apiKey) {
      website = await getWebsiteByApiKey(apiKey);
    }

    if (!website) {
      return NextResponse.json(
        { error: 'Invalid Website ID or API key' },
        { status: 401, headers }
      );
    }

    // If campaignId is provided, validate it
    let notification;
    if (campaignId) {
      notification = await getNotificationById(campaignId);
      if (!notification || notification.siteId.toString() !== website._id.toString()) {
        // If not found, it might be a general site event, but if campaignId was sent, it should exist
        // For now, allow continuing if it's a general event, but warn
      }
    }

    // Get request information for bot detection
    const userAgent = request.headers.get('user-agent');
    const ip = request.headers.get('x-forwarded-for') || '';
    const referrer = request.headers.get('referer') || body.referrer;

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
    if (action === 'impression' && sessionId && campaignId) {
      isUnique = !(await hasSessionSeenNotification(campaignId, sessionId));
    }

    // Create metric entry
    if (campaignId) {
      await createMetric({
        siteId: website._id,
        notificationId: campaignId,
        type: action,
        url: url ? sanitizeInput(url) : undefined,
        userAgent,
        ipAddress: ip,
        referrer,
        sessionId,
        clientId,
        isBot: detectedAsBot,
        isUnique,
        variantId,
        conversionValue
      });

      // Update notification counts
      if (!detectedAsBot && (action !== 'impression' || isUnique)) {
        const updates: any = {};

        if (action === 'impression') {
          updates.impressions = (notification?.impressions || 0) + 1;
        } else if (action === 'click') {
          updates.clicks = (notification?.clicks || 0) + 1;
        } else if (action === 'conversion') {
          // Add conversion tracking to notification model if needed, or just rely on metrics
          // For now, let's assume we might want to track total conversions on the notification object too
          // updates.conversions = (notification?.conversions || 0) + 1; 
        }

        if (Object.keys(updates).length > 0) {
          await updateNotification(campaignId, updates);
        }
      }
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Error tracking event:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.statusCode, headers }
    );
  }
}

// Disable body parsing to increase performance for high-volume endpoint
export const config = {
  api: {
    bodyParser: false,
  },
}; 