'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShieldCheckIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { VerificationMethod, VerificationStatus } from '@/app/lib/domain-verification';
// Domain Verification Form Component
function DomainVerificationForm({ verificationData, websiteId, onVerificationComplete, onMethodChange, }) {
    const [selectedMethod, setSelectedMethod] = useState(verificationData.verification.method);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState(null);
    // Handle method change
    async function handleMethodChange(method) {
        try {
            if (method === selectedMethod)
                return;
            setIsVerifying(true);
            setError(null);
            // Convert method to lowercase string for API
            const methodValue = method.toString().toLowerCase();
            console.log(`Sending method: ${methodValue}`);
            const response = await fetch(`/api/websites/${websiteId}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ method: methodValue }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to change verification method');
            }
            const data = await response.json();
            console.log('Method change response:', data);
            setSelectedMethod(method);
            onMethodChange(method);
        }
        catch (err) {
            console.error('Error changing verification method:', err);
            setError(err.message);
        }
        finally {
            setIsVerifying(false);
        }
    }
    // Handle verify request
    async function handleVerify(e) {
        e.preventDefault();
        try {
            setIsVerifying(true);
            setError(null);
            const response = await fetch(`/api/websites/${websiteId}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Verification request failed');
            }
            onVerificationComplete(data.success, data.message);
        }
        catch (err) {
            console.error('Error verifying domain:', err);
            setError(err.message);
            onVerificationComplete(false, err.message);
        }
        finally {
            setIsVerifying(false);
        }
    }
    return (<div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h2 className="card-title">Verify Domain Ownership</h2>
        <p className="text-sm mb-4">
          Verify that you own the domain before using it with our service.
        </p>
        
        {error && (<div className="alert alert-error mb-4">
            <ExclamationCircleIcon className="h-5 w-5"/>
            <span>{error}</span>
          </div>)}
        
        <form onSubmit={handleVerify}>
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium">Verification Method</span>
            </label>
            
            {/* Only show DNS verification method for simplicity */}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => handleMethodChange(VerificationMethod.DNS)} className="btn btn-sm btn-primary" disabled={selectedMethod === VerificationMethod.DNS}>
                <GlobeAltIcon className="h-4 w-4 mr-1"/>
                DNS
              </button>
            </div>
          </div>
          
          <div className="bg-base-200 p-4 rounded-lg mb-6">
            <h3 className="font-medium mb-2">Instructions</h3>
            <pre className="whitespace-pre-wrap text-sm">{verificationData.instructions}</pre>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={isVerifying}>
              {isVerifying ? (<>
                  <LoadingSpinner size="sm"/>
                  Verifying...
                </>) : (<>
                  <ShieldCheckIcon className="h-5 w-5 mr-1"/>
                  Verify Domain
                </>)}
            </button>
          </div>
        </form>
      </div>
    </div>);
}
export default function VerifyWebsitePage() {
    const router = useRouter();
    const params = useParams();
    const websiteId = params.id;
    const [isLoading, setIsLoading] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isChangingMethod, setIsChangingMethod] = useState(false);
    const [verificationData, setVerificationData] = useState(null);
    const [error, setError] = useState(null);
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
                // Make sure the verification data is properly structured
                if (!data.verification) {
                    throw new Error('Invalid verification data returned from server');
                }
                // Set available methods if not provided by API
                if (!data.methods) {
                    data.methods = Object.values(VerificationMethod);
                }
                setVerificationData(data);
            }
            catch (err) {
                console.error('Error fetching verification data:', err);
                setError(err.message);
            }
            finally {
                setIsLoading(false);
            }
        }
        if (websiteId) {
            fetchVerificationData();
        }
    }, [websiteId]);
    // Handle verify domain request
    async function handleVerify(success, message) {
        try {
            setIsVerifying(true);
            setError(null);
            if (success) {
                // Refresh the verification data
                const updatedResponse = await fetch(`/api/websites/${websiteId}/verify`);
                const updatedData = await updatedResponse.json();
                setVerificationData(updatedData);
                // If verified successfully, show success message
                if (success) {
                    // Redirect to website dashboard after short delay
                    setTimeout(() => {
                        router.push(`/dashboard/websites/${websiteId}`);
                    }, 2000);
                }
            }
            else {
                setError(message);
            }
        }
        catch (err) {
            console.error('Error verifying domain:', err);
            setError(err.message);
        }
        finally {
            setIsVerifying(false);
        }
    }
    // Handle change verification method
    async function handleChangeMethod(method) {
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
        }
        catch (err) {
            console.error('Error changing verification method:', err);
            setError(err.message);
        }
        finally {
            setIsChangingMethod(false);
        }
    }
    return (<div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Domain Verification</h1>
        {verificationData && (<p className="text-gray-600">
            Verify ownership of <span className="font-medium">{verificationData.domain}</span>
          </p>)}
      </div>

      {isLoading ? (<div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg"/>
        </div>) : error ? (<div className="alert alert-error">
          <ExclamationCircleIcon className="h-6 w-6"/>
          <span>{error}</span>
        </div>) : verificationData ? (<>
          {verificationData.verification.status === VerificationStatus.VERIFIED ? (<div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircleIcon className="h-8 w-8 text-green-600"/>
                  </div>
                  <div>
                    <h2 className="card-title text-green-600">Domain Verified!</h2>
                    <p className="text-gray-600">
                      Your domain {verificationData.domain} has been successfully verified.
                    </p>
                  </div>
                </div>
                <div className="card-actions justify-end mt-4">
                  <button onClick={() => router.push(`/dashboard/websites/${websiteId}`)} className="btn btn-primary">
                    Go to Website Dashboard
                  </button>
                </div>
              </div>
            </div>) : (<DomainVerificationForm verificationData={verificationData} websiteId={websiteId} onVerificationComplete={handleVerify} onMethodChange={handleChangeMethod}/>)}
        </>) : (<div className="alert alert-warning">
          <span>No verification data available. Please try refreshing the page.</span>
        </div>)}
    </div>);
}
