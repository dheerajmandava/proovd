'use client';
import { SessionProvider } from 'next-auth/react';
export default function AuthSessionProvider({ children }) {
    return (<SessionProvider 
    // Refetch session every 5 minutes
    refetchInterval={5 * 60} 
    // Refetch on window focus
    refetchOnWindowFocus={true} 
    // Refetch when gaining connection
    refetchWhenOffline={false}>
      {children}
    </SessionProvider>);
}
