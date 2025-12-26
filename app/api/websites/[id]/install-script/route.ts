/**
 * POST /api/websites/[id]/install-script
 * Installs the Proovd widget ScriptTag on a connected Shopify store
 * Uses the stored access token - no OAuth required
 */
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/database/connection';
import Website from '@/app/lib/models/website';
import { auth } from '@/auth';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: websiteId } = await params;

        await connectToDatabase();
        const website = await Website.findById(websiteId);

        if (!website) {
            return NextResponse.json({ error: 'Website not found' }, { status: 404 });
        }

        // Check Shopify connection
        if (!website.shopify?.shop || !website.shopify?.accessToken) {
            return NextResponse.json(
                { error: 'Shopify not connected. Please connect your store first.' },
                { status: 400 }
            );
        }

        const { shop, accessToken } = website.shopify;

        // ScriptTag requires HTTPS with proper Content-Type headers.
        // jsDelivr CDN serves Gists with correct headers for browser execution.
        const scriptSrc = process.env.SHOPIFY_SCRIPT_URL ||
            'https://cdn.jsdelivr.net/gh/dheerajmandava/widget.js@d556cd19f4c6d48eedc612fe4f656635567cec45/widget.js';

        console.log('Installing ScriptTag:', { shop, scriptSrc });

        // Try using the stored access token first
        let authToken = accessToken;
        let tokenValid = false;

        // Test if token is valid
        const testResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
            headers: { 'X-Shopify-Access-Token': authToken },
        });
        tokenValid = testResponse.ok;

        if (!tokenValid) {
            // Token is invalid - need to get a new one through OAuth
            // For now, return an error with instructions
            return NextResponse.json({
                error: 'Access token is invalid or expired',
                instructions: 'Please reconnect your Shopify store. Go to Shopify Admin > Apps > proovd and reinstall the app.',
                details: 'The stored access token has expired. You need to re-authorize the app from your Shopify Admin.'
            }, { status: 401 });
        }

        // First, check if script already exists and delete old ones
        const existingResponse = await fetch(`https://${shop}/admin/api/2024-01/script_tags.json`, {
            method: 'GET',
            headers: {
                'X-Shopify-Access-Token': accessToken,
            },
        });

        if (existingResponse.ok) {
            const existingData = await existingResponse.json();
            const existingScripts = existingData.script_tags || [];

            // Remove any existing Proovd scripts
            for (const script of existingScripts) {
                if (script.src.includes('widget.js') || script.src.includes('proovd')) {
                    await fetch(`https://${shop}/admin/api/2024-01/script_tags/${script.id}.json`, {
                        method: 'DELETE',
                        headers: {
                            'X-Shopify-Access-Token': accessToken,
                        },
                    });
                    console.log('Deleted old ScriptTag:', script.id);
                }
            }
        }

        // Register new ScriptTag
        const scriptTagResponse = await fetch(`https://${shop}/admin/api/2024-01/script_tags.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
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
            console.error('ScriptTag registration failed:', errorText);
            return NextResponse.json(
                { error: 'Failed to install script', details: errorText },
                { status: 500 }
            );
        }

        const result = await scriptTagResponse.json();
        console.log('ScriptTag installed successfully:', result);

        return NextResponse.json({
            success: true,
            message: 'Widget script installed successfully!',
            scriptTag: result.script_tag,
        });

    } catch (error) {
        console.error('Install script error:', error);
        return NextResponse.json(
            { error: 'Failed to install script', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
