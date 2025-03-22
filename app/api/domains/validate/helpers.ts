import dns from 'dns/promises';
import { extractDomain } from '@/app/lib/server-utils';

/**
 * Comprehensive domain validation
 */
export async function validateDomain(domain: string): Promise<{
  valid: boolean;
  domain: string;
  dnsRecords?: boolean;
  httpAccess?: boolean;
  exists?: boolean;
  error?: string;
  details?: string;
}> {
  console.log('Running validateDomain function for:', domain);
  
  // Result object
  const result = {
    valid: false,
    domain,
    exists: false,
    dnsRecords: false,
    httpAccess: false
  };

  // Basic domain format validation
  const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;
  if (!domainRegex.test(domain)) {
    console.log('Domain failed regex validation:', domain);
    return {
      ...result,
      error: 'Invalid domain format',
      details: 'The domain format is not valid. Please enter a correctly formatted domain (e.g., example.com).'
    };
  }

  try {
    // Check if domain has DNS records (A, AAAA, or CNAME)
    try {
      console.log('Attempting DNS resolution for:', domain);
      // Try to resolve IP addresses
      const addresses = await dns.resolve(domain);
      console.log('DNS resolution successful:', addresses);
      if (addresses && addresses.length > 0) {
        result.dnsRecords = true;
        result.exists = true;
      }
    } catch (dnsError) {
      console.log('Initial DNS resolution failed, trying TXT records');
      try {
        // If that fails, try to see if there are TXT records
        const txtRecords = await dns.resolveTxt(domain);
        console.log('TXT records found:', txtRecords);
        if (txtRecords && txtRecords.length > 0) {
          result.dnsRecords = true;
          result.exists = true;
        }
      } catch (txtError) {
        // No DNS records found
        console.log('No DNS records found for domain:', domain);
        return {
          ...result,
          error: 'Domain not found',
          details: 'The domain does not have valid DNS records. Please ensure the domain exists and is properly configured.'
        };
      }
    }

    // Try to access the website
    try {
      console.log('Attempting HTTP access to:', domain);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('HTTP access successful, status:', response.status);
      
      if (response.ok || response.status === 403) { // 403 means the site exists but access is forbidden
        result.httpAccess = true;
      }
    } catch (httpError) {
      console.log('HTTP access failed:', httpError);
      // HTTP access failed, but domain might still be valid
      // Some domains might not have a website or might block HEAD requests
      // We'll still consider the domain valid if DNS records exist
    }

    // Final validation result
    result.valid = result.dnsRecords; // Domain is valid if it has DNS records
    console.log('Final validation result:', result);
    
    return result;
    
  } catch (error) {
    console.error('Validation error:', error);
    return {
      ...result,
      error: 'Validation failed',
      details: (error as Error).message
    };
  }
} 