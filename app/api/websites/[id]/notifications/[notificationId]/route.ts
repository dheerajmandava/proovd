import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { getWebsiteById } from '@/app/lib/services';
import Notification, { NotificationDocument } from '@/app/lib/models/notification';
import { handleApiError } from '@/app/lib/utils/error';
import { isValidObjectId } from 'mongoose';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/app/lib/mongodb';

// GET handler (placeholder, if needed)
// export async function GET(...) { ... }

/**
 * PUT /api/websites/[id]/notifications/[notificationId]
 * 
 * Update a specific notification template.
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string, notificationId: string } }) {
  try {
    await connectToDatabase();
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.sub;
    const { id: websiteId, notificationId } = params;

    if (!isValidObjectId(websiteId) || !isValidObjectId(notificationId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // Verify website ownership
    const website = await getWebsiteById(websiteId);
    if (!website || website.userId.toString() !== userId) {
      return NextResponse.json({ error: 'Website not found or unauthorized' }, { status: 404 });
    }

    // Parse the request body
    const body = await request.json();
    const { name, components } = body;

    // Basic validation (add more as needed)
    if (!name || !components) {
      return NextResponse.json({ error: 'Missing required fields: name and components' }, { status: 400 });
    }
    if (!Array.isArray(components)) {
      return NextResponse.json({ error: 'Components field must be an array' }, { status: 400 });
    }

    // Update the notification
    const updatedNotification = await Notification.findOneAndUpdate(
      { _id: notificationId, siteId: websiteId }, // Query criteria
      { $set: { name, components } }, // Update fields
      { new: true, runValidators: true } // Options: return updated doc, run schema validators
    );

    if (!updatedNotification) {
      return NextResponse.json({ error: 'Notification not found or failed to update' }, { status: 404 });
    }

    // Revalidate relevant paths
    revalidatePath(`/dashboard/websites/${websiteId}/notifications`);
    revalidatePath(`/dashboard/websites/${websiteId}/notifications/${notificationId}/edit`); // Revalidate edit page too

    return NextResponse.json(updatedNotification, { status: 200 });

  } catch (error) {
    // Handle potential JSON parsing errors or other issues
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return handleApiError(error);
  }
}

/**
 * DELETE /api/websites/[id]/notifications/[notificationId]
 * 
 * Delete a specific notification template.
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string, notificationId: string } }) {
  try {
    await connectToDatabase();
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.sub;
    const { id: websiteId, notificationId } = params;

    if (!isValidObjectId(websiteId) || !isValidObjectId(notificationId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // Verify website ownership
    const website = await getWebsiteById(websiteId);
    if (!website || website.userId.toString() !== userId) {
      return NextResponse.json({ error: 'Website not found or unauthorized' }, { status: 404 });
    }

    // Delete the notification
    const deleteResult = await Notification.deleteOne({ 
      _id: notificationId, 
      siteId: websiteId 
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: 'Notification not found or already deleted' }, { status: 404 });
    }

    // Revalidate relevant paths
    revalidatePath(`/dashboard/websites/${websiteId}/notifications`);

    return NextResponse.json({ message: 'Notification deleted successfully' }, { status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
} 