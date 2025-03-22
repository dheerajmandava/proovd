'use client';

import React from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { auth } from '@/auth';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import { Check, Copy, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Button } from '@/app/components/ui/button';
import CodeSection from '@/app/dashboard/components/CodeSection';
import { VerificationMethod } from '@/app/lib/domain-verification';
import LoadingScreen from '@/app/components/ui/loading-screen';
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";

export default function WebsiteSetupPage() {
  const params = useParams();
  const [website, setWebsite] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState<{[key: string]: boolean}>({});
  const [verificationTab, setVerificationTab] = useState<string>(VerificationMethod.DNS);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    async function fetchWebsite() {
      try {
        const response = await fetch(`/api/websites/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Website not found');
        }
        
        const data = await response.json();
        setWebsite(data);
        
        // Set initial verification method tab based on website data
        if (data.verification?.method) {
          setVerificationTab(data.verification.method);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load website');
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) {
      fetchWebsite();
    }
  }, [params.id]);

  // Fetch verification information
  useEffect(() => {
    if (!website) return;
    
    const fetchVerificationInfo = async () => {
      try {
        const response = await fetch(`/api/websites/${params.id}/verify`);
        if (!response.ok) throw new Error('Failed to fetch verification info');
        
        const data = await response.json();
        
        // Update website with the latest verification data
        setWebsite(prev => ({
          ...prev,
          verification: data.verification,
          verificationInstructions: data.instructions
        }));
      } catch (err) {
        console.error('Error fetching verification info:', err);
      }
    };

    fetchVerificationInfo();
  }, [params.id, website?.verification?.status]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopySuccess({...copySuccess, [field]: true});
        setTimeout(() => {
          setCopySuccess({...copySuccess, [field]: false});
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  // Change verification method
  const changeVerificationMethod = async (method: string) => {
    try {
      setVerificationTab(method);
      
      const response = await fetch(`/api/websites/${params.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method })
      });
      
      if (!response.ok) throw new Error('Failed to update verification method');
      
      const data = await response.json();
      
      // Update website with the new verification method
      setWebsite(prev => ({
        ...prev,
        verification: {
          ...prev.verification,
          method: data.method,
          status: 'pending'
        }
      }));
      
      // Reset verification result
      setVerificationResult(null);
    } catch (err) {
      console.error('Error changing verification method:', err);
      setError('Failed to update verification method. Please try again.');
    }
  };

  // Verify domain
  const verifyDomain = async () => {
    try {
      setVerifying(true);
      setVerificationResult(null);
      
      const response = await fetch(`/api/websites/${params.id}/verify`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      // Set verification result
      setVerificationResult({
        success: data.success,
        message: data.message
      });
      
      // Update website verification status
      if (data.success) {
        setWebsite(prev => ({
          ...prev,
          verification: {
            ...prev.verification,
            status: 'verified'
          },
          status: 'verified'
        }));
      }
    } catch (err) {
      console.error('Error verifying domain:', err);
      setVerificationResult({
        success: false,
        message: 'An error occurred during verification. Please try again.'
      });
    } finally {
      setVerifying(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !website) {
    return (
      <div className="p-4">
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error || 'Failed to load website'}</span>
        </div>
        <div className="mt-4">
          <Link href="/dashboard/websites" className="btn btn-primary">
            Back to Websites
          </Link>
        </div>
      </div>
    );
  }

  const isVerified = website.verification?.status === 'verified';
  const apiKey = website.apiKey;
  const domain = website.domain;

  // Widget installation code snippets
  const scriptTag = `<script src="${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/api/websites/${params.id}/widget.js?key=${apiKey}"></script>`;
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Setup {website.name}</h1>
        <p className="text-muted-foreground">Complete these steps to start showing notifications on your website</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Domain Verification Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isVerified ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-xs">1</span>
              )}
              Verify Domain Ownership
            </CardTitle>
            <CardDescription>
              Verify that you own the domain <span className="font-semibold">{domain}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isVerified ? (
              <Alert className="bg-green-50 border-green-500">
                <Check className="h-4 w-4 text-green-500" />
                <AlertTitle>Domain Verified</AlertTitle>
                <AlertDescription>
                  Your domain has been successfully verified. You can now proceed to installing the widget.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Tabs value={verificationTab} onValueChange={changeVerificationMethod}>
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value={VerificationMethod.DNS}>DNS</TabsTrigger>
                    <TabsTrigger value={VerificationMethod.FILE}>File</TabsTrigger>
                    <TabsTrigger value={VerificationMethod.META}>Meta Tag</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value={VerificationMethod.DNS}>
                    <div className="space-y-4">
                      <Alert className="bg-blue-50 border-blue-300">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertTitle>DNS Verification</AlertTitle>
                        <AlertDescription>
                          Add a TXT record to your domain's DNS settings. This may take up to 24 hours to propagate.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="rounded-md bg-muted p-4 space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="font-medium">Host/Name:</div>
                          <div className="col-span-2 font-mono bg-background p-1 rounded">
                            @ <span className="text-muted-foreground text-sm">or</span> {domain}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="font-medium">Value/Content:</div>
                          <div className="col-span-2 font-mono bg-background p-1 rounded overflow-x-auto">
                            {website.verification?.token}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value={VerificationMethod.FILE}>
                    <div className="space-y-4">
                      <Alert className="bg-blue-50 border-blue-300">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertTitle>File Verification</AlertTitle>
                        <AlertDescription>
                          Create a file at the specified path with the provided content.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="rounded-md bg-muted p-4 space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="font-medium">File Path:</div>
                          <div className="col-span-2 font-mono bg-background p-1 rounded">
                            /.well-known/socialproofify-verification.txt
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="font-medium">Content:</div>
                          <div className="col-span-2 font-mono bg-background p-1 rounded">
                            {website.verification?.token}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="font-medium">URL:</div>
                          <div className="col-span-2 font-mono bg-background p-1 rounded overflow-x-auto">
                            https://{domain}/.well-known/socialproofify-verification.txt
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value={VerificationMethod.META}>
                    <div className="space-y-4">
                      <Alert className="bg-blue-50 border-blue-300">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertTitle>Meta Tag Verification</AlertTitle>
                        <AlertDescription>
                          Add the following meta tag to the <code>&lt;head&gt;</code> section of your website's homepage.
                        </AlertDescription>
                      </Alert>
                      
                      <CodeSection 
                        code={`<meta name="socialproofify-verification" content="${website.verification?.token}" />`}
                        language="html"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
                
                {verificationResult && (
                  <Alert className={`mt-4 ${verificationResult.success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                    {verificationResult.success ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <AlertTitle>{verificationResult.success ? 'Success' : 'Verification Failed'}</AlertTitle>
                    <AlertDescription>{verificationResult.message}</AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
          <CardFooter>
            {!isVerified && (
              <Button 
                onClick={verifyDomain} 
                disabled={verifying}
                className="w-full"
              >
                {verifying ? 'Verifying...' : 'Verify Now'}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Widget Installation Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full ${isVerified ? 'bg-primary' : 'bg-muted'} text-white text-xs`}>2</span>
              Install the Widget
            </CardTitle>
            <CardDescription>
              Add the widget to your website by including this script
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-300">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle>Installation Instructions</AlertTitle>
                <AlertDescription>
                  Add this script tag just before the closing <code>&lt;/body&gt;</code> tag on all pages where you want to show notifications.
                </AlertDescription>
              </Alert>
              
              <CodeSection 
                code={scriptTag}
                language="html"
              />
              
              {!isVerified && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Domain Not Verified</AlertTitle>
                  <AlertDescription>
                    You must verify your domain before the widget will work. Complete step 1 first.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                navigator.clipboard.writeText(scriptTag);
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy Script
            </Button>
            
            <Button 
              disabled={!isVerified}
              onClick={() => window.location.href = `/dashboard/websites/${params.id}/notifications`}
            >
              Manage Notifications <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 