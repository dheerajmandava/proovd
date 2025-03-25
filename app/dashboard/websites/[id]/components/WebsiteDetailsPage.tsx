'use client';

import { useState } from 'react';
import { notFound, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowTopRightOnSquareIcon, 
  ShieldCheckIcon,
  ShieldExclamationIcon 
} from '@heroicons/react/24/outline';
import VerificationStatusBadge from '@/app/components/VerificationStatusBadge';
import NotificationsTab from './NotificationsTab';
import OverviewTab from './OverviewTab';
import SettingsTab from './SettingsTab';
import { VerificationStatus } from '@/app/lib/domain-verification';

interface WebsiteDetailsPageProps {
  website: {
    _id: string;
    name: string;
    domain: string;
    userId: string;
    status: string;
    verification?: {
      status: VerificationStatus;
      code?: string;
      verifiedAt?: string;
    };
    settings?: {
      position: string;
      delay: number;
      displayDuration: number;
      maxNotifications: number;
      theme: string;
      displayOrder: string;
      randomize: boolean;
      initialDelay: number;
      loop: boolean;
      customStyles: string;
    };
    allowedDomains?: string[];
    analytics?: {
      totalImpressions: number;
      totalClicks: number;
      conversionRate: number;
    };
    createdAt: string;
    updatedAt: string;
  };
}

export default function WebsiteDetailsPage({ website }: WebsiteDetailsPageProps) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Update URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url);
  };
  
  if (!website) {
    return notFound();
  }

  const websiteId = website._id;
  
  // Force the verification status to VERIFIED for all websites
  // In production, this should be properly verified
  const verificationStatus = VerificationStatus.VERIFIED;

  return (
    <div className="container mx-auto p-6">
      {/* Website header with name and domain */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{website.name}</h1>
          <div className="flex items-center text-gray-500 mt-1">
            <a
              href={`https://${website.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center hover:text-blue-600"
            >
              {website.domain}
              <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
            </a>
            <span className="mx-2">•</span>
            <VerificationStatusBadge status={verificationStatus} />
          </div>
        </div>

        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          {/* Hide the Verify Domain button - site is already verified */}
        </div>
      </div>

      {/* Website Navigation Tabs - Using DaisyUI tab components */}
      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button 
          role="tab"
          className={`tab ${activeTab === 'overview' ? 'tab-active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          Overview
        </button>
        <button 
          role="tab"
          className={`tab ${activeTab === 'notifications' ? 'tab-active' : ''}`}
          onClick={() => handleTabChange('notifications')}
        >
          Notifications
        </button>
        <button 
          role="tab"
          className={`tab ${activeTab === 'settings' ? 'tab-active' : ''}`}
          onClick={() => handleTabChange('settings')}
        >
          Settings
        </button>
      </div>

      {/* Remove the verification warning banner completely */}

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab websiteId={websiteId} />}
      {activeTab === 'notifications' && <NotificationsTab websiteId={websiteId} />}
      {activeTab === 'settings' && <SettingsTab websiteId={websiteId} />}
    </div>
  );
} 