import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import Notification from '@/app/lib/models/notification';
import { sanitizeInput, isValidObjectId } from '@/app/lib/server-utils';
import { auth } from '@/auth';

/**
 * GET /api/websites/[id]/notifications
 * 
 * Fetch all notifications for a specific website
 */
export async function GET(request, { params }) {
  try {
    // Get the current user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid website ID' },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Check website ownership
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

    // Get all notifications for this website
    const notifications = await Notification.find({ siteId: id })
      .sort({ createdAt: -1 });

    // Format notifications for response
    const formattedNotifications = notifications.map(notification => notification.toResponse());

    return NextResponse.json({ notifications: formattedNotifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/websites/[id]/notifications
 * 
 * Create a new notification for a website
 */
export async function POST(request, { params }) {
  try {
    // Get the current user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid website ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Notification name is required' },
        { status: 400 }
      );
    }

    if (body.type === 'purchase' && !body.productName) {
      return NextResponse.json(
        { error: 'Product name is required for purchase notifications' },
        { status: 400 }
      );
    }

    if (body.type === 'custom' && !body.message) {
      return NextResponse.json(
        { error: 'Message is required for custom notifications' },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Check website ownership
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

    // Sanitize inputs
    const sanitizedName = sanitizeInput(body.name);
    const sanitizedProductName = body.productName ? sanitizeInput(body.productName) : undefined;
    const sanitizedMessage = body.message ? sanitizeInput(body.message) : undefined;
    const sanitizedUrl = body.url ? sanitizeInput(body.url) : undefined;
    const sanitizedImage = body.image ? sanitizeInput(body.image) : undefined;
    const sanitizedLocation = body.location || 'global';

    // Create the notification
    const notification = await Notification.create({
      siteId: id,
      name: sanitizedName,
      type: body.type,
      status: body.status || 'active',
      location: sanitizedLocation,
      productName: sanitizedProductName,
      message: sanitizedMessage,
      url: sanitizedUrl,
      image: sanitizedImage,
      displayRules: body.displayRules || {
        pages: [],
        frequency: 'always',
        delay: 0
      }
    });

    // Return the created notification
    return NextResponse.json(notification.toResponse(), { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
} 