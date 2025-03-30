import { NextResponse } from 'next/server';
import { extractDomain } from '@/app/lib/server-utils';
import { auth } from '@/auth';
import { validateDomain } from './helpers';
/**
 * POST /api/domains/validate
 *
 * Pre-validates a domain before allowing website creation
 */
export async function POST(req) {
    var _a;
    console.log('Domain validation API called');
    try {
        // Check authentication
        const session = await auth();
        if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
            console.log('Auth failed, user not authenticated');
            return NextResponse.json({
                error: 'Authentication required'
            }, { status: 401 });
        }
        // Get request body
        const body = await req.json();
        const { domain } = body;
        console.log('Validating domain:', domain);
        if (!domain) {
            console.log('Domain is required but was not provided');
            return NextResponse.json({
                error: 'Domain is required',
                valid: false
            }, { status: 400 });
        }
        // Clean and extract domain
        let cleanDomain = domain.trim().toLowerCase();
        // Extract domain if it's a full URL
        if (cleanDomain.startsWith('http')) {
            try {
                const url = new URL(cleanDomain);
                cleanDomain = url.hostname;
            }
            catch (error) {
                cleanDomain = extractDomain(cleanDomain);
            }
        }
        console.log('Extracted clean domain:', cleanDomain);
        // Perform validation checks
        const validation = await validateDomain(cleanDomain);
        console.log('Validation result:', validation);
        return NextResponse.json(validation);
    }
    catch (error) {
        console.error('Error validating domain:', error);
        return NextResponse.json({
            error: 'Failed to validate domain',
            valid: false,
            details: error.message
        }, { status: 500 });
    }
}
