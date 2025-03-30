/**
 * ProovdPulse Widget
 * Real-time website visitor tracking and engagement metrics
 * Simple implementation without authentication
 */
import { PulseSocketClient } from './socket-client';
import { PulseUI, PulseUIOptions } from './pulse-ui';
import { v4 as uuidv4 } from 'uuid';

interface ProovdPulseOptions extends PulseUIOptions {
  websiteId: string;
  serverUrl?: string;
  clientId?: string;
  secure?: boolean;
  debug?: boolean;
  reconnectMaxAttempts?: number;
}

interface ActivityMetrics {
  clickCount: number;
  scrollPercentage: number;
  timeOnPage: number;
}

export class ProovdPulse {
  private socketClient: PulseSocketClient;
  private ui: PulseUI;
  private options: ProovdPulseOptions;
  private metrics: ActivityMetrics = {
    clickCount: 0,
    scrollPercentage: 0,
    timeOnPage: 0
  };
  private isTracking = false;
  private startTime: number = 0;
  private activityInterval: number | null = null;
  private maxScrollPercentage = 0;
  private clickHandler: ((e: MouseEvent) => void) | null = null;
  private scrollHandler: ((e: Event) => void) | null = null;

  constructor(options: ProovdPulseOptions) {
    // Make a copy of options to avoid mutation issues
    this.options = { ...options };
    
    // Generate a client ID if not provided
    if (!this.options.clientId) {
      this.options.clientId = this.getClientId();
    }
    
    // Set default server URL
    if (!this.options.serverUrl) {
      // Use wss:// for production, ws:// for localhost
      this.options.serverUrl = window.location.hostname === 'localhost' || 
        window.location.hostname.includes('127.0.0.1')
        ? 'ws://localhost:3001'
        : 'wss://socket.proovd.in';
    }
    
    // Set secure option based on protocol
    if (this.options.secure === undefined) {
      this.options.secure = window.location.protocol === 'https:';
    }
    
    this.log('Initializing with options:', this.options);
    
    // Create socket client - ensure we have all required properties first
    if (!this.options.clientId || !this.options.websiteId || !this.options.serverUrl) {
      console.error('ProovdPulse: Missing required options', {
        clientId: this.options.clientId,
        websiteId: this.options.websiteId,
        serverUrl: this.options.serverUrl
      });
      throw new Error('Missing required options for ProovdPulse initialization');
    }
    
    // Initialize socket client
    this.socketClient = new PulseSocketClient(
      this.options.clientId,
      this.options.websiteId,
      this.options.serverUrl,
      {
        secure: this.options.secure,
        debug: this.options.debug,
        reconnectMaxAttempts: this.options.reconnectMaxAttempts
      }
    );
    
    // Create UI component
    this.ui = new PulseUI(options);
    
    // Handle stats updates
    this.socketClient.on('stats', (data) => {
      if (data.websiteId === this.options.websiteId) {
        this.ui.updateUserCount(data.activeUsers || 0);
      }
    });
    
    // Handle connection events
    this.socketClient.on('connect', () => {
      this.log('Connected to ProovdPulse server');
      
      // Send join message on connect
      this.socketClient.sendJoin();
    });
    
    this.socketClient.on('disconnect', (data) => {
      this.log('Disconnected from ProovdPulse server', data);
    });
    
    this.socketClient.on('error', (data) => {
      this.log('Error connecting to ProovdPulse server', data);
    });
  }

  /**
   * Initialize the widget
   */
  async init(): Promise<void> {
    try {
      // Mount UI
      this.ui.mount();
      
      // Connect to socket server
      await this.socketClient.connect();
      
      // Start tracking activity
      this.startTracking();
      
      this.log('Initialized successfully');
    } catch (error) {
      console.error('ProovdPulse: Failed to initialize', error);
    }
  }

  /**
   * Start tracking user activity
   */
  private startTracking(): void {
    if (this.isTracking) return;
    this.isTracking = true;
    this.startTime = Date.now();
    
    // Track clicks
    this.clickHandler = () => {
      this.metrics.clickCount += 1;
    };
    document.addEventListener('click', this.clickHandler);
    
    // Track scroll depth
    this.scrollHandler = () => {
      const scrollHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
      );
      
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      
      const scrollPercentage = Math.min(
        Math.round((scrollTop / (scrollHeight - windowHeight)) * 100),
        100
      );
      
      this.maxScrollPercentage = Math.max(scrollPercentage, this.maxScrollPercentage);
    };
    document.addEventListener('scroll', this.scrollHandler);
    
    // Send activity reports periodically
    this.activityInterval = window.setInterval(() => {
      this.reportActivity();
    }, 5000) as unknown as number; // 5 seconds
    
    // Report activity when user leaves page
    window.addEventListener('beforeunload', () => {
      this.reportActivity();
      this.destroy();
    });
  }

  /**
   * Report current activity metrics
   */
  reportActivity(): void {
    if (!this.isTracking) return;
    
    // Calculate time on page
    const timeOnPage = Math.round((Date.now() - this.startTime) / 1000);
    
    // Prepare metrics
    const currentMetrics = {
      clickCount: this.metrics.clickCount,
      scrollPercentage: this.maxScrollPercentage,
      timeOnPage
    };
    
    // Send activity update
    this.socketClient.sendActivity(currentMetrics);
    
    // Reset click count for next report
    this.metrics.clickCount = 0;
  }

  /**
   * Destroy the widget and clean up
   */
  destroy(): void {
    // Stop tracking
    this.isTracking = false;
    
    // Clear interval
    if (this.activityInterval !== null) {
      clearInterval(this.activityInterval);
      this.activityInterval = null;
    }
    
    // Remove event listeners
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler);
      this.clickHandler = null;
    }
    
    if (this.scrollHandler) {
      document.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }
    
    // Disconnect socket
    this.socketClient.disconnect();
    
    // Unmount UI
    this.ui.unmount();
    
    this.log('Destroyed');
  }

  /**
   * Get or create a client ID
   */
  private getClientId(): string {
    // Try to get from localStorage first
    const storedId = localStorage.getItem('proovdPulseClientId');
    if (storedId) {
      return storedId;
    }
    
    // Generate a new ID
    const newId = uuidv4();
    localStorage.setItem('proovdPulseClientId', newId);
    return newId;
  }
  
  /**
   * Log messages if debug is enabled
   */
  private log(message: string, ...args: any[]): void {
    if (this.options.debug) {
      console.log(`ProovdPulse: ${message}`, ...args);
    }
  }
}