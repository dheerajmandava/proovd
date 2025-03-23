import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import Notification from '@/app/lib/models/notification';
import Metric from '@/app/lib/models/metric';
import { getMetricsTimeSeries, getTopNotifications } from '@/app/lib/analytics';
import { auth } from '@/auth';

/**
 * GET /api/websites/[id]/analytics
 * 
 * Gets analytics data for a specific website
 */
export async function GET(req, { params }) {
  try {
    const { id } = params;
    const searchParams = req.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || 'week';
    const groupBy = searchParams.get('groupBy') || 'day';

    // Validate parameters
    if (!['day', 'week', 'month', 'year'].includes(timeRange)) {
      return NextResponse.json(
        { error: 'Invalid time range' },
        { status: 400 }
      );
    }

    if (!['hour', 'day', 'week', 'month'].includes(groupBy)) {
      return NextResponse.json(
        { error: 'Invalid group by parameter' },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Verify website ownership
    const website = await Website.findOne({
      _id: id,
      userId: session.user.id
    });

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Get time series data
    const timeSeries = await getMetricsTimeSeries(
      website._id,
      timeRange,
      groupBy
    );

    // Get summary metrics
    const totalImpressions = await Metric.countDocuments({
      siteId: website._id,
      type: 'impression'
    });

    const totalClicks = await Metric.countDocuments({
      siteId: website._id,
      type: 'click'
    });

    const conversionRate = totalImpressions > 0 
      ? ((totalClicks / totalImpressions) * 100).toFixed(2) 
      : '0.00';

    const totalNotifications = await Notification.countDocuments({
      siteId: website._id
    });

    // Get top performing notifications
    const topNotifications = await getTopNotifications(website._id, 5);

    // Return the analytics data
    return NextResponse.json({
      summary: {
        totalImpressions,
        totalClicks,
        conversionRate,
        totalNotifications
      },
      timeSeries,
      topNotifications
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
} 