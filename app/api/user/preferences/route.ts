import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectToDatabase } from '@/app/lib/db';
import User from '@/app/lib/models/user';

/**
 * PATCH /api/user/preferences
 * 
 * Updates user email preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Find the user
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const data = await request.json();
    const updatedFields: any = {};
    
    // Update email if provided
    if (data.email) {
      user.email = data.email;
      updatedFields.email = data.email;
    }
    
    // Update email notification preferences
    if (data.emailNotifications !== undefined) {
      user.emailNotifications = Boolean(data.emailNotifications);
      updatedFields.emailNotifications = user.emailNotifications;
    }
    
    // Update notification digest preference
    if (data.notificationDigest) {
      user.notificationDigest = data.notificationDigest;
      updatedFields.notificationDigest = user.notificationDigest;
    }
    
    // Save changes
    await user.save();
    
    // Return updated fields
    return NextResponse.json({
      success: true,
      updatedFields
    });
    
  } catch (error: any) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Error updating user preferences', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/preferences
 * 
 * Gets user email preferences
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Find the user
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return relevant preferences
    return NextResponse.json({
      email: user.email,
      emailNotifications: user.emailNotifications || true,
      notificationDigest: user.notificationDigest || 'daily'
    });
    
  } catch (error: any) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Error fetching user preferences', details: error.message },
      { status: 500 }
    );
  }
} 