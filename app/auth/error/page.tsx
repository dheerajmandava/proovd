import { Suspense } from 'react';
import AuthErrorClient from './client';

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="text-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-4 text-base-content/70">Loading error information...</p>
      </div>
    </div>}>
      <AuthErrorClient />
    </Suspense>
  );
} 