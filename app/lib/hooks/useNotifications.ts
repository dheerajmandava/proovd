'use client';

import { useState } from 'react';
import useSWR from 'swr';

export type Notification = {
  _id: string;
  name: string;
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
};

const fetcher = (url: string) => 
  fetch(url)
    .then(async res => {
      if (!res.ok) {
        // Try to get the detailed error message from the response
        try {
          const errorData = await res.json();
          throw new Error(errorData.error || `API error: ${res.status}`);
        } catch (parseError) {
          // If we can't parse the response, use a generic error
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
      }
      return res.json();
    });

/**
 * Hook for fetching notifications with SWR
 * @param websiteId Website ID
 * @param limit Number of notifications to fetch
 * @param initialData Optional initial data
 * @returns Notifications, loading state, error, and refresh function
 */
export function useNotifications(
  websiteId: string, 
  limit = 10, 
  initialData?: Notification[]
) {
  const { data, error, isLoading, mutate } = useSWR<{ notifications: Notification[] }>(
    websiteId ? `/api/websites/${websiteId}/notifications?limit=${limit}` : null,
    fetcher,
    {
      fallbackData: initialData ? { notifications: initialData } : undefined,
      revalidateOnFocus: true,
    }
  );

  return {
    notifications: data?.notifications || [],
    isLoading,
    error,
    refreshNotifications: mutate
  };
}

/**
 * Hook for creating a new notification
 * @returns Create function, loading state, and error
 */
export function useCreateNotification() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createNotification = async (
    websiteId: string,
    notificationData: {
      name: string;
      message: string;
      link?: string;
      image?: string;
      priority?: number;
    }
  ) => {
    setIsCreating(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/websites/${websiteId}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create notification');
      }
      
      return await response.json();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return { createNotification, isCreating, error };
}

/**
 * Hook for updating a notification
 * @returns Update function, loading state, and error
 */
export function useUpdateNotification() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateNotification = async (
    id: string, 
    updateData: Partial<Notification>
  ) => {
    setIsUpdating(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update notification');
      }
      
      return await response.json();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateNotification, isUpdating, error };
}

/**
 * Hook for deleting a notification
 * @returns Delete function, loading state, and error
 */
export function useDeleteNotification() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteNotification = async (id: string) => {
    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete notification');
      }
      
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteNotification, isDeleting, error };
} 