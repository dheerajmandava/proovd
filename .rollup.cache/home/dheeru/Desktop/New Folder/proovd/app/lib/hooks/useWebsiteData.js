'use client';
import { __rest } from "tslib";
import { useState } from 'react';
import useSWR from 'swr';
const fetcher = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
        // Try to get the detailed error message from the response
        try {
            const errorData = await response.json();
            throw new Error(errorData.error || `API error: ${response.status} - ${response.statusText}`);
        }
        catch (parseError) {
            // If we can't parse the response, use a generic error
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
    }
    return response.json();
};
/**
 * Hook for fetching website data with SWR
 * @param websiteId Website ID
 * @param initialData Optional initial data
 * @returns Website data, loading state, error, and refresh function
 */
export function useWebsiteData(websiteId, initialData) {
    const { data, error, isLoading, mutate } = useSWR(websiteId ? `/api/websites/${websiteId}` : null, fetcher, {
        fallbackData: initialData,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 10000, // 10 seconds
    });
    return {
        website: data,
        isLoading,
        error,
        refreshWebsite: mutate
    };
}
/**
 * Hook for updating website settings
 * @returns Update function and loading state
 */
export function useWebsiteSettings() {
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState(null);
    const updateSettings = async (websiteId, settings) => {
        setIsUpdating(true);
        setError(null);
        try {
            // Check if allowedDomains is present in the settings
            const { allowedDomains } = settings, settingsData = __rest(settings, ["allowedDomains"]);
            // Create appropriate payload depending on what's being updated
            const payload = allowedDomains !== undefined
                ? { settings: settingsData, allowedDomains }
                : { settings: settingsData };
            const response = await fetch(`/api/websites/${websiteId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
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
    return { updateSettings, isUpdating, error };
}
/**
 * Hook for fetching website stats with real-time updates
 * @param websiteId Website ID
 * @returns Stats data, loading state, error, and refresh function
 */
export function useWebsiteStats(websiteId) {
    const { data, error, isLoading, mutate } = useSWR(websiteId ? `/api/websites/${websiteId}/stats` : null, fetcher, {
        refreshInterval: 60000, // Refresh every minute
        revalidateOnFocus: true,
    });
    return {
        stats: data,
        isLoading,
        error,
        refreshStats: mutate
    };
}
