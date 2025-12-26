import { NextResponse } from 'next/server';
import { getWebsiteById, getCampaignsByWebsite, createCampaign } from '@/app/lib/services';
import { sanitizeInput, isValidObjectId } from '@/app/lib/server-utils';
import { auth } from '@/auth';
import { handleApiError } from '@/app/lib/utils/server-error';

/**
 * GET /api/websites/[id]/campaigns
 * Fetch all campaigns for a specific website
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { id } = await context.params;

        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid website ID' }, { status: 400 });
        }

        const website = await getWebsiteById(id);
        if (!website) {
            return NextResponse.json({ error: 'Website not found' }, { status: 404 });
        }

        if (website.userId.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const campaigns = await getCampaignsByWebsite(id);

        return NextResponse.json({
            success: true,
            campaigns,
            count: campaigns.length
        });
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        const apiError = handleApiError(error);
        return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode });
    }
}

/**
 * POST /api/websites/[id]/campaigns
 * Create a new campaign
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { id } = await context.params;

        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid website ID' }, { status: 400 });
        }

        const website = await getWebsiteById(id);
        if (!website) {
            return NextResponse.json({ error: 'Website not found' }, { status: 404 });
        }

        if (website.userId.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const body = await request.json();

        if (!body.name) {
            return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
        }

        const campaign = await createCampaign({
            name: sanitizeInput(body.name),
            message: body.message ? sanitizeInput(body.message) : '',
            components: body.components || [],
            siteId: website._id,
            url: body.url ? sanitizeInput(body.url) : '',
            image: body.image ? sanitizeInput(body.image) : '',
            status: body.status || 'active',
            type: body.type || 'popup',
            priority: body.priority ? parseInt(body.priority) : 0,
            content: body.content,
            triggers: body.triggers,
            variants: body.variants,
            position: body.position,
            theme: body.theme,
            displayRules: body.displayRules,
            displayFrequency: body.displayFrequency,
            trafficAllocation: body.trafficAllocation,
            goals: body.goals,
        });

        return NextResponse.json({ success: true, campaign }, { status: 201 });
    } catch (error) {
        console.error('Error creating campaign:', error);
        const apiError = handleApiError(error);
        return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode });
    }
}
