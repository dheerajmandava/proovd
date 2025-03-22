'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error occurred:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="card w-full max-w-lg bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-12 w-12 text-error" />
            <h2 className="card-title text-error text-2xl">Error Occurred</h2>
          </div>
          
          <p className="text-base-content/80 mb-6">
            {error?.message || 'An unexpected error occurred while loading the dashboard.'}
          </p>
          
          <p className="text-sm text-base-content/70 mb-8">
            This could be due to authentication issues or server problems. Please try signing in again.
          </p>
          
          <div className="card-actions flex flex-col sm:flex-row gap-2">
            <button 
              onClick={() => reset()}
              className="btn btn-primary flex-1"
            >
              Try again
            </button>
            
            <Link href="/auth/signin" className="btn btn-outline flex-1">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 