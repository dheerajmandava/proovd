import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Notification from '@/app/lib/models/notification';
import User from '@/app/lib/models/user';
import Website from '@/app/lib/models/website';
import { auth } from '@/auth';
import { isValidApiKey, extractDomain, sanitizeInput, getPlanLimits, generateApiKey } from '@/app/lib/server-utils';
import { FilterQuery } from 'mongoose';

/**
 * API endpoint for creating notifications through the dashboard
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication for dashboard users
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    const { name, message, type, productName, location, url, status } = body;

    if (!name || !message || !type || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Additional validation for purchase notifications
    if (type === 'purchase' && !productName) {
      return NextResponse.json(
        { error: 'Product name is required for purchase notifications' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find or create default website
    let website = await Website.findOne({ userId: user._id });
    
    if (!website) {
      // Create a default website for the user
      website = await Website.create({
        name: 'Default Website',
        domain: 'example.com',
        userId: user._id,
        apiKey: generateApiKey(),
        status: 'active'
      });
    }

    // Create the notification
    const notification = await Notification.create({
      name: sanitizeInput(name),
      websiteId: website._id,
      type: sanitizeInput(type),
      message: sanitizeInput(message),
      productName: productName ? sanitizeInput(productName) : undefined,
      location: sanitizeInput(location),
      url: url ? sanitizeInput(url) : undefined,
      status: status || 'active',
      displayCount: 0,
      clickCount: 0
    });

    // Return the created notification
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for fetching website notifications to display on client sites
 * OR fetching dashboard notifications for the authenticated user
 * 
 * This endpoint accepts the following query parameters:
 * For public access:
 * - apiKey: The website's API key
 * - url: Current URL where notifications will be displayed
 * 
 * For dashboard access:
 * - websiteId: (optional) Filter by specific website
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey');
    const url = searchParams.get('url');
    const websiteId = searchParams.get('websiteId');

    // Check if this is a public API request (using apiKey)
    if (apiKey) {
      // Connect to database
      await connectToDatabase();

      // Find website by API key
      const website = await Website.findOne({ apiKey });
      if (!website) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
      }

      // Get notifications for this website
      const query: FilterQuery<typeof Notification> = {
        siteId: website._id,
        status: 'active'
      };
      
      // If URL is provided, filter by URL or global notifications
      if (url) {
        const normalizedUrl = url.replace(/\/$/, ''); // Remove trailing slash
        query.$or = [
          { location: 'global' },
          { url: { $in: [url, normalizedUrl, url + '/', normalizedUrl + '/'] } }
        ];
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      // Get website settings
      const settings = {
        position: website.settings?.position || 'bottom-left',
        theme: website.settings?.theme || 'light',
        displayDuration: website.settings?.displayDuration || 5,
        delay: website.settings?.delay || 5,
        maxNotifications: website.settings?.maxNotifications || 5,
      };

      return NextResponse.json({
        notifications,
        settings,
      });
    } 
    // This is a dashboard request (authenticated user)
    else {
      // Check authentication
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Connect to database
      await connectToDatabase();

      // Get all websites for this user
      const websites = await Website.find({ userId: session.user.id });
      const websiteIds = websites.map(site => site._id);

      if (websiteIds.length === 0) {
        return NextResponse.json({ 
          notifications: [],
          websites: []
        });
      }

      // Build query - either all websites or a specific one
      const query: FilterQuery<typeof Notification> = {
        siteId: websiteId ? websiteId : { $in: websiteIds }
      };

      // Get notifications
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .populate('siteId', 'name domain') // Include website details
        .lean();

      // Format notifications
      const formattedNotifications = notifications.map(notification => ({
        id: notification._id.toString(),
        name: notification.name,
        type: notification.type,
        status: notification.status,
        location: notification.location,
        productName: notification.productName,
        message: notification.message,
        url: notification.url,
        image: notification.image,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        website: notification.siteId
      }));

      return NextResponse.json({
        notifications: formattedNotifications,
        websites: websites.map(site => ({
          id: site._id.toString(),
          name: site.name,
          domain: site.domain,
          status: site.status
        }))
      });
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 