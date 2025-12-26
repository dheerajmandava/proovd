/**
 * Shopify Products API
 * GET /api/shopify/products?websiteId=xxx
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectToDatabase } from '@/app/lib/database/connection';
import Website from '@/app/lib/models/website';
import { ShopifyClient } from '@/app/lib/shopify/client';

export async function GET(request: NextRequest) {
    // Verify session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const websiteId = request.nextUrl.searchParams.get('websiteId');
    if (!websiteId) {
        return NextResponse.json({ error: 'Missing websiteId' }, { status: 400 });
    }

    try {
        await connectToDatabase();

        const website = await Website.findById(websiteId);
        if (!website) {
            return NextResponse.json({ error: 'Website not found' }, { status: 404 });
        }

        // Check if user owns this website
        if (website.userId.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check if Shopify is connected
        if (!website.shopify?.accessToken || !website.shopify?.shop) {
            return NextResponse.json(
                { error: 'Shopify not connected', connected: false },
                { status: 400 }
            );
        }

        // Fetch products from Shopify
        const client = new ShopifyClient(
            website.shopify.shop,
            website.shopify.accessToken
        );

        const products = await client.getProducts(100);

        return NextResponse.json({
            connected: true,
            shop: website.shopify.shop,
            products,
        });
    } catch (error: any) {
        console.error('Error fetching Shopify products:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch products',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                response: error.response ? JSON.stringify(error.response) : undefined
            },
            { status: 500 }
        );
    }
}
