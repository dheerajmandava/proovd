/**
 * Shopify OAuth - Callback Handler
 * GET /api/shopify/callback
 */
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/database/connection';
import Website from '@/app/lib/models/website';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const hmac = searchParams.get('hmac');

    // Get stored state from cookie
    const storedStateData = request.cookies.get('shopify_oauth_state')?.value;
    if (!storedStateData) {
        return NextResponse.json(
            { error: 'OAuth state not found. Please try again.' },
            { status: 400 }
        );
    }

    let websiteId: string | null = null;
    let userId: string | null = null;

    try {
        const parsed = JSON.parse(storedStateData);
        if (parsed.state !== state) {
            return NextResponse.json(
                { error: 'Invalid state parameter. Possible CSRF attack.' },
                { status: 400 }
            );
        }
        websiteId = parsed.websiteId;
        userId = parsed.userId;
    } catch (e) {
        return NextResponse.json(
            { error: 'Invalid state data' },
            { status: 400 }
        );
    }

    if (!shop || !code) {
        return NextResponse.json(
            { error: 'Missing required parameters' },
            { status: 400 }
        );
    }

    // Validate HMAC
    if (hmac && process.env.SHOPIFY_CLIENT_SECRET) {
        const queryParams = new URLSearchParams(searchParams);
        queryParams.delete('hmac');

        // Sort parameters alphabetically
        const sortedParams = Array.from(queryParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('&');

        const computedHmac = crypto
            .createHmac('sha256', process.env.SHOPIFY_CLIENT_SECRET)
            .update(sortedParams)
            .digest('hex');

        if (hmac !== computedHmac) {
            return NextResponse.json(
                { error: 'Invalid HMAC signature' },
                { status: 400 }
            );
        }
    }

    try {
        // Debug logging
        console.log('Token Exchange Debug:', {
            shop,
            code: code?.substring(0, 10) + '...',
            hasClientId: !!process.env.SHOPIFY_CLIENT_ID,
            hasClientSecret: !!process.env.SHOPIFY_CLIENT_SECRET,
            tokenUrl: `https://${shop}/admin/oauth/access_token`
        });

        // Exchange code for access token
        const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.SHOPIFY_CLIENT_ID,
                client_secret: process.env.SHOPIFY_CLIENT_SECRET,
                code,
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Token exchange failed:', errorText);
            return NextResponse.json(
                { error: 'Failed to exchange authorization code' },
                { status: 500 }
            );
        }

        const tokenData = await tokenResponse.json();
        const { access_token, scope } = tokenData;

        // Store in database
        await connectToDatabase();

        if (websiteId === 'new' && userId) {
            // userId is already extracted from state
            const domain = shop.replace('.myshopify.com', '');

            // Checks if website already exists for this user and domain
            let website = await Website.findOne({ userId, domain });

            if (!website) {
                // Create new website
                website = await Website.create({
                    userId,
                    name: shop.replace('.myshopify.com', ''),
                    domain: domain,
                    status: 'active',
                    shopify: {
                        shop,
                        accessToken: access_token,
                        scope,
                        installedAt: new Date(),
                        isActive: true,
                    },
                    verification: {
                        status: 'verified',
                        method: 'DNS', // Defaulting to DNS enum but marking verified
                        verifiedAt: new Date(),
                        token: crypto.randomBytes(16).toString('hex')
                    }
                });
            } else {
                // Update existing
                await Website.findByIdAndUpdate(website._id, {
                    $set: {
                        shopify: {
                            shop,
                            accessToken: access_token,
                            scope,
                            installedAt: new Date(),
                            isActive: true,
                        },
                        status: 'active', // Ensure it's active
                        'verification.status': 'verified'
                    },
                });
            }
            websiteId = website._id.toString();
        } else if (websiteId) {
            // Update existing website with Shopify credentials
            await Website.findByIdAndUpdate(websiteId, {
                $set: {
                    shopify: {
                        shop,
                        accessToken: access_token,
                        scope,
                        installedAt: new Date(),
                        isActive: true,
                    },
                    domain: shop.replace('.myshopify.com', ''),
                },
            });
        }

        if (websiteId) {
            // Register ScriptTag
            try {
                // Dynamic host detection to ensure we use the correct tunnel URL
                const host = request.headers.get('host');
                const isLocal = host?.includes('localhost');
                const protocol = isLocal ? 'http' : 'https';
                // Use dynamic host for localhost to avoid stale env vars
                const appUrl = (isLocal ? null : process.env.SHOPIFY_APP_URL) || `${protocol}://${host}`;
                const scriptSrc = `${appUrl}/widget.js`;

                console.log('Registering ScriptTag:', scriptSrc);

                const scriptTagResponse = await fetch(`https://${shop}/admin/api/2025-10/script_tags.json`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Shopify-Access-Token': access_token,
                    },
                    body: JSON.stringify({
                        script_tag: {
                            event: 'onload',
                            src: scriptSrc,
                        },
                    }),
                });

                if (!scriptTagResponse.ok) {
                    const errorText = await scriptTagResponse.text();
                    console.error('Failed to register ScriptTag:', errorText);
                } else {
                    console.log('ScriptTag registered successfully');
                }
            } catch (err) {
                console.error('Error registering ScriptTag:', err);
            }
        }

        // Clear the state cookie
        const response = NextResponse.redirect(
            new URL(
                `/dashboard/websites/${websiteId}?shopify=connected`,
                request.url
            )
        );

        response.cookies.delete('shopify_oauth_state');

        return response;
    } catch (error) {
        console.error('OAuth callback error:', error);
        return NextResponse.json(
            {
                error: 'Authentication failed',
                details: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
