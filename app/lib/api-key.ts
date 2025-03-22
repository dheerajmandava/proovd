'use client';

/**
 * Validates if an API key is in the correct format
 * @param {string} apiKey - The API key to validate
 * @returns {boolean} True if the API key is valid, false otherwise
 */
export function isValidApiKey(apiKey: string): boolean {
  if (!apiKey) return false;
  
  // Check if the API key has the correct format
  return /^spfy_[a-f0-9]{36}$/.test(apiKey);
}

/**
 * Dummy version of generateApiKey for client imports
 * This is only used for type safety and won't be called on the client
 */
export function generateApiKey(): string {
  if (typeof window !== 'undefined') {
    console.error('generateApiKey should not be called on the client');
  }
  return 'spfy_clientsidedummykeythatwillneverbecalled';
} 