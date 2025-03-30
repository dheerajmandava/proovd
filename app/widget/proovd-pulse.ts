/**
 * ProovdPulse Widget
 * Social proof and engagement metrics for website visitor tracking
 */

import { PulseSocketClient } from './socket-client';

// User activity data interface
export interface UserActivity {
  id: string;
  websiteId: string;
  sessionId: string;
  userId?: string;
  userType?: 'user' | 'guest';
  deviceInfo: {
    browser: string;
    os: string;
    device: string;
  };
  location?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  lastActive: string;
  isActive: boolean;
  referrer?: string;
  path: string;
  totalClicks: number;
  scrollDepth: number;
  timeOnPage: number;
}

// Widget configuration interface
export interface PulseWidgetConfig {
  websiteId: string;
  token?: string;
  socketUrl?: string;
  widgetPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  widgetColors?: {
    background?: string;
    text?: string;
    pulse?: string;
  };
  customText?: {
    activeUserLabel?: string;
    pulseLabel?: string;
  };
  hideWidgetOnMobile?: boolean;
}

/**
 * ProovdPulse Class
 * Tracks user activity and engagement metrics on a webpage
 */
export class ProovdPulse {
  private config: PulseWidgetConfig;
  private socketClient: PulseSocketClient;
  private sessionId: string;
  private path: string;
  private referrer: string;
  private startTime: number;
  private lastScrollDepth: number = 0;
  private totalClicks: number = 0;
  private browserInfo: any = {};
  private locationInfo: any = {};
  private activityInterval: any = null;
  private isWidgetVisible: boolean = false;
  private widgetElement: HTMLElement | null = null;
  private activeUsersCount: number = 0;
  private initialized: boolean = false;

  /**
   * Constructor
   * @param config Configuration options for the widget
   */
  constructor(config: PulseWidgetConfig) {
    this.config = this.mergeWithDefaults(config);
    this.sessionId = this.generateSessionId();
    this.path = window.location.pathname;
    this.referrer = document.referrer;
    this.startTime = Date.now();
    this.detectBrowser();
    this.socketClient = new PulseSocketClient(this.config);
    
    console.log('ProovdPulse: Initialized with config:', this.config);
  }
  
  /**
   * Merge provided configuration with defaults
   */
  private mergeWithDefaults(config: PulseWidgetConfig): PulseWidgetConfig {
    return {
      websiteId: config.websiteId,
      token: config.token || '',
      socketUrl: config.socketUrl || 'wss://socket.proovd.in',
      widgetPosition: config.widgetPosition || 'bottom-right',
      widgetColors: {
        background: config.widgetColors?.background || '#1e293b',
        text: config.widgetColors?.text || '#ffffff',
        pulse: config.widgetColors?.pulse || '#3b82f6',
      },
      customText: {
        activeUserLabel: config.customText?.activeUserLabel || 'Active Users',
        pulseLabel: config.customText?.pulseLabel || 'Proovd Pulse',
      },
      hideWidgetOnMobile: config.hideWidgetOnMobile !== undefined ? config.hideWidgetOnMobile : true,
    };
  }

  /**
   * Initialize the tracking and widget
   */
  public async init(): Promise<void> {
    if (this.initialized) {
      console.log('ProovdPulse: Already initialized');
      return;
    }
    
    try {
      console.log('ProovdPulse: Initializing widget...');
      
      // Connect to WebSocket server
      await this.socketClient.connect();
      
      // Set up event handlers for socket events
      this.socketClient.onActiveUsersUpdate((count) => {
        this.activeUsersCount = count;
        this.updateWidgetCount(count);
      });
      
      // Setup tracking event listeners
      this.setupEventListeners();
      
      // Start periodic reporting
      this.startActivityReporting();
      
      // Create widget if needed
      if (!this.isInIframe()) {
        this.createWidget();
      }
      
      this.initialized = true;
      console.log('ProovdPulse initialized successfully');
      
      // Send initial join message
      this.socketClient.sendJoinMessage(this.sessionId);
    } catch (error) {
      console.error('Failed to initialize ProovdPulse:', error);
    }
  }

  /**
   * Setup event listeners for tracking
   */
  private setupEventListeners(): void {
    // Click tracking
    document.addEventListener('click', () => {
      this.totalClicks++;
      this.reportActivity();
    });

    // Scroll tracking
    window.addEventListener('scroll', this.throttle(() => {
      this.trackScrollDepth();
    }, 500));

    // Visibility change
    document.addEventListener('visibilitychange', () => {
      this.reportActivity();
    });

    // Before unload
    window.addEventListener('beforeunload', () => {
      this.reportActivity(false);
      this.socketClient.sendLeaveMessage(this.sessionId);
    });
  }

