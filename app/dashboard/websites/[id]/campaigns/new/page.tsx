'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import PricingWizard from '../components/PricingWizard';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function NewCampaignPage() {
    const params = useParams();
    const websiteId = params.id as string;

    return (
        <div className="p-4">
            <PricingWizard websiteId={websiteId} />
        </div>
    );
}
