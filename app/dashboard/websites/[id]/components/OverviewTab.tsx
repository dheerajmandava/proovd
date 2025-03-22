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
  apiKey: string;
  totalImpressions: number;
  totalClicks: number;
  conversionRate: number;
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
        
        // Format notifications for display
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
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  if (!websiteData) {
    return (
      <div className="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Website data not available</span>
      </div>
    );
  }

  // Generate the installation code snippet
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://proovd.com';
  const installationCode = `<script src="${baseUrl}/api/embed?domain=${websiteData.domain}"></script>`;

  // Format the conversion rate safely
  const formattedConversionRate = websiteData.conversionRate !== undefined && websiteData.conversionRate !== null 
    ? `${websiteData.conversionRate.toFixed(1)}%` 
    : '0.0%';

  return (
    <div>
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ClientStatsCard 
          title="Total Impressions" 
          value={websiteData.totalImpressions || 0} 
          iconName="ChartBarIcon" 
          description="Total number of notification views" 
        />
        <ClientStatsCard 
          title="Total Clicks" 
          value={websiteData.totalClicks || 0} 
          iconName="CursorArrowRippleIcon" 
          description="Total number of notification clicks" 
        />
        <ClientStatsCard 
          title="Conversion Rate" 
          value={formattedConversionRate} 
          iconName="ArrowTrendingUpIcon" 
          description="Percentage of views that led to clicks" 
          valueFormatting={false}
        />
      </div>

      {/* API Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">Integration Details</h2>
        <div className="border rounded-md p-4 bg-gray-50">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <div className="flex">
              <div className="bg-gray-100 rounded-l-md border border-r-0 border-gray-300 px-3 py-2 text-gray-500 text-sm font-mono flex-grow">
                {websiteData.apiKey}
              </div>
              <CopyButton textToCopy={websiteData.apiKey} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Installation Code
            </label>
            <div className="bg-gray-100 rounded-md border border-gray-300 p-3 text-sm font-mono overflow-x-auto">
              {installationCode}
            </div>
            <CopyButton 
              textToCopy={installationCode}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
              iconClassName="h-4 w-4 mr-1"
              label="Copy to clipboard"
            />
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Recent Notifications</h2>
          <button 
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            onClick={() => window.location.href = `/dashboard/websites/${websiteData.id}/notifications`}
          >
            View All <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
          </button>
        </div>

        {formattedNotifications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formattedNotifications.map((notification) => (
                  <tr key={notification.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {notification.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {notification.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {notification.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {notification.timeAgo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <BellIcon className="h-12 w-12 mx-auto text-gray-300" />
            <p className="mt-2 text-gray-500">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
} 