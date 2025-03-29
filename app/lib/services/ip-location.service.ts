/**
 * IP Location Service
 * Uses iplocate.io to get geographic data for IP addresses
 */

import { createCache } from '@/app/lib/cache';

interface LocationData {
  ip: string;
  country: string;
  country_code: string;
  city: string;
  continent: string;
  latitude: number;
  longitude: number;
  time_zone: string;
  postal_code: string;
  org: string;
  asn: string;
}

class IPLocationService {
  private API_KEY = 'aasasas123FVC12231'; // Use the API key provided
  private API_URL = 'https://www.iplocate.io/api/lookup';
  private cache: Map<string, LocationData>;
  private requestCount: number = 0;
  private dailyQuota: number = 1000; // Default daily quota

  constructor() {
    // Create a cache with 24-hour TTL
    this.cache = createCache<LocationData>(24 * 60 * 60 * 1000);
    
    // Reset request count daily
    setInterval(() => {
      this.requestCount = 0;
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Get location data for an IP address
   */
  async getLocationData(ip: string): Promise<LocationData | null> {
    // Check quota
    if (this.requestCount >= this.dailyQuota) {
      console.warn('IP location API daily quota exceeded');
      return null;
    }

    // Check cache first
    if (this.cache.has(ip)) {
      return this.cache.get(ip) || null;
    }

    try {
      // Make API call
      const url = `${this.API_URL}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to get location data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as LocationData;
      
      // Increment request count
      this.requestCount++;
      
      // Cache result
      this.cache.set(ip, data);
      
      return data;
    } catch (error) {
      console.error('Error getting location data:', error);
      return null;
    }
  }

  /**
   * Get current quota usage
   */
  getQuotaUsage(): { current: number, limit: number, percentage: number } {
    return {
      current: this.requestCount,
      limit: this.dailyQuota,
      percentage: Math.round((this.requestCount / this.dailyQuota) * 100)
    };
  }
}

// Export a singleton instance
export const ipLocationService = new IPLocationService(); 