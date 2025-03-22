'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  
  // Log errors in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth error:', error);
    }
  }, [error]);
  
  // Get user-friendly error message
  const getErrorMessage = (errorCode: string | null) => {
    switch(errorCode) {
      case 'CredentialsSignin':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'OAuthAccountNotLinked':
        return 'There was an error with your social sign-in. Please try again or use a different sign-in method.';
      case 'EmailCreateAccount':
      case 'EmailSignin':
        return 'There was an error sending the email. Please try again.';
      case 'SessionRequired':
        return 'You need to be signed in to access this page.';
      case 'Default':
      case 'Configuration':
        return 'There is a problem with the server configuration. Please contact support.';
      case 'AccessDenied':
        return 'You do not have permission to access this resource.';
      case 'Verification':
        return 'The verification link has expired or has already been used.';
      default:
        return 'An unexpected authentication error occurred. Please try again.';
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-5">
            <AlertCircle className="h-8 w-8 text-error" />
            <h1 className="text-2xl font-bold">Authentication Error</h1>
          </div>

          <p className="text-base-content mb-4">
            {getErrorMessage(error)}
          </p>
          
          <div className="my-2 border-t border-base-300"></div>
          
          <div className="card-actions flex-col">
            <Link 
              href="/auth/signin" 
              className="btn btn-primary w-full"
            >
              Try signing in again
            </Link>
            
            <Link 
              href="/" 
              className="btn btn-outline btn-sm gap-2 mt-4 mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-sm text-base-content/60">
        <p>Need help? <Link href="/help" className="link link-primary">Contact support</Link></p>
      </div>
    </div>
  );
} 