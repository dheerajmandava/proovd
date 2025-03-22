'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { timeAgo } from '@/app/lib/utils';

// Define notification type interface
interface Notification {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string;
  productName?: string;
  message?: string;
  url?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  website: {
    _id: string;
    name: string;
    domain: string;
  };
}

// Define website interface
interface Website {
  id: string;
  name: string;
  domain: string;
  status: string;
  }

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Fetch notifications from all websites
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/notifications');
        
        if (!response.ok) {
          throw new Error('Failed to load notifications');
        }
        
        const data = await response.json();
        setNotifications(data.notifications || []);
        setFilteredNotifications(data.notifications || []);
        setWebsites(data.websites || []);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Filter notifications when website selection changes
  useEffect(() => {
    if (selectedWebsite === 'all') {
      setFilteredNotifications(notifications);
    } else {
      setFilteredNotifications(
        notifications.filter(notification => 
          notification.website._id === selectedWebsite
        )
      );
    }
  }, [selectedWebsite, notifications]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
  return (
      <div className="p-4">
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }
      
  // Render notifications list
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">All Notifications</h1>
          <p className="text-neutral-content">
            Manage notifications across all your websites
          </p>
        </div>
        {websites.length > 0 && (
          <Link href={`/dashboard/websites/${websites[0].id}/notifications/new`} className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
            Add Notification
        </Link>
        )}
      </div>
      
      {websites.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filter by website:</span>
            <select 
              className="select select-bordered select-sm"
              value={selectedWebsite}
              onChange={(e) => setSelectedWebsite(e.target.value)}
            >
              <option value="all">All websites</option>
              {websites.map((website) => (
                <option key={website.id} value={website.id}>
                  {website.name} ({website.domain})
                </option>
              ))}
            </select>
          </div>
                        </div>
      )}
      
      {websites.length === 0 ? (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body items-center text-center">
            <h2 className="card-title mb-2">No websites yet</h2>
            <p className="mb-4">Add your first website to start showing social proof on your site</p>
            <Link href="/dashboard/websites/new" className="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              Add Your First Website
                        </Link>
                      </div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body items-center text-center">
            <h2 className="card-title mb-2">No notifications yet</h2>
            <p className="mb-4">Add your first notification to start showing social proof on your website</p>
            <Link href={`/dashboard/websites/${websites[0].id}/notifications/new`} className="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              Create Your First Notification
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredNotifications.map((notification) => (
            <div key={notification.id} className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="card-title">{notification.name}</h2>
                      <div className={`badge badge-${notification.status === 'active' ? 'success' : notification.status === 'draft' ? 'warning' : 'error'} gap-1`}>
                        <div className={`w-2 h-2 rounded-full bg-${notification.status === 'active' ? 'success' : notification.status === 'draft' ? 'warning' : 'error'}-content`}></div>
                        {notification.status === 'active' ? 'Active' : notification.status === 'draft' ? 'Draft' : 'Inactive'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="badge badge-outline">
                        {notification.type === 'purchase' ? 'Purchase' : 
                         notification.type === 'signup' ? 'Sign Up' : 'Custom'}
                      </div>
                      <div className="badge badge-primary badge-outline">
                        {notification.website.name}
        </div>
      </div>
      
                    <p className="text-sm text-neutral-content mb-2">
                      {notification.type === 'purchase' && notification.productName && (
                        <span>Someone purchased {notification.productName}</span>
                      )}
                      {notification.type === 'signup' && (
                        <span>Someone signed up</span>
                      )}
                      {notification.message && (
                        <span> {notification.message}</span>
                      )}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-neutral-content mb-2">
                      <span>Created {timeAgo(notification.createdAt)}</span>
                      <span>•</span>
                      <span className="capitalize">
                        {notification.location === 'global' ? 'All pages' : 'Specific pages'}
                      </span>
                      <span>•</span>
                      <span>{notification.website.domain}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link 
                      href={`/dashboard/websites/${notification.website._id}/notifications/${notification.id}`} 
                      className="btn btn-sm btn-outline"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      View
                    </Link>
                    <Link 
                      href={`/dashboard/websites/${notification.website._id}/notifications/${notification.id}/edit`} 
                      className="btn btn-sm btn-outline"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      Edit
                    </Link>
                    <Link 
                      href={`/dashboard/websites/${notification.website._id}`} 
                      className="btn btn-sm btn-outline"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                      Website
                    </Link>
              </div>
            </div>
            
                {/* Preview of the notification */}
                <div className="mt-4 p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-base-300">
                      {notification.image ? (
                        <img src={notification.image} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold">
                          {notification.name.substring(0, 1)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">
                        {notification.type === 'purchase' && notification.productName ? 
                          `Someone purchased ${notification.productName}` : 
                          notification.type === 'signup' ? 
                            'Someone signed up' : 
                            notification.message || 'Custom notification'}
                      </div>
                      <div className="text-xs text-neutral-content">A few moments ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 