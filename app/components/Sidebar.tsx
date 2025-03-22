'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  HomeIcon, 
  ChartBarIcon, 
  CogIcon, 
  BellIcon, 
  CreditCardIcon,
  QuestionMarkCircleIcon,
  GlobeAltIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import WebsiteSelector from './WebsiteSelector';

export default function Sidebar() {
  const pathname = usePathname();
  const [activeWebsiteId, setActiveWebsiteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch current website ID from localStorage or URL
  useEffect(() => {
    setIsLoading(true);
    
    // Try to get website ID from URL path
    const matches = pathname.match(/\/dashboard\/websites\/([a-f0-9]{24})\/?.*/);
    if (matches && matches[1]) {
      setActiveWebsiteId(matches[1]);
      localStorage.setItem('activeWebsiteId', matches[1]);
    } else {
      // Try to get from localStorage
      const storedId = localStorage.getItem('activeWebsiteId');
      if (storedId) {
        setActiveWebsiteId(storedId);
      }
    }
    
    setIsLoading(false);
  }, [pathname]);
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Websites', href: '/dashboard/websites', icon: GlobeAltIcon },
    { 
      name: 'Analytics', 
      href: activeWebsiteId 
        ? `/dashboard/websites/${activeWebsiteId}/analytics` 
        : '/dashboard/analytics', 
      icon: ChartBarIcon 
    },
    { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCardIcon },
    { name: 'Help', href: '/dashboard/help', icon: QuestionMarkCircleIcon },
  ];
  
  // Handle website selection
  const handleWebsiteSelect = (id: string) => {
    setActiveWebsiteId(id);
    localStorage.setItem('activeWebsiteId', id);
  };
  
  return (
    <div className="drawer-side z-20">
      <label htmlFor="drawer-toggle" className="drawer-overlay"></label>
      <aside className="bg-base-200 w-72 h-screen flex flex-col">
        <div className="px-4 py-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <div className="mask mask-squircle bg-primary w-10 h-10 flex items-center justify-center">
              <span className="text-primary-content text-lg font-bold">SP</span>
            </div>
            Proovd
          </Link>
        </div>
        
        {/* Website Selector */}
        <div className="px-4 mb-4">
          <WebsiteSelector 
            activeWebsiteId={activeWebsiteId} 
            onSelect={handleWebsiteSelect} 
          />
        </div>
        
        <div className="px-4 flex-grow">
          <ul className="menu menu-md bg-base-200 rounded-box gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={isActive ? 'active' : ''}
                  >
                    <item.icon
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="divider px-4 my-2"></div>
        
        <div className="px-4 py-4">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body p-4">
              <h3 className="card-title text-sm">Need help?</h3>
              <p className="text-base-content/70 text-xs">Check our documentation or contact support</p>
              <div className="card-actions justify-end mt-2">
                <Link href="/dashboard/help" className="btn btn-primary btn-sm">
                  <QuestionMarkCircleIcon className="h-4 w-4 mr-1" />
                  Help Center
                </Link>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
} 