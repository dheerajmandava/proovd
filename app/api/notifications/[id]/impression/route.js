import { NextResponse } from 'next/server';
import { trackNotificationImpression } from '@/app/lib/services/notification.service';
import { isValidObjectId } from '@/app/lib/server-utils';

/**
 * POST /api/notifications/[id]/impression
 * 
 * Public endpoint to track notification impressions.
 * This does not require authentication.
 */
export async function POST(request, props) {
  const params = await props.params;
  try {
    const { id } = params;
    const origin = request.headers.get('origin') || '*';
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid notification ID' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }
    
    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { websiteId } = body;
    
    if (!websiteId) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }
    
    // Track impression using the service
    const result = await trackNotificationImpression(id, websiteId);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }
    
    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  } catch (error) {
    console.error('Error tracking impression:', error);
    const origin = request.headers.get('origin') || '*';
    
    return NextResponse.json(
      { error: 'Failed to track impression' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS(request) {
  const origin = request.headers.get('origin') || '*';
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
} 