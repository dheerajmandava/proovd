import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getWebsiteById, getCampaignById, updateCampaign, deleteCampaign } from '@/app/lib/services';
import Campaign from '@/app/lib/models/campaign';
import { handleApiError } from '@/app/lib/utils/server-error';
import { isValidObjectId } from '@/app/lib/server-utils';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/app/lib/database/connection';

/**
 * GET /api/websites/[id]/campaigns/[campaignId]
 * Get a specific campaign
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string; campaignId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { id: websiteId, campaignId } = await context.params;

        if (!isValidObjectId(websiteId) || !isValidObjectId(campaignId)) {
            return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
        }

        const website = await getWebsiteById(websiteId);
        if (!website || website.userId.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Website not found or unauthorized' }, { status: 404 });
        }

        const campaign = await getCampaignById(campaignId);
        if (!campaign || campaign.siteId.toString() !== websiteId) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, campaign });
    } catch (error) {
        const apiError = handleApiError(error);
        return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode });
    }
}

/**
 * PUT /api/websites/[id]/campaigns/[campaignId]
 * Update a campaign
 */
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string; campaignId: string }> }
) {
    try {
        await connectToDatabase();
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { id: websiteId, campaignId } = await context.params;

        if (!isValidObjectId(websiteId) || !isValidObjectId(campaignId)) {
            return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
        }

        const website = await getWebsiteById(websiteId);
        if (!website || website.userId.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Website not found or unauthorized' }, { status: 404 });
        }

        const body = await request.json();

        const updatedCampaign = await Campaign.findOneAndUpdate(
            { _id: campaignId, siteId: websiteId },
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!updatedCampaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        revalidatePath(`/dashboard/websites/${websiteId}/campaigns`);

        return NextResponse.json({ success: true, campaign: updatedCampaign });
    } catch (error) {
        const apiError = handleApiError(error);
        return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode });
    }
}

/**
 * DELETE /api/websites/[id]/campaigns/[campaignId]
 * Delete a campaign
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string; campaignId: string }> }
) {
    try {
        await connectToDatabase();
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { id: websiteId, campaignId } = await context.params;

        if (!isValidObjectId(websiteId) || !isValidObjectId(campaignId)) {
            return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
        }

        const website = await getWebsiteById(websiteId);
        if (!website || website.userId.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Website not found or unauthorized' }, { status: 404 });
        }

        const deleteResult = await Campaign.deleteOne({ _id: campaignId, siteId: websiteId });

        if (deleteResult.deletedCount === 0) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        revalidatePath(`/dashboard/websites/${websiteId}/campaigns`);

        return NextResponse.json({ success: true, message: 'Campaign deleted' });
    } catch (error) {
        const apiError = handleApiError(error);
        return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode });
    }
}
