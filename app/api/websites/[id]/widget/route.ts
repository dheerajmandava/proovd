import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import Notification from '@/app/lib/models/notification';
import { cors } from '@/app/lib/cors';

/**
 * GET /api/websites/[id]/widget
 * 
 * Serve the widget JS file for a specific website
 * This is a public API endpoint that's loaded on customer websites
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply CORS headers for cross-origin requests
  const corsResponse = cors(request);
  if (corsResponse instanceof NextResponse) return corsResponse;

  try {
    const { id } = params;
    const apiKey = request.nextUrl.searchParams.get('key');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Get the website by ID
    const website = await Website.findOne({
      _id: id,
      apiKey: apiKey
    });

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found or invalid API key' },
        { status: 404 }
      );
    }

    // Check if the domain is verified
    if (website.verification.status !== 'verified' && website.status !== 'verified') {
      return NextResponse.json(
        { error: 'Domain not verified', verificationStatus: website.verification.status },
        { status: 403 }
      );
    }

    // Track an impression
    await website.recordImpression();

    // Get active notifications for this website
    const notifications = await Notification.find({
      siteId: website._id,
      status: 'active'
    }).sort({ createdAt: -1 }).limit(website.settings.maxNotifications || 5);
    
    // Format notifications for the widget
    const formattedNotifications = notifications.map(notification => ({
      id: notification._id.toString(),
      type: notification.type,
      message: notification.message,
      productName: notification.productName,
      productImage: notification.productImage,
      productUrl: notification.productUrl,
      location: notification.location,
      createdAt: notification.createdAt
    }));

    // Return widget data
    const response = NextResponse.json({
      siteId: website._id.toString(),
      domain: website.domain,
      settings: website.settings,
      notifications: formattedNotifications
    });
    
    // Add cache control headers
    response.headers.set('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
    
    return response;
  } catch (error) {
    console.error('Error serving widget:', error);
    return NextResponse.json(
      { error: 'Failed to serve widget' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/websites/[id]/widget/click
 * 
 * Track clicks on notifications in the widget
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply CORS headers for cross-origin requests
  const corsResponse = cors(request);
  if (corsResponse instanceof NextResponse) return corsResponse;

  try {
    const { id } = params;
    
    // Get API key from query params or request body
    let apiKey = request.nextUrl.searchParams.get('key');
    
    if (!apiKey) {
      // Try to get from body
      try {
        const body = await request.json();
        apiKey = body.apiKey;
      } catch (e) {
        // No body or no apiKey in body
      }
    }
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Get the website
    const website = await Website.findOne({
      _id: id,
      apiKey: apiKey
    });

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found or invalid API key' },
        { status: 404 }
      );
    }

    // Record click
    await website.recordClick();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking click:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
} 