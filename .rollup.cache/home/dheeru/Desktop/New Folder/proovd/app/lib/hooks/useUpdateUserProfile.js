'use client';
import { useState } from 'react';
/**
 * Hook for updating user profile
 * @returns Update function, loading state, and error
 */
export function useUpdateUserProfile() {
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState(null);
    const updateProfile = async (profileData) => {
        setIsUpdating(true);
        setError(null);
        try {
            const response = await fetch('/api/user', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData),
            });
            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `API error: ${response.status} - ${response.statusText}`);
                }
                catch (parseError) {
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }
            }
            return await response.json();
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            setError(error);
            throw error;
        }
        finally {
            setIsUpdating(false);
        }
    };
    return { updateProfile, isUpdating, error };
}
