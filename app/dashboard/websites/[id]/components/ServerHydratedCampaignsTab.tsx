import { getServerSideWebsite, getServerSideCampaigns } from '@/app/lib/server/data-fetchers';
import ExperimentsTab from './ExperimentsTab';

export default async function ServerHydratedCampaignsTab({ websiteId }: { websiteId: string }) {
    const website = await getServerSideWebsite(websiteId);
    const campaigns = await getServerSideCampaigns(websiteId, 100);

    if (!website) {
        return <div className="alert alert-error">Website not found</div>;
    }

    const serializedWebsite = {
        _id: website._id.toString(),
        name: website.name || '',
        domain: website.domain || '',
    };

    const serializedCampaigns = campaigns.map(campaign => ({
        _id: campaign._id.toString(),
        name: campaign.name || '',
        type: campaign.type || 'ab-test',
        status: campaign.status || 'draft',
        siteId: campaign.siteId.toString(),
        impressions: campaign.impressions || 0,
        clicks: campaign.clicks || 0,
        conversions: campaign.conversions || 0,
        variants: campaign.variants || [],
        trafficAllocation: campaign.trafficAllocation,
        createdAt: campaign.createdAt instanceof Date ?
            campaign.createdAt.toISOString() :
            (typeof campaign.createdAt === 'string' ? campaign.createdAt : new Date().toISOString()),
        updatedAt: campaign.updatedAt instanceof Date ?
            campaign.updatedAt.toISOString() :
            (typeof campaign.updatedAt === 'string' ? campaign.updatedAt : new Date().toISOString()),
    }));

    return <ExperimentsTab
        websiteId={websiteId}
        website={JSON.parse(JSON.stringify(serializedWebsite))}
        initialCampaigns={JSON.parse(JSON.stringify(serializedCampaigns))}
    />;
}
