import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';

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

    // Create a test website
    const website = new Website({
      name: 'Test Website',
      domain: 'localhost:8081',
      apiKey: '72ea2d02-2174-40d4-bd45-8db754952570',
      userId: '000000000000000000000000', // Dummy user ID
      status: 'active',
      settings: {
        position: 'bottom-left',
        theme: 'light',
        displayDuration: 5,
        delay: 3,
        maxNotifications: 5
      }
    });

    await website.save();

    return NextResponse.json({
      success: true,
      website: {
        id: website._id,
        name: website.name,
        domain: website.domain,
        apiKey: website.apiKey
      }
    });
  } catch (error) {
    console.error('Error creating test website:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 