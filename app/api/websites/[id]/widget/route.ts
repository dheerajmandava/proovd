import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import Notification from '@/app/lib/models/notification';
import { cors } from '@/app/lib/cors';

/**
 * GET /api/websites/[id]/widget
 * 
 * Serve the widget JS file for a specific website
 * Now uses domain-based verification instead of API key
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
    
    // Get the referer header (the domain that loaded the script)
    const referer = request.headers.get('referer');
    const refererDomain = referer ? new URL(referer).hostname : null;

    // Connect to the database
    await connectToDatabase();

    // Get the website by ID
    const website = await Website.findOne({ _id: id });

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Check if the domain is verified
    const websiteDomain = website.domain;
    const isVerified = website.verification?.status === 'verified' || website.status === 'verified';
    
    if (!isVerified) {
      return NextResponse.json(
        { error: 'Domain not verified', verificationStatus: website.verification.status },
        { status: 403 }
      );
    }
    
    // Check if the referer matches the verified domain in production
    if (refererDomain) {
      // Extract the base domain for comparison, accounting for subdomains
      const refererBaseDomain = refererDomain.split('.').slice(-2).join('.');
      const websiteBaseDomain = websiteDomain.split('.').slice(-2).join('.');
      
      if (refererBaseDomain !== websiteBaseDomain && !refererDomain.endsWith(websiteDomain)) {
        return NextResponse.json(
          { error: 'Domain mismatch' },
          { status: 403 }
        );
      }
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
 * Now uses domain-based verification instead of API key
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
    
    // Get the referer header (the domain that loaded the script)
    const referer = request.headers.get('referer');
    const refererDomain = referer ? new URL(referer).hostname : null;

    // Connect to the database
    await connectToDatabase();

    // Get the website
    const website = await Website.findOne({ _id: id });

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Check if the domain is verified in production
    if (refererDomain) {
      const websiteDomain = website.domain;
      
      // Extract the base domain for comparison, accounting for subdomains
      const refererBaseDomain = refererDomain.split('.').slice(-2).join('.');
      const websiteBaseDomain = websiteDomain.split('.').slice(-2).join('.');
      
      if (refererBaseDomain !== websiteBaseDomain && !refererDomain.endsWith(websiteDomain)) {
        return NextResponse.json(
          { error: 'Domain mismatch' },
          { status: 403 }
        );
      }
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