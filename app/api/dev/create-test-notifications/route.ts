import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import Notification from '@/app/lib/models/notification';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    // Get API key from request body
    const { apiKey } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Find website by API key
    const website = await Website.findOne({ apiKey });
    
    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Create sample notifications
    const notifications = [
      {
        websiteId: website._id,
        type: 'purchase',
        status: 'active',
        name: 'John D.',
        message: 'Just purchased',
        productName: 'Premium Package',
        url: 'http://localhost:8081/#',
        image: 'https://ui-avatars.com/api/?name=John+D&background=random',
        location: 'global',
        createdAt: new Date(Date.now() - 5 * 60000), // 5 minutes ago
      },
      {
        websiteId: website._id,
        type: 'signup',
        status: 'active',
        name: 'Sarah M.',
        message: 'Just signed up',
        url: 'http://localhost:8081/#',
        image: 'https://ui-avatars.com/api/?name=Sarah+M&background=random',
        location: 'global',
        createdAt: new Date(Date.now() - 10 * 60000), // 10 minutes ago
      },
      {
        websiteId: website._id,
        type: 'purchase',
        status: 'active',
        name: 'Mike R.',
        message: 'Just purchased',
        productName: 'Basic Package',
        url: 'http://localhost:8081/#',
        image: 'https://ui-avatars.com/api/?name=Mike+R&background=random',
        location: 'global',
        createdAt: new Date(Date.now() - 15 * 60000), // 15 minutes ago
      }
    ];

    // Delete existing notifications for this website
    await Notification.deleteMany({ websiteId: website._id });

    // Insert new notifications
    await Notification.insertMany(notifications);

    return NextResponse.json({
      success: true,
      websiteId: website._id,
      notificationsCreated: notifications.length
    });
  } catch (error) {
    console.error('Error creating test notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 