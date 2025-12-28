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

        // Format output
        const totalImpressions = stats.reduce((acc, curr) => acc + curr.impressions, 0);
        const totalConversions = stats.reduce((acc, curr) => acc + curr.conversions, 0);

        const formattedVariants = stats.map(s => ({
            variantId: s._id,
            impressions: s.impressions,
            conversions: s.conversions,
            clicks: s.clicks,
            conversionRate: s.impressions > 0 ? (s.conversions / s.impressions) * 100 : 0
        }));

        return NextResponse.json({
            success: true,
            stats: {
                totalImpressions,
                totalConversions,
                conversionRate: totalImpressions > 0 ? (totalConversions / totalImpressions) * 100 : 0,
                variants: formattedVariants,
                updatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error fetching campaign stats:', error);
        const apiError = handleApiError(error);
        return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode });
    }
}
