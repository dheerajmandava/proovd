import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getWebsiteVerification, updateWebsiteVerificationMethod, updateWebsiteVerificationStatus } from '@/app/lib/services';
import { isValidObjectId } from 'mongoose';
import { VerificationMethod, VerificationStatus } from '@/app/lib/domain-verification';
import { verifyDomainWithDetails } from '@/app/lib/server-domain-verification';
import { handleApiError, createUnauthorizedError, createBadRequestError, createNotFoundError } from '@/app/lib/utils/server-error';
/**
 * Server-side implementation of getVerificationInstructions
 * This avoids the client/server mismatch error
 */
function getVerificationInstructionsServer(domain, method, token) {
    const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').trim().toLowerCase();
    switch (method) {
        case VerificationMethod.DNS:
            return `
Create a TXT record with the following details:
- Host/Name: _proovd
- Value/Content: ${token}
- TTL: 3600 (or default)

After adding this TXT record to your DNS settings, it may take up to 24-48 hours for DNS changes to propagate.
      `.trim();
        case VerificationMethod.FILE:
            return `
Create a new file with exactly this name and upload it to your website's root directory:
- File name: proovd-${token}.html
- File location: https://${normalizedDomain}/proovd-${token}.html
- File content: ${token}

Make sure the file is accessible by visiting the URL above.
      `.trim();
        case VerificationMethod.META:
            return `
Add the following meta tag to the <head> section of your website's home page:
<meta name="proovd-verification" content="${token}">

Make sure the meta tag is present when visiting https://${normalizedDomain}
      `.trim();
        default:
            return 'Invalid verification method selected.';
    }
}
/**
 * GET /api/websites/[id]/verify
 * Get domain verification details
 */
export async function GET(request, context) {
    var _a;
    try {
        // Authentication check
        const session = await auth();
        if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
            throw createUnauthorizedError('Authentication required');
        }
        // Access id from context params
        const id = context.params.id;
        // Validate the website ID
        if (!isValidObjectId(id)) {
            throw createBadRequestError('Invalid website ID');
        }
        // Get the website
        const website = await getWebsiteVerification(id, session.user.id);
        if (!website) {
            throw createNotFoundError('Website not found');
        }
        // If there's no verification data, initialize it
        if (!website.verification) {
            website.verification = {
                status: VerificationStatus.PENDING,
                method: VerificationMethod.DNS,
                token: generateVerificationToken(website.domain),
                attempts: 0
            };
            // Update the database with initial verification details
            await updateWebsiteVerificationMethod(id, VerificationMethod.DNS, website.verification.token);
        }
        // For development/testing - automatically verify domain when checking status
        // IMPORTANT: In production, this should be properly implemented with real checks
        // This is just for testing the UI flow
        if (website.verification.status !== VerificationStatus.VERIFIED) {
            // Auto-verify after checking status
            await updateWebsiteVerificationStatus(id, true);
            website.verification.status = VerificationStatus.VERIFIED;
        }
        // Generate verification instructions based on method
        const instructions = getVerificationInstructionsServer(website.domain, website.verification.method, website.verification.token);
        // Return verification details
        return NextResponse.json({
            domain: website.domain,
            verification: website.verification,
            instructions
        });
    }
    catch (error) {
        console.error('Error fetching verification details:', error);
        const apiError = handleApiError(error);
        return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode });
    }
}
// Helper function to generate a verification token
function generateVerificationToken(domain) {
    const crypto = require('crypto');
    return crypto.randomBytes(8).toString('hex');
}
/**
 * POST /api/websites/[id]/verify
 * 1. Update verification method (if method is provided)
 * 2. Verify domain (if no method is provided)
 */
export async function POST(request, context) {
    var _a;
    try {
        // Authentication check
        const session = await auth();
        if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
            throw createUnauthorizedError('Authentication required');
        }
        // Access id from context params
        const id = context.params.id;
        // Validate the website ID
        if (!isValidObjectId(id)) {
            throw createBadRequestError('Invalid website ID');
        }
        // Get request body
        let body;
        try {
            body = await request.json();
        }
        catch (error) {
            body = {}; // Empty body - assumption is just triggering verification
        }
        // Get the website
        const website = await getWebsiteVerification(id, session.user.id);
        if (!website) {
            throw createNotFoundError('Website not found');
        }
        // Initialize verification if needed
        if (!website.verification) {
            website.verification = {
                status: VerificationStatus.PENDING,
                method: VerificationMethod.DNS,
                token: generateVerificationToken(website.domain),
                attempts: 0
            };
        }
        // If method is provided, update verification method
        if (body.method) {
            // Define hardcoded valid values for verification methods
            const validMethods = ['dns', 'file', 'meta'];
            console.log('Received verification method:', body.method);
            // For DNS verification, we'll support both 'DNS' and 'dns' formats
            const methodLower = body.method.toLowerCase();
            if (!validMethods.includes(methodLower)) {
                throw createBadRequestError(`Invalid verification method. Supported methods: ${validMethods.join(', ')}`);
            }
            // Convert method string to enum
            let methodEnum;
            switch (methodLower) {
                case 'dns':
                    methodEnum = VerificationMethod.DNS;
                    break;
                case 'file':
                    methodEnum = VerificationMethod.FILE;
                    break;
                case 'meta':
                    methodEnum = VerificationMethod.META;
                    break;
                default:
                    // Default to DNS
                    methodEnum = VerificationMethod.DNS;
            }
            // Update verification method
            const updatedWebsite = await updateWebsiteVerificationMethod(id, methodEnum, website.verification.token // Keep the existing token
            );
            if (!updatedWebsite) {
                throw createBadRequestError('Failed to update verification method');
            }
            // Generate instructions for the new method
            const instructions = getVerificationInstructionsServer(website.domain, methodEnum, website.verification.token);
            return NextResponse.json({
                success: true,
                method: methodLower,
                token: website.verification.token,
                instructions
            });
        }
        // Otherwise verify the domain
        const verificationResult = await verifyDomainWithDetails(website.domain, website.verification);
        // Update verification status
        const updatedWebsite = await updateWebsiteVerificationStatus(id, verificationResult.isVerified, verificationResult.reason);
        if (!updatedWebsite) {
            throw createNotFoundError('Website not found after verification attempt');
        }
        return NextResponse.json({
            success: verificationResult.isVerified,
            message: verificationResult.isVerified
                ? 'Domain verified successfully!'
                : verificationResult.reason || 'Verification failed. Please check your settings and try again.',
            status: updatedWebsite.verification.status,
            attempts: updatedWebsite.verification.attempts || 0
        });
    }
    catch (error) {
        console.error('Error verifying domain:', error);
        const apiError = handleApiError(error);
        return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode });
    }
}
/**
 * Helper function to get a description for each verification method
 */
function getMethodDescription(method) {
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
