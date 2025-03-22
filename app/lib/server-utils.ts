import crypto from 'crypto';
import { generateApiKey, isValidApiKey, rateLimit } from './server-api-key';

// Re-export these functions
export { generateApiKey, isValidApiKey, rateLimit };

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} input - The input to sanitize
 * @returns {string} The sanitized input
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Convert to string if not already
  const str = String(input);
  
  // Replace potentially dangerous characters
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates a URL format
 * @param {string} url - The URL to validate
 * @returns {boolean} Whether the URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/**
 * Extracts domain from a URL
 * @param {string} url - The URL to extract domain from
 * @returns {string} The domain
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    // If it's not a valid URL, try to extract domain from string
    // Remove protocol if present
    let domain = url.replace(/^(https?:\/\/)?(www\.)?/, '');
    // Get everything before first slash
    domain = domain.split('/')[0];
    return domain || '';
  }
}

/**
 * Checks if the provided value is a MongoDB ObjectId
 * @param {string} id - The ID to check
 * @returns {boolean} Whether the ID is a valid ObjectId
 */
export function isValidObjectId(id: string): boolean {
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  return objectIdPattern.test(id);
}

/**
 * Generate a random location for demo purposes
 */
export function getRandomLocation(): string {
  const cities = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
    'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
    'London', 'Paris', 'Berlin', 'Madrid', 'Rome',
    'Tokyo', 'Sydney', 'Toronto', 'Singapore', 'Dubai'
  ];
  
  return cities[Math.floor(Math.random() * cities.length)];
}

/**
 * Get the plan limits based on the plan name
 * @param plan The plan name
 * @returns Object containing the plan limits
 */
export function getPlanLimits(plan: 'free' | 'starter' | 'growth' | 'business'): {
  pageviews: number;
  websites: number;
  historyDays: number;
} {
  switch (plan) {
    case 'free':
      return {
        pageviews: 5000,
        websites: 1,
        historyDays: 7,
      };
    case 'starter':
      return {
        pageviews: 50000,
        websites: 3,
        historyDays: 30,
      };
    case 'growth':
      return {
        pageviews: 200000,
        websites: 10,
        historyDays: 90,
      };
    case 'business':
      return {
        pageviews: 1000000,
        websites: 25,
        historyDays: 365,
      };
    default:
      return {
        pageviews: 5000,
        websites: 1,
        historyDays: 7,
      };
  }
}

/**
 * Generate a unique ID for a website
 * @returns {string} A unique ID
 */
export function generateWebsiteId(): string {
  return crypto.randomUUID();
}

/**
 * Checks if a website is verified
 * @param website The website object to check
 * @returns Boolean indicating if the website is verified
 */
export function isWebsiteVerified(website: any): boolean {
  return website.verification.status === 'verified' || website.status === 'verified';
}

/**
 * Middleware-style function to verify website verification status
 * @param website The website object to check
 * @param onUnverified Optional callback for custom handling of unverified websites
 * @returns NextResponse with error if website is not verified, otherwise null
 */
export function requireVerifiedWebsite(website: any, onUnverified?: () => any): Response | null {
  if (!isWebsiteVerified(website)) {
    return new Response(
      JSON.stringify({
        error: 'Website must be verified before accessing this resource',
        verificationRequired: true
      }), 
      { 
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
  
  return null;
} 