'use client';

import crypto from 'crypto';

/**
 * Verification methods available to users
 */
export enum VerificationMethod {
  DNS = 'dns',
  FILE = 'file',
  META = 'meta'
}

/**
 * Verification status values
 */
export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed'
}

/**
 * Verification data interface
 */
export interface VerificationDetails {
  status: 'pending' | 'verified' | 'failed';
  method: VerificationMethod;
  token: string;
  attempts: number;
  verifiedAt?: string;
}

/**
 * Generate a verification token (client-safe version)
 */
export function generateVerificationToken(domain: string): string {
  const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
  // Use Math.random in client-side code
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `spfy-${normalizedDomain.replace(/\./g, '-')}-${randomPart}`;
}

/**
 * Extract domain from URL or domain string - safe for client use
 */
export function extractDomain(urlOrDomain: string): string {
  // If it's already a bare domain without protocol
  if (!urlOrDomain.includes('://') && !urlOrDomain.startsWith('//')) {
    return urlOrDomain.trim().toLowerCase();
  }

  // Add protocol if missing but has //
  if (urlOrDomain.startsWith('//')) {
    urlOrDomain = `http:${urlOrDomain}`;
  }

  try {
    // Parse the URL in a client-safe way
    const url = new URL(urlOrDomain);
    let domain = url.hostname || '';

    // Remove 'www.' prefix if present
    domain = domain.replace(/^www\./, '');

    return domain.trim().toLowerCase();
  } catch (error) {
    console.error('Error extracting domain:', error);
    // If parsing fails, clean the string as best we can
    return urlOrDomain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .trim()
      .toLowerCase();
  }
}

/**
 * Initialize domain verification - client-safe version
 */
export function initializeDomainVerification(
  domain: string,
  method: VerificationMethod = VerificationMethod.DNS
): VerificationDetails {
  const token = generateVerificationToken(domain);
  
  return {
    status: 'pending',
    method,
    token,
    attempts: 0
  };
}

/**
 * Get verification instructions based on method
 */
export function getVerificationInstructions(
  domain: string,
  method: VerificationMethod,
  token: string
): string {
  const normalizedDomain = extractDomain(domain);
  
  switch (method) {
    case VerificationMethod.DNS:
      return `
Create a TXT record with the following details:
- Host/Name: _socialproofify
- Value/Content: ${token}
- TTL: 3600 (or default)

After adding this TXT record to your DNS settings, it may take up to 24-48 hours for DNS changes to propagate.
      `.trim();
    
    case VerificationMethod.FILE:
      return `
Create a new file with exactly this name and upload it to your website's root directory:
- File name: socialproofify-${token}.html
- File location: https://${normalizedDomain}/socialproofify-${token}.html
- File content: ${token}

Make sure the file is accessible by visiting the URL above.
      `.trim();
    
    case VerificationMethod.META:
      return `
Add the following meta tag to the <head> section of your website's home page:
<meta name="socialproofify-verification" content="${token}">

Make sure the meta tag is present when visiting https://${normalizedDomain}
      `.trim();
    
    default:
      return 'Invalid verification method selected.';
  }
}

// Remove the verifyDomain function and all functions related to server-side verification 