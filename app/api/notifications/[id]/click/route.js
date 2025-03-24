import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Notification from '@/app/lib/models/notification';
import { isValidObjectId } from '@/app/lib/server-utils';

/**
 * POST /api/notifications/[id]/click
 * 
 * Public endpoint to track notification clicks.
 * This does not require authentication.
 */
export async function POST(request, { params }) {
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
    
    // Connect to the database
    await connectToDatabase();
    
    // Find notification
    const notification = await Notification.findOne({ 
      _id: id,
      siteId: websiteId
    });
    
    if (!notification) {
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
    
    // Track click
    notification.clicks = (notification.clicks || 0) + 1;
    await notification.save();
    
    // Update website analytics
    try {
      const Website = (await import('@/app/lib/models/website')).default;
      const website = await Website.findById(websiteId);
      if (website) {
        // Initialize analytics if needed
        if (!website.analytics) {
          website.analytics = {
            totalImpressions: 0,
            totalClicks: 0,
            conversionRate: 0
          };
        }
        
        // Update click count
        website.analytics.totalClicks = (website.analytics.totalClicks || 0) + 1;
        
        // Recalculate conversion rate
        const totalClicks = website.analytics.totalClicks || 0;
        const totalImpressions = website.analytics.totalImpressions || 0;
        website.analytics.conversionRate = totalImpressions > 0 
          ? (totalClicks / totalImpressions) * 100 
          : 0;
        
        await website.save();
      }
    } catch (error) {
      console.error('Error updating website analytics:', error);
      // Continue even if website analytics update fails
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
    console.error('Error tracking click:', error);
    const origin = request.headers.get('origin') || '*';
    
    return NextResponse.json(
      { error: 'Failed to track click' },
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