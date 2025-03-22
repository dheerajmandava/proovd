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
  loading: () => <div className="flex justify-center items-center h-64">
    <div className="loading loading-spinner loading-lg"></div>
  </div>
});

// Dynamically import the WebsiteSetupPage component
const WebsiteSetupPage = dynamic(() => import('./setup/page'), {
  loading: () => <div className="flex justify-center items-center h-64">
    <div className="loading loading-spinner loading-lg"></div>
  </div>
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
        <div className="loading loading-spinner loading-lg"></div>
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
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

      {/* Website Navigation Tabs */}
      <div className="tabs tabs-bordered mb-6">
        <button 
          onClick={() => handleTabChange('overview')} 
          className={`tab ${activeTab === 'overview' ? 'tab-active' : ''}`}
        >
          Overview
        </button>
        <button 
          onClick={() => handleTabChange('notifications')} 
          className={`tab ${activeTab === 'notifications' ? 'tab-active' : ''}`}
        >
          Notifications
        </button>
        <button 
          onClick={() => handleTabChange('analytics')} 
          className={`tab ${activeTab === 'analytics' ? 'tab-active' : ''}`}
        >
          Analytics
        </button>
        <button 
          onClick={() => handleTabChange('settings')} 
          className={`tab ${activeTab === 'settings' ? 'tab-active' : ''}`}
        >
          Settings
        </button>
        <button 
          onClick={() => handleTabChange('setup')} 
          className={`tab ${activeTab === 'setup' ? 'tab-active' : ''}`}
        >
          Setup
        </button>
      </div>

      {website.verification?.status !== 'verified' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mb-6">
          <div className="flex">
            <ShieldExclamationIcon className="h-6 w-6 text-yellow-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Domain Verification Required</h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>
                  Your website is not yet verified. Verify domain ownership to
                  start displaying notifications on your website.
                </p>
                <Link
                  href={`/dashboard/websites/${websiteId}/verify`}
                  className="inline-flex items-center mt-2 text-yellow-800 hover:text-yellow-900 font-medium"
                >
                  Complete Verification
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab websiteId={websiteId} />}
      {activeTab === 'notifications' && <NotificationsTab websiteId={websiteId} />}
      {activeTab === 'analytics' && <div>Analytics content coming soon</div>}
      {activeTab === 'settings' && <WebsiteSettingsPage />}
      {activeTab === 'setup' && <WebsiteSetupPage />}
    </div>
  );
} 