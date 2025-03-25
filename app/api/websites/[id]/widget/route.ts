import { NextRequest, NextResponse } from 'next/server';
import { getWebsiteById } from '@/app/lib/services';
import { isValidObjectId } from 'mongoose';
import { cors } from '@/app/lib/cors';
import { handleApiError } from '@/app/lib/utils/error';
import Notification from '@/app/lib/models/notification';

/**
 * GET /api/websites/[id]/widget
 * 
 * Serve the widget JS file for a specific website
 * Now uses domain-based verification instead of API key
 */
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  // Apply CORS headers for cross-origin requests
  const corsResponse = cors(request);
  if (corsResponse instanceof NextResponse) return corsResponse;

  try {
    const { id } = params;
    
    // Validate the ID
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid website ID' },
        { status: 400 }
      );
    }
    
    // Get the referer header (the domain that loaded the script)
    const referer = request.headers.get('referer');
    const refererDomain = referer ? new URL(referer).hostname : null;

    // Get the website by ID using the service
    const website = await getWebsiteById(id);

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Check if the website is active
    if (website.status !== 'active' && website.status !== 'verified') {
      return NextResponse.json(
        { error: 'Website is not active' },
        { status: 403 }
      );
    }
    
    // Check if the domain is verified or if the referer domain is allowed
    if (refererDomain) {
      // Extract base domain for comparison (e.g., example.com from www.example.com)
      const websiteDomain = website.domain.toLowerCase();
      const baseDomain = refererDomain.replace(/^www\./, '');
      const websiteBaseDomain = websiteDomain.replace(/^www\./, '');
      
      // Check if domains match or if referer is in allowed domains
      const allowedDomains = website.allowedDomains || [];
      const isDomainAllowed = 
        baseDomain === websiteBaseDomain || 
        allowedDomains.includes(refererDomain) ||
        allowedDomains.includes(baseDomain);
      
      if (!isDomainAllowed) {
        return NextResponse.json(
          { error: 'Unauthorized domain' },
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
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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