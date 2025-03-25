import { NextResponse } from 'next/server';
import { trackNotificationImpression, trackNotificationClick } from '@/app/lib/services';
import { getUserByApiKey } from '@/app/lib/services/user.service';
import { handleApiError } from '@/app/lib/utils/error';

export async function POST(request, props) {
  const params = await props.params;
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

    // Find user by API key
    const user = await getUserByApiKey(apiKey);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Track based on action type
    let success = false;
    if (action === 'display') {
      success = await trackNotificationImpression(notificationId, user._id);
    } else if (action === 'click') {
      success = await trackNotificationClick(notificationId, user._id);
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Notification not found or tracking failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking notification:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.statusCode }
    );
  }
} 