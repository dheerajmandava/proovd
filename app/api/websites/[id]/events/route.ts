import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getEventsBySiteId, getEventCountBySiteId } from '@/app/lib/services/event.service';
import { handleApiError } from '@/app/lib/utils/server-error';

/**
 * API endpoint to fetch events for a website
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get website id from the route parameter
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { status: 400 }
      );
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const eventType = searchParams.get('type');
    
    // Validate parameters
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'Invalid page number' },
        { status: 400 }
      );
    }
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit. Must be between 1 and 100' },
        { status: 400 }
      );
    }
    
    // Calculate offset
    const skip = (page - 1) * limit;
    
    // Fetch events
    const events = await getEventsBySiteId(
      id,
      limit,
      skip,
      eventType || undefined
    );
    
    // Get total count for pagination
    const totalCount = await getEventCountBySiteId(
      id,
      eventType || undefined
    );
    
    // Format the response
    const formattedEvents = events.map(event => ({
      id: event._id.toString(),
      type: event.type,
      name: event.name,
      data: event.data,
      eventTime: event.eventTime,
      createdAt: event.createdAt,
    }));
    
    return NextResponse.json({
      events: formattedEvents,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.statusCode }
    );
  }
} 