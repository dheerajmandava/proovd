'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { timeAgo } from '@/app/lib/utils';
import { useNotifications, useDeleteNotification } from '@/app/lib/hooks';
export default function NotificationsTab({ websiteId }) {
    const [website, setWebsite] = useState(null);
    const [fetchError, setFetchError] = useState('');
    // Use custom hooks for notifications data and deletion
    const { notifications, isLoading, error: notificationsError, refreshNotifications } = useNotifications(websiteId);
    const { deleteNotification, isDeleting, error: deleteError } = useDeleteNotification();
    // Track which notifications are being deleted
    const [deletingIds, setDeletingIds] = useState(new Set());
    // Fetch website data
    useEffect(() => {
        async function fetchWebsiteData() {
            try {
                if (!websiteId)
                    return;
                const websiteResponse = await fetch(`/api/websites/${websiteId}`);
                if (!websiteResponse.ok)
                    throw new Error('Failed to load website');
                const websiteData = await websiteResponse.json();
                setWebsite(websiteData);
            }
            catch (err) {
                console.error('Error fetching website data:', err);
                setFetchError(err.message || 'Failed to load website');
            }
        }
        fetchWebsiteData();
    }, [websiteId]);
    // Handle notification delete
    async function handleDelete(notificationId) {
        if (!confirm('Are you sure you want to delete this notification?')) {
            return;
        }
        try {
            setDeletingIds(prev => new Set(prev).add(notificationId));
            await deleteNotification(notificationId);
            // Refresh the notifications list
            refreshNotifications();
        }
        catch (err) {
            console.error('Failed to delete notification:', err);
            alert('Failed to delete notification. Please try again.');
        }
        finally {
            setDeletingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(notificationId);
                return newSet;
            });
        }
    }
    // Show loading state
    if (isLoading) {
        return (<div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>);
    }
    // Show error state
    const error = notificationsError || fetchError || deleteError;
    if (error) {
        return (<div className="alert alert-error shadow-lg">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>{error.toString()}</span>
        </div>
      </div>);
    }
    return (<div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Notifications</h2>
          <p className="text-base-content/70">
            Manage notifications for {(website === null || website === void 0 ? void 0 : website.name) || 'this website'}
          </p>
        </div>
        <Link href={`/dashboard/websites/${websiteId}/notifications/new`} className="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/>
          </svg>
          Add Notification
        </Link>
      </div>
      
      {notifications.length === 0 ? (<div className="card bg-base-100 shadow-lg">
          <div className="card-body items-center text-center">
            <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center text-base-content/40 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </div>
            <h2 className="card-title mb-2">No notifications yet</h2>
            <p className="mb-4 text-base-content/70">Add your first notification to start showing social proof on your website</p>
            <div className="card-actions">
              <Link href={`/dashboard/websites/${websiteId}/notifications/new`} className="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/>
                </svg>
                Create Your First Notification
              </Link>
            </div>
          </div>
        </div>) : (<div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Title</th>
                <th>Message</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notification) => (<tr key={notification._id}>
                  <td className="font-medium">{notification.title}</td>
                  <td className="max-w-xs truncate">{notification.message}</td>
                  <td>{notification.impressions}</td>
                  <td>{notification.clicks}</td>
                  <td>
                    <span className={`badge ${notification.status === 'active' ? 'badge-success' : 'badge-ghost'}`}>
                      {notification.status}
                    </span>
                  </td>
                  <td>{timeAgo(new Date(notification.createdAt))}</td>
                  <td className="flex gap-2">
                    <Link href={`/dashboard/websites/${websiteId}/notifications/${notification._id}/edit`} className="btn btn-xs btn-outline">
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(notification._id)} className="btn btn-xs btn-error btn-outline" disabled={deletingIds.has(notification._id)}>
                      {deletingIds.has(notification._id) ? (<span className="loading loading-spinner loading-xs"></span>) : 'Delete'}
                    </button>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>)}
    </div>);
}
