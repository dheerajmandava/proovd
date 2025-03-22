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
}

// Define website interface
interface Website {
  id: string;
  name: string;
  domain: string;
}

interface NotificationsTabProps {
  websiteId: string;
}

export default function NotificationsTab({ websiteId }: NotificationsTabProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [website, setWebsite] = useState<Website | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Fetch website and notifications
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch website data
        const websiteResponse = await fetch(`/api/websites/${websiteId}`);
        if (!websiteResponse.ok) throw new Error('Failed to load website');
        const websiteData = await websiteResponse.json();
        setWebsite(websiteData);
        
        // Fetch notifications
        const notificationsResponse = await fetch(`/api/websites/${websiteId}/notifications`);
        if (!notificationsResponse.ok) throw new Error('Failed to load notifications');
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData.notifications || []);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [websiteId]);
  
  // Handle notification delete
  async function handleDelete(notificationId: string) {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }
    
    try {
      const response = await fetch(
        `/api/websites/${websiteId}/notifications/${notificationId}`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
      
      // Remove deleted notification from state
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (err: any) {
      alert(err.message || 'Failed to delete notification');
    }
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="alert alert-error shadow-lg">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Notifications</h2>
          <p className="text-base-content/70">
            Manage notifications for {website?.name || 'this website'}
          </p>
        </div>
        <Link href={`/dashboard/websites/${websiteId}/notifications/new`} className="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Add Notification
        </Link>
      </div>
      
      {notifications.length === 0 ? (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body items-center text-center">
            <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center text-base-content/40 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 className="card-title mb-2">No notifications yet</h2>
            <p className="mb-4 text-base-content/70">Add your first notification to start showing social proof on your website</p>
            <div className="card-actions">
              <Link href={`/dashboard/websites/${websiteId}/notifications/new`} className="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Create Your First Notification
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {notifications.map((notification) => (
            <div key={notification.id} className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="card-title">{notification.name}</h2>
                      {notification.status === 'active' && (
                        <div className="badge badge-success gap-1">
                          <span className="w-2 h-2 rounded-full bg-success-content"></span>
                          Active
                        </div>
                      )}
                      {notification.status === 'draft' && (
                        <div className="badge badge-warning gap-1">
                          <span className="w-2 h-2 rounded-full bg-warning-content"></span>
                          Draft
                        </div>
                      )}
                      {notification.status === 'inactive' && (
                        <div className="badge badge-error gap-1">
                          <span className="w-2 h-2 rounded-full bg-error-content"></span>
                          Inactive
                        </div>
                      )}
                    </div>

                    <div className="badge badge-outline mb-2">
                      {notification.type === 'purchase' ? 'Purchase' : 
                       notification.type === 'signup' ? 'Sign Up' : 'Custom'}
                    </div>

                    <p className="text-base-content/80 mb-2">
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

                    <div className="flex items-center gap-2 text-xs text-base-content/60 mb-2">
                      <span>Created {notification.createdAt ? timeAgo(notification.createdAt) : 'recently'}</span>
                      <span>•</span>
                      <span className="capitalize">
                        {notification.location === 'global' ? 'All pages' : 'Specific pages'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link 
                      href={`/dashboard/websites/${websiteId}/notifications/${notification.id}`} 
                      className="btn btn-sm btn-outline"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      View
                    </Link>
                    <Link 
                      href={`/dashboard/websites/${websiteId}/notifications/${notification.id}/edit`} 
                      className="btn btn-sm btn-outline"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      Edit
                    </Link>
                    <button 
                      className="btn btn-sm btn-outline btn-error"
                      onClick={() => handleDelete(notification.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
                
                {/* Preview of the notification */}
                <div className="collapse collapse-plus bg-base-200 rounded-box mt-4">
                  <input type="checkbox" className="peer" /> 
                  <div className="collapse-title text-sm font-medium">
                    Preview Notification
                  </div>
                  <div className="collapse-content">
                    <div className="flex items-center mt-2">
                      <div className="avatar">
                        <div className="w-10 h-10 rounded-full bg-base-300">
                          {notification.image ? (
                            <img src={notification.image} alt="Avatar" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl font-bold">
                              {notification.name.substring(0, 1)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="font-semibold text-sm">
                          {notification.type === 'purchase' && notification.productName && (
                            <span>Someone purchased {notification.productName}</span>
                          )}
                          {notification.type === 'signup' && (
                            <span>Someone signed up</span>
                          )}
                          {notification.message && (
                            <span> {notification.message}</span>
                          )}
                        </div>
                        <div className="text-xs text-base-content/60">just now</div>
                      </div>
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