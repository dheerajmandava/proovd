import { NextResponse } from 'next/server';
import { 
  getWebsiteById
} from '@/app/lib/services';
import { 
  getWebsiteMetricsSummary, 
  getWebsiteTimeSeries, 
  getTopNotifications 
} from '@/app/lib/services/analytics.service';
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

/**
 * GET /api/websites/[id]/analytics
 * 
 * Gets analytics data for a specific website
 */
export async function GET(request, { params }) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const id = params.id;
    const timeRange = searchParams.get('timeRange') || 'week'; // Default to week
    const groupBy = searchParams.get('groupBy') || 'day'; // Default to day

    // Validate parameters
    const validTimeRanges = ['day', 'week', 'month', 'year'];
    const validGroupBy = ['hour', 'day', 'week', 'month'];

    if (!validTimeRanges.includes(timeRange)) {
      return NextResponse.json(
        { success: false, error: 'Invalid timeRange parameter' },
        { status: 400 }
      );
    }

    if (!validGroupBy.includes(groupBy)) {
      return NextResponse.json(
        { success: false, error: 'Invalid groupBy parameter' },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get website and check ownership
    const website = await getWebsiteById(id);
    if (!website) {
      return NextResponse.json(
        { success: false, error: 'Website not found' },
        { status: 404 }
      );
    }

    if (website.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to view this website' },
        { status: 403 }
      );
    }

    try {
      // Fetch analytics data
      // Note: The getWebsiteMetricsSummary function doesn't accept a timeRange parameter
      const summary = await getWebsiteMetricsSummary(id);
      const timeSeriesData = await getWebsiteTimeSeries(id, timeRange, groupBy);
      
      // Note: The getTopNotifications function doesn't accept a timeRange parameter
      const topNotifications = await getTopNotifications(id, 5);

      // Process time series data to ensure it's in the right format
      const formattedTimeSeries = timeSeriesData.map(item => ({
        date: formatDate(item.date, groupBy),
        impressions: item.impressions || 0,
        clicks: item.clicks || 0
      }));

      // Process top notifications to add conversion rate
      const formattedTopNotifications = topNotifications.map(notification => ({
        id: notification._id || notification.notificationId,
        type: notification.type || 'Unknown',
        views: notification.impressions || 0,
        clicks: notification.clicks || 0,
        conversionRate: notification.impressions > 0 
          ? notification.clicks / notification.impressions 
          : 0
      }));

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalImpressions: summary.totalImpressions || 0,
            totalClicks: summary.totalClicks || 0,
            conversionRate: parseFloat(summary.conversionRate) || 0,
            totalNotifications: summary.totalNotifications || 0
          },
          timeSeriesData: formattedTimeSeries,
          topNotifications: formattedTopNotifications
        }
      });
    } catch (serviceError) {
      console.error('Error in analytics service:', serviceError);
      return NextResponse.json(
        { success: false, error: 'Failed to process analytics data: ' + serviceError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in analytics API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data: ' + error.message },
      { status: 500 }
    );
  }
}

// Helper function to format date based on grouping
function formatDate(date, groupBy) {
  if (!date) return '';
  
  try {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) {
      return String(date);
    }
    
    if (groupBy === 'hour') {
      return d.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric'
      });
    } else if (groupBy === 'day') {
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
    } else if (groupBy === 'week') {
      // Calculate the start of the week
      const startOfWeek = new Date(d);
      startOfWeek.setDate(d.getDate() - d.getDay());
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else if (groupBy === 'month') {
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric'
      });
    }
    
    return d.toISOString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
} 