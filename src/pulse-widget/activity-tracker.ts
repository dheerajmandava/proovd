/**
 * ProovdPulse Activity Tracker
 * Monitors user activity on the page and sends metrics to the socket server
 */

import { PulseSocketClient } from './socket-client';
import { throttle } from './utils';

export interface ActivityMetrics {
  clickCount: number;
  scrollPercentage: number;
  timeOnPage: number;
}

export class WebsiteActivityTracker {
  private socket: PulseSocketClient;
  private clickCount: number = 0;
  private scrollPercentage: number = 0;
  private startTime: number = Date.now();
  private isActive: boolean = false;
  private activityTimeout: NodeJS.Timeout | null = null;
  private sendInterval: NodeJS.Timeout | null = null;
  private visibilityHandler: () => void;
  private trackScroll: (event: Event) => void;
  private trackClick: (event: MouseEvent) => void;
  
  /**
   * Create a new WebsiteActivityTracker instance
   */
  constructor(socketClient: PulseSocketClient) {
    console.log('🟢 Creating WebsiteActivityTracker');
    this.socket = socketClient;
    
    // Create throttled event handlers
    this.trackScroll = throttle(this.handleScroll.bind(this), 200);
    this.trackClick = this.handleClick.bind(this);
    this.visibilityHandler = this.handleVisibilityChange.bind(this);
    
    console.log('✅ WebsiteActivityTracker created');
  }
  
  /**
   * Start tracking user activity
   */
  start(): void {
    console.log('🟢 Starting activity tracker');
    if (this.isActive) {
      console.log('⚠️ Activity tracker already active');
      return;
    }
    
    // Reset metrics
    this.clickCount = 0;
    this.scrollPercentage = 0;
    this.startTime = Date.now();
    
    // Add event listeners
    window.addEventListener('scroll', this.trackScroll, { passive: true });
    document.addEventListener('click', this.trackClick);
    document.addEventListener('visibilitychange', this.visibilityHandler);
    
    // Start sending metrics
    this.startActivityTimer();
    this.startSendInterval();
    
    this.isActive = true;
    console.log('✅ Activity tracker started');
  }
  
  /**
   * Stop tracking user activity
   */
  stop(): void {
    console.log('🟢 Stopping activity tracker');
    
    // Remove event listeners
    window.removeEventListener('scroll', this.trackScroll);
    document.removeEventListener('click', this.trackClick);
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    
    // Clear timers
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
      this.activityTimeout = null;
    }
    
    if (this.sendInterval) {
      clearInterval(this.sendInterval);
      this.sendInterval = null;
    }
    
    // Send final metrics
    this.sendActivityMetrics();
    
    this.isActive = false;
    console.log('✅ Activity tracker stopped');
  }
  
  /**
   * Get the current activity metrics
   */
  getMetrics(): ActivityMetrics {
    const timeOnPage = Math.floor((Date.now() - this.startTime) / 1000);
    
    return {
      clickCount: this.clickCount,
      scrollPercentage: this.scrollPercentage,
      timeOnPage
    };
  }
  
  /**
   * Handle page visibility changes (tab switching)
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      console.log('🟢 Page became visible');
      // Update start time to account for time spent away
      this.startTime = Date.now() - (this.getMetrics().timeOnPage * 1000);
    } else {
      console.log('🟡 Page hidden');
      // Send metrics when page is hidden
      this.sendActivityMetrics();
    }
  }
  
  /**
   * Handle scroll events
   */
  private handleScroll(event: Event): void {
    // Calculate scroll percentage
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    let percentage = 0;
    
    if (scrollHeight > 0) {
      percentage = Math.round((scrollTop / scrollHeight) * 100);
    }
    
    // Update max scroll percentage
    if (percentage > this.scrollPercentage) {
      this.scrollPercentage = percentage;
      console.log(`🟢 New max scroll percentage: ${this.scrollPercentage}%`);
    }
    
    // Reset activity timer
    this.startActivityTimer();
  }
  
  /**
   * Handle click events
   */
  private handleClick(event: MouseEvent): void {
    // Increment click count
    this.clickCount++;
    console.log(`🟢 Click tracked, total: ${this.clickCount}`);
    
    // Reset activity timer
    this.startActivityTimer();
  }
  
  /**
   * Start/reset the activity timeout
   */
  private startActivityTimer(): void {
    // Clear existing timer
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }
    
    // Set new timer (60 seconds of inactivity)
    this.activityTimeout = setTimeout(() => {
      console.log('🟡 User inactive, sending metrics');
      this.sendActivityMetrics();
    }, 60000) as unknown as NodeJS.Timeout;
  }
  
  /**
   * Start the interval to periodically send metrics
   */
  private startSendInterval(): void {
    // Clear existing interval
    if (this.sendInterval) {
      clearInterval(this.sendInterval);
    }
    
    // Send metrics every 30 seconds
    this.sendInterval = setInterval(() => {
      console.log('🟢 Sending periodic metrics');
      this.sendActivityMetrics();
    }, 30000) as unknown as NodeJS.Timeout;
  }
  
  /**
   * Send activity metrics to the socket server
   */
  private sendActivityMetrics(): void {
    if (!this.socket || !this.socket.isActive()) {
      console.log('🟡 Socket not active, cannot send metrics');
      return;
    }
    
    const metrics = this.getMetrics();
    console.log('🟢 Sending activity metrics:', metrics);
    
    this.socket.sendActivity(metrics);
  }
} 