'use client';
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
 * Hook for fetching user data with SWR
 * @param initialData Optional initial data
 * @returns User data, loading state, error, and refresh function
 */
export function useUserData(initialData) {
    const { data, error, isLoading, mutate } = useSWR('/api/user', fetcher, {
        fallbackData: initialData,
        revalidateOnFocus: false,
    });
    return {
        user: data,
        isLoading,
        error,
        refreshUser: mutate
    };
}
