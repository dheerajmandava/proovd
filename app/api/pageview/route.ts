import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import { isValidApiKey } from '@/app/lib/server-utils';

/**
 * POST /api/pageview
 * 
 * Records a page view for analytics
 */
export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const body = await req.json();
    const { apiKey, url, referrer, title } = body;

    // Validate API key
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Validate API key format
    if (!isValidApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find website by API key
    const website = await Website.findOne({ apiKey, status: 'active' });
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