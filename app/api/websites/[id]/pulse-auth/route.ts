import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/database/connection';
import Website from '@/app/lib/models/website';
import jwt from 'jsonwebtoken';

/**
 * POST /api/websites/[id]/pulse-auth
 * Generate JWT token for pulse widget authentication
 * This endpoint is called by the widget on customer websites
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get website ID from URL params
    const websiteId = params.id;
    
    // Connect to the database
    await connectToDatabase();
    
    // Check if website exists
    const website = await Website.findById(websiteId);
    
    if (!website) {
      return NextResponse.json(
        { success: false, error: 'Website not found' },
        { status: 404 }
      );
    }
    
    // Verify pulse is enabled for this website
    if (!website.settings?.pulse?.enabled) {
      return NextResponse.json(
        { success: false, error: 'ProovdPulse is not enabled for this website' },
        { status: 403 }
      );
    }
    
    // Get client ID from request body
    let clientId;
    try {
      const body = await request.json();
      clientId = body.clientId;
      
      if (!clientId) {
        throw new Error('Client ID is required');
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format. Expected JSON with clientId.' },
        { status: 400 }
      );
    }
    
    // Get the JWT secret from environment variable
    const jwtSecret = process.env.PROOVDPULSE_JWT_SECRET;
    
    if (!jwtSecret) {
      console.error('PROOVDPULSE_JWT_SECRET is not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    // Get origin for CORS
    const origin = request.headers.get('origin') || '*';
    
    // Generate token with 24 hour expiration
    const token = jwt.sign(
      {
        websiteId,
        clientId,
        domain: website.domain
      },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    // Return the token with CORS headers for cross-domain requests
    return NextResponse.json(
      {
        success: true,
        token,
        socketUrl: process.env.NEXT_PUBLIC_PROOVDPULSE_SOCKET_URL || 'wss://socket.proovd.in'
      },
      { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  } catch (error) {
    console.error('Error generating pulse auth token:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to generate authentication token' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    }
  );
} 