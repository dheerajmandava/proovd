import { NextRequest } from 'next/server';
import Website from './models/website';
import crypto from 'crypto';
import { isValidApiKey } from './api-key';

// Re-export isValidApiKey
export { isValidApiKey };

// Rate limiting cache (in-memory for now, would use Redis in production)
const rateLimitCache: Record<string, {
  requests: number;
  lastReset: Date;
}> = {};

/**
 * Generates a unique API key in the format spfy_<uuid>
 * @returns {string} The generated API key
 */
export function generateApiKey(): string {
  const uuid = crypto.randomUUID();
  return `spfy_${uuid}`;
}

/**
 * Find a website by API key
 */
export async function findWebsiteByApiKey(apiKey: string): Promise<any> {
  if (!isValidApiKey(apiKey)) {
    return null;
  }
  
  try {
    const website = await Website.findOne({
      'apiKeys.key': apiKey,
      status: { $in: ['active', 'verified'] }
    });
    
    return website;
  } catch (error) {
    console.error('Error finding website by API key:', error);
    return null;
  }
}

/**
 * Validates if a request is authorized to access a website's API
 * @param {string} apiKey - The API key from the request
 * @param {Array<string>} websiteApiKeys - The website's API keys
 * @param {string} origin - The request origin
 * @returns {boolean} True if the request is authorized, false otherwise
 */
export function validateApiRequest(
  apiKey: string, 
  websiteApiKeys: any[], 
  origin?: string
): boolean {
  if (!apiKey || !websiteApiKeys || websiteApiKeys.length === 0) {
    return false;
  }
  
  // Find the matching API key
  const matchingKey = websiteApiKeys.find(key => key.key === apiKey);
  
  if (!matchingKey) {
    return false;
  }
  
  // If no origin restrictions or no origin provided, simply validate the key
  if (!matchingKey.allowedOrigins || matchingKey.allowedOrigins.length === 0 || !origin) {
    return true;
  }
  
  // Check if the origin is allowed
  return isOriginAllowed(origin, matchingKey.allowedOrigins);
}

/**
 * Checks if an origin is allowed based on the allowed origins list
 * @param {string} origin - The request origin
 * @param {Array<string>} allowedOrigins - List of allowed origins (supports wildcards)
 * @returns {boolean} True if the origin is allowed, false otherwise
 */
function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  // Extract domain from origin (e.g., https://example.com -> example.com)
  const domainMatch = origin.match(/^(?:https?:\/\/)?([^\/]+)/i);
  
  if (!domainMatch) {
    return false;
  }
  
  const domain = domainMatch[1].toLowerCase();
  
  // Check if the domain matches any of the allowed origins
  return allowedOrigins.some(allowedOrigin => {
    // Exact match
    if (allowedOrigin === domain) {
      return true;
    }
    
    // Wildcard match (*.example.com)
    if (allowedOrigin.startsWith('*.')) {
      const suffix = allowedOrigin.substring(1); // *.example.com -> .example.com
      return domain.endsWith(suffix);
    }
    
    return false;
  });
}

/**
 * Extracts the API key from a request
 * @param {any} req - The Next.js request object
 * @returns {string|null} The API key or null if not found
 */
export function extractApiKey(req: any): string | null {
  // Check for API key in headers
  const headerKey = req.headers.get('x-api-key') || req.headers.get('api-key');
  if (headerKey) {
    return headerKey;
  }
  
  // Check for API key in query params
  const url = new URL(req.url);
  const queryKey = url.searchParams.get('apiKey') || url.searchParams.get('api_key');
  if (queryKey) {
    return queryKey;
  }
  
  return null;
}

/**
 * Check rate limiting for an API key
 */