  /**
   * Start periodic activity reporting
   */
  private startActivityReporting(): void {
    // Report initial activity
    this.reportActivity();

    // Set up interval for periodic updates
    this.activityInterval = setInterval(() => {
      this.reportActivity();
    }, 30000); // Report every 30 seconds
  }

  /**
   * Report user activity to WebSocket server
   */
  private reportActivity(isActive: boolean = !document.hidden): void {
    if (!this.socketClient.getConnectionStatus()) {
      this.socketClient.connect().catch(err => {
        console.error('Failed to reconnect to socket server:', err);
      });
      return;
    }

    const activity: UserActivity = {
      id: this.sessionId,
      websiteId: this.config.websiteId,
      sessionId: this.sessionId,
      deviceInfo: this.browserInfo,
      location: this.locationInfo,
      lastActive: new Date().toISOString(),
      isActive: isActive,
      referrer: this.referrer,
      path: this.path,
      totalClicks: this.totalClicks,
      scrollDepth: this.lastScrollDepth,
      timeOnPage: Math.floor((Date.now() - this.startTime) / 1000)
    };

    this.socketClient.sendActivity(activity);
  }

  /**
   * Track scroll depth percentage
   */
  private trackScrollDepth(): void {
    const windowHeight = window.innerHeight;
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    );
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    
    if (documentHeight > windowHeight) {
      const scrollPercent = Math.floor((scrollTop / (documentHeight - windowHeight)) * 100);
      this.lastScrollDepth = Math.max(scrollPercent, this.lastScrollDepth);
    }
  }

  /**
   * Throttle function to limit execution frequency
   */
  private throttle(callback: Function, delay: number): any {
    let lastCall = 0;
    return function(...args: any[]) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        callback(...args);
      }
    };
  }

  /**
   * Detect browser, OS, and device
   */
  private detectBrowser(): void {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    // Detect browser
    if (userAgent.indexOf('Firefox') > -1) {
      browser = 'Firefox';
    } else if (userAgent.indexOf('SamsungBrowser') > -1) {
      browser = 'Samsung Browser';
    } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
      browser = 'Opera';
    } else if (userAgent.indexOf('Edge') > -1) {
      browser = 'Edge';
    } else if (userAgent.indexOf('Chrome') > -1) {
      browser = 'Chrome';
    } else if (userAgent.indexOf('Safari') > -1) {
      browser = 'Safari';
    } else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident/') > -1) {
      browser = 'Internet Explorer';
    }

    // Detect OS
    if (userAgent.indexOf('Windows') > -1) {
      os = 'Windows';
    } else if (userAgent.indexOf('Mac') > -1) {
      os = 'MacOS';
    } else if (userAgent.indexOf('Linux') > -1) {
      os = 'Linux';
    } else if (userAgent.indexOf('Android') > -1) {
      os = 'Android';
    } else if (userAgent.indexOf('iOS') > -1 || (navigator.platform === 'iPhone' || navigator.platform === 'iPad' || navigator.platform === 'iPod')) {
      os = 'iOS';
    }

    // Detect device
    if (window.innerWidth <= 768 || userAgent.indexOf('Mobile') > -1 || userAgent.indexOf('Android') > -1 && userAgent.indexOf('Mozilla/5.0') > -1) {
      device = 'Mobile';
    } else if (window.innerWidth <= 1024 || navigator.platform === 'iPad' || userAgent.indexOf('Tablet') > -1) {
      device = 'Tablet';
    }

    this.browserInfo = { browser, os, device };

    // Get location info from API if available
    this.getLocationInfo();
  }

  /**
   * Get user location information (Optional - only used if available)
   */
  private getLocationInfo(): void {
    try {
      fetch('https://geolocation-db.com/json/')
        .then(response => response.json())
        .then(data => {
          this.locationInfo = {
            country: data.country_name,
            city: data.city,
            latitude: data.latitude,
            longitude: data.longitude
          };
        })
        .catch(() => {
          // Silently fail if geolocation is not available
          this.locationInfo = {};
        });
    } catch (error) {
      // Silently fail if fetch is not available
      this.locationInfo = {};
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Create and display the widget
   */
  private createWidget(): void {
    if (this.isWidgetVisible || this.widgetElement) return;
    
    // Do not show widget on mobile if configured that way
    if (this.config.hideWidgetOnMobile && this.browserInfo.device === 'Mobile') {
      return;
    }

    // Create widget container
    const widget = document.createElement('div');
    widget.className = 'proovd-pulse-widget';
    widget.style.position = 'fixed';
    widget.style.zIndex = '9999';
    widget.style.padding = '8px 12px';
    widget.style.borderRadius = '50px';
    widget.style.backgroundColor = this.config.widgetColors?.background || '#1e293b';
    widget.style.color = this.config.widgetColors?.text || '#ffffff';
    widget.style.fontFamily = 'Arial, sans-serif';
    widget.style.fontSize = '14px';
    widget.style.display = 'flex';
    widget.style.alignItems = 'center';
    widget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    widget.style.transition = 'opacity 0.3s';
    widget.style.opacity = '0.9';
    widget.style.cursor = 'pointer';

    // Set position
    switch (this.config.widgetPosition) {
      case 'bottom-left':
        widget.style.bottom = '20px';
        widget.style.left = '20px';
        break;
      case 'top-right':
        widget.style.top = '20px';
        widget.style.right = '20px';
        break;
      case 'top-left':
        widget.style.top = '20px';
        widget.style.left = '20px';
        break;
      default:
        widget.style.bottom = '20px';
        widget.style.right = '20px';
    }

    // Hover effect
    widget.addEventListener('mouseenter', () => {
      widget.style.opacity = '1';
    });
    widget.addEventListener('mouseleave', () => {
      widget.style.opacity = '0.9';
    });

    // Pulse indicator
    const pulse = document.createElement('div');
    pulse.className = 'proovd-pulse-indicator';
    pulse.style.width = '12px';
    pulse.style.height = '12px';
    pulse.style.borderRadius = '50%';
    pulse.style.backgroundColor = this.config.widgetColors?.pulse || '#3b82f6';
    pulse.style.marginRight = '8px';
    pulse.style.position = 'relative';

    // Pulse animation
    const pulseAnimation = document.createElement('style');
    pulseAnimation.textContent = `
      @keyframes pulse {
        0% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
        }
        70% {
          transform: scale(1);
          box-shadow: 0 0 0 6px rgba(59, 130, 246, 0);
        }
        100% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
        }
      }
      .proovd-pulse-indicator {
        animation: pulse 2s infinite;
      }
    `;
    document.head.appendChild(pulseAnimation);

    // Counter
    const counter = document.createElement('div');
    counter.className = 'proovd-pulse-counter';

    // Active user count
    const countElement = document.createElement('div');
    countElement.className = 'proovd-pulse-count';
    countElement.style.fontWeight = 'bold';
    countElement.textContent = '1';

    // Label
    const labelElement = document.createElement('div');
    labelElement.className = 'proovd-pulse-label';
    labelElement.style.fontSize = '12px';
    labelElement.style.marginLeft = '4px';
    labelElement.textContent = this.config.customText?.activeUserLabel || 'Active Users';

    // Powered by label
    const poweredBy = document.createElement('div');
    poweredBy.className = 'proovd-pulse-powered';
    poweredBy.style.fontSize = '10px';
    poweredBy.style.marginLeft = '8px';
    poweredBy.style.opacity = '0.7';
    poweredBy.textContent = this.config.customText?.pulseLabel || 'Proovd Pulse';

    // Assemble widget
    counter.appendChild(countElement);
    counter.appendChild(labelElement);
    widget.appendChild(pulse);
    widget.appendChild(counter);
    widget.appendChild(poweredBy);

    // Add click handler to open Proovd dashboard in new tab
    widget.addEventListener('click', () => {
      window.open('https://app.proovd.in/dashboard', '_blank');
    });

    // Append to document
    document.body.appendChild(widget);
    this.widgetElement = widget;
    this.isWidgetVisible = true;
  }

  /**
   * Update widget with current active user count
   */
  private updateWidgetCount(count: number): void {
    if (this.widgetElement) {
      const countElement = this.widgetElement.querySelector('.proovd-pulse-count');
      if (countElement) {
        countElement.textContent = count.toString();
      }
    }
  }

  /**
   * Check if the script is running in an iframe
   */
  private isInIframe(): boolean {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  /**
   * Clean up event listeners and intervals
   */
  public cleanup(): void {
    // Clear reporting interval
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
    }

    // Send final update
    this.reportActivity(false);

    // Close WebSocket connection
    this.socketClient.disconnect();

    // Remove widget
    if (this.widgetElement && this.widgetElement.parentNode) {
      this.widgetElement.parentNode.removeChild(this.widgetElement);
      this.widgetElement = null;
      this.isWidgetVisible = false;
    }

    // Mark as not initialized
    this.initialized = false;
  }
} 