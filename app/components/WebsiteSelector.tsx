'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GlobeAltIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Website {
  id: string;
  name: string;
  domain: string;
  status: string;
}

interface WebsiteSelectorProps {
  activeWebsiteId: string | null;
  onSelect: (id: string) => void;
}

export default function WebsiteSelector({ activeWebsiteId, onSelect }: WebsiteSelectorProps) {
  const router = useRouter();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [activeWebsite, setActiveWebsite] = useState<Website | null>(null);

  // Fetch websites
  useEffect(() => {
    async function fetchWebsites() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/websites');
        
        if (!response.ok) {
          throw new Error('Failed to fetch websites');
        }
        
        const data = await response.json();
        setWebsites(data.websites || []);
        
        // Set active website
        if (activeWebsiteId && data.websites) {
          const active = data.websites.find((site: Website) => site.id === activeWebsiteId);
          if (active) {
            setActiveWebsite(active);
          } else if (data.websites.length > 0) {
            // If active ID not found but we have websites, set the first one as active
            setActiveWebsite(data.websites[0]);
            onSelect(data.websites[0].id);
          }
        } else if (data.websites && data.websites.length > 0) {
          // No active ID but we have websites, set the first one as active
          setActiveWebsite(data.websites[0]);
          onSelect(data.websites[0].id);
        }
      } catch (error) {
        console.error('Error fetching websites:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchWebsites();
  }, [activeWebsiteId, onSelect]);

  // Handle website selection
  function handleSelectWebsite(website: Website) {
    setActiveWebsite(website);
    onSelect(website.id);
    setIsOpen(false);
    
    // Navigate to the website dashboard
    router.push(`/dashboard/websites/${website.id}`);
  }

  return (
    <div className="relative">
      <div className="mb-2 text-sm font-medium text-gray-500">Your Website</div>
      
      {isLoading ? (
        <div className="h-10 bg-base-300 animate-pulse rounded-lg"></div>
      ) : (
        <>
          <button
            className="w-full flex items-center justify-between gap-2 p-2 border rounded-lg bg-base-100 hover:bg-base-200 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center gap-2 truncate">
              {activeWebsite ? (
                <>
                  <div className={`w-2 h-2 rounded-full ${activeWebsite.status === 'verified' ? 'bg-success' : activeWebsite.status === 'pending' ? 'bg-warning' : 'bg-error'}`}></div>
                  <span className="font-medium truncate max-w-[180px]">{activeWebsite.name}</span>
                </>
              ) : (
                <>
                  <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-500">Select a website</span>
                </>
              )}
            </div>
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isOpen && (
            <div className="absolute w-full mt-1 bg-base-100 border rounded-lg shadow-lg z-10">
              <ul className="py-1 max-h-60 overflow-auto">
                {websites.map((website) => (
                  <li key={website.id}>
                    <button
                      className={`w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-base-200 ${
                        activeWebsite?.id === website.id ? 'bg-base-200' : ''
                      }`}
                      onClick={() => handleSelectWebsite(website)}
                    >
                      <div className={`w-2 h-2 rounded-full ${website.status === 'verified' ? 'bg-success' : website.status === 'pending' ? 'bg-warning' : 'bg-error'}`}></div>
                      <div className="flex flex-col">
                        <span className="font-medium">{website.name}</span>
                        <span className="text-xs text-gray-500">{website.domain}</span>
                      </div>
                    </button>
                  </li>
                ))}
                
                <li className="border-t mt-1">
                  <Link
                    href="/dashboard/websites/new"
                    className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-base-200 text-primary"
                    onClick={() => setIsOpen(false)}
                  >
                    <PlusIcon className="w-5 h-5" />
                    <span>Add new website</span>
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
} 