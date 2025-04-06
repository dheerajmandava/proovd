import { NextRequest, NextResponse } from 'next/server';
import { 
  getNotificationById, 
  updateNotification, 
  deleteNotification 
} from '@/app/lib/services/notification.service';
import { auth } from '@/auth';
import { sanitizeInput } from '@/app/lib/server-utils';
import { handleApiError } from '@/app/lib/utils/server-error';

/**
 * GET /api/notifications/[id]
 * Get a notification by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const notification = await getNotificationById(params.id);
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error fetching notification:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.statusCode }
    );
  }
}

/**
 * PATCH /api/notifications/[id]
 * Update a notification
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the notification to verify ownership
    const notification = await getNotificationById(params.id);
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    
    // Sanitize inputs
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = sanitizeInput(body.name);
    if (body.message !== undefined) updateData.message = sanitizeInput(body.message);
    // Handle both url and link for backward compatibility, but always store as url
    if (body.link !== undefined) updateData.url = sanitizeInput(body.link);
    if (body.url !== undefined) updateData.url = sanitizeInput(body.url);
    if (body.image !== undefined) updateData.image = sanitizeInput(body.image);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.priority !== undefined) updateData.priority = parseInt(body.priority);
    
    // Optional: handle displayRules if present
    if (body.displayRules) {
      updateData.displayRules = {
        frequency: body.displayRules.frequency || 'always',
        delay: parseInt(body.displayRules.delay || 0),
        pages: Array.isArray(body.displayRules.pages) 
          ? body.displayRules.pages.map(sanitizeInput) 
          : []
      };
    }
    
    // Update the notification
    const updatedNotification = await updateNotification(params.id, updateData);
    
    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error('Error updating notification:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.statusCode }
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the notification to verify ownership
    const notification = await getNotificationById(params.id);
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    // Delete the notification
    const success = await deleteNotification(params.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete notification' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.statusCode }
    );
  }
} 