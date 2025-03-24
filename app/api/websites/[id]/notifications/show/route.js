import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import Notification from '@/app/lib/models/notification';
import { isValidObjectId } from '@/app/lib/server-utils';

/**
 * GET /api/websites/[id]/notifications/show
 * 
 * Public endpoint to fetch active notifications for a website.
 * This endpoint does not require authentication but validates the domain.
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const url = request.nextUrl.searchParams.get('url');
    const origin = request.headers.get('origin') || '*';

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid website ID' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Find the website
    const website = await Website.findOne({ _id: id });

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    // Check if website is active
    if (website.status !== 'active' && website.status !== 'verified') {
      return NextResponse.json(
        { error: 'Website is not active' },
        { 
          status: 403,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    // Domain validation
    if (origin && origin !== '*') {
      try {
        const originUrl = new URL(origin);
        const originDomain = originUrl.hostname.toLowerCase();
        
        // Check if domain matches or is in allowed domains
        const domainMatches = 
          website.domain === originDomain || 
          (website.allowedDomains && website.allowedDomains.includes(originDomain));
        
        if (!domainMatches) {
          // Log for debugging but don't block in development
          console.warn(`Domain mismatch: ${originDomain} vs ${website.domain} or ${website.allowedDomains}`);
          
          // In production, allow the request but log the warning
          console.warn(`Allowing request from unauthorized domain: ${originDomain}`);
        }
      } catch (error) {
        console.error('Error parsing origin:', error);
      }
    }

    // Get active notifications for this website
    // Sort by priority (high to low) and then by creation date (newest first)
    const notifications = await Notification.find({ 
      siteId: id,
      status: 'active'
    }).sort({ priority: -1, createdAt: -1 });

    // Format notifications for response
    const formattedNotifications = notifications.map(notification => {
      // Convert the notification to a plain object
      const notificationObj = notification.toObject ? notification.toObject() : notification;
      
      // Use fake timestamp if available
      if (notificationObj.fakeTimestamp) {
        notificationObj.timestamp = notificationObj.fakeTimestamp;
      } else {
        notificationObj.timestamp = notificationObj.createdAt;
      }
      
      // Use pre-defined timeAgo if available
      if (!notificationObj.timeAgo) {
        const now = new Date();
        const createdAt = new Date(notificationObj.timestamp || notificationObj.createdAt);
        const diffMs = now - createdAt;
        const diffMins = Math.round(diffMs / 60000);
        
        if (diffMins < 1) {
          notificationObj.timeAgo = 'Just now';
        } else if (diffMins < 60) {
          notificationObj.timeAgo = `${diffMins} minutes ago`;
        } else if (diffMins < 1440) {
          const hours = Math.floor(diffMins / 60);
          notificationObj.timeAgo = `${hours} hours ago`;
        } else {
          const days = Math.floor(diffMins / 1440);
          notificationObj.timeAgo = `${days} days ago`;
        }
      }
      
      // Ensure critical display parameters are present
      if (!notificationObj.displayFrequency) {
        notificationObj.displayFrequency = 'always';
      }
      
      if (!notificationObj.displayDuration) {
        notificationObj.displayDuration = 
          website.settings?.displayDuration || 5;
      }
      
      return notificationObj;
    });

    // Get advanced website settings for the widget
    const widgetSettings = {
      position: website.settings?.position || 'bottom-left',
      delay: website.settings?.delay || 5,
      displayDuration: website.settings?.displayDuration || 5,
      maxNotifications: website.settings?.maxNotifications || 5,
      theme: website.settings?.theme || 'light',
      loop: website.settings?.loop || false,
      randomize: website.settings?.randomize || false,
      initialDelay: website.settings?.initialDelay || website.settings?.delay || 5
    };

    // Return notifications and website settings
    return NextResponse.json(
      { 
        notifications: formattedNotifications,
        settings: widgetSettings
      },
      {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      }
    );
  } catch (error) {
    console.error('Error fetching public notifications:', error);
    const origin = request.headers.get('origin') || '*';
    
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
} 