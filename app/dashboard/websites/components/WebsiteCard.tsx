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
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  
  // Safely mask API key 
  function maskApiKey(key: string): string {
    if (!key || key.length <= 8) return key || '';
    return key.slice(0, 4) + '...' + key.slice(-4);
  }
  
  const copyApiKey = () => {
    const keyToCopy = website.apiKeys && website.apiKeys.length > 0 ? website.apiKeys[0].key : '';
    navigator.clipboard.writeText(keyToCopy || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get base URL for the widget
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_BASE_URL || 'https://proovd.in';
  };

  const scriptTag = `<script src="https://cdn.proovd.in/w/${website.id}.js"></script>`;

  const copySetupCode = () => {
    navigator.clipboard.writeText(scriptTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="card bg-base-100 shadow-lg overflow-hidden transition-all hover:shadow-xl">
        <Link href={`/dashboard/websites/${website.id}`} className="flex-grow">
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
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowSetupDialog(true);
                  }}
                  className="btn btn-sm btn-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                  Setup Code
                </button>
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
                    {maskApiKey(website.apiKeys && website.apiKeys.length > 0 ? website.apiKeys[0].key : 'No API key found')}
                  </span>
                </div>
                {(website.apiKeys && website.apiKeys.length > 0) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      copyApiKey();
                    }}
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
        </Link>
      </div>

      {/* Setup Code Dialog */}
      {showSetupDialog && (
        <dialog open className="modal modal-open">
          <div className="modal-box relative bg-white max-w-2xl mx-auto">
            <button 
              className="btn btn-sm btn-circle absolute right-2 top-2" 
              onClick={() => setShowSetupDialog(false)}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg mb-4">Integration Code for {website.name}</h3>
            
            <div className="mt-4">
              <p className="text-sm mb-2">Add this script to your website's <code className="bg-gray-100 px-1 rounded">&lt;head&gt;</code> tag:</p>
              <pre className="bg-slate-800 text-white p-4 rounded-lg font-mono text-sm overflow-x-auto">
                {scriptTag}
              </pre>
              <div className="mt-4 flex justify-end">
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={copySetupCode}
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
                      Copy Code
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowSetupDialog(false)}>close</button>
          </form>
        </dialog>
      )}
    </>
  );
}