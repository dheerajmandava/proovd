import { NextRequest, NextResponse } from 'next/server';
import {
  getWebsiteByApiKey,
  createMetric,
  hasSessionSeenNotification
} from '@/app/lib/services';
import { sanitizeInput } from '@/app/lib/server-utils';
import { isBot } from '@/app/lib/bot-detection';
import { handleApiError } from '@/app/lib/utils/server-error';

export const dynamic = 'force-dynamic';

/**
 * API endpoint for tracking impressions and clicks on notifications
 */
export async function POST(request: NextRequest) {
  // Allow requests from any origin
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');



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
    if ((!siteId && !apiKey && !body.shop) || !action) {
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
    } else if (body.shop) {
      // Support lookup by shop domain for zero-config installation
      const { getWebsiteByShopifyDomain } = await import('@/app/lib/services');
      website = await getWebsiteByShopifyDomain(body.shop);
    }

    if (!website) {
      return NextResponse.json(
        { error: 'Invalid Website ID, API key, or Shop Domain' },
        { status: 401, headers }
      );
    }

    // If campaignId is provided, just validate it matches site (optional logic removed for simplicity as notification service is gone)
    // We can trust the tracking for now or implement campaign existence check via campaign service later.

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

      // Update notification counts - REMOVED (Legacy Social Proof)
      // if (!detectedAsBot && (action !== 'impression' || isUnique)) {
      //   // We only track metrics now, no aggregate updates on notification model
      // }
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
// OPTIONS handler for CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return new NextResponse(null, {
    status: 204,
    headers
  });
} 