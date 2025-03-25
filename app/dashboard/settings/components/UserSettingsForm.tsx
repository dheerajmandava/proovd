'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Switch } from '@headlessui/react';

interface ServerUser {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  plan: string;
  lastLogin: Date;
}

interface UserPreferences {
  emailNotifications: boolean;
  notificationDigest: string;
}

interface UserSettingsFormProps {
  initialUserData: ServerUser;
  initialPreferences: UserPreferences | null;
}

export default function UserSettingsForm({ initialUserData, initialPreferences }: UserSettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Use initial data or set defaults
  const preferences = initialPreferences || {
    emailNotifications: true,
    notificationDigest: 'daily'
  };
  
  // Form state
  const [formData, setFormData] = useState({
    emailNotifications: preferences.emailNotifications,
    notificationDigest: preferences.notificationDigest
  });
  
  // Handle input change
  const handleSwitchChange = (checked: boolean) => {
    setFormData({
      ...formData,
      emailNotifications: checked
    });
  };
  
  // Handle select change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update preferences');
      }
      
      setSuccessMessage('Settings updated successfully!');
      router.refresh(); // Refresh the page to update server data
    } catch (error) {
      console.error('Error updating preferences:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      {/* User information (read-only) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="label">
            <span className="label-text">Name</span>
          </label>
          <input 
            type="text" 
            value={initialUserData.name}
            className="input input-bordered w-full" 
            disabled
          />
        </div>
        
        <div>
          <label className="label">
            <span className="label-text">Email</span>
          </label>
          <input 
            type="email" 
            value={initialUserData.email}
            className="input input-bordered w-full" 
            disabled
          />
        </div>
        
        <div>
          <label className="label">
            <span className="label-text">Account Type</span>
          </label>
          <input 
            type="text" 
            value={initialUserData.plan.charAt(0).toUpperCase() + initialUserData.plan.slice(1)}
            className="input input-bordered w-full" 
            disabled
          />
        </div>
      </div>
      
      <div className="divider"></div>
      
      {/* Notification Preferences */}
      <h3 className="text-lg font-semibold">Notification Preferences</h3>
      
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Email Notifications</h4>
          <p className="text-sm text-muted-foreground">
            Receive notifications about your website activity via email
          </p>
        </div>
        <Switch
          checked={formData.emailNotifications}
          onChange={handleSwitchChange}
          className={`${
            formData.emailNotifications ? 'bg-primary' : 'bg-gray-300'
          } relative inline-flex h-6 w-11 items-center rounded-full`}
        >
          <span className="sr-only">Enable email notifications</span>
          <span
            className={`${
              formData.emailNotifications ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition`}
          />
        </Switch>
      </div>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text">Notification Digest Frequency</span>
        </label>
        <select 
          name="notificationDigest"
          value={formData.notificationDigest}
          onChange={handleSelectChange}
          className="select select-bordered w-full max-w-xs"
          disabled={!formData.emailNotifications}
        >
          <option value="realtime">Real-time</option>
          <option value="daily">Daily digest</option>
          <option value="weekly">Weekly digest</option>
        </select>
        <label className="label">
          <span className="label-text-alt">
            How often you want to receive email digests of your notifications
          </span>
        </label>
      </div>
      
      {/* Error and success messages */}
      {errorMessage && (
        <div className="alert alert-error">
          <span>{errorMessage}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="alert alert-success">
          <span>{successMessage}</span>
        </div>
      )}
      
      {/* Form actions */}
      <div className="flex justify-end">
        <button 
          type="submit" 
          className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
} 