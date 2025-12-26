'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PricingWizard from '../../components/PricingWizard';

export default function EditCampaignPage() {
    const params = useParams();
    const websiteId = params.id as string;
    const campaignId = params.campaignId as string;

    const [initialData, setInitialData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchCampaign() {
            try {
                const response = await fetch(`/api/websites/${websiteId}/campaigns/${campaignId}`);
                if (!response.ok) throw new Error('Failed to fetch experiment');

                const data = await response.json();
                const campaign = data.campaign;

                setInitialData({
                    name: campaign.name,
                    type: 'pricing',
                    status: campaign.status,
                    pricingConfig: campaign.pricingConfig || {
                        productId: '',
                        productHandle: '',
                        productUrl: '',
                        variants: []
                    }
                });
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }

        if (websiteId && campaignId) {
            fetchCampaign();
        }
    }, [websiteId, campaignId]);

    if (isLoading) {
        return <div className="p-8 text-center"><span className="loading loading-spinner loading-lg"></span></div>;
    }

    return (
        <div className="p-4">
            <PricingWizard
                websiteId={websiteId}
                initialData={initialData}
                campaignId={campaignId}
                isEditing={true}
            />
        </div>
    );
}
