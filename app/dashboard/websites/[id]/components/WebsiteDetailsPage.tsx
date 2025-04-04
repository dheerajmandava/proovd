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
import AnalyticsTab from './AnalyticsTab';
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
      pulse?: {
        position: string;
        theme: string;
        showActiveUsers: boolean;
      };
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
  
  // Helper functions for formatting settings
  const getPositionLabel = (position: string): string => {
    switch (position) {
      case 'top-left': return 'Top Left';
      case 'top-right': return 'Top Right';
      case 'bottom-left': return 'Bottom Left';
      case 'bottom-right': return 'Bottom Right';
      default: return 'Bottom Right';
    }
  };
  
  const getThemeLabel = (theme: string): string => {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'auto': return 'Auto (System)';
      default: return 'Auto (System)';
    }
  };
  
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
          className={`tab ${activeTab === 'analytics' ? 'tab-active' : ''}`}
          onClick={() => handleTabChange('analytics')}
        >
          Analytics
        </button>
        <button 
          role="tab"
          className={`tab ${activeTab === 'proovdpulse' ? 'tab-active' : ''}`}
          onClick={() => handleTabChange('proovdpulse')}
        >
          ProovdPulse
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
      {activeTab === 'analytics' && <AnalyticsTab websiteId={websiteId} />}
      {activeTab === 'proovdpulse' && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">
                <div className="flex items-center">
                  <div className="mr-2 h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                  Real-Time Tracking
                </div>
              </h2>
              <div className="flex flex-col">
                <div className="alert alert-success mt-2 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>ProovdPulse tracking is ready</span>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Add the tracking widget to your website by copying the script tag below and adding it to your site's HTML.
                </p>
                <div className="mt-4 bg-base-200 rounded-box p-3 text-sm font-mono overflow-x-auto">
                  {`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/api/cdn/p/${websiteId}"></script>`}
                </div>
              </div>
              <div className="card-actions justify-end mt-4">
                <Link href={`/dashboard/websites/${websiteId}/pulse`} className="btn btn-primary btn-sm">
                  View Live Dashboard
                </Link>
              </div>
            </div>
          </div>
          
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Widget Settings</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Position:</span>
                  <span className="badge badge-primary">{getPositionLabel(website.settings?.pulse?.position || 'bottom-right')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Theme:</span>
                  <span className="badge">{getThemeLabel(website.settings?.pulse?.theme || 'auto')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Users Display:</span>
                  <span className={`badge ${website.settings?.pulse?.showActiveUsers !== false ? 'badge-success' : 'badge-outline'}`}>
                    {website.settings?.pulse?.showActiveUsers !== false ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  The ProovdPulse widget uses secure WebSockets to transmit real-time data about your website visitors.
                </p>
              </div>
              <div className="card-actions justify-end mt-4">
                <Link href={`/dashboard/websites/${websiteId}/pulse`} className="btn btn-outline btn-sm">
                  Configure Widget
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'settings' && <SettingsTab websiteId={websiteId} />}
    </div>
  );
} 