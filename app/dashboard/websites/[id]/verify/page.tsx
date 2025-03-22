'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ShieldCheckIcon, 
  ShieldExclamationIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentCheckIcon,
  GlobeAltIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon 
} from '@heroicons/react/24/solid';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { VerificationMethod } from '@/app/lib/domain-verification';

// Interface for verification data structure
interface VerificationData {
  domain: string;
  verification: {
    status: 'pending' | 'verified' | 'failed';
    method: VerificationMethod;
    token: string;
    attempts: number;
    verifiedAt?: string;
  };
  methods: string[];
  instructions: string;
}

export default function VerifyWebsitePage() {
  const router = useRouter();
  const params = useParams();
  const websiteId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isChangingMethod, setIsChangingMethod] = useState(false);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch verification data
  useEffect(() => {
    async function fetchVerificationData() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/websites/${websiteId}/verify`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch verification data');
        }
        
        const data = await response.json();
        setVerificationData(data);
      } catch (err) {
        console.error('Error fetching verification data:', err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (websiteId) {
      fetchVerificationData();
    }
  }, [websiteId]);

  // Handle verify domain request
  async function handleVerify() {
    try {
      setIsVerifying(true);
      setError(null);
      
      const response = await fetch(`/api/websites/${websiteId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Verification request failed');
      }
      
      // Refresh the verification data
      const updatedResponse = await fetch(`/api/websites/${websiteId}/verify`);
      const updatedData = await updatedResponse.json();
      setVerificationData(updatedData);
      
      // If verified successfully, show success message
      if (data.verified) {
        // Redirect to website dashboard after short delay
        setTimeout(() => {
          router.push(`/dashboard/websites/${websiteId}`);
        }, 2000);
      }
    } catch (err) {
      console.error('Error verifying domain:', err);
      setError((err as Error).message);
    } finally {
      setIsVerifying(false);
    }
  }

  // Handle change verification method
  async function handleChangeMethod(method: VerificationMethod) {
    try {
      setIsChangingMethod(true);
      setError(null);
      
      const response = await fetch(`/api/websites/${websiteId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change verification method');
      }
      
      // Refresh the verification data
      const updatedResponse = await fetch(`/api/websites/${websiteId}/verify`);
      const updatedData = await updatedResponse.json();
      setVerificationData(updatedData);
    } catch (err) {
      console.error('Error changing verification method:', err);
      setError((err as Error).message);
    } finally {
      setIsChangingMethod(false);
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading verification details...</p>
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-3xl mx-auto mt-8">
        <div className="flex items-center">
          <ExclamationCircleIcon className="h-8 w-8 text-red-500 mr-4" />
          <div>
            <h2 className="text-lg font-medium text-red-800">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // If no verification data
  if (!verificationData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-3xl mx-auto mt-8">
        <div className="flex items-center">
          <ExclamationCircleIcon className="h-8 w-8 text-yellow-500 mr-4" />
          <div>
            <h2 className="text-lg font-medium text-yellow-800">No Data Available</h2>
            <p className="text-yellow-700">No verification data could be found for this website.</p>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => router.push('/dashboard/websites')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Websites
          </button>
        </div>
      </div>
    );
  }

  // Helper to render status badge
  const renderStatusBadge = () => {
    const { verification } = verificationData;
    
    switch (verification.status) {
      case 'verified':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-4 w-4 mr-1" /> Verified
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <ExclamationCircleIcon className="h-4 w-4 mr-1" /> Failed
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-4 w-4 mr-1" /> Pending
          </span>
        );
    }
  };

  // Helper to render method icon
  const renderMethodIcon = (method: VerificationMethod) => {
    switch (method) {
      case VerificationMethod.DNS:
        return <GlobeAltIcon className="h-5 w-5" />;
      case VerificationMethod.FILE:
        return <DocumentCheckIcon className="h-5 w-5" />;
      case VerificationMethod.META:
        return <CodeBracketIcon className="h-5 w-5" />;
      default:
        return <GlobeAltIcon className="h-5 w-5" />;
    }
  };

  // Helper to render method name
  const getMethodName = (method: string): string => {
    switch (method) {
      case VerificationMethod.DNS:
        return 'DNS Verification';
      case VerificationMethod.FILE:
        return 'File Verification';
      case VerificationMethod.META:
        return 'Meta Tag Verification';
      default:
        return method;
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Website</h1>
        <p className="text-gray-600">
          Complete the verification process to prove ownership of {verificationData.domain}
        </p>
      </div>
      
      {/* Domain Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Domain</h2>
            <div className="text-sm font-medium text-gray-500">
              {verificationData.domain}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Status</h2>
            <div>
              {renderStatusBadge()}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Method</h2>
            <div className="inline-flex items-center text-sm font-medium text-gray-500">
              {renderMethodIcon(verificationData.verification.method)}
              <span className="ml-1">
                {getMethodName(verificationData.verification.method)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Verification Status */}
      <div className="mb-8">
        {verificationData.verification.status === 'verified' ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start">
              <ShieldCheckIcon className="h-10 w-10 text-green-500 mr-4" />
              <div>
                <h2 className="text-lg font-medium text-green-800">Website Verified</h2>
                <p className="text-green-700 mt-1">
                  Your website has been successfully verified. You can now use all the features of Proovd.
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => router.push(`/dashboard/websites/${websiteId}`)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Verification Instructions
              </h2>
              
              {/* Method Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Method
                </label>
                <div className="flex flex-wrap gap-2">
                  {verificationData.methods.map((method) => (
                    <button
                      key={method}
                      onClick={() => handleChangeMethod(method as VerificationMethod)}
                      disabled={isChangingMethod || method === verificationData.verification.method}
                      className={`
                        inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md 
                        ${method === verificationData.verification.method
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {renderMethodIcon(method as VerificationMethod)}
                      <span className="ml-1.5">
                        {getMethodName(method)}
                      </span>
                    </button>
                  ))}
                </div>
                {isChangingMethod && (
                  <div className="mt-2 text-sm text-gray-500 flex items-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Updating verification method...</span>
                  </div>
                )}
              </div>
              
              {/* Instructions */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Follow these instructions:
                </h3>
                <div className="bg-gray-50 rounded-md p-4 mb-6">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {verificationData.instructions}
                  </pre>
                </div>
                
                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-4">
                    After completing the steps above, click the button below to verify your domain.
                    {verificationData.verification.attempts > 0 && (
                      <span className="block mt-1">
                        Previous attempts: {verificationData.verification.attempts}
                      </span>
                    )}
                  </p>
                  <button
                    onClick={handleVerify}
                    disabled={isVerifying}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifying ? (
                      <>
                        <LoadingSpinner size="sm" className="text-white" />
                        <span className="ml-2">Verifying...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheckIcon className="h-5 w-5 mr-2" />
                        Verify Domain
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 