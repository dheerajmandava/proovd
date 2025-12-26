import { NextResponse } from 'next/server';
import { getWebsiteById, getNotificationsByWebsite, createNotification } from '@/app/lib/services';
import { sanitizeInput, isValidObjectId } from '@/app/lib/server-utils';
import { auth } from '@/auth';
import { handleApiError } from '@/app/lib/utils/server-error';

/**
 * GET /api/websites/[id]/notifications
 * 
 * Fetch all notifications for a specific website
 */
export async function GET(request, context) {
  try {
    // Get the current user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const id = (await context.params).id;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid website ID' },
        { status: 400 }
      );
    }

    // Get website to verify ownership
    const website = await getWebsiteById(id);

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (website.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to access this website' },
        { status: 403 }
      );
    }

    // Get notifications using service
    const notifications = await getNotificationsByWebsite(id);

    // Return the notifications in a structured object format
    return NextResponse.json({
      success: true,
      notifications: notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.statusCode }
    );
  }
}

/**
 * POST /api/websites/[id]/notifications
 * 
 * Create a new notification for a specific website
 */
export async function POST(request, props) {
  const params = await props.params;
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

    // Get website to verify ownership
    const website = await getWebsiteById(id);

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (website.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to access this website' },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: `Name is required` },
        { status: 400 }
      );
    }

    // Create notification using service - map fields to expected parameters
    const notification = await createNotification({
      name: sanitizeInput(body.name),
      message: body.message ? sanitizeInput(body.message) : '',
      components: body.components || [],
      siteId: website._id,
      url: body.url ? sanitizeInput(body.url) : '',
      image: body.image ? sanitizeInput(body.image) : '',
      status: body.status || 'active',
      type: body.type || 'custom',
      priority: body.priority ? parseInt(body.priority) : 0,
      // New Campaign Fields
      content: body.content,
      triggers: body.triggers,
      variants: body.variants,
      position: body.position,
      theme: body.theme,
      displayRules: body.displayRules,
      displayFrequency: body.displayFrequency,
    });

    // Return the new notification
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.statusCode }
    );
  }
} 