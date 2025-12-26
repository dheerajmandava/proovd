import { NextRequest, NextResponse } from 'next/server';
import { getNotificationsByWebsiteId } from '@/app/lib/services/notification.service';
import { isValidObjectId } from '@/app/lib/server-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const siteId = searchParams.get('siteId');
        const shopDomain = searchParams.get('shop');

        // CORS headers
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Cache-Control': 'no-store, max-age=0',
        };

        let resolvedSiteId = siteId;

        // If no siteId but shop domain is provided, look up the website
        if (!resolvedSiteId && shopDomain) {
            const { connectToDatabase } = await import('@/app/lib/database/connection');
            const Website = (await import('@/app/lib/models/website')).default;
            await connectToDatabase();

            const website = await Website.findOne({ 'shopify.shop': shopDomain });
            if (website) {
                resolvedSiteId = website._id.toString();
                console.log(`Resolved shop ${shopDomain} to siteId ${resolvedSiteId}`);
            }
        }

        if (!resolvedSiteId) {
            return NextResponse.json(
                { error: 'Site ID or shop domain is required' },
                { status: 400, headers }
            );
        }

        if (!isValidObjectId(resolvedSiteId)) {
            return NextResponse.json(
                { error: 'Invalid Site ID' },
                { status: 400, headers }
            );
        }

        // Fetch active campaigns
        const campaigns = await getNotificationsByWebsiteId(resolvedSiteId);

        return NextResponse.json(
            {
                success: true,
                campaigns: campaigns
            },
            { status: 200, headers }
        );
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function OPTIONS(request: NextRequest) {
    return NextResponse.json(
        {},
        {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        }
    );
}
