import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { initializeDomainVerification } from '@/app/lib/server-domain-verification';
import { authOptions } from '@/auth';
export async function POST(request) {
    try {
        // Check if user is authenticated
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Parse request body
        const body = await request.json();
        const { domain, method } = body;
        // Validate input
        if (!domain) {
            return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
        }
        if (!method || !['DNS', 'FILE', 'META'].includes(method)) {
            return NextResponse.json({ error: 'Valid verification method is required' }, { status: 400 });
        }
        // Initialize domain verification (generate token, etc.)
        const verificationData = await initializeDomainVerification(domain, method);
        // Generate user-friendly instructions based on the verification method
        let instructions = '';
        const token = verificationData.token;
        if (method === 'DNS') {
            instructions = `
Create a DNS TXT record with the following values:
Host/Name: _proovd.${domain}
Value/Content: ${token}

This may take up to 24 hours to propagate, though it often happens within minutes.
`;
        }
        else if (method === 'FILE') {
            instructions = `
Create a file at the following URL:
https://${domain}/.well-known/proovd-verification.txt

The file should contain the following text (and nothing else):
${token}
`;
        }
        else if (method === 'META') {
            instructions = `
Add the following meta tag to the <head> section of your website's homepage:
<meta name="proovd-verification" content="${token}">
`;
        }
        // Return the verification data with instructions
        return NextResponse.json({
            domain,
            method,
            token,
            instructions,
            createdAt: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error initializing verification:', error);
        return NextResponse.json({ error: 'Failed to initialize verification', details: error.message }, { status: 500 });
    }
}
