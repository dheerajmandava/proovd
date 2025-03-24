import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import { auth } from '@/auth';
import { isValidObjectId } from 'mongoose';
import Notification from '@/app/lib/models/notification';
import { VerificationMethod } from '@/app/lib/domain-verification';
import { verifyDomainWithDetails } from '@/app/lib/server-domain-verification';

/**
 * GET /api/websites/[id]
 * 
 * Fetches a specific website by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Validate ID
    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid website ID' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Find website, ensure it belongs to current user
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
    
    // Count notifications for this website
    const notificationsCount = await Notification.countDocuments({ siteId: id });
    
    // Return website data
    const response = {
      ...website.toResponse(),
      notificationsCount
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Error fetching website:', error);
    return NextResponse.json(
      { error: 'Error fetching website', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/websites/[id]
 * 
 * Updates a website
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Validate ID
    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid website ID' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Check if website exists and belongs to user
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
    
    // Parse request body
    const data = await request.json();
    
    // Update allowed fields
    if (data.name) website.name = data.name;
    
    // Update settings if provided
    if (data.settings) {
      // Update specific settings fields
      if (data.settings.position) website.settings.position = data.settings.position;
      if (data.settings.delay) website.settings.delay = parseInt(data.settings.delay, 10);
      if (data.settings.displayDuration) website.settings.displayDuration = parseInt(data.settings.displayDuration, 10);
      if (data.settings.maxNotifications) website.settings.maxNotifications = parseInt(data.settings.maxNotifications, 10);
      if (data.settings.theme) website.settings.theme = data.settings.theme;
    }
    
    // Update allowed domains if provided
    if (data.allowedDomains && Array.isArray(data.allowedDomains)) {
      website.allowedDomains = data.allowedDomains;
    }
    
    // Save changes
    await website.save();
    
    // Return updated website
    return NextResponse.json({
      success: true,
      website: website.toResponse()
    });
    
  } catch (error: any) {
    console.error('Error updating website:', error);
    return NextResponse.json(
      { error: 'Error updating website', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/websites/[id]
 * 
 * Deletes a website
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Validate ID
    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid website ID' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Check if website exists and belongs to user
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
    
    // Delete website
    await Website.deleteOne({ _id: id });
    
    // Also delete all notifications for this website
    await Notification.deleteMany({ siteId: id });
    
    return NextResponse.json({
      success: true,
      message: 'Website and all related notifications deleted'
    });
    
  } catch (error: any) {
    console.error('Error deleting website:', error);
    return NextResponse.json(
      { error: 'Error deleting website', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/websites/[id]
 * 
 * Updates specific website fields
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Validate ID
    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid website ID' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Check if website exists and belongs to user
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
    
    // Parse request body
    const data = await request.json();
    
    // Update provided fields
    const updatedFields: any = {};
    
    // Handle status change if provided
    if (data.status) {
      website.status = data.status;
      updatedFields.status = data.status;
    }
    
    // Handle name update if provided
    if (data.name) {
      website.name = data.name;
      updatedFields.name = data.name;
    }
    
    // Handle settings update if provided
    if (data.settings) {
      // Update specific settings fields
      if (data.settings.position) website.settings.position = data.settings.position;
      if (data.settings.delay !== undefined) website.settings.delay = parseInt(data.settings.delay.toString(), 10);
      if (data.settings.displayDuration !== undefined) website.settings.displayDuration = parseInt(data.settings.displayDuration.toString(), 10);
      if (data.settings.maxNotifications !== undefined) website.settings.maxNotifications = parseInt(data.settings.maxNotifications.toString(), 10);
      if (data.settings.theme) website.settings.theme = data.settings.theme;
      if (data.settings.displayOrder) website.settings.displayOrder = data.settings.displayOrder;
      if (data.settings.randomize !== undefined) website.settings.randomize = Boolean(data.settings.randomize);
      if (data.settings.initialDelay !== undefined) website.settings.initialDelay = parseInt(data.settings.initialDelay.toString(), 10);
      if (data.settings.loop !== undefined) website.settings.loop = Boolean(data.settings.loop);
      if (data.settings.customStyles !== undefined) website.settings.customStyles = data.settings.customStyles;
      
      updatedFields.settings = website.settings;
    }
    
    // Handle allowed domains update if provided
    if (data.allowedDomains && Array.isArray(data.allowedDomains)) {
      website.allowedDomains = data.allowedDomains;
      updatedFields.allowedDomains = data.allowedDomains;
    }
    
    // Handle user preferences update
    if (data.user) {
      // These are stored in the user model, not in website
      // We'll need to implement this as a separate API endpoint
      updatedFields.userPreferences = "User preferences were provided but are handled by a separate API";
    }
    
    // Save changes
    await website.save();
    
    // Return success with updated fields
    return NextResponse.json({
      success: true,
      updatedFields
    });
    
  } catch (error: any) {
    console.error('Error patching website:', error);
    return NextResponse.json(
      { error: 'Error updating website', details: error.message },
      { status: 500 }
    );
  }
} 