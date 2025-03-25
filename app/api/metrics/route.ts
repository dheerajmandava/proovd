import { NextRequest, NextResponse } from 'next/server';
import { getWebsiteById, createMetric, updateNotification } from '@/app/lib/services';
import { isValidObjectId } from '@/app/lib/server-utils';
import { handleApiError } from '@/app/lib/utils/server-error';

/**
 * POST /api/metrics
 * 
 * Records metrics for notification impressions and clicks
 */
export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const body = await req.json();
    const { websiteId, type, notificationId, url } = body;

    // Validate required fields
    if (!websiteId || !type || !notificationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate website ID format
    if (!isValidObjectId(websiteId)) {
      return NextResponse.json(
        { error: 'Invalid website ID format' },
        { status: 400 }
      );
    }

    // Validate metric type
    if (type !== 'impression' && type !== 'click') {
      return NextResponse.json(
        { error: 'Invalid metric type' },
        { status: 400 }
      );
    }

    // Find website by ID
    const website = await getWebsiteById(websiteId);
    if (!website || !['active', 'verified'].includes(website.status)) {
      return NextResponse.json(
        { error: 'Website not found or inactive' },
        { status: 404 }
      );
    }

    // Don't create metrics for pageview notifications (they're generated dynamically)
    if (notificationId.startsWith('pageview-')) {
      return NextResponse.json({ success: true });
    }

    // Create metric record
    await createMetric({
      siteId: website._id,
      notificationId,
      type,
      url,
      userAgent: req.headers.get('user-agent'),
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      isBot: false,
      isUnique: true
    });

    // Update notification metrics counter
    const updates = type === 'impression' 
      ? { impressions: 1 } 
      : { clicks: 1 };
      
    await updateNotification(notificationId, updates, true); // Using increment=true

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording metric:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.statusCode }
    );
  }
} 