import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import { isValidObjectId } from '@/app/lib/server-utils';
import { VerificationMethod } from '@/app/lib/domain-verification';
import { verifyDomainWithDetails } from '@/app/lib/server-domain-verification';
import { generateApiKey } from '@/app/lib/api-key';

// Server-side implementation of verification instructions
function getDnsVerificationInstructions(domain: string, token: string): string {
  // Clean the domain
  const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
  
  return `
To verify ownership of ${normalizedDomain}, add this TXT record to your DNS settings:

- Record type: TXT
- Host/Name: _proovd.${normalizedDomain}
- Value/Content: ${token}
- TTL: 3600 (or default)

After adding this TXT record to your DNS settings, click the "Verify" button below.
DNS changes can take 5-30 minutes to propagate, but may take up to 24-48 hours in some cases.

Need help? Most domain registrars have guides on adding TXT records:
- GoDaddy: https://www.godaddy.com/help/add-a-txt-record-19232
- Namecheap: https://www.namecheap.com/support/knowledgebase/article.aspx/317/2237/how-do-i-add-txtspfdkimdmarc-records-for-my-domain/
- Cloudflare: https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/
`.trim();
}

/**
 * POST /api/websites/[id]/verify
 * 
 * Verifies a website domain
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  console.log('Domain verification API called for website ID:', id);
  
  try {
    // Enhanced authentication check
    const session = await auth();
    if (!session?.user?.id) {
      console.log('Authentication failed for website verification API');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Additional logging for security tracking
    console.log(`User ${session.user.id} attempting to verify website ${id}`);

    // Validate website ID
    if (!id || !isValidObjectId(id)) {
      console.log('Invalid website ID format');
      return NextResponse.json({ error: 'Invalid website ID' }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();
    
    // Get the website and verify ownership
    const website = await Website.findOne({
      _id: id,
      userId: session.user.id
    });

    if (!website) {
      console.log('Website not found or not owned by user');
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Only DNS verification is supported now
    website.verification.method = VerificationMethod.DNS;
    
    // This is a verification request
    console.log('Verifying domain:', website.domain);
    
    // Increment attempts
    website.verification.attempts += 1;
    
    // Verify the domain using DNS with detailed result
    const verificationResult = await verifyDomainWithDetails(website.domain, website.verification);
    
    if (verificationResult.isVerified) {
      // Update verification status
      website.verification.status = 'verified';
      website.verification.verifiedAt = new Date().toISOString();
      website.status = 'active'; // Change this to 'active' to match the flow
      
      // Create the first API key after verification
      if (!website.apiKeys || website.apiKeys.length === 0) {
        const initialApiKey = {
          id: new Date().getTime().toString(),
          key: generateApiKey(),
          name: 'Default',
          allowedOrigins: [website.domain],
          createdAt: new Date().toISOString(),
        };
        
        website.apiKeys = [initialApiKey];
      }
      
      await website.save();
      
      return NextResponse.json({
        success: true,
        message: 'Domain verified successfully',
        verified: true,
        token: website.verification.token
      });
    } else {
      // Update verification status
      website.verification.status = 'failed';
      
      await website.save();
      
      return NextResponse.json({
        success: false,
        message: verificationResult.reason || 'Domain verification failed. Please check the DNS record and try again.',
        verified: false,
        token: website.verification.token
      });
    }
  } catch (error) {
    console.error('Error verifying domain:', error);
    return NextResponse.json({ 
      error: 'Failed to verify domain',
      details: (error as Error).message 
    }, { status: 500 });
  }
}

/**
 * GET /api/websites/[id]/verify
 * 
 * Retrieves verification status and instructions
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  console.log('Get verification status for website ID:', id);
  
  try {
    // Enhanced authentication check
    const session = await auth();
    if (!session?.user?.id) {
      console.log('Authentication failed for website verification status API');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Additional logging for security tracking
    console.log(`User ${session.user.id} requesting verification status for website ${id}`);

    // Validate website ID
    if (!id || !isValidObjectId(id)) {
      console.log('Invalid website ID format');
      return NextResponse.json({ error: 'Invalid website ID' }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();
    
    // Get the website and verify ownership
    const website = await Website.findOne({
      _id: id,
      userId: session.user.id
    });

    if (!website) {
      console.log('Website not found or not owned by user');
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }
    
    // Get verification instructions for DNS only
    const instructions = getDnsVerificationInstructions(
      website.domain,
      website.verification.token
    );
    
    // Return verification status and instructions
    return NextResponse.json({
      domain: website.domain,
      verification: {
        status: website.verification.status,
        method: VerificationMethod.DNS, // Always DNS
        token: website.verification.token,
        attempts: website.verification.attempts,
        verifiedAt: website.verification.verifiedAt
      },
      methods: [VerificationMethod.DNS], // Only offer DNS verification
      instructions
    });
  } catch (error) {
    console.error('Error getting verification status:', error);
    return NextResponse.json({ 
      error: 'Failed to get verification status',
      details: (error as Error).message 
    }, { status: 500 });
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