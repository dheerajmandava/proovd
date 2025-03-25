'use client';

import { useState } from 'react';
import { UserPreferences } from './useUserData';

/**
 * Hook for updating user preferences
 * @returns Update function, loading state, and error
 */
export function useUpdateUserPreferences() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    setIsUpdating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `API error: ${response.status} - ${response.statusText}`);
        } catch (parseError) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
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

  return { updatePreferences, isUpdating, error };
} 