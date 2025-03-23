import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import { isValidObjectId } from '@/app/lib/server-utils';
import { VerificationMethod } from '@/app/lib/domain-verification';
import { verifyDomainWithDetails } from '@/app/lib/server-domain-verification';

/**
 * GET /api/websites/[id]/verify
 * 
 * Gets domain verification details and instructions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Validate ID
    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid website ID' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Check if website exists and belongs to user
    const website = await Website.findOne({
      _id: id,
      userId: session.user.id
    });
    
    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }
    
    // Get the verification details
    const verification = website.verification || {
      status: 'pending',
      method: VerificationMethod.DNS,
      token: '',
      attempts: 0
    };
    
    // Generate instructions based on method
    let instructions = '';
    const domain = website.domain;
    const token = verification.token;
    
    switch (verification.method) {
      case VerificationMethod.DNS:
        instructions = `
Add a TXT record to your domain's DNS with the following values:
Host: @
Value: ${token}

Note: This can take up to 24 hours to propagate.
`;
        break;
      case VerificationMethod.FILE:
        instructions = `
Create a file at this URL:
https://${domain}/.well-known/proovd-verification.txt

With this content:
${token}
`;
        break;
      case VerificationMethod.META:
        instructions = `
Add this meta tag to your website's <head> section:
<meta name="proovd-verification" content="${token}" />
`;
        break;
    }
    
    // Return the verification details and instructions
    return NextResponse.json({
      verification,
      instructions
    });
    
  } catch (error: any) {
    console.error('Error getting verification details:', error);
    return NextResponse.json(
      { error: 'Error getting verification details', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/websites/[id]/verify
 * 
 * Verifies a domain or updates verification method
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Validate ID
    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid website ID' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Check if website exists and belongs to user
    const website = await Website.findOne({
      _id: id,
      userId: session.user.id
    });
    
    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }
    
    // Get request body
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      // If no body, just proceed with verification
    }
    
    // If method is provided, update verification method
    if (body && (body as any).method) {
      const method = (body as any).method;
      
      if (!Object.values(VerificationMethod).includes(method)) {
        return NextResponse.json(
          { error: 'Invalid verification method' },
          { status: 400 }
        );
      }
      
      // Update verification method
      website.verification = {
        status: 'pending',
        method,
        token: website.verification?.token || require('crypto').randomBytes(16).toString('hex'),
        attempts: 0
      };
      
      await website.save();
      
      return NextResponse.json({
        success: true,
        method,
        token: website.verification.token,
        status: 'pending'
      });
    }
    
    // Verify domain
    const result = await verifyDomainWithDetails(website.domain, website.verification);
    
    // Update verification attempts
    website.verification.attempts = (website.verification.attempts || 0) + 1;
    
    // If verified, update status
    if (result.isVerified) {
      website.verification.status = 'verified';
      website.verification.verifiedAt = new Date().toISOString();
      website.status = 'verified';
      
      await website.save();
      
      return NextResponse.json({
        success: true,
        message: 'Domain verified successfully!'
      });
    } else {
      // Not verified
      await website.save();
      
      return NextResponse.json({
        success: false,
        message: `Verification failed: ${result.reason}`
      });
    }
    
  } catch (error: any) {
    console.error('Error verifying domain:', error);
    return NextResponse.json(
      { error: 'Error verifying domain', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get a description for each verification method
 */
function getMethodDescription(method: VerificationMethod): string {
  switch (method) {
    case VerificationMethod.DNS:
      return 'Verify ownership by adding a TXT record to your domain DNS settings';
    case VerificationMethod.FILE:
      return 'Upload a verification file to your website server';
    case VerificationMethod.META:
      return 'Add a meta tag to your website\'s homepage';
    default:
      return 'Verification method';
  }
} 