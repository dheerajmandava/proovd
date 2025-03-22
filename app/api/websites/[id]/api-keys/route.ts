import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import { generateApiKey, isValidApiKey, isValidObjectId, requireVerifiedWebsite } from '@/app/lib/server-utils';
import { sanitizeInput } from '@/app/lib/server-utils';

// GET /api/websites/[id]/api-keys - Get all API keys for a website
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Find the website and check if it belongs to the user
    const website = await Website.findOne({ 
      _id: params.id, 
      userId: session.user.id 
    });

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Require website verification to access API keys
    const verificationCheck = requireVerifiedWebsite(website);
    if (verificationCheck) {
      return verificationCheck;
    }

    // Return the API keys
    return NextResponse.json(
      { 
        apiKeys: website.apiKeys || [] 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching API keys' },
      { status: 500 }
    );
  }
}

// POST /api/websites/[id]/api-keys - Create a new API key for a website
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const name = sanitizeInput(body.name);
    let allowedOrigins = body.allowedOrigins || [];
    
    // Sanitize allowed origins
    allowedOrigins = allowedOrigins.map((origin: string) => sanitizeInput(origin));
    
    // Connect to the database
    await connectToDatabase();

    // Find the website and check if it belongs to the user
    const website = await Website.findOne({ 
      _id: params.id, 
      userId: session.user.id 
    });

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // CHECK VERIFICATION STATUS - Only allow API key creation for verified websites
    const verificationCheck = requireVerifiedWebsite(website);
    if (verificationCheck) {
      return verificationCheck;
    }

    // Check if there's a limit to the number of API keys (e.g., plan restrictions)
    if (website.apiKeys && website.apiKeys.length >= 5) {
      return NextResponse.json(
        { error: 'You have reached the maximum number of API keys for this website' },
        { status: 403 }
      );
    }

    // Generate a new API key
    const apiKey = {
      id: new Date().getTime().toString(),
      key: generateApiKey(),
      name,
      allowedOrigins,
      createdAt: new Date().toISOString(),
    };

    // Add the API key to the website
    if (!website.apiKeys) {
      website.apiKeys = [];
    }
    
    website.apiKeys.push(apiKey);
    await website.save();

    // Return the new API key
    return NextResponse.json(
      { apiKey },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while creating the API key' },
      { status: 500 }
    );
  }
} 