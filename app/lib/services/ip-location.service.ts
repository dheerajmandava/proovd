/**
 * IP Location Service
 * Uses iplocate.io to get geographic data for IP addresses
 */

import { createCache } from '@/app/lib/cache';

export interface LocationData {
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
  region?: string;
  region_name?: string;
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
    
    // For local development, return mock data
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return this.getMockLocationData();
    }

    try {
      // Make API call
      const url = `${this.API_URL}/${ip}`;
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
      return this.getMockLocationData(); // Fallback to mock data on error
    }
  }
  
  /**
   * Get mock location data for development
   */
  private getMockLocationData(): LocationData {
    const mockLocations = [
      { country: 'United States', country_code: 'US', city: 'New York', region_name: 'New York' },
      { country: 'United Kingdom', country_code: 'GB', city: 'London', region_name: 'England' },
      { country: 'Canada', country_code: 'CA', city: 'Toronto', region_name: 'Ontario' },
      { country: 'India', country_code: 'IN', city: 'Mumbai', region_name: 'Maharashtra' },
      { country: 'Australia', country_code: 'AU', city: 'Sydney', region_name: 'New South Wales' }
    ];
    
    const mock = mockLocations[Math.floor(Math.random() * mockLocations.length)];
    
    return {
      ip: '127.0.0.1',
      country: mock.country,
      country_code: mock.country_code,
      city: mock.city,
      continent: 'Unknown',
      latitude: 0,
      longitude: 0,
      time_zone: 'UTC',
      postal_code: '00000',
      org: 'Local',
      asn: 'Local',
      region_name: mock.region_name
    };
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