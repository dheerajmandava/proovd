'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CogIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface WebsiteSettings {
  position: string;
  delay: number;
  displayDuration: number;
  maxNotifications: number;
  theme: string;
  allowedDomains: string[];
}

export default function WebsiteSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [newDomain, setNewDomain] = useState('');
  const [settings, setSettings] = useState<WebsiteSettings>({
    position: 'bottom-left',
    delay: 5,
    displayDuration: 5,
    maxNotifications: 5,
    theme: 'light',
    allowedDomains: []
  });
  const [websiteName, setWebsiteName] = useState('');
  const [websiteDomain, setWebsiteDomain] = useState('');

  useEffect(() => {
    fetchWebsite();
  }, [params.id]);

  const fetchWebsite = async () => {
    try {
      const response = await fetch(`/api/websites/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch website');
      }
      
      const data = await response.json();
      setWebsiteName(data.name);
      setWebsiteDomain(data.domain);
      
      // Set settings with defaults if any property is missing
      setSettings({
        position: data.settings?.position || 'bottom-left',
        delay: data.settings?.delay || 5,
        displayDuration: data.settings?.displayDuration || 5,
        maxNotifications: data.settings?.maxNotifications || 5,
        theme: data.settings?.theme || 'light',
        allowedDomains: data.allowedDomains || []
      });
      
      setIsLoading(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load website settings' });
      setIsLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setSettings(prev => ({
      ...prev,
      [name]: name === 'displayDuration' || name === 'delay' || name === 'maxNotifications' 
        ? parseInt(value, 10) 
        : value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await fetch(`/api/websites/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: {
            position: settings.position,
            delay: settings.delay,
            displayDuration: settings.displayDuration,
            maxNotifications: settings.maxNotifications,
            theme: settings.theme
          },
          allowedDomains: settings.allowedDomains
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDomain = () => {
    if (!newDomain) return;
    
    // Normalize domain input (remove protocol and trailing slash)
    let domain = newDomain.toLowerCase();
    if (domain.startsWith('http://')) {
      domain = domain.substring(7);
    } else if (domain.startsWith('https://')) {
      domain = domain.substring(8);
    }
    
    if (domain.endsWith('/')) {
      domain = domain.slice(0, -1);
    }
    
    // Check if domain already exists
    if (settings.allowedDomains.includes(domain)) {
      setMessage({ type: 'error', text: 'Domain already exists in the list' });
      return;
    }
    
    setSettings(prev => ({
      ...prev,
      allowedDomains: [...prev.allowedDomains, domain]
    }));
    
    setNewDomain('');
  };
  
  const handleRemoveDomain = (domain: string) => {
    setSettings(prev => ({
      ...prev,
      allowedDomains: prev.allowedDomains.filter(d => d !== domain)
    }));
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">

      
      {message.text && (
        <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'} mb-6`}>
          {message.type === 'error' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          <span>{message.text}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="card-title mb-6">
                  <CogIcon className="h-6 w-6 mr-2" />
                  Notification Settings
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Position</span>
                    </label>
                    <select
                      name="position"
                      value={settings.position}
                      onChange={handleChange}
                      className="select select-bordered w-full"
                    >
                      <option value="top-left">Top Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                    <label className="label">
                      <span className="label-text-alt">Where notifications appear on the screen</span>
                    </label>
                  </div>
                  
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Theme</span>
                    </label>
                    <select
                      name="theme"
                      value={settings.theme}
                      onChange={handleChange}
                      className="select select-bordered w-full"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                    <label className="label">
                      <span className="label-text-alt">Visual appearance of notifications</span>
                    </label>
                  </div>
                  
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Display Duration (seconds)</span>
                    </label>
                    <input
                      type="range"
                      name="displayDuration"
                      min="1"
                      max="20"
                      value={settings.displayDuration}
                      onChange={handleChange}
                      className="range range-primary"
                    />
                    <div className="w-full flex justify-between text-xs px-2 mt-2">
                      <span>1s</span>
                      <span>5s</span>
                      <span>10s</span>
                      <span>15s</span>
                      <span>20s</span>
                    </div>
                    <label className="label">
                      <span className="label-text-alt">Current: {settings.displayDuration} seconds</span>
                    </label>
                  </div>
                  
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Delay Between Notifications (seconds)</span>
                    </label>
                    <input
                      type="range"
                      name="delay"
                      min="0"
                      max="30"
                      value={settings.delay}
                      onChange={handleChange}
                      className="range range-primary"
                    />
                    <div className="w-full flex justify-between text-xs px-2 mt-2">
                      <span>0s</span>
                      <span>10s</span>
                      <span>20s</span>
                      <span>30s</span>
                    </div>
                    <label className="label">
                      <span className="label-text-alt">Current: {settings.delay} seconds</span>
                    </label>
                  </div>
                  
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Maximum Notifications Per Session</span>
                    </label>
                    <input
                      type="number"
                      name="maxNotifications"
                      min="1"
                      max="20"
                      value={settings.maxNotifications}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                    />
                    <label className="label">
                      <span className="label-text-alt">Maximum number of notifications to show to a visitor</span>
                    </label>
                  </div>
                </div>
                
                <div className="divider"></div>
                
                <div className="card-title mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                  Allowed Domains
                </div>
                
                <div className="mb-4">
                  <p className="text-sm mb-2">
                    Control which domains can embed your notifications. The main domain <span className="font-mono text-primary">{websiteDomain}</span> is always allowed.
                  </p>
                  
                  <div className="form-control">
                    <div className="join w-full">
                      <input
                        type="text"
                        placeholder="Example: subdomain.example.com"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        className="input input-bordered join-item w-full"
                      />
                      <button
                        type="button"
                        onClick={handleAddDomain}
                        className="btn join-item btn-primary"
                      >
                        Add
                      </button>
                    </div>
                    <label className="label">
                      <span className="label-text-alt">Add any additional domains where your widget will be embedded</span>
                    </label>
                  </div>
                  
                  {settings.allowedDomains.length > 0 ? (
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Allowed Domains:</div>
                      <div className="flex flex-wrap gap-2">
                        {settings.allowedDomains.map((domain) => (
                          <div key={domain} className="badge badge-outline gap-1 p-3">
                            {domain}
                            <button
                              type="button"
                              onClick={() => handleRemoveDomain(domain)}
                              className="ml-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 mt-2">
                      No additional domains added. Your widget will only work on {websiteDomain}.
                    </div>
                  )}
                </div>
                
                <div className="card-actions justify-end mt-6">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn btn-primary"
                  >
                    {isSaving ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Saving...
                      </>
                    ) : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <div>
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                About Settings
              </div>
              <div className="text-sm space-y-3 mt-4">
                <p>
                  <span className="font-semibold">Position:</span> Determines where notifications appear on your visitors' screens.
                </p>
                <p>
                  <span className="font-semibold">Theme:</span> Choose between light and dark appearance for notifications.
                </p>
                <p>
                  <span className="font-semibold">Display Duration:</span> How long each notification remains visible.
                </p>
                <p>
                  <span className="font-semibold">Delay Between Notifications:</span> Wait time before showing the next notification.
                </p>
                <p>
                  <span className="font-semibold">Maximum Notifications:</span> Limits how many notifications a visitor sees per session.
                </p>
                <p>
                  <span className="font-semibold">Allowed Domains:</span> Control which domains can display your notifications.
                </p>
              </div>
              
              <div className="divider"></div>
              
              <div className="flex justify-between items-center">
                <Link href={`/dashboard/websites/${params.id}/api-keys`} className="btn btn-sm btn-outline">
                  Manage API Keys
                </Link>
                <Link href={`/dashboard/websites/${params.id}/notifications`} className="btn btn-sm btn-outline">
                  Manage Notifications
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 