import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, mongoose } from '@/app/lib/database/connection';
import Metric from '@/app/lib/models/metric';
import Campaign from '@/app/lib/models/campaign';
import { handleApiError } from '@/app/lib/utils/server-error';

/**
 * GET /api/campaigns/[id]/stats
 * Get analytics stats for a campaign including A/B test variant breakdown
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id: campaignId } = await context.params;

        if (!mongoose.Types.ObjectId.isValid(campaignId)) {
            return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
        }

        // Get campaign details
        const campaign = await Campaign.findById(campaignId).lean();
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Get aggregate stats from metrics
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Overall stats
        const overallStats = await Metric.aggregate([
            {
                $match: {
                    notificationId: new mongoose.Types.ObjectId(campaignId),
                    isBot: false
                }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    unique: { $sum: { $cond: ['$isUnique', 1, 0] } }
                }
            }
        ]);

        // Variant breakdown for A/B tests
        const variantStats = await Metric.aggregate([
            {
                $match: {
                    notificationId: new mongoose.Types.ObjectId(campaignId),
                    isBot: false,
                    variantId: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: { type: '$type', variantId: '$variantId' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Daily stats for chart (last 30 days)
        const dailyStats = await Metric.aggregate([
            {
                $match: {
                    notificationId: new mongoose.Types.ObjectId(campaignId),
                    isBot: false,
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        type: '$type'
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.date': 1 } }
        ]);

        // Process stats
        let impressions = 0, clicks = 0, conversions = 0;
        overallStats.forEach((stat: any) => {
            if (stat._id === 'impression') impressions = stat.count;
            if (stat._id === 'click') clicks = stat.count;
            if (stat._id === 'conversion') conversions = stat.count;
        });

        const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00';
        const conversionRate = impressions > 0 ? ((conversions / impressions) * 100).toFixed(2) : '0.00';

        // Process variant stats for A/B tests
        const variants: Record<string, { impressions: number; clicks: number; conversions: number }> = {
            control: { impressions: 0, clicks: 0, conversions: 0 }
        };

        // Initialize variant objects
        if (campaign.variants && Array.isArray(campaign.variants)) {
            campaign.variants.forEach((v: any) => {
                variants[v.id] = { impressions: 0, clicks: 0, conversions: 0 };
            });
        }

        variantStats.forEach((stat: any) => {
            const variantId = stat._id.variantId || 'control';
            const type = stat._id.type;
            if (!variants[variantId]) {
                variants[variantId] = { impressions: 0, clicks: 0, conversions: 0 };
            }
            if (type === 'impression') variants[variantId].impressions = stat.count;
            if (type === 'click') variants[variantId].clicks = stat.count;
            if (type === 'conversion') variants[variantId].conversions = stat.count;
        });

        // Calculate CTR for each variant and determine winner
        const variantResults = Object.entries(variants).map(([id, stats]) => {
            const variantCTR = stats.impressions > 0
                ? ((stats.clicks / stats.impressions) * 100)
                : 0;
            return {
                id,
                name: id === 'control' ? 'Control' : `Variant ${id}`,
                ...stats,
                ctr: variantCTR.toFixed(2)
            };
        });

        // Find winner (highest CTR with at least 100 impressions)
        const eligibleVariants = variantResults.filter(v => v.impressions >= 100);
        const winner = eligibleVariants.length > 0
            ? eligibleVariants.reduce((a, b) => parseFloat(a.ctr) > parseFloat(b.ctr) ? a : b)
            : null;

        // Format daily data for chart
        const chartData = dailyStats.reduce((acc: any[], stat: any) => {
            const date = stat._id.date;
            let entry = acc.find(e => e.date === date);
            if (!entry) {
                entry = { date, impressions: 0, clicks: 0, conversions: 0 };
                acc.push(entry);
            }
            if (stat._id.type === 'impression') entry.impressions = stat.count;
            if (stat._id.type === 'click') entry.clicks = stat.count;
            if (stat._id.type === 'conversion') entry.conversions = stat.count;
            return acc;
        }, []);

        return NextResponse.json({
            success: true,
            stats: {
                impressions,
                clicks,
                conversions,
                ctr,
                conversionRate
            },
            variants: variantResults,
            winner: winner?.id || null,
            chartData,
            campaign: {
                id: campaign._id,
                name: campaign.name,
                type: campaign.type,
                status: campaign.status,
                hasVariants: campaign.variants && campaign.variants.length > 0
            }
        });
    } catch (error) {
        console.error('Error fetching campaign stats:', error);
        const apiError = handleApiError(error);
        return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode });
    }
}
