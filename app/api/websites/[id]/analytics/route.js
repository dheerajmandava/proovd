import { NextResponse } from 'next/server';
import { 
  getWebsiteById, 
  getWebsiteMetricsSummary, 
  getWebsiteTimeSeries, 
  getTopNotifications 
} from '@/app/lib/services';
import { handleApiError } from '@/app/lib/utils/error';
import { auth } from '@/auth';

/**
 * GET /api/websites/[id]/analytics
 * 
 * Gets analytics data for a specific website
 */
export async function GET(req, props) {
  const params = await props.params;
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

    // Verify website ownership using service
    const website = await getWebsiteById(id);

    if (!website || website.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Get analytics data using services
    const summary = await getWebsiteMetricsSummary(id);
    const timeSeries = await getWebsiteTimeSeries(id, timeRange, groupBy);
    const topNotifications = await getTopNotifications(id, 5);

    // Return the analytics data
    return NextResponse.json({
      summary,
      timeSeries,
      topNotifications
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.statusCode }
    );
  }
} 