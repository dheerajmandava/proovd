/**
 * ProovdPulse API Endpoint
 * Handles requests from ProovdPulse widget for engagement data
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/app/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { ipLocationService } from '@/app/lib/services/ip-location.service';
import { activeUsersTracker } from '@/app/lib/active-users';
import crypto from 'crypto';
import Website from '@/app/lib/models/website';
import { parse } from 'url';
import { WebsiteStats } from '@/app/lib/models/website-stats';

// Validate request schema - Make it more flexible to match what the client sends
const pulseRequestSchema = z.object({
  sessionId: z.string().optional(),
  clientId: z.string().optional(),
  url: z.string().optional(),
  referrer: z.string().optional(),
  pageUrl: z.string().optional(),
  screenSize: z.object({
    width: z.number(),
    height: z.number()
  }).optional(),
  metrics: z.object({
    scrollPercentage: z.number().optional(),
    timeOnPage: z.number().optional(),
    clickCount: z.number().optional(),
    focusedElements: z.array(z.any()).optional()
  }).optional(),
  clickElements: z.array(z.any()).optional(),
  engagementData: z.object({
    timeOnPage: z.number().optional(),
    scrollDepth: z.number().optional(),
    scrollPercentage: z.number().optional(),
    interactionPoints: z.number().optional(),
    focusedElements: z.array(
      z.object({
        id: z.string(),
        selector: z.string(),
        interactionCount: z.number()
      })
    ).optional()
  }).optional()
}).passthrough(); // Allow additional properties

// Helper function to set CORS headers
function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

/**
 * Helper function to generate a session ID if not provided
 */
function getOrCreateSessionId(clientId?: string): string {
  if (clientId) {
    return clientId;
  }
  
  return crypto.randomUUID();
}

/**
 * GET /api/websites/[id]/pulse
 * Returns pulse statistics for a website
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    // Get session
    const session = await getServerSession(authOptions);
    
    // Verify user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get website ID from params
    const websiteId = params.id;
    
    // Verify the website exists and belongs to the user
    const website = await Website.findOne({
      _id: websiteId,
      userId: session.user.id
    });
    
    if (!website) {
      return NextResponse.json(
        { success: false, error: 'Website not found' },
        { status: 404 }
      );
    }
    
    // Fetch website stats from MongoDB
    const websiteStats = await WebsiteStats.findOne({ websiteId });
    
    // If no stats found, return default stats
    if (!websiteStats) {
      const defaultStats = {
        id: websiteId,
        websiteId,
        activeUsers: 0,
        totalClicks: 0,
        avgScrollPercentage: 0,
        avgTimeOnPage: 0,
        usersByCountry: '{}',
        usersByCity: '{}',
        updatedAt: new Date()
      };
      
      return NextResponse.json({
        success: true,
        data: defaultStats
      });
    }
    
    // Return the website stats
    return NextResponse.json({
      success: true,
      data: websiteStats
    });
  } catch (error) {
    console.error('Error fetching pulse data:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pulse data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/websites/[id]/pulse
 * Record engagement data from client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Allow CORS preflight
  if (request.method === 'OPTIONS') {
    return setCorsHeaders(new NextResponse(null, { status: 200 }));
  }

  try {
    // Get website ID from params
    const websiteId = params.id;
    
    // Parse request body
    const body = await request.json();
    
    // Validate with a more forgiving schema
    const validationResult = pulseRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('Invalid request data:', validationResult.error);
      return setCorsHeaders(NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      ));
    }
    
    const data = validationResult.data;
    
    // Get IP address and generate a session ID if not provided
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';
    
    // Create a session ID from client ID or generate one
    const sessionId = getOrCreateSessionId(data.clientId || data.sessionId);
    
    // Track or update the session
    if (activeUsersTracker.updateSession(sessionId)) {
      // Session exists, just updated
    } else {
      // Create new session
      let locationData = null;
      try {
        // Get location data for IP
        locationData = await ipLocationService.getLocationData(ip.split(',')[0].trim());
      } catch (error) {
        console.error('Error getting location data:', error);
      }
      
      activeUsersTracker.trackSession({
        id: sessionId,
        websiteId,
        url: data.url || data.pageUrl || '',
        referrer: data.referrer || request.headers.get('referer') || undefined,
        ipAddress: ip.split(',')[0].trim(),
        userAgent,
        location: locationData ? {
          country: locationData.country,
          city: locationData.city,
          latitude: locationData.latitude,
          longitude: locationData.longitude
        } : undefined
      });
    }
    
    // In a real implementation, we would store the engagement data
    console.log('Received engagement data:', {
      websiteId,
      sessionId,
      url: data.url || data.pageUrl,
      ip: ip.split(',')[0].trim(),
      metrics: data.metrics || data.engagementData
    });
    
    // Return success with CORS headers
    return setCorsHeaders(NextResponse.json({
      success: true,
      quotaUsage: ipLocationService.getQuotaUsage()
    }));
  } catch (error) {
    console.error('Error recording engagement data:', error);
    return setCorsHeaders(NextResponse.json(
      { success: false, error: 'Failed to record engagement data' },
      { status: 500 }
    ));
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    }
  );
} 