'use client';

import { notFound, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowTopRightOnSquareIcon, 
  ChartBarIcon, 
  CogIcon, 
  BellIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon 
} from '@heroicons/react/24/outline';
import VerificationStatusBadge from '@/app/components/VerificationStatusBadge';
import NotificationsTab from './components/NotificationsTab';
import OverviewTab from './components/OverviewTab';
import dynamic from 'next/dynamic';

// Dynamically import the WebsiteSettingsPage component
const WebsiteSettingsPage = dynamic(() => import('./settings/page'), {
  loading: () => (
    <div className="flex justify-center items-center h-64">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  )
});

// Dynamically import the WebsiteSetupPage component
const WebsiteSetupPage = dynamic(() => import('./setup/page'), {
  loading: () => (
    <div className="flex justify-center items-center h-64">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  )
});

export default function WebsiteDetailsPage({
  params
}: {
  params: { id: string }
}){
  // @ts-ignore - Direct params access - will need to be updated in future Next.js versions
  const websiteId = params.id;
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [website, setWebsite] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    async function fetchWebsite() {
      try {
        const response = await fetch(`/api/websites/${websiteId}`);
        if (!response.ok) {
          throw new Error('Failed to load website');
        }
        const data = await response.json();
        setWebsite(data);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchWebsite();
  }, [websiteId]);
  
  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Update URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url);
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }
  
  if (!website) {
    return notFound();
  }

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
            <VerificationStatusBadge status={website.verification?.status || 'pending'} />
          </div>
        </div>

        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          {website.verification?.status !== 'verified' && (
            <Link
              href={`/dashboard/websites/${websiteId}/verify`}
              className="btn btn-sm btn-primary flex items-center"
            >
              <ShieldCheckIcon className="h-4 w-4 mr-1" />
              Verify Domain
            </Link>
          )}

          <Link
            href={`/dashboard/websites/${websiteId}/edit`}
            className="btn btn-sm btn-outline"
          >
            <PencilSquareIcon className="h-4 w-4 mr-1" />
            Edit
          </Link>

          <Link
            href={`/dashboard/websites/${websiteId}/settings`}
            className="btn btn-sm btn-outline"
          >
            <CogIcon className="h-4 w-4 mr-1" />
            Settings
          </Link>
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
          className={`tab ${activeTab === 'settings' ? 'tab-active' : ''}`}
          onClick={() => handleTabChange('settings')}
        >
          Settings
        </button>
        <button 
          role="tab"
          className={`tab ${activeTab === 'setup' ? 'tab-active' : ''}`}
          onClick={() => handleTabChange('setup')}
        >
          Setup
        </button>
      </div>

      {/* Website Verification Warning - Using DaisyUI alert */}
      {website.verification?.status !== 'verified' && (
        <div className="alert alert-warning mb-6">
          <ShieldExclamationIcon className="h-6 w-6" />
          <div>
            <h3 className="font-bold">Domain Verification Required</h3>
            <div className="text-sm">
              Your website is not yet verified. Verify domain ownership to
              start displaying notifications on your website.
            </div>
            <div className="mt-2">
              <Link
                href={`/dashboard/websites/${websiteId}/verify`}
                className="btn btn-sm btn-warning"
              >
                Complete Verification
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab websiteId={websiteId} />}
      {activeTab === 'notifications' && <NotificationsTab websiteId={websiteId} />}
      {activeTab === 'analytics' && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <h2 className="card-title">Analytics Coming Soon</h2>
            <p>We're working on building powerful analytics tools for your website.</p>
            <div className="card-actions mt-4">
              <button className="btn btn-primary btn-disabled">Coming Soon</button>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'settings' && <WebsiteSettingsPage />}
      {activeTab === 'setup' && <WebsiteSetupPage />}
    </div>
  );
} 