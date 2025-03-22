'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isValidDomain } from '@/app/lib/utils';
import { 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Loader2,
  Globe,
  FileText,
  Code
} from 'lucide-react';

// Steps in the domain validation and website creation process
type ValidationStep = 
  | 'input'
  | 'validating'
  | 'validation_failed'
  | 'validation_success'
  | 'verification_prep'
  | 'verifying'
  | 'verification_failed'
  | 'creating';

// Step constants
const STEPS = {
  INPUT: 'input' as ValidationStep,
  VALIDATING: 'validating' as ValidationStep,
  VALIDATION_FAILED: 'validation_failed' as ValidationStep,
  VALIDATION_SUCCESS: 'validation_success' as ValidationStep,
  VERIFICATION_PREP: 'verification_prep' as ValidationStep,
  VERIFYING: 'verifying' as ValidationStep,
  VERIFICATION_FAILED: 'verification_failed' as ValidationStep,
  CREATING: 'creating' as ValidationStep,
};

// Verification methods - only DNS is supported now
type VerificationMethod = 'DNS';

// Component for adding a new website
export default function NewWebsitePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(STEPS.INPUT);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    verificationMethod: 'DNS' as VerificationMethod
  });
  const [validationResult, setValidationResult] = useState<any>(null);
  const [verificationDetails, setVerificationDetails] = useState<any>(null);
  const [error, setError] = useState('');

  // Handle input changes
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset validation when domain changes
    if (name === 'domain' && currentStep !== STEPS.INPUT) {
      setCurrentStep(STEPS.INPUT);
      setValidationResult(null);
    }
  }

  // Validate the domain
  async function validateDomain() {
    setError('');
    setCurrentStep(STEPS.VALIDATING);

    try {
      // Don't proceed without a domain
      if (!formData.domain.trim()) {
        setError('Domain is required');
        setCurrentStep(STEPS.VALIDATION_FAILED);
        return;
      }

      // Make the validation request
      const response = await fetch('/api/domains/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: formData.domain })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to validate domain');
      }

      const result = await response.json();
      if (!result.valid) {
        throw new Error(result.error || 'Domain is not valid');
      }

      // Store the validation result
      setValidationResult(result);
      
      // Initialize verification after successful validation
      await initializeVerification(result.domain);
      
      // Show verification instructions immediately instead of preparation step
      setCurrentStep(STEPS.VERIFICATION_FAILED);
    } catch (err: any) {
      console.error('Domain validation error:', err);
      setError(err.message || 'An error occurred during domain validation');
      setCurrentStep(STEPS.VALIDATION_FAILED);
    }
  }

  // Initialize domain verification (new step)
  async function initializeVerification(domain: string) {
    try {
      setError('');
      
      // Get verification details based on method
      const response = await fetch('/api/websites/init-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          method: formData.verificationMethod
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize verification');
      }

      const verificationData = await response.json();
      setVerificationDetails(verificationData);
      return true;
    } catch (err: any) {
      console.error('Verification initialization error:', err);
      setError(err.message || 'An error occurred while preparing verification');
      setCurrentStep(STEPS.VALIDATION_FAILED);
      return false;
    }
  }

  // Create the website after verification
  async function createWebsite() {
    if ((currentStep !== STEPS.VALIDATION_SUCCESS && 
         currentStep !== STEPS.VERIFICATION_PREP && 
         currentStep !== STEPS.VERIFICATION_FAILED) || !verificationDetails) {
      return;
    }

    // When trying again after failure or from prep step, switch to verifying
    setCurrentStep(STEPS.VERIFYING);
    setError('');

    try {
      // Basic validation
      if (!formData.name.trim()) {
        setError('Website name is required');
        setCurrentStep(STEPS.VERIFICATION_FAILED);
        return;
      }

      // Create the website (will verify domain first on server)
      const response = await fetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          domain: validationResult?.domain || formData.domain,
          verificationMethod: formData.verificationMethod,
          verificationToken: verificationDetails.token // Send the existing token to use it
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // If verification failed but we got verification details
        if (response.status === 400 && data.verification) {
          setVerificationDetails({
            ...data.verification,
            instructions: data.details || 'Please verify your domain ownership using the provided token.',
            token: verificationDetails.token // Keep the existing token, don't use a new one
          });
          setError(data.error || 'Domain verification failed. Please check your DNS settings and try again.');
          setCurrentStep(STEPS.VERIFICATION_FAILED);
          return;
        }
        
        throw new Error(data.error || data.details || 'Failed to create website');
      }

      // Redirect to the new website dashboard
      router.push(`/dashboard/websites/${data.id}`);
    } catch (err: any) {
      console.error('Website creation error:', err);
      const errorMessage = err.message || 'An error occurred during website creation';
      setError(errorMessage);
      setCurrentStep(STEPS.VERIFICATION_FAILED);
    }
  }

  // Render the verification instructions for DNS
  function renderVerificationInstructions() {
    if (!verificationDetails) return null;
    
    const { token, status } = verificationDetails;
    const domain = formData.domain;
    
    return (
      <div className="mt-6 border rounded-lg p-6 bg-base-200">
        <h3 className="text-lg font-semibold mb-2">DNS Verification</h3>
        <p className="mb-4">To verify ownership of your domain, add this TXT record to your DNS settings:</p>
        
        <div className="overflow-x-auto">
          <table className="table w-full border-collapse">
            <thead>
              <tr>
                <th className="border px-4 py-2 bg-base-300">Record Type</th>
                <th className="border px-4 py-2 bg-base-300">Host/Name</th>
                <th className="border px-4 py-2 bg-base-300">Value/Content</th>
                <th className="border px-4 py-2 bg-base-300">TTL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-2">TXT</td>
                <td className="border px-4 py-2 font-mono">_proovd.{domain.replace(/^https?:\/\//, '').replace(/^www\./, '')}</td>
                <td className="border px-4 py-2 font-mono">{token}</td>
                <td className="border px-4 py-2">3600 (or default)</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-sm opacity-80">
          <p>DNS changes can take 5-30 minutes to propagate, but may take up to 24 hours in some cases.</p>
          <p className="mt-2">After adding the TXT record, click the "Verify Domain" button below.</p>
          
          <div className="mt-4 border-t pt-4">
            <h4 className="font-semibold mb-2">Need help?</h4>
            <p>Most domain registrars have guides on adding TXT records:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><a href="https://www.godaddy.com/help/add-a-txt-record-19232" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GoDaddy</a></li>
              <li><a href="https://www.namecheap.com/support/knowledgebase/article.aspx/317/2237/how-do-i-add-txtspfdkimdmarc-records-for-my-domain/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Namecheap</a></li>
              <li><a href="https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Cloudflare</a></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
  
  function renderVerificationPrep() {
    // No verification method selection UI, as we only support DNS now
    return (
      <div className="mt-4">
        <h3 className="font-semibold mb-4">Domain Verification Required</h3>
        <p className="mb-4">
          Before we create your website, you need to verify that you own the domain <span className="font-semibold">{formData.domain}</span>.
        </p>
        
        <div className="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
          <Globe className="text-primary h-5 w-5" />
          <span>DNS verification will be used to confirm your ownership</span>
        </div>
        
        <div className="mt-6">
          <button
            className="btn btn-primary w-full"
            onClick={() => initializeVerification(formData.domain)}
          >
            Continue to Verification
          </button>
        </div>
      </div>
    );
  }
  
  // No method change function since we only support DNS
  
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (currentStep === STEPS.INPUT || currentStep === STEPS.VALIDATION_FAILED) {
      validateDomain();
    } else if (currentStep === STEPS.VALIDATION_SUCCESS || 
              currentStep === STEPS.VERIFICATION_FAILED || 
              currentStep === STEPS.VERIFICATION_PREP) {
      createWebsite();
    }
  }

  // Update button text based on the current step
  function getButtonText() {
    if (currentStep === STEPS.INPUT || currentStep === STEPS.VALIDATION_FAILED) {
      return 'Validate Domain';
    } else if (currentStep === STEPS.VALIDATING) {
      return 'Validating...';
    } else if (currentStep === STEPS.VALIDATION_SUCCESS) {
      return 'Create Website';
    } else if (currentStep === STEPS.VERIFICATION_PREP) {
      return 'Verify Domain';
    } else if (currentStep === STEPS.VERIFYING) {
      return 'Verifying...';
    } else if (currentStep === STEPS.VERIFICATION_FAILED) {
      return 'Try Again';  
    } else if (currentStep === STEPS.CREATING) {
      return 'Creating...';
    }
    return 'Next';
  }

  // Update step indicators
  function getStepClassName(step: number): string {
    if (step === 1) {
      return 'step step-primary';
    } else if (step === 2) {
      return `step ${currentStep === STEPS.VERIFICATION_PREP || 
                    currentStep === STEPS.VERIFICATION_FAILED ||
                    currentStep === STEPS.VERIFYING ? 'step-primary' : ''}`;
    }
    return 'step';
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">Add a New Website</h1>
      
      {/* Information card about domain validation */}
      <div className="alert bg-base-200 mb-6">
        <div>
          <h3 className="font-bold">Domain Validation Required</h3>
          <div className="text-sm mt-2">
            <p className="mb-2">Domain validation is required to verify that you own the website before you can use Proovd with it.</p>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-3">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <span>Verify domain ownership with a DNS TXT record</span>
              </div>
            </div>
            <p className="mt-2">After validation, you'll need to add a DNS TXT record to prove ownership.</p>
          </div>
        </div>
      </div>
      
      <div className="bg-base-100 shadow-lg rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Steps indicator */}
            <div className="mb-6">
              <ul className="steps steps-horizontal w-full">
                <li className={getStepClassName(1)}>Enter Domain</li>
                <li className={getStepClassName(2)}>Verify Ownership</li>
                <li className={`step ${currentStep === STEPS.CREATING ? 'step-primary' : ''}`}>Create Website</li>
              </ul>
            </div>
            
            {/* Website name input */}
            <div className="form-control">
              <label className="label" htmlFor="name">
                <span className="label-text">Website Name</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="My Website"
                className="input input-bordered w-full"
                disabled={currentStep === STEPS.VALIDATING || currentStep === STEPS.CREATING}
              />
              <label className="label">
                <span className="label-text-alt">A friendly name to identify this website</span>
              </label>
            </div>
            
            {/* Domain input */}
            <div className="form-control">
              <label className="label" htmlFor="domain">
                <span className="label-text">Website Domain</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="domain"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  placeholder="example.com"
                  className="input input-bordered w-full"
                  disabled={currentStep === STEPS.VALIDATING || currentStep === STEPS.CREATING}
                />
                {validationResult?.valid && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-success flex items-center">
                    <CheckCircle className="h-5 w-5" />
                    <span className="ml-1 text-sm">Valid</span>
                  </div>
                )}
              </div>
              <label className="label">
                <span className="label-text-alt">Enter the domain of your website</span>
              </label>
            </div>
            
            {/* Verification method selection - hidden since we only use DNS */}
            <div className="form-control hidden">
              <label className="label" htmlFor="verificationMethod">
                <span className="label-text">Verification Method</span>
              </label>
              <select
                id="verificationMethod"
                name="verificationMethod"
                value={formData.verificationMethod}
                onChange={handleChange}
                className="select select-bordered w-full"
                disabled={true}
              >
                <option value="DNS">DNS Record (Recommended)</option>
              </select>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="alert alert-error">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}
            
            {/* Verification instructions - show immediately after validation */}
            {(currentStep === STEPS.VERIFICATION_FAILED || currentStep === STEPS.VERIFICATION_PREP) && 
              verificationDetails && renderVerificationInstructions()}
            
            {/* Form submission button */}
            <div className="pt-4 space-y-4">
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={currentStep === STEPS.VALIDATING || currentStep === STEPS.VERIFYING || currentStep === STEPS.CREATING}
              >
                {(currentStep === STEPS.VALIDATING || currentStep === STEPS.VERIFYING || currentStep === STEPS.CREATING) && (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                )}
                {getButtonText()}
              </button>
              
              <Link href="/dashboard/websites" className="btn btn-outline w-full">
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 