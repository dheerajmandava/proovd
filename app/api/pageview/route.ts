import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import { isValidObjectId } from '@/app/lib/server-utils';

/**
 * POST /api/pageview
 * 
 * Records a page view for analytics
 */
export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const body = await req.json();
    const { websiteId, url, referrer, title } = body;

    // Validate website ID
    if (!websiteId) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { status: 400 }
      );
    }

    // Validate website ID format
    if (!isValidObjectId(websiteId)) {
      return NextResponse.json(
        { error: 'Invalid website ID format' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find website by ID
    const website = await Website.findOne({ _id: websiteId, status: { $in: ['active', 'verified'] } });
    if (!website) {
      return NextResponse.json(
        { error: 'Website not found or inactive' },
        { status: 404 }
      );
    }

    // In a real implementation, we would log this pageview to:
    // 1. Redis for real-time visitor counting
    // 2. A pageviews collection for analytics
    // 3. Update aggregate statistics

    // For the MVP, we'll just return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking pageview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Support OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 