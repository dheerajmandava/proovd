'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CogIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface SettingsTabProps {
  websiteId: string;
}

interface WebsiteSettings {
  position: string;
  delay: number;
  displayDuration: number;
  maxNotifications: number;
  theme: string;
  allowedDomains: string[];
  email: string;
  emailNotifications: boolean;
  notificationDigest: string;
  displayOrder: string;
  randomize: boolean;
  initialDelay: number;
  loop: boolean;
  customStyles: string;
}

export default function SettingsTab({ websiteId }: SettingsTabProps) {
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
    allowedDomains: [],
    email: '',
    emailNotifications: true,
    notificationDigest: 'daily',
    displayOrder: 'newest',
    randomize: false,
    initialDelay: 5,
    loop: false,
    customStyles: ''
  });
  const [websiteName, setWebsiteName] = useState('');
  const [websiteDomain, setWebsiteDomain] = useState('');

  useEffect(() => {
    fetchWebsite();
  }, [websiteId]);

  const fetchWebsite = async () => {
    try {
      // First fetch website settings
      const websiteResponse = await fetch(`/api/websites/${websiteId}`);
      
      if (!websiteResponse.ok) {
        throw new Error('Failed to fetch website');
      }
      
      const websiteData = await websiteResponse.json();
      setWebsiteName(websiteData.name);
      setWebsiteDomain(websiteData.domain);
      
      // Then fetch user preferences
      const userResponse = await fetch('/api/user/preferences');
      let userData: { email?: string; emailNotifications?: boolean; notificationDigest?: string } = {};
      
      if (userResponse.ok) {
        userData = await userResponse.json();
      }
      
      // Set settings with defaults if any property is missing
      setSettings({
        position: websiteData.settings?.position || 'bottom-left',
        delay: websiteData.settings?.delay || 5,
        displayDuration: websiteData.settings?.displayDuration || 5,
        maxNotifications: websiteData.settings?.maxNotifications || 5,
        theme: websiteData.settings?.theme || 'light',
        allowedDomains: websiteData.allowedDomains || [],
        email: userData.email || '',
        emailNotifications: userData.emailNotifications !== undefined ? userData.emailNotifications : true,
        notificationDigest: userData.notificationDigest || 'daily',
        displayOrder: websiteData.settings?.displayOrder || 'newest',
        randomize: websiteData.settings?.randomize || false,
        initialDelay: websiteData.settings?.initialDelay || websiteData.settings?.delay || 5,
        loop: websiteData.settings?.loop || false,
        customStyles: websiteData.settings?.customStyles || ''
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

  const handleAddDomain = () => {
    if (!newDomain) return;
    
    const domain = newDomain.trim();
    if (settings.allowedDomains.includes(domain)) {
      setMessage({ type: 'error', text: 'Domain already exists' });
      return;
    }
    
    setSettings({
      ...settings,
      allowedDomains: [...settings.allowedDomains, domain]
    });
    setNewDomain('');
  };
  
  const handleRemoveDomain = (domain: string) => {
    setSettings({
      ...settings,
      allowedDomains: settings.allowedDomains.filter(d => d !== domain)
    });
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      // First update website settings
      const websiteResponse = await fetch(`/api/websites/${websiteId}`, {
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
            theme: settings.theme,
            displayOrder: settings.displayOrder,
            randomize: settings.randomize,
            initialDelay: settings.initialDelay,
            loop: settings.loop,
            customStyles: settings.customStyles
          },
          allowedDomains: settings.allowedDomains,
        }),
      });
      
      if (!websiteResponse.ok) {
        throw new Error('Failed to update website settings');
      }
      
      // Then update user preferences
      const userResponse = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: settings.email,
          emailNotifications: settings.emailNotifications,
          notificationDigest: settings.notificationDigest
        }),
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to update user preferences');
      }
      
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }
  
  return (
    <div>
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
              <div className="card-title">
                <CogIcon className="h-6 w-6 mr-2" />
                Website Settings
              </div>
              
              <form onSubmit={handleSubmit} className="mt-6">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Notification Position</span>
                  </label>
                  <select
                    name="position"
                    value={settings.position}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                  <label className="label">
                    <span className="label-text-alt">Where notifications appear on your website</span>
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
                    max="20"
                    value={settings.delay}
                    onChange={handleChange}
                    className="range range-primary"
                  />
                  <div className="w-full flex justify-between text-xs px-2 mt-2">
                    <span>0s</span>
                    <span>5s</span>
                    <span>10s</span>
                    <span>15s</span>
                    <span>20s</span>
                  </div>
                  <label className="label">
                    <span className="label-text-alt">Current: {settings.delay} seconds</span>
                  </label>
                </div>
                
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Maximum Notifications</span>
                  </label>
                  <input
                    type="range"
                    name="maxNotifications"
                    min="1"
                    max="10"
                    value={settings.maxNotifications}
                    onChange={handleChange}
                    className="range range-primary"
                  />
                  <div className="w-full flex justify-between text-xs px-2 mt-2">
                    <span>1</span>
                    <span>3</span>
                    <span>5</span>
                    <span>7</span>
                    <span>10</span>
                  </div>
                  <label className="label">
                    <span className="label-text-alt">Current: {settings.maxNotifications} notifications</span>
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
                    <option value="custom">Custom</option>
                  </select>
                  <label className="label">
                    <span className="label-text-alt">Visual appearance of notifications</span>
                  </label>
                </div>
                
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Display Order</span>
                  </label>
                  <select
                    name="displayOrder"
                    value={settings.displayOrder}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="newest">Newest First</option>
                    <option value="random">Random</option>
                    <option value="smart">Smart (Optimized)</option>
                  </select>
                  <label className="label">
                    <span className="label-text-alt">How notifications are ordered when displayed</span>
                  </label>
                </div>
                
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Initial Delay (seconds)</span>
                  </label>
                  <input
                    type="range"
                    name="initialDelay"
                    min="0"
                    max="30"
                    value={settings.initialDelay}
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
                    <span className="label-text-alt">Current: {settings.initialDelay} seconds</span>
                  </label>
                </div>
                
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Advanced Options</span>
                  </label>
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="flex items-center">
                      <label className="label cursor-pointer justify-start gap-2">
                        <input
                          type="checkbox"
                          name="randomize"
                          checked={settings.randomize}
                          onChange={(e) => setSettings({...settings, randomize: e.target.checked})}
                          className="checkbox checkbox-primary"
                        />
                        <span className="label-text">Randomize Notifications</span>
                      </label>
                    </div>
                    <div className="flex items-center">
                      <label className="label cursor-pointer justify-start gap-2">
                        <input
                          type="checkbox"
                          name="loop"
                          checked={settings.loop}
                          onChange={(e) => setSettings({...settings, loop: e.target.checked})}
                          className="checkbox checkbox-primary"
                        />
                        <span className="label-text">Loop Notifications</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                {settings.theme === 'custom' && (
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Custom CSS</span>
                    </label>
                    <textarea
                      name="customStyles"
                      value={settings.customStyles}
                      onChange={(e) => setSettings({...settings, customStyles: e.target.value})}
                      className="textarea textarea-bordered h-24 font-mono text-sm"
                      placeholder=".notification { background: #f5f5f5; }"
                    />
                    <label className="label">
                      <span className="label-text-alt">Custom CSS for notification styling</span>
                    </label>
                  </div>
                )}
                
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
                
                <div className="card-title mb-6 mt-6">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                  Allowed Domains
                </div>
                
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text font-medium">Domain Name</span>
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="example.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      className="input input-bordered flex-grow"
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleAddDomain}
                    >
                      Add
                    </button>
                  </div>
                  <label className="label">
                    <span className="label-text-alt">Add domains that can show notifications from this website</span>
                  </label>
                </div>
                
                <div className="mb-6">
                  {settings.allowedDomains.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="table table-compact w-full">
                        <thead>
                          <tr>
                            <th>Domain</th>
                            <th className="w-20 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {settings.allowedDomains.map((domain, index) => (
                            <tr key={index}>
                              <td>{domain}</td>
                              <td className="text-right">
                                <button
                                  type="button"
                                  className="btn btn-xs btn-error"
                                  onClick={() => handleRemoveDomain(domain)}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="alert alert-info">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>No domains added yet. Add domains to control where notifications can appear.</span>
                    </div>
                  )}
                </div>
                
                <div className="card-title mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  Notification Preferences
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Email</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={settings.email}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                    />
                    <label className="label">
                      <span className="label-text-alt">Used for notifications and account updates</span>
                    </label>
                  </div>
                  
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Email Notifications</span>
                    </label>
                    <div className="flex items-center h-12">
                      <label className="label cursor-pointer justify-start gap-2">
                        <input
                          type="checkbox"
                          name="emailNotifications"
                          checked={settings.emailNotifications}
                          onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                          className="checkbox checkbox-primary"
                        />
                        <span className="label-text">Receive email notifications</span>
                      </label>
                    </div>
                    <label className="label">
                      <span className="label-text-alt">Get notified about important updates</span>
                    </label>
                  </div>
                  
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Notification Digest</span>
                    </label>
                    <select
                      name="notificationDigest"
                      value={settings.notificationDigest}
                      onChange={handleChange}
                      className="select select-bordered w-full"
                      disabled={!settings.emailNotifications}
                    >
                      <option value="realtime">Real-time</option>
                      <option value="daily">Daily Digest</option>
                      <option value="weekly">Weekly Digest</option>
                    </select>
                    <label className="label">
                      <span className="label-text-alt">How often you receive email summaries</span>
                    </label>
                  </div>
                </div>
                
                <div className="form-control w-full mt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="label mb-0 pb-0">
                        <span className="label-text font-medium">API Keys</span>
                      </label>
                      <label className="label mt-0 pt-0">
                        <span className="label-text-alt">Manage API keys for this website</span>
                      </label>
                    </div>
                    <Link 
                      href={`/dashboard/websites/${websiteId}/api-keys`} 
                      className="btn btn-sm btn-primary"
                    >
                      Manage API Keys
                    </Link>
                  </div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 