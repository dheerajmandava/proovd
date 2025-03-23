import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Notification from '@/app/lib/models/notification';
import User from '@/app/lib/models/user';

export async function POST(request, { params }) {
  try {
    const notificationId = params.id;
    const body = await request.json();
    const { apiKey, action } = body;

    if (!apiKey || !action || !['display', 'click'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find user by API key
    const user = await User.findOne({ apiKey });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Find notification
    const notification = await Notification.findOne({
      _id: notificationId,
      userId: user._id
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Update notification stats
    if (action === 'display') {
      notification.displayCount += 1;
    } else if (action === 'click') {
      notification.clickCount += 1;
    }

    await notification.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 