export function checkRateLimit(website: any, apiKey: string): {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  // Find the API key in the website
  const apiKeyObj = website.apiKeys.find((key: any) => key.key === apiKey);
  
  if (!apiKeyObj) {
    return {
      allowed: false,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }
  
  // Default rate limit
  const limit = apiKeyObj.rateLimit?.requests || 100;
  const period = apiKeyObj.rateLimit?.period || 60; // 1 minute
  
  // Check cache
  if (!rateLimitCache[apiKey]) {
    rateLimitCache[apiKey] = {
      requests: 0,
      lastReset: new Date(),
    };
  }
  
  const cache = rateLimitCache[apiKey];
  const now = new Date();
  const elapsed = (now.getTime() - cache.lastReset.getTime()) / 1000;
  
  // Reset if period has passed
  if (elapsed >= period) {
    cache.requests = 0;
    cache.lastReset = now;
  }
  
  // Increment request count
  cache.requests++;
  
  // Check if over limit
  const remaining = Math.max(0, limit - cache.requests);
  const resetTime = new Date(cache.lastReset.getTime() + period * 1000);
  const resetSeconds = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);
  
  return {
    allowed: cache.requests <= limit,
    limit,
    remaining,
    reset: resetSeconds,
  };
}

/**
 * Update API key usage statistics
 */
export async function updateApiKeyUsage(website: any, apiKey: string, bytes: number = 0): Promise<void> {
  try {
    const apiKeyIndex = website.apiKeys.findIndex((key: any) => key.key === apiKey);
    
    if (apiKeyIndex === -1) {
      return;
    }
    
    // Update usage stats
    const apiKeyPath = `apiKeys.${apiKeyIndex}`;
    
    await Website.updateOne(
      { _id: website._id },
      {
        $inc: {
          [`${apiKeyPath}.usage.requests`]: 1,
          [`${apiKeyPath}.usage.bandwidth`]: bytes,
        },
        $set: {
          [`${apiKeyPath}.lastUsed`]: new Date(),
        },
      }
    );
  } catch (error) {
    console.error('Error updating API key usage:', error);
  }
}

/**
 * Validate API key from request
 */
export async function validateApiKey(
  req: NextRequest,
  requireVerified: boolean = true
): Promise<{
  valid: boolean;
  website?: any;
  apiKey?: string;
  error?: string;
  rateLimit?: {
    allowed: boolean;
    limit: number;
    remaining: number;
    reset: number;
  };
}> {
  // Get API key from query params or header
  const searchParams = new URL(req.url).searchParams;
  const apiKey = searchParams.get('apiKey') || req.headers.get('x-api-key');
  
  if (!apiKey) {
    return {
      valid: false,
      error: 'API key is required',
    };
  }
  
  if (!isValidApiKey(apiKey)) {
    return {
      valid: false,
      error: 'Invalid API key format',
    };
  }
  
  // Find website by API key
  const website = await findWebsiteByApiKey(apiKey);
  
  if (!website) {
    return {
      valid: false,
      error: 'Invalid API key',
    };
  }
  
  // Check if website is verified when required
  if (requireVerified && website.status !== 'verified') {
    return {
      valid: false,
      error: 'Website not verified',
    };
  }
  
  // Check origin (referer)
  const origin = req.headers.get('origin') || req.headers.get('referer');
  
  if (origin) {
    const apiKeyObj = website.apiKeys.find((key: any) => key.key === apiKey);
    if (apiKeyObj && apiKeyObj.allowedOrigins && apiKeyObj.allowedOrigins.length > 0) {
      if (!isOriginAllowed(origin, apiKeyObj.allowedOrigins)) {
        return {
          valid: false,
          error: 'Origin not allowed',
        };
      }
    }
  }
  
  // Check rate limit
  const rateLimit = checkRateLimit(website, apiKey);
  
  if (!rateLimit.allowed) {
    return {
      valid: false,
      error: 'Rate limit exceeded',
      rateLimit,
    };
  }
  
  // Update usage statistics
  await updateApiKeyUsage(website, apiKey);
  
  return {
    valid: true,
    website,
    apiKey,
    rateLimit,
  };
}

/**
 * Rate limits API requests by key
 * @param {string} apiKey - The API key to rate limit
 * @param {number} limit - The maximum number of requests allowed per minute
 * @returns {boolean} True if the request is allowed, false otherwise
 */
export function rateLimit(apiKey: string, limit: number = 60): boolean {
  // This is a simple implementation - in production you'd use Redis or a similar store
  
  // For now, always allow requests
  return true;
} 