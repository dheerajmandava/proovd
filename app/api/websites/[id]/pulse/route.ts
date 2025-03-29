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
 * Get engagement data for a website
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Ensure database connection
    await connectToDatabase();
    
    // Get website ID from params
    const websiteId = params.id;
    
    // Get website from database
    const website = await Website.findById(websiteId);
    
    if (!website) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Website not found' }), { 
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    
    // Get AppSync information from environment variables
    const config = {
      region: process.env.NEXT_PUBLIC_AWS_REGION,
      endpoint: process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT,
      apiKey: process.env.NEXT_PUBLIC_APPSYNC_API_KEY
    };
    
    return NextResponse.json({
      success: true,
      data: {
        appsync: config,
        websiteId
      },
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error handling ProovdPulse request:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
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
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 