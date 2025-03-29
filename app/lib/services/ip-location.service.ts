/**
 * IPLocation Service
 * Integrates with IPLocate.io API to provide geolocation data for IPs
 * Implements caching and request throttling to stay within quota limits
 */

// Types for IPLocate response
export interface GeoData {
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
  subdivision: string;
  is_vpn: boolean;
}

export class IPLocationService {
  private cache: Map<string, GeoData> = new Map();
  private requestCount: number = 0;
  private requestCountResetDate: Date = new Date();
  private maxDailyRequests: number = 950; // Keeping a safety margin from 1000
  private apiKey: string;
  
  constructor(apiKey: string = '') {
    this.apiKey = apiKey || process.env.IPLOCATE_API_KEY || '';
    this.resetCounterIfNewDay();
  }
  
  /**
   * Get location data for an IP address
   * Returns cached data if available, otherwise fetches from API
   */
  async getLocationData(ip: string): Promise<GeoData | null> {
    this.resetCounterIfNewDay();
    
    // Return from cache if available
    if (this.cache.has(ip)) {
      return this.cache.get(ip) || null;
    }
    
    // Check if we've reached the daily quota
    if (this.requestCount >= this.maxDailyRequests) {
      console.warn('IPLocate daily quota limit reached. Using cached data only.');
      return null;
    }
    
    try {
      // Build the API URL with or without API key
      let apiUrl = `https://www.iplocate.io/api/lookup/${ip}`;
      if (this.apiKey) {
        apiUrl += `?apikey=${this.apiKey}`;
      }
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`IPLocate API error: ${response.status}`);
      }
      
      const data = await response.json() as GeoData;
      
      // Increment counter and cache the result
      this.requestCount++;
      this.cache.set(ip, data);
      
      return data;
    } catch (error) {
      console.error('Error fetching IP location data:', error);
      return null;
    }
  }
  
  /**
   * Reset request counter if it's a new day
   */
  private resetCounterIfNewDay(): void {
    const today = new Date();
    if (today.toDateString() !== this.requestCountResetDate.toDateString()) {
      this.requestCount = 0;
      this.requestCountResetDate = today;
    }
  }
  
  /**
   * Get current quota usage
   */
  getQuotaUsage(): { used: number, remaining: number, resetsIn: string } {
    this.resetCounterIfNewDay();
    const remaining = this.maxDailyRequests - this.requestCount;
    
    // Calculate time until reset
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilReset = tomorrow.getTime() - now.getTime();
    const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60));
    const minutesUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      used: this.requestCount,
      remaining,
      resetsIn: `${hoursUntilReset}h ${minutesUntilReset}m`
    };
  }
}

// Export singleton instance
export const ipLocationService = new IPLocationService(); 