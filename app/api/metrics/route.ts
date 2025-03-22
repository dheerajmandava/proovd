import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import Notification from '@/app/lib/models/notification';
import Metric from '@/app/lib/models/metric';
import { isValidApiKey } from '@/app/lib/server-utils';

/**
 * POST /api/metrics
 * 
 * Records metrics for notification impressions and clicks
 */
export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const body = await req.json();
    const { apiKey, type, notificationId, url } = body;

    // Validate required fields
    if (!apiKey || !type || !notificationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate API key format
    if (!isValidApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
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

    // Connect to database
    await connectToDatabase();

    // Find website by API key
    const website = await Website.findOne({ apiKey, status: 'active' });
    if (!website) {
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
    const metric = new Metric({
      siteId: website._id,
      notificationId,
      type,
      url,
      userAgent: req.headers.get('user-agent'),
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      timestamp: new Date()
    });

    await metric.save();

    // Update notification metrics counter
    if (type === 'impression') {
      await Notification.updateOne(
        { _id: notificationId },
        { $inc: { impressions: 1 } }
      );
    } else if (type === 'click') {
      await Notification.updateOne(
        { _id: notificationId },
        { $inc: { clicks: 1 } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording metric:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 