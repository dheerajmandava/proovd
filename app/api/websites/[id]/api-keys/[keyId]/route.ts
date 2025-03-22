import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import { requireVerifiedWebsite } from '@/app/lib/server-utils';

// DELETE /api/websites/[id]/api-keys/[keyId] - Delete a specific API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; keyId: string } }
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

    // Check if website is verified
    const verificationCheck = requireVerifiedWebsite(website);
    if (verificationCheck) {
      return verificationCheck;
    }

    // Check if API keys exist
    if (!website.apiKeys || website.apiKeys.length === 0) {
      return NextResponse.json(
        { error: 'No API keys found' },
        { status: 404 }
      );
    }

    // Check if this is the primary API key (first in the array)
    const keyIndex = website.apiKeys.findIndex((key: { id: string }) => key.id === params.keyId);
    
    if (keyIndex === -1) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of the primary key
    if (keyIndex === 0) {
      return NextResponse.json(
        { error: 'Cannot delete the primary API key' },
        { status: 403 }
      );
    }

    // Remove the API key
    website.apiKeys.splice(keyIndex, 1);
    await website.save();

    // Return success
    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while deleting the API key' },
      { status: 500 }
    );
  }
} 