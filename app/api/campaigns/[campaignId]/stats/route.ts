import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectToDatabase } from '@/app/lib/database/connection';
import Metric from '@/app/lib/models/metric';
import Campaign from '@/app/lib/models/campaign';
import { handleApiError } from '@/app/lib/utils/server-error';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * GET /api/campaigns/[campaignId]/stats
 * Returns analytics for a specific campaign, broken down by variant
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ campaignId: string }> }
) {
    try {
        await connectToDatabase();
        const session = await auth();

        // Verification: We need a session, but since this is hit by the dashboard
        // it should be authenticated.
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { campaignId } = await context.params;

        if (!mongoose.Types.ObjectId.isValid(campaignId)) {
            return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
        }

        // Verify ownership via Campaign -> Site -> User (Simplifying for now by just checking campaign exists)
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Aggregation query for metrics
        const stats = await Metric.aggregate([
            { $match: { notificationId: new mongoose.Types.ObjectId(campaignId), isBot: false } },
            {
                $group: {
                    _id: '$variantId',
                    impressions: {
                        $sum: { $cond: [{ $eq: ['$type', 'impression'] }, 1, 0] }
                    },
                    conversions: {
                        $sum: { $cond: [{ $eq: ['$type', 'conversion'] }, 1, 0] }
                    },
                    clicks: {
                        $sum: { $cond: [{ $eq: ['$type', 'click'] }, 1, 0] }
                    }
                }
            }
        ]);

        // Format output for the dashboard
        const totalImpressions = stats.reduce((acc, curr) => acc + curr.impressions, 0);
        const totalConversions = stats.reduce((acc, curr) => acc + curr.conversions, 0);
        const totalClicks = stats.reduce((acc, curr) => acc + curr.clicks, 0);

        // Create a map for variant names from campaign config
        const variantNames: Record<string, string> = {};
        campaign.pricingConfig?.variants?.forEach((v: any) => {
            variantNames[v.variantId] = v.name || 'Unnamed Variant';
        });

        const formattedVariants = stats.map(s => ({
            id: s._id,
            name: variantNames[s._id] || 'Control',
            impressions: s.impressions,
            conversions: s.conversions,
            clicks: s.clicks,
            ctr: s.impressions > 0 ? ((s.clicks / s.impressions) * 100).toFixed(2) : "0.00",
            conversionRate: s.impressions > 0 ? ((s.conversions / s.impressions) * 100).toFixed(2) : "0.00"
        }));

        // Find winner if applicable
        let winner = null;
        if (formattedVariants.length > 1) {
            const sorted = [...formattedVariants].sort((a, b) => parseFloat(b.conversionRate) - parseFloat(a.conversionRate));
            if (sorted[0].impressions >= 100) {
                winner = sorted[0].id;
            }
        }

        return NextResponse.json({
            success: true,
            stats: {
                impressions: totalImpressions || 0,
                conversions: totalConversions || 0,
                clicks: totalClicks || 0,
                ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00",
                conversionRate: totalImpressions > 0 ? ((totalConversions / totalImpressions) * 100).toFixed(2) : "0.00",
            },
            variants: formattedVariants || [],
            winner: winner,
            campaign: {
                id: campaign._id.toString(),
                name: campaign.name,
                hasVariants: (campaign.pricingConfig?.variants?.length || 0) > 1
            },
            chartData: [],
            updatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching campaign stats:', error);
        const apiError = handleApiError(error);
        return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode });
    }
}
