'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface UserSettings {
  displayDuration: number;
  position: string;
  delay: number;
  maxNotifications: number;
  apiKey: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [settings, setSettings] = useState<UserSettings>({
    displayDuration: 5,
    position: 'bottom-left',
    delay: 3,
    maxNotifications: 5,
    apiKey: ''
  });
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    
    if (status === 'authenticated') {
      fetchSettings();
    }
  }, [status, router]);
  
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/user/settings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      setSettings(data);
      setIsLoading(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load settings' });
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
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
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
  
  const regenerateApiKey = async () => {
    if (!confirm('Are you sure you want to regenerate your API key? This will invalidate your current key.')) {
      return;
    }
    
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await fetch('/api/user/regenerate-api-key', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to regenerate API key');
      }
      
      const data = await response.json();
      setSettings(prev => ({
        ...prev,
        apiKey: data.apiKey
      }));
      
      setMessage({ type: 'success', text: 'API key regenerated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to regenerate API key' });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <div className="text-sm breadcrumbs">
          <ul>
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li>Settings</li>
          </ul>
        </div>
      </div>
      
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
      
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="card-title mb-6">Notification Settings</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            
            <div className="card-title mb-6">API Settings</div>
            
            <div className="form-control w-full mb-6">
              <label className="label">
                <span className="label-text font-medium">API Key</span>
              </label>
              <div className="join w-full">
                <input
                  type="text"
                  value={settings.apiKey}
                  readOnly
                  className="input input-bordered join-item w-full font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={regenerateApiKey}
                  disabled={isSaving}
                  className="btn join-item btn-primary"
                >
                  Regenerate
                </button>
              </div>
              <label className="label">
                <span className="label-text-alt">Use this key to authenticate API requests. Keep it secret.</span>
              </label>
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
      
      <div className="mt-8">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Widget Installation</h2>
            <p className="text-sm opacity-70">
              Add this script to your website to display social proof notifications.
            </p>
            
            <div className="mockup-code mt-4">
              <pre data-prefix="1"><code>{`<script src="https://your-domain.com/widget.js" data-key="${settings.apiKey}"></script>`}</code></pre>
            </div>
            
            <div className="alert bg-base-200 mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Add this script right before the closing &lt;/body&gt; tag for best performance.</span>
            </div>
            
            <div className="card-actions justify-end mt-4">
              <button className="btn btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                </svg>
                Copy Code
              </button>
              <Link href="/dashboard/api-docs" className="btn btn-primary">
                View Documentation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 