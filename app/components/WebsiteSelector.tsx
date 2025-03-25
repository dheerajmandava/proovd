'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { GlobeAltIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Website {
  _id: string;
  name: string;
  domain: string;
}

interface WebsiteSelectorProps {
  activeWebsiteId: string | null;
  onSelect: (id: string) => void;
}

export default function WebsiteSelector({ activeWebsiteId, onSelect }: WebsiteSelectorProps) {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/websites', {
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched websites data:', data);
        
        if (data.websites && Array.isArray(data.websites)) {
          setWebsites(data.websites);
          
          // If we have websites but no active ID, set the first one
          if (data.websites.length > 0 && !activeWebsiteId) {
            onSelect(data.websites[0]._id);
          }
        } else if (data && Array.isArray(data)) {
          // Handle case where API returns array directly
          setWebsites(data);
          
          // If we have websites but no active ID, set the first one
          if (data.length > 0 && !activeWebsiteId) {
            onSelect(data[0]._id);
          }
        } else {
          console.error('Unexpected API response format:', data);
          setError('Unexpected data format from API');
          setWebsites([]);
        }
      } catch (error) {
        console.error('Error fetching websites:', error);
        setError('Failed to load websites');
        setWebsites([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWebsites();
  }, [activeWebsiteId, onSelect]);
  
  const activeWebsite = websites.find(site => site._id === activeWebsiteId);
  
  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
    
    // If we're on a website-specific page, navigate to the same page for the new website
    if (pathname.includes('/websites/')) {
      const newPath = pathname.replace(/\/websites\/[^/]+/, `/websites/${id}`);
      router.push(newPath);
    }
  };
  
  if (isLoading) {
    return (
      <div className="select select-bordered w-full h-12 flex items-center justify-between opacity-70">
        <span className="loading loading-spinner loading-sm"></span>
        <span>Loading websites...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="alert alert-error p-2 text-xs">
        <span>{error}</span>
        <button onClick={() => window.location.reload()} className="btn btn-xs btn-ghost">Retry</button>
      </div>
    );
  }
  
  if (websites.length === 0) {
    return (
      <Link href="/dashboard/websites/new" className="btn btn-primary btn-outline w-full gap-2">
        <PlusIcon className="h-5 w-5" />
        Add Your First Website
      </Link>
    );
  }
  
  return (
    <div className="dropdown w-full">
      <div 
        tabIndex={0}
        role="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-outline w-full justify-between font-normal border-base-300 bg-base-100 text-base-content shadow-sm"
      >
        {activeWebsite ? (
          <div className="flex items-center gap-2 truncate">
            <div className="mask mask-squircle bg-primary/10 w-6 h-6 flex items-center justify-center flex-shrink-0">
              <GlobeAltIcon className="h-3 w-3 text-primary" />
            </div>
            <span className="truncate">{activeWebsite.name}</span>
          </div>
        ) : (
          <span>Select a website</span>
        )}
        <svg className="h-4 w-4 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </div>
      
      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-full mt-1 border border-base-200">
        {websites.map((website) => (
          <li key={website._id}>
            <button
              onClick={() => handleSelect(website._id)}
              className={`flex items-center ${website._id === activeWebsiteId ? 'active font-medium' : ''}`}
            >
              <div className="mask mask-squircle bg-primary/10 w-6 h-6 flex items-center justify-center">
                <GlobeAltIcon className="h-3 w-3 text-primary" />
              </div>
              <span className="truncate">{website.name}</span>
            </button>
          </li>
        ))}
        <div className="divider my-1"></div>
        <li>
          <Link href="/dashboard/websites/new" className="text-primary flex items-center gap-1">
            <PlusIcon className="h-4 w-4" />
            Add New Website
          </Link>
        </li>
      </ul>
    </div>
  );
} 