'use client';

import { useState, useEffect } from 'react';
import { UserData, useWebsiteData, useWebsiteSettings, WebsiteData, WebsiteSettings } from '@/app/lib/hooks';
import { useUserData, useUpdateUserPreferences } from '@/app/lib/hooks';


interface SettingsTabProps {
  websiteId: string;
  initialWebsite: WebsiteData;
  initialUserData: UserData;
}

export default function SettingsTab({ websiteId, initialWebsite, initialUserData }: SettingsTabProps) {
  // State for new domain input
  const [newDomain, setNewDomain] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Custom hook for fetching website data

  // Custom hook for updating website settings
  const { 
    updateSettings, 
    isUpdating: isUpdatingSettings, 
    error: updateSettingsError 
  } = useWebsiteSettings();
  
  // Custom hooks for user data and preferences
  const { 
    user: userData, 
    isLoading: isLoadingUser, 
    error: userError 
  } = useUserData();
  
  const { 
    updatePreferences, 
    isUpdating: isUpdatingPreferences 
  } = useUpdateUserPreferences();
  
  // Combined loading state
 
  
  // Prepare settings object combining website settings and user preferences
  const combinedSettings = {
    // Website settings with defaults
    position: initialWebsite?.settings?.position || 'bottom-left',
    delay: initialWebsite?.settings?.delay || 5,
    displayDuration: initialWebsite?.settings?.displayDuration || 5,
    maxNotifications: initialWebsite?.settings?.maxNotifications || 5,
    theme: initialWebsite?.settings?.theme || 'light',
    displayOrder: initialWebsite?.settings?.displayOrder || 'newest',
    randomize: initialWebsite?.settings?.randomize || false,
    initialDelay: initialWebsite?.settings?.initialDelay || 5,
    loop: initialWebsite?.settings?.loop || false,
    customStyles: initialWebsite?.settings?.customStyles || '',
    
    // User data with defaults
    email: userData?.email || '',
    emailNotifications: userData?.emailNotifications !== undefined 
      ? userData.emailNotifications 
      : true,
    notificationDigest: userData?.notificationDigest || 'daily',
    
    // Allowed domains
    allowedDomains: initialWebsite?.allowedDomains || [],
  };
  
  // New state for tracking local changes
  const [localSettings, setLocalSettings] = useState<Partial<WebsiteSettings> & { allowedDomains?: string[] }>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let updatedValue: string | number | boolean = value;
    
    // Convert number fields
    if (name === 'displayDuration' || name === 'delay' || name === 'initialDelay' || name === 'maxNotifications') {
      updatedValue = parseInt(value, 10);
    }
    
    // Convert checkbox fields
    if (type === 'checkbox') {
      updatedValue = (e.target as HTMLInputElement).checked;
    }
    
    // Update local state instead of immediately saving
    setLocalSettings(prev => ({
      ...prev,
      [name]: updatedValue
    }));
  };

  // Track changes to see if save button should be enabled
  useEffect(() => {
    setHasChanges(Object.keys(localSettings).length > 0);
  }, [localSettings]);

  // Save all changes at once
  const handleSaveSettings = () => {
    if (!hasChanges) return;
    
    updateSettings(websiteId, localSettings)
      .then(() => {   
        setLocalSettings({});
        setHasChanges(false);
        setMessage({ type: 'success', text: 'Settings saved successfully' });
      })
      .catch((error) => {
        setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
      });
  };

  // Handle slider changes
  const handleSliderChange = (name: string, value: number) => {
    setLocalSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle adding a new domain
  const handleAddDomain = () => {
    if (!newDomain) return;
    
    const domain = newDomain.trim();
    const currentDomains = localSettings.allowedDomains || combinedSettings.allowedDomains;
    
    if (currentDomains.includes(domain)) {
      setMessage({ type: 'error', text: 'Domain already exists' });
      return;
    }
    
    const newAllowedDomains = [...currentDomains, domain];
    
    // Update local settings instead of making API call directly
    setLocalSettings(prev => ({
      ...prev,
      allowedDomains: newAllowedDomains
    }));
    
    setNewDomain('');
    setMessage({ type: 'success', text: 'Domain added. Click Save Settings to apply changes.' });
  };
  
  // Handle removing a domain
  const handleRemoveDomain = (domain: string) => {
    const currentDomains = localSettings.allowedDomains || combinedSettings.allowedDomains;
    const newAllowedDomains = currentDomains.filter(d => d !== domain);
    
    // Update local settings instead of making API call directly
    setLocalSettings(prev => ({
      ...prev,
      allowedDomains: newAllowedDomains
    }));
    
    setMessage({ type: 'success', text: 'Domain removed. Click Save Settings to apply changes.' });
  };
  
  // Combined settings object that prioritizes local changes
  const displaySettings = {
    ...combinedSettings,
    ...localSettings
  };
  
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
              <h2 className="card-title flex items-center">
                <svg className="h-6 w-6 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Website Settings
              </h2>
              
              <div className="mt-4">
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <label className="font-medium">Notification Position</label>
                    <span className="text-sm capitalize">{displaySettings.position.replace('-', ' ')}</span>
                  </div>
                  <select
                    name="position"
                    value={displaySettings.position}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Where notifications appear on your website</p>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <label className="font-medium">Delay Between Notifications</label>
                   
                  </div>
                  <div className="w-full max-w-xs">
                    <input
                      type="range"
                      name="delay"
                      min="0"
                      max="20"
                      value={displaySettings.delay}
                      onChange={handleChange}
                      className="range range-primary"
                      step="1"
                    />
                    <div className="flex justify-between px-2.5 mt-2 text-xs">
                      <span>0s</span>
                      <span>5s</span>
                      <span>10s</span>
                      <span>15s</span>
                      <span>20s</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Current: {displaySettings.delay} seconds</p>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <label className="font-medium">Maximum Notifications</label>
                    <span className="text-sm">{displaySettings.maxNotifications}</span>
                  </div>
                  <div className="w-full max-w-xs">
                    <input
                      type="range"
                      name="maxNotifications"
                      min="1"
                      max="10"
                      value={displaySettings.maxNotifications}
                      onChange={handleChange}
                      className="range range-primary"
                      step="1"
                    />
                    <div className="flex justify-between px-2.5 mt-2 text-xs">
                      <span>1</span>
                      <span>3</span>
                      <span>5</span>
                      <span>7</span>
                      <span>10</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Current: {displaySettings.maxNotifications} notifications</p>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <label className="font-medium">Theme</label>
                  </div>
                  <select
                    name="theme"
                    value={displaySettings.theme}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="custom">Custom</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Visual appearance of notifications</p>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <label className="font-medium">Display Order</label>
                  </div>
                  <select
                    name="displayOrder"
                    value={displaySettings.displayOrder}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">How notifications are ordered when displayed</p>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <label className="font-medium">Initial Delay</label>
                    <span className="text-sm">{displaySettings.initialDelay} seconds</span>
                  </div>
                  <div className="w-full max-w-xs">
                    <input
                      type="range"
                      name="initialDelay"
                      min="0"
                      max="30"
                      value={displaySettings.initialDelay}
                      onChange={handleChange}
                      className="range range-primary"
                      step="1"
                    />
                    <div className="flex justify-between px-2.5 mt-2 text-xs">
                      <span>0s</span>
                      <span>10s</span>
                      <span>20s</span>
                      <span>30s</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Current: {displaySettings.initialDelay} seconds</p>
                </div>
                
                <div className="mb-6">
                  <p className="font-medium mb-2">Advanced Options</p>
                  
                  <div className="form-control mb-2">
                    <label className="label cursor-pointer justify-start">
                      <input
                        type="checkbox"
                        name="randomize"
                        checked={displaySettings.randomize}
                        onChange={handleChange}
                        className="checkbox checkbox-primary mr-2"
                      />
                      <span className="label-text">Randomize Notifications</span>
                    </label>
                  </div>
                  
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start">
                      <input
                        type="checkbox"
                        name="loop"
                        checked={displaySettings.loop}
                        onChange={handleChange}
                        className="checkbox checkbox-primary mr-2"
                      />
                      <span className="label-text">Loop Notifications</span>
                    </label>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <label className="font-medium">Display Duration</label>
                    <span className="text-sm">{displaySettings.displayDuration} seconds</span>
                  </div>
                  <div className="w-full max-w-xs">
                    <input
                      type="range"
                      name="displayDuration"
                      min="1"
                      max="20"
                      value={displaySettings.displayDuration}
                      onChange={handleChange}
                      className="range range-primary"
                      step="1"
                    />
                    <div className="flex justify-between px-2.5 mt-2 text-xs">
                      <span>1s</span>
                      <span>5s</span>
                      <span>10s</span>
                      <span>15s</span>
                      <span>20s</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Current: {displaySettings.displayDuration} seconds</p>
                </div>
              </div>

              {/* Add save button at the bottom of the settings card */}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className={`btn ${hasChanges ? 'btn-primary' : 'btn-disabled'}`}
                  onClick={handleSaveSettings}
                  disabled={!hasChanges}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
          
          <div className="card bg-base-100 shadow-xl mt-6">
            <div className="card-body">
              <h2 className="card-title flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Allowed Domains
              </h2>
              
              <p className="text-sm text-gray-600 mt-2">
                By default, your widget will only load on {initialWebsite?.domain}. Add additional domains where you want to display notifications.
              </p>
              
              {/* Allowed Domains List */}
              <div className="mt-4">
                <h3 className="font-medium text-lg mb-2">Allowed Domains</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(localSettings.allowedDomains || combinedSettings.allowedDomains).map((domain) => (
                    <div key={domain} className="badge badge-primary badge-lg gap-2">
                      {domain}
                      <button 
                        type="button" 
                        className="btn btn-xs btn-ghost btn-circle"
                        onClick={() => handleRemoveDomain(domain)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {(localSettings.allowedDomains || combinedSettings.allowedDomains).length === 0 && (
                    <p className="text-sm text-base-content/70">No domains added yet. Add domains to allow notifications on additional websites.</p>
                  )}
                </div>
                {/* Add Domain Form */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="example.com"
                    className="input input-bordered flex-grow"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                  />
                  <button 
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddDomain}
                  >
                    Add Domain
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                About Settings
              </h2>
              
              <div className="mt-4 space-y-4">
                <div>
                  <p className="font-medium">Position:</p>
                  <p className="text-sm">Determines where notifications appear on your visitors' screens.</p>
                </div>
                
                <div>
                  <p className="font-medium">Theme:</p>
                  <p className="text-sm">Choose between light and dark appearance for notifications.</p>
                </div>
                
                <div>
                  <p className="font-medium">Display Duration:</p>
                  <p className="text-sm">How long each notification remains visible.</p>
                </div>
                
                <div>
                  <p className="font-medium">Delay Between Notifications:</p>
                  <p className="text-sm">Wait time before showing the next notification.</p>
                </div>
                
                <div>
                  <p className="font-medium">Maximum Notifications:</p>
                  <p className="text-sm">Limits how many notifications a visitor sees per session.</p>
                </div>
                
                <div>
                  <p className="font-medium">Allowed Domains:</p>
                  <p className="text-sm">Control which domains can display your notifications.</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-semibold">Need Help?</h3>
                <p className="mt-2 text-sm">
                  Check out our <a href="#" className="text-blue-600 hover:underline">documentation</a> for more information on how to customize your notifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 