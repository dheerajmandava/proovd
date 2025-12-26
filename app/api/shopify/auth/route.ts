import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');
    const websiteId = searchParams.get('websiteId');

    if (!shop) {
        return NextResponse.json(
            { error: 'Missing shop parameter' },
            { status: 400 }
        );
    }

    // Validate shop domain format
    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
    if (!shopRegex.test(shop)) {
        return NextResponse.json(
            { error: 'Invalid shop domain format' },
            { status: 400 }
        );
    }

    // Generate state token for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');

    // Store state with websiteId and userId in a cookie
    const stateData = JSON.stringify({
        state,
        websiteId,
        userId: session.user.id
    });

    // Build OAuth URL
    // Build OAuth URL
    const host = request.headers.get('host');
    const isLocal = host?.includes('localhost');
    const protocol = isLocal ? 'http' : 'https';

    // Allow manual override via query param (critical for dev tunnels)
    let tunnelUrl = searchParams.get('tunnel_url');

    // Ensure tunnel URL has https:// protocol
    if (tunnelUrl && !tunnelUrl.startsWith('http://') && !tunnelUrl.startsWith('https://')) {
        tunnelUrl = `https://${tunnelUrl}`;
    }

    // Priority: 1. Manual Tunnel URL, 2. Env Var (Prod), 3. Host Header
    const baseUrl = tunnelUrl || (isLocal ? null : process.env.SHOPIFY_APP_URL) || `${protocol}://${host}`;
    const redirectUri = `${baseUrl}/api/shopify/callback`;

    console.log('OAuth Start Debug:', {
        host,
        isLocal,
        baseUrl,
        redirectUri,
        envAppUrl: process.env.SHOPIFY_APP_URL
    });

    const scopes = 'read_products,write_script_tags';

    const authUrl = `https://${shop}/admin/oauth/authorize?` +
        `client_id=${process.env.SHOPIFY_CLIENT_ID}` +
        `&scope=${scopes}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state}`;

    const response = NextResponse.redirect(authUrl);

    // Store state in cookie for validation
    response.cookies.set('shopify_oauth_state', stateData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600, // 10 minutes
        path: '/',
    });

    return response;
}
