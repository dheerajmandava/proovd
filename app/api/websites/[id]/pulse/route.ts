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

// Validate request schema
const pulseRequestSchema = z.object({
  sessionId: z.string(),
  clientId: z.string(),
  pageUrl: z.string().url(),
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
});

/**
 * GET /api/websites/[id]/pulse
 * Get engagement data for a website
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get website ID from params
    const websiteId = params.id;
    
    // Get URL parameters
    const url = new URL(request.url);
    const pageUrl = url.searchParams.get('pageUrl');
    
    // Connect to database
    const db = await connectToDatabase();
    
    // Get engagement data - Simplified for now
    // In production, we'd query engagement data from a database
    const engagementData = {
      activeUsers: Math.floor(Math.random() * 20) + 5,
      viewCount: Math.floor(Math.random() * 1000) + 100,
      avgTimeOnPage: Math.floor(Math.random() * 300) + 60,
      focusAreas: [],
      trend: Math.random() > 0.5 ? 'up' : 'down'
    };
    
    return NextResponse.json({
      success: true,
      data: engagementData
    });
  } catch (error) {
    console.error('Error getting engagement data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get engagement data' },
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
  try {
    // Get website ID from params
    const websiteId = params.id;
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = pulseRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: validationResult.error },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    // Get IP address and location data (if available)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    let locationData = null;
    
    try {
      // Randomly sample requests to stay within IP location API limits
      if (Math.random() < 0.1) { // Only look up 10% of IPs
        locationData = await ipLocationService.getLocationData(ip.split(',')[0].trim());
      }
    } catch (error) {
      console.error('Error getting location data:', error);
      // Continue without location data
    }
    
    // Connect to database
    const db = await connectToDatabase();
    
    // In a real implementation, we would store the engagement data
    // For now, we'll just log it
    console.log('Received engagement data:', {
      websiteId,
      sessionId: data.sessionId,
      clientId: data.clientId,
      pageUrl: data.pageUrl,
      ip,
      location: locationData ? `${locationData.city}, ${locationData.country}` : 'Unknown',
      engagementData: data.engagementData
    });
    
    // Return success
    return NextResponse.json({
      success: true,
      quotaUsage: ipLocationService.getQuotaUsage()
    });
  } catch (error) {
    console.error('Error recording engagement data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record engagement data' },
      { status: 500 }
    );
  }
} 