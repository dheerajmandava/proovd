'use server';

import { connectToDatabase } from '@/app/lib/database/connection';
import { mongoose } from '@/app/lib/database/connection';
import Campaign from '@/app/lib/models/campaign';
import { cache } from 'react';

export type CampaignType = {
    _id: string;
    name: string;
    type: 'pricing';
    status: string;
    siteId: string;
    pricingConfig?: {
        productId: string;
        productHandle: string;
        productUrl: string;
        variants: {
            variantId: string;
            name: string;
            price: number;
            cost: number;
            trafficPercent: number;
            impressions: number;
            conversions: number;
            revenue: number;
        }[];
    };
    impressions: number;
    conversions: number;
    createdAt: Date;
    updatedAt: Date;
};

/**
 * Get a campaign by ID
 */
export const getCampaignById = cache(async (id: string): Promise<CampaignType | null> => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
    await connectToDatabase();
    const campaign = await Campaign.findById(id).lean();
    return campaign as CampaignType;
});

/**
 * Get all campaigns for a website
 */
export const getCampaignsByWebsiteId = cache(
    async (websiteId: string, limit = 10): Promise<CampaignType[]> => {
        if (!websiteId || !mongoose.Types.ObjectId.isValid(websiteId)) return [];
        await connectToDatabase();

        const campaigns = await Campaign.find({ siteId: websiteId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return campaigns as CampaignType[];
    }
);

/**
 * Get all campaigns for a website (all statuses)
 */
export async function getCampaignsByWebsite(websiteId: string): Promise<CampaignType[]> {
    if (!websiteId || !mongoose.Types.ObjectId.isValid(websiteId)) return [];
    await connectToDatabase();
    const campaigns = await Campaign.find({ siteId: websiteId })
        .sort({ createdAt: -1 })
        .lean();
    return campaigns as CampaignType[];
}

/**
 * Create a new pricing campaign
 */
export async function createCampaign(campaignData: {
    name: string;
    siteId: string;
    type?: string;
    status?: string;
    pricingConfig?: any;
}): Promise<CampaignType> {
    await connectToDatabase();

    const name = campaignData.name;
    if (!name || name.trim() === '') {
        throw new Error('Campaign name is required');
    }

    const campaign = new Campaign({
        name: name,
        siteId: campaignData.siteId,
        type: 'pricing',
        status: campaignData.status || 'draft',
        pricingConfig: campaignData.pricingConfig,
        impressions: 0,
        conversions: 0,
    });

    await campaign.save();
    return campaign.toObject() as CampaignType;
}

/**
 * Update a campaign
 */
export async function updateCampaign(
    id: string,
    updateData: Partial<CampaignType>
): Promise<CampaignType | null> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
    await connectToDatabase();

    if ((updateData as any)._id) {
        delete (updateData as any)._id;
    }

    const campaign = await Campaign.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
    ).lean();

    return campaign as CampaignType;
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(id: string): Promise<boolean> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return false;
    await connectToDatabase();
    const result = await Campaign.deleteOne({ _id: id });
    return result.deletedCount > 0;
}

// Backward compatibility aliases
export const getNotificationById = getCampaignById;
export const getNotificationsByWebsiteId = getCampaignsByWebsiteId;
export const getNotificationsByWebsite = getCampaignsByWebsite;
export const createNotification = createCampaign;
export const updateNotification = updateCampaign;
export const deleteNotification = deleteCampaign;
export type NotificationType = CampaignType;
