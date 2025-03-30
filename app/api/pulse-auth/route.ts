import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import jwt from 'jsonwebtoken';

/**
 * Generate JWT token for ProovdPulse WebSocket authentication
 * This endpoint is only accessible to authenticated users and generates
 * a token that can be used to authenticate with the ProovdPulse WebSocket server
 */
export async function GET(request: NextRequest) {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  try {
    // Get user ID from session
    const userId = session.user.id;
    
    // Extract websiteId from query parameters or use the user's default website
    const searchParams = request.nextUrl.searchParams;
    const websiteId = searchParams.get('websiteId');
    
    if (!websiteId) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { status: 400 }
      );
    }
    
    // Get JWT secret from environment variables
    const jwtSecret = process.env.PROOVDPULSE_JWT_SECRET;
    
    if (!jwtSecret) {
      console.error('PROOVDPULSE_JWT_SECRET environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    // Generate token with 24 hour expiry
    const token = jwt.sign(
      { 
        userId,
        websiteId,
        timestamp: Date.now()
      },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    // Return token
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating ProovdPulse token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
} 