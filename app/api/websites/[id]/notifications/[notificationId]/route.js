import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectToDatabase } from '@/app/lib/db';
import Notification from '@/app/lib/models/notification';
import Website from '@/app/lib/models/website';
import { sanitizeInput } from '@/app/lib/server-utils';
import Metric from '@/app/lib/models/metric';

/**
 * GET /api/websites/[id]/notifications/[notificationId]
 * 
 * Gets a specific notification with its metrics
 */
export async function GET(_req, { params }) {
  try {
    const { id, notificationId } = params;

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

    // Get the notification
    const notification = await Notification.findOne({
      _id: notificationId,
      siteId: website._id
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Get metrics for this notification
    const impressions = await Metric.countDocuments({
      notificationId,
      type: 'impression'
    });

    const clicks = await Metric.countDocuments({
      notificationId,
      type: 'click'
    });

    // Get the most recent metrics for trend analysis
    const recentMetrics = await Metric.find({
      notificationId
    })
    .sort({ timestamp: -1 })
    .limit(100);

    // Calculate conversion rate
    const conversionRate = impressions > 0 
      ? ((clicks / impressions) * 100).toFixed(2) 
      : '0.00';

    // Return the notification with metrics
    return NextResponse.json({
      notification,
      metrics: {
        impressions,
        clicks,
        conversionRate,
        recentMetrics
      }
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/websites/[id]/notifications/[notificationId]
 * 
 * Updates a specific notification
 */
export async function PATCH(req, { params }) {
  try {
    const { id, notificationId } = params;

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await req.json();
    const { name, location, productName, url, image, status } = body;

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

    // Get the notification
    const notification = await Notification.findOne({
      _id: notificationId,
      siteId: website._id
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Update fields if provided
    if (name !== undefined) {
      notification.name = sanitizeInput(name);
    }

    if (location !== undefined) {
      notification.location = sanitizeInput(location);
    }

    if (productName !== undefined) {
      notification.productName = sanitizeInput(productName);
    }

    if (url !== undefined) {
      notification.url = url;
    }

    if (image !== undefined) {
      notification.image = image;
    }

    if (status !== undefined && ['active', 'inactive'].includes(status)) {
      notification.status = status;
    }

    // Save the updated notification
    await notification.save();

    // Return the updated notification
    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/websites/[id]/notifications/[notificationId]
 * 
 * Deletes a specific notification and its metrics
 */
export async function DELETE(_req, { params }) {
  try {
    const { id, notificationId } = params;

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

    // Get the notification
    const notification = await Notification.findOne({
      _id: notificationId,
      siteId: website._id
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Delete all metrics for this notification
    await Metric.deleteMany({ notificationId });

    // Delete the notification
    await Notification.deleteOne({ _id: notificationId });

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Notification and metrics deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
} 