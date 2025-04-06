import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { verifyDomainWithDetails } from '@/app/lib/server-domain-verification';
import { createUnauthorizedError, handleApiError } from '@/app/lib/utils/server-error';
import { VerificationMethod, VerificationStatus } from '@/app/lib/domain-verification';

/**
 * POST /api/websites/verify-dns
 * Verify a domain's DNS TXT record before creating a website
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
    const { domain, token } = body;
    
    // Basic validation
    if (!domain || !token) {
      return NextResponse.json({ 
        error: 'Domain and token are required',
        verified: false 
      }, { status: 400 });
    }
    
    // Normalize domain
    const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').trim().toLowerCase();
    
    // Create verification data structure
    const verification = {
      status: VerificationStatus.PENDING,
      method: VerificationMethod.DNS,
      token,
      attempts: 0
    };
    
    // Verify the domain's DNS TXT record
    const verificationResult = await verifyDomainWithDetails(normalizedDomain, verification);
    
    if (!verificationResult.isVerified) {
      return NextResponse.json({
        verified: false,
        error: verificationResult.reason || 'Domain verification failed',
        details: `Please ensure you've added the TXT record with Host: _proovd.${normalizedDomain} and Value: ${token}`
      }, { status: 200 });
    }
    
    // Verification successful
    return NextResponse.json({
      verified: true,
      domain: normalizedDomain
    });
    
  } catch (error: any) {
    console.error('Error verifying DNS:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { 
        error: apiError.message,
        verified: false 
      },
      { status: apiError.statusCode }
    );
  }
} 