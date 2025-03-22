'use client';

import Link from 'next/link';
import { formatNumber } from '@/app/lib/utils';
import { useState } from 'react';

interface WebsiteMetrics {
  id: string;
  name: string;
  domain: string;
  apiKey: string | null;
  apiKeys?: Array<{
    id: string;
    key: string;
    name: string;
    allowedOrigins: string[];
    createdAt: string;
    lastUsed?: string;
  }>;
  status: string;
  createdAt: Date;
  notificationsCount: number;
  impressionsCount: number;
  clicksCount: number;
  conversionRate: string;
}

interface WebsiteCardProps {
  website: WebsiteMetrics;
}

export default function WebsiteCard({ website }: WebsiteCardProps) {
  const [copied, setCopied] = useState(false);
  
  // Safely mask API key 
  function maskApiKey(key: string): string {
    if (!key || key.length <= 8) return key || '';
    return key.slice(0, 4) + '...' + key.slice(-4);
  }
  
  const copyApiKey = () => {
    const keyToCopy = website.apiKey || (website.apiKeys && website.apiKeys.length > 0 ? website.apiKeys[0].key : '');
    navigator.clipboard.writeText(keyToCopy || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h2 className="card-title">{website.name}</h2>
            <p className="text-sm text-gray-700 mb-2">{website.domain}</p>
            <div className={`badge badge-${website.status === 'active' ? 'success' : 'error'} gap-1 mb-4`}>
              <div className={`w-2 h-2 rounded-full bg-${website.status === 'active' ? 'success' : 'error'}-content`}></div>
              {website.status === 'active' ? 'Active' : 'Inactive'}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <Link 
              href={`/dashboard/websites/${website.id}?tab=settings`} 
              className="btn btn-sm btn-outline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
            <Link 
              href={`/dashboard/websites/${website.id}?tab=notifications`} 
              className="btn btn-sm btn-outline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              Notifications
            </Link>
            <Link 
              href={`/dashboard/websites/${website.id}?tab=analytics`} 
              className="btn btn-sm btn-outline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              Analytics
            </Link>
            <Link 
              href={`/dashboard/websites/${website.id}?tab=setup`} 
              className="btn btn-sm btn-primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
              Setup Code
            </Link>
          </div>
        </div>
        
        <div className="divider my-2"></div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat bg-base-200 rounded-box p-4">
            <div className="stat-title text-xs font-medium text-gray-700">Notifications</div>
            <div className="stat-value text-lg">{formatNumber(website.notificationsCount)}</div>
          </div>
          <div className="stat bg-base-200 rounded-box p-4">
            <div className="stat-title text-xs font-medium text-gray-700">Impressions</div>
            <div className="stat-value text-lg">{formatNumber(website.impressionsCount)}</div>
          </div>
          <div className="stat bg-base-200 rounded-box p-4">
            <div className="stat-title text-xs font-medium text-gray-700">Clicks</div>
            <div className="stat-value text-lg">{formatNumber(website.clicksCount)}</div>
          </div>
          <div className="stat bg-base-200 rounded-box p-4">
            <div className="stat-title text-xs font-medium text-gray-700">Conversion Rate</div>
            <div className="stat-value text-lg">{website.conversionRate}%</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="p-3 bg-base-200 rounded-lg flex items-center justify-between">
            <div className="text-sm text-gray-700 overflow-hidden">
              <span className="font-semibold">API Key:</span> <span className="font-mono">
                {maskApiKey(website.apiKey || (website.apiKeys && website.apiKeys.length > 0 ? website.apiKeys[0].key : 'No API key found'))}
              </span>
            </div>
            {(website.apiKey || (website.apiKeys && website.apiKeys.length > 0)) && (
              <button
                onClick={copyApiKey}
                className="btn btn-xs btn-outline ml-2"
                title="Copy API Key"
              >
                {copied ? (
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 