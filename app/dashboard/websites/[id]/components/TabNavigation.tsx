'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface WebsiteData {
  _id: string;
  name: string;
  domain: string;
  status: string;
}

interface TabNavigationProps {
  websiteId: string;
  activeTab: string;
  initialWebsite: WebsiteData;
}

export default function TabNavigation({
  websiteId,
  activeTab,
  initialWebsite
}: TabNavigationProps) {
  // Use the provided initial website data
  const [website] = useState<WebsiteData>(initialWebsite);

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'campaigns', name: 'Campaigns' },
    { id: 'analytics', name: 'Analytics' },
    { id: 'settings', name: 'Settings' },
  ];

  return (
    <div className="border-b border-base-300 pb-4 mb-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">{website.name}</h1>
        <div className="flex items-center mt-1 text-base-content/70">
          <a
            href={`https://${website.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:text-primary transition-colors"
          >
            {website.domain}
            <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
          </a>
          {/* Domain verification badge removed for Shopify-first workflow */}
        </div>
      </div>

      <div className="flex space-x-8">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/dashboard/websites/${websiteId}?tab=${tab.id}`}
            className={`pb-2 relative ${activeTab === tab.id
              ? 'text-primary font-medium border-b-2 border-primary'
              : 'text-base-content/70 hover:text-primary transition-colors'
              }`}
          >
            {tab.name}
          </Link>
        ))}
      </div>
    </div>
  );
}