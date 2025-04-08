import { NextResponse } from 'next/server';
import { isValidObjectId } from '@/app/lib/server-utils';
import { 
  getNotificationById, 
  trackNotificationImpression, 
  trackNotificationClick 
} from '@/app/lib/services';
import { AnalyticsEvent } from '@/app/lib/models/analytics';
import { handleApiError } from '@/app/lib/utils/error';

/**
 * POST /api/websites/[id]/notifications/[notificationId]/track
 * 
 * Public endpoint to track notification impressions and clicks
 * This endpoint does not require authentication as it's called from the widget
 */
export async function POST(request, { params }) {
  try {
    const { id, notificationId } = params;
    const origin = request.headers.get('origin') || '*';
    
    // Set CORS headers for all responses
    const headers = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // Handle OPTIONS (preflight) request
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { 
        status: 204,
        headers
      });
    }
    
    // Validate ObjectIds
    if (!isValidObjectId(id) || !isValidObjectId(notificationId)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400, headers }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { type, url } = body;
    
    if (!type || !['impression', 'click'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid tracking type. Must be "impression" or "click"' },
        { status: 400, headers }
      );
    }

    // Verify notification exists and belongs to this website
    const notification = await getNotificationById(notificationId);
    if (!notification || notification.siteId.toString() !== id) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404, headers }
      );
    }

    // Get request information for analytics
    const userAgent = request.headers.get('user-agent');
    const ip = request.headers.get('x-forwarded-for') || '';
    const referrer = request.headers.get('referer');
    
    // Track the event in notification service
    if (type === 'impression') {
      await trackNotificationImpression(notificationId, id);
    } else if (type === 'click') {
      await trackNotificationClick(notificationId, id);
    }
    
    // Also store in analytics events collection for detailed reporting
    await AnalyticsEvent.create({
      websiteId: id,
      notificationId: notificationId,
      type: type,
      timestamp: new Date(),
      metadata: {
        url: url || '',
        referrer: referrer || '',
        userAgent: userAgent || '',
        deviceType: userAgent?.includes('Mobile') ? 'mobile' : 'desktop',
      }
    });

    return NextResponse.json(
      { success: true },
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Error tracking notification:', error);
    const apiError = handleApiError(error);
    
    return NextResponse.json(
      { error: apiError.message },
      { 
        status: apiError.statusCode || 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

// Support OPTIONS method for CORS
export async function OPTIONS(request) {
  const origin = request.headers.get('origin') || '*';
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 