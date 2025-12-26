'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatNumber, formatTimeAgo } from '@/app/lib/utils';
import { ArrowTopRightOnSquareIcon, BellIcon } from '@heroicons/react/24/outline';
import ClientStatsCard from '@/app/dashboard/components/ClientStatsCard';
import CopyButton from '../components/CopyButton';
import SetupGuide from './SetupGuide';
import { Card } from '@/components/ui/card';
import { getServerSideCampaigns, getServerSideWebsite } from '@/app/lib/server/data-fetchers';

interface OverviewTabProps {
  websiteId: string;
  websiteData: WebsiteData;
  formattedNotifications: Campaign[];
}

interface Campaign {
  id: string;
  name: string;
  action: string;
  location: string;
  timestamp: string;
  timeAgo: string;
  impressions: number;
  clicks: number;
}

interface WebsiteData {
  _id: string;
  name: string;
  domain: string;
  analytics?: {
    totalImpressions: number;
    totalClicks: number;
    conversionRate: number;
  };
  cachedStats?: {
    totalImpressions: number;
    totalUniqueImpressions: number;
    totalClicks: number;
    conversionRate: string;
    metrics: {
      last24Hours: {
        impressions: number;
        uniqueImpressions: number;
        clicks: number;
        conversionRate: string;
      };
      last7Days: {
        impressions: number;
        uniqueImpressions: number;
        clicks: number;
        conversionRate: string;
      };
      last30Days: {
        impressions: number;
        uniqueImpressions: number;
        clicks: number;
        conversionRate: string;
      };
    };
    lastUpdated: string;
  };
  shopify?: {
    shop: string;
    isActive: boolean;
    installedAt: Date;
  };
}

export default function OverviewTab({ websiteId, websiteData, formattedNotifications }: OverviewTabProps) {

  if (!websiteData) {
    return (
      <div className="alert alert-error shadow-lg">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Website data not available</span>
        </div>
      </div>
    );
  }
  let impressionsTOTAL = 0;
  impressionsTOTAL = formattedNotifications.map((e) => e.impressions).reduce((a, b) => a + b, 0);
  let clicksTOTAL = 0;
  clicksTOTAL = formattedNotifications.map((e) => e.clicks).reduce((a, b) => a + b, 0);



  // Update the conversion rate rendering to safely handle division by zero
  const renderConversionRate = () => {
    if (!websiteData) return '0%';

    // Use cached stats if available
    if (websiteData.cachedStats?.conversionRate) {
      return `${websiteData.cachedStats.conversionRate}%`;
    }

    // Calculate on the fly with safety check for division by zero
    const impressions = formattedNotifications.map((e) => e.impressions).reduce((a, b) => a + b, 0);
    const clicks = formattedNotifications.map((e) => e.clicks).reduce((a, b) => a + b, 0);

    if (impressions === 0) return '0.00%';

    return `${((clicks / impressions) * 100).toFixed(2)}%`;
  };

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Active Campaigns</h3>
          <div className="mt-2 flex items-baseline">
            <div className="text-3xl font-semibold">{formattedNotifications.length}</div>
            <div className="ml-2 text-sm text-gray-500">campaigns</div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Impressions</h3>
          <div className="mt-2 flex items-baseline">
            <div className="text-3xl font-semibold">{formatNumber(impressionsTOTAL || 0)}</div>
            <div className="ml-2 text-sm text-gray-500">impressions</div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
          <div className="mt-2 flex items-baseline">
            <div className="text-3xl font-semibold">{renderConversionRate()}</div>
            <div className="ml-2 text-sm text-gray-500">avg. today</div>
          </div>
        </Card>
      </div>

      {/* Shopify Integration Card */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="card-title flex items-center gap-2">
                <svg className="w-6 h-6 text-[#96bf48]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.467 6.973l-1.89-3.23a1.226 1.226 0 00-1.68-.44L12 6.5 6.103 3.303a1.226 1.226 0 00-1.68.44L2.533 6.973a1.226 1.226 0 00.44 1.68L8.5 11.5l-5.527 2.847a1.226 1.226 0 00-.44 1.68l1.89 3.23c.333.573 1.06.773 1.68.44L12 16.5l5.897 3.197c.62.333 1.347.133 1.68-.44l1.89-3.23a1.226 1.226 0 00-.44-1.68L15.5 11.5l5.527-2.847a1.226 1.226 0 00.44-1.68z" />
                </svg>
                Shopify Integration
              </h2>
              <p className="text-sm text-base-content/60 mt-1">
                {websiteData.shopify?.isActive
                  ? `Connected to ${websiteData.shopify.shop}`
                  : 'Connect your Shopify store to automatically sync products and variants.'}
              </p>
            </div>
            {websiteData.shopify?.isActive ? (
              <div className="badge badge-success gap-2 p-3">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                Connected
              </div>
            ) : (
              <button
                onClick={() => {
                  const shop = prompt('Enter your Shopify store domain (e.g. my-store.myshopify.com):');
                  if (shop) {
                    window.location.href = `/api/shopify/auth?shop=${shop}&websiteId=${websiteId}`;
                  }
                }}
                className="btn btn-primary btn-sm gap-2"
              >
                Connect Store
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Setup Guide */}
      {/* <SetupGuide websiteId={websiteId} /> */}

      {/* API Information */}
      {/* <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <h2 className="card-title">Integration Details</h2>
          
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Installation Code</span>
            </label>
            <pre className="bg-base-200 rounded-box p-3 text-sm font-mono overflow-x-auto">{installationCode}</pre>
            <div className="mt-2">
              <CopyButton 
                textToCopy={installationCode}
                className="btn btn-sm btn-ghost gap-2"
                iconClassName="h-4 w-4"
                label="Copy to clipboard"
              />
            </div>
          </div>
        </div>
      </div> */}

      {/* Recent Notifications */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="card-title">Recent Campaigns</h2>
            {/* <Link 
              href={`/dashboard/websites/${websiteData.id}/?tab=notifications`}
              className="btn btn-sm btn-ghost gap-2"
            >
              View All 
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </Link> */}
          </div>

          {formattedNotifications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Action</th>
                    <th>Location</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {formattedNotifications.map((notification) => (
                    <tr key={notification.id}>
                      <td className="font-medium">{notification.name}</td>
                      <td>
                        <div className="badge badge-outline">{notification.action}</div>
                      </td>
                      <td>
                        <div className="badge badge-neutral">{notification.location}</div>
                      </td>
                      <td>{notification.timeAgo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center text-base-content/40 mb-4">
                <BellIcon className="h-8 w-8" />
              </div>
              <h3 className="font-bold">No campaigns yet</h3>
              <p className="text-sm text-base-content/60 mt-1">Create your first campaign to get started</p>
              <Link href={`/dashboard/websites/${websiteId}/campaigns/new`} className="btn btn-primary mt-4">
                Create Campaign
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 