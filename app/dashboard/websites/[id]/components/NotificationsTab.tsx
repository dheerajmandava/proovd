'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { timeAgo } from '@/app/lib/utils';
import { useNotifications, useDeleteNotification } from '@/app/lib/hooks';
import type { Notification as NotificationType } from '@/app/lib/hooks';
import { revalidatePath } from 'next/cache';
import { toast } from 'react-hot-toast';

// Define notification type interface
interface Notification {
  _id: string;
  name: string;
  type: string;
  message: string;
  link?: string;
  image?: string;
  status: string;
  siteId: string;
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
  priority?: number;
  fakeTimestamp?: string;
  timeAgo?: string;
}

// Define website interface
interface Website {
  _id: string;
  name: string;
  domain: string;
}

interface NotificationsTabProps {
  websiteId: string;
  website: Website;
  initialNotifications: Notification[];
}

export default function NotificationsTab({ websiteId, website, initialNotifications }: NotificationsTabProps) {
  const router = useRouter();
  const [currentNotifications, setCurrentNotifications] = useState(initialNotifications);

  // Use custom hook for deletion
  const {
    deleteNotification,
    isDeleting,
    error: deleteError
  } = useDeleteNotification();

  // Track which notifications are being deleted
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Handle notification delete
  async function handleDelete(notificationId: string) {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      setDeletingIds(prev => new Set(prev).add(notificationId));

      await deleteNotification(notificationId);
      toast.success('Notification deleted successfully');

      // Remove notification from local state immediately for better UX
      setCurrentNotifications(prev => prev.filter(n => n._id !== notificationId));

      // Optionally re-fetch or revalidate if not using optimistic updates
      // Consider revalidating the path if using RSC/Server Actions for data fetching
      // router.refresh(); // This re-fetches data for the current route

    } catch (err: any) {
      console.error('Failed to delete notification:', err);
      const errorMessage = deleteError?.message || 'Failed to delete notification. Please try again.';
      toast.error(errorMessage);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Campaigns</h2>
          <p className="text-base-content/70">
            Manage campaigns for {website?.name || 'this website'}
          </p>
        </div>
        <Link href={`/dashboard/websites/${websiteId}/notifications/new`} className="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Create Campaign
        </Link>
      </div>

      {initialNotifications.length === 0 ? (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body items-center text-center">
            <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center text-base-content/40 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 className="card-title mb-2">No campaigns yet</h2>
            <p className="mb-4 text-base-content/70">Create your first campaign to start engaging visitors on your website</p>
            <div className="card-actions">
              <Link href={`/dashboard/websites/${websiteId}/notifications/new`} className="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Create Your First Campaign
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentNotifications.map((notification) => (
                <tr key={notification._id}>
                  <td className="font-medium">{notification.name}</td>
                  <td>
                    <span className="badge badge-outline">
                      {notification.type || 'custom'}
                    </span>
                  </td>
                  <td>{notification.impressions}</td>
                  <td>{notification.clicks}</td>
                  <td>
                    <span className={`badge ${notification.status === 'active' ? 'badge-success' : 'badge-ghost'}`}>
                      {notification.status}
                    </span>
                  </td>
                  <td>{timeAgo(new Date(notification.createdAt))}</td>
                  <td className="flex gap-2">
                    <Link
                      href={`/dashboard/websites/${websiteId}/notifications/${notification._id}/edit`}
                      className="btn btn-xs btn-outline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(notification._id)}
                      className="btn btn-xs btn-error btn-outline"
                      disabled={deletingIds.has(notification._id)}
                    >
                      {deletingIds.has(notification._id) ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}