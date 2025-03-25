'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatNumber, formatTimeAgo } from '@/app/lib/utils';
import { ArrowTopRightOnSquareIcon, BellIcon } from '@heroicons/react/24/outline';
import ClientStatsCard from '@/app/dashboard/components/ClientStatsCard';
import CopyButton from '../components/CopyButton';

interface OverviewTabProps {
  websiteId: string;
}

interface Notification {
  id: string;
  name: string;
  action: string;
  location: string;
  timestamp: string;
  timeAgo: string;
}

interface WebsiteData {
  id: string;
  name: string;
  domain: string;
  totalImpressions: number;
  totalClicks: number;
  conversionRate: number;
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
}

export default function OverviewTab({ websiteId }: OverviewTabProps) {
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
  const [formattedNotifications, setFormattedNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch website data
        const websiteResponse = await fetch(`/api/websites/${websiteId}`);
        if (!websiteResponse.ok) throw new Error('Failed to load website');
        const websiteData = await websiteResponse.json();
        setWebsiteData(websiteData);
        
        // Fetch recent notifications
        const notificationsResponse = await fetch(`/api/websites/${websiteId}/notifications?limit=5`);
        if (!notificationsResponse.ok) throw new Error('Failed to load notifications');
        const notificationsData = await notificationsResponse.json();
        
        // Format notifications for display with safety check
        if (notificationsData && notificationsData.notifications && Array.isArray(notificationsData.notifications)) {
          const formatted = notificationsData.notifications.map((notification: any) => ({
            id: notification.id,
            name: notification.name,
            action: notification.type === 'purchase' ? 'Purchased' : 
                    notification.type === 'signup' ? 'Signed up' : 'Custom',
            location: notification.location || 'Global',
            timestamp: notification.createdAt,
            timeAgo: formatTimeAgo(notification.createdAt),
          }));
          setFormattedNotifications(formatted);
        } else {
          console.error('Unexpected notifications data format:', notificationsData);
          setFormattedNotifications([]);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [websiteId]);
  
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
      <div className="alert alert-error shadow-lg">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

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

  // Generate the installation code snippet with proper website ID
  const installationCode = `<script src="https://cdn.proovd.in/w/${websiteId}.js"></script>`;

  // Update the conversion rate rendering to safely handle division by zero
  const renderConversionRate = () => {
    if (!websiteData) return '0%';
    
    // Use cached stats if available
    if (websiteData.cachedStats?.conversionRate) {
      return `${websiteData.cachedStats.conversionRate}%`;
    }
    
    // Calculate on the fly with safety check for division by zero
    const impressions = websiteData.totalImpressions || 0;
    const clicks = websiteData.totalClicks || 0;
    
    if (impressions === 0) return '0.00%';
    
    return `${((clicks / impressions) * 100).toFixed(2)}%`;
  };

  return (
    <div>
      {/* Stats Section */}
      <div className="stats stats-vertical md:stats-horizontal shadow bg-base-100 w-full mb-8">
        <div className="stat">
          <div className="stat-title">Total Impressions</div>
          <div className="stat-value text-primary">{formatNumber(websiteData.totalImpressions || 0)}</div>
          <div className="stat-desc">Total notification views</div>
        </div>
        
        <div className="stat">
          <div className="stat-title">Total Clicks</div>
          <div className="stat-value text-secondary">{formatNumber(websiteData.totalClicks || 0)}</div>
          <div className="stat-desc">Total notification clicks</div>
        </div>
        
        <div className="stat">
          <div className="stat-title">Conversion Rate</div>
          <div className="stat-value text-accent">{renderConversionRate()}</div>
          <div className="stat-desc">Views that led to clicks</div>
        </div>
      </div>

      {/* API Information */}
      <div className="card bg-base-100 shadow-xl mb-8">
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
      </div>

      {/* Recent Notifications */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="card-title">Recent Notifications</h2>
            <Link 
              href={`/dashboard/websites/${websiteData.id}/notifications`}
              className="btn btn-sm btn-ghost gap-2"
            >
              View All 
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </Link>
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
              <h3 className="font-bold">No notifications yet</h3>
              <p className="text-sm text-base-content/60 mt-1">Create your first notification to get started</p>
              <Link href={`/dashboard/websites/${websiteId}/notifications/new`} className="btn btn-primary mt-4">
                Create Notification
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 