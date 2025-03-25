'use client';

import useSWR from 'swr';
import { UserPreferences } from './useUserData';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  
  if (!response.ok) {
    // Try to get the detailed error message from the response
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status} - ${response.statusText}`);
    } catch (parseError) {
      // If we can't parse the response, use a generic error
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
  }
  
  return response.json();
};

/**
 * Hook for fetching user preferences with SWR
 * @param initialData Optional initial data
 * @returns User preferences, loading state, error, and refresh function
 */
export function useUserPreferences(initialData?: UserPreferences) {
  const { data, error, isLoading, mutate } = useSWR<UserPreferences>(
    '/api/user/preferences',
    fetcher,
    {
      fallbackData: initialData,
      revalidateOnFocus: true,
    }
  );

  return {
    preferences: data,
    isLoading,
    error,
    refreshPreferences: mutate
  };
} 