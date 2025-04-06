import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isValidObjectId } from 'mongoose';
import { 
  createWebsite, 
  getWebsitesByUserId, 
  getWebsiteById,
  deleteWebsite, 
  getWebsiteByDomain,
  updateWebsiteVerificationStatus
} from '@/app/lib/services';
import { 
  CustomError, 
  createUnauthorizedError, 
  createBadRequestError, 
  createNotFoundError, 
  handleApiError 
} from '@/app/lib/utils/server-error';
import { extractDomain } from '@/app/lib/server-utils';
import { initializeDomainVerification, verifyDomainWithDetails } from '@/app/lib/server-domain-verification';
import { VerificationMethod } from '@/app/lib/domain-verification';

/**
 * NOTE: MongoDB transactions require a replica set or mongos deployment.
 * For production deployment, ensure your MongoDB connection is to:
 * 1. MongoDB Atlas (recommended for production)
 * 2. A self-hosted MongoDB replica set
 * 3. A sharded MongoDB cluster
 * 
 * If using MongoDB locally, you must configure a replica set.
 * See: https://www.mongodb.com/docs/manual/tutorial/deploy-replica-set/
 */

/**
 * POST /api/websites
 * Create a new website
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      throw createUnauthorizedError('Authentication required');
    }

    // Parse request body
    const body = await req.json();
    const { name, domain, verificationMethod, verificationToken } = body;
    
    // Basic validation
    if (!name || !domain) {
      throw createBadRequestError('Name and domain are required');
    }
    
    // Normalize domain
    const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').trim().toLowerCase();
    
    // Check if domain already exists for this user
    const existingWebsite = await getWebsiteByDomain(normalizedDomain);
    
    if (existingWebsite && existingWebsite.userId === session.user.id) {
      throw createBadRequestError('You already have a website with this domain');
    }
    
    // Initialize domain verification
    // If a verification token is provided, use it instead of generating a new one
    let verification;
    if (verificationToken) {
      // Use the existing token provided by the client
      verification = {
        status: 'pending',
        method: verificationMethod || 'DNS',
        token: verificationToken,
        attempts: 0
      };
    } else {
      // Generate a new verification token
      verification = initializeDomainVerification(normalizedDomain);
    }
    
    // First verify the domain before creating the website
    const verificationResult = await verifyDomainWithDetails(normalizedDomain, verification);
    
    if (!verificationResult.isVerified) {
      // Return the verification details so the user can complete verification
      return NextResponse.json({
        error: 'Domain verification required',
        details: verificationResult.reason,
        verification,
        token: verification.token,
      }, { status: 400 });
    }
    
    // Only create the website if verification has passed
    const websiteData = {
      name: name.trim(),
      domain: normalizedDomain,
      userId: session.user.id,
      status: 'active',
      verification: {
        ...verification,
        status: 'verified',
        verifiedAt: new Date().toISOString()
      },
      settings: {
        position: 'bottom-left',
        delay: 5,
        displayDuration: 5,
        maxNotifications: 5,
        theme: 'light',
        displayOrder: 'newest',
        randomize: false,
        initialDelay: 5,
        loop: false,
        customStyles: ''
      }
    };
    
    // Create new website
    const website = await createWebsite(websiteData);
    
    // Explicitly update verification status to ensure it's properly saved
    await updateWebsiteVerificationStatus(website._id.toString(), true);
    
    return NextResponse.json({
      id: website._id,
      name: website.name,
      domain: website.domain,
      status: website.status
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating website:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.statusCode }
    );
  }
}

// Helper function to generate user-friendly verification instructions
function generateVerificationInstructions(domain: string, method: string, token: string): string {
  let instructions = '';
  
  if (method === 'DNS') {
    instructions = `
Create a DNS TXT record with the following values:
Host/Name: _proovd.${domain}
Value/Content: ${token}

This may take up to 24 hours to propagate, though it often happens within minutes.
`;
  } else if (method === 'FILE') {
    instructions = `
Create a file at the following URL:
https://${domain}/.well-known/proovd-verification.txt

The file should contain the following text (and nothing else):
${token}
`;
  } else if (method === 'META') {
    instructions = `
Add the following meta tag to the <head> section of your website's homepage:
<meta name="proovd-verification" content="${token}">
`;
  }
  
  return instructions;
}

/**
 * GET /api/websites
 * 
 * Fetches all websites for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      throw createUnauthorizedError('Authentication required');
    }
    
    // Get websites from service
    const websites = await getWebsitesByUserId(session.user.id);
    
    // Format response with consistent structure
    return NextResponse.json({ 
      websites: websites,
      success: true 
    });
    
  } catch (error: any) {
    console.error('Error fetching websites:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.statusCode }
    );
  }
}

/**
 * DELETE /api/websites
 * 
 * Removes a website by ID, ensuring the current user owns it
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      throw createUnauthorizedError('Authentication required');
    }
    
    // Get the website ID from the search params
    const url = new URL(request.url);
    const websiteId = url.searchParams.get('id');
    
    if (!websiteId) {
      throw createBadRequestError('Website ID is required');
    }
    
    if (!isValidObjectId(websiteId)) {
      throw createBadRequestError('Invalid website ID');
    }
    
    // Get website to verify ownership
    const website = await getWebsiteById(websiteId);
    
    if (!website) {
      throw createNotFoundError('Website not found');
    }
    
    // Check if user owns the website
    if (website.userId !== session.user.id) {
      throw createUnauthorizedError('You do not have permission to delete this website');
    }
    
    // Delete the website with service
    const success = await deleteWebsite(websiteId);
    
    if (!success) {
      throw createNotFoundError('Website not found or already deleted');
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Website deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting website:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.statusCode }
    );
  }
} 