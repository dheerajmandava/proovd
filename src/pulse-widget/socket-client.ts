/**
 * ProovdPulse WebSocket Client
 * Handles communication with the ProovdPulse WebSocket server
 * Simple implementation without authentication
 */

interface PulseMetrics {
  clickCount: number;
  scrollPercentage: number;
  timeOnPage: number;
}

interface PulseStats {
  websiteId: string;
  activeUsers: number;
  totalClicks: number;
  avgScrollPercentage: number;
  avgTimeOnPage: number;
  updatedAt: string;
}

interface PulseOptions {
  clientId: string;
  websiteId: string;
  serverUrl: string;
  secure?: boolean;
  reconnectMaxAttempts?: number;
  debug?: boolean;
}

type MessageHandler = (data: any) => void;

export class PulseSocketClient {
  private socket: WebSocket | null = null;
  private options: PulseOptions;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private handlers: { [key: string]: MessageHandler[] } = {
    stats: [],
    connect: [],
    disconnect: [],
    error: []
  };
  private isConnected = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPongTime = 0;

  constructor(clientId: string, websiteId: string, serverUrl: string, options: Partial<PulseOptions> = {}) {
    // Use secure WebSockets if on HTTPS
    const useSecure = options.secure !== undefined 
      ? options.secure 
      : (typeof window !== 'undefined' && window.location.protocol === 'https:');
    
    this.options = {
      clientId,
      websiteId,
      serverUrl,
      secure: useSecure,
      reconnectMaxAttempts: options.reconnectMaxAttempts || 10,
      debug: options.debug || false
    };
    
    this.log('Initialized with options:', this.options);
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.socket && this.isConnected) {
          this.log('Already connected to WebSocket server');
          return resolve();
        }
        
        // Reset reconnection attempts if this is a manual connection
        if (this.reconnectAttempts === 0) {
          this.reconnectAttempts = 0;
        }
        
        // Build the WebSocket URL with parameters
        const wsUrl = this.buildWebSocketUrl();
        
        this.log(`Connecting to WebSocket server: ${wsUrl}`);
        
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          this.log('Connected to WebSocket server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Start ping interval for keep-alive
          this.startPingInterval();
          
          // Notify handlers
          this.notifyHandlers('connect', { connected: true });
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'stats') {
              this.notifyHandlers('stats', data);
            } else if (data.type === 'pong') {
              this.lastPongTime = Date.now();
              this.log('Received pong from server');
            }
          } catch (error) {
            this.log('Error parsing message', error);
          }
        };

        this.socket.onclose = (event) => {
          this.log(`Connection closed: ${event.code} ${event.reason}`);
          this.isConnected = false;
          this.stopPingInterval();
          this.notifyHandlers('disconnect', { connected: false, code: event.code, reason: event.reason });
          
          // Try to reconnect if not closed deliberately
          if (event.code !== 1000) {
            this.attemptReconnect();
          }
        };

        this.socket.onerror = (error) => {
          this.log('WebSocket error', error);
          this.notifyHandlers('error', { error });
          reject(error);
        };
      } catch (error) {
        this.log('Failed to connect', error);
        this.notifyHandlers('error', { error });
        reject(error);
      }
    });
  }

  /**
   * Send a join message to the server
   */
  sendJoin(): void {
    this.sendMessage('join', {
      clientId: this.options.clientId,
      websiteId: this.options.websiteId
    });
  }

  /**
   * Send activity metrics to the server
   */
  sendActivity(metrics: PulseMetrics): void {
    this.sendMessage('activity', {
      clientId: this.options.clientId,
      websiteId: this.options.websiteId,
      metrics
    });
  }

  /**
   * Send a ping to keep the connection alive
   */
  private sendPing(): void {
    this.sendMessage('ping', {
      clientId: this.options.clientId,
      timestamp: Date.now()
    });
  }
  
  /**
   * Start the ping interval
   */
  private startPingInterval(): void {
    this.stopPingInterval();
    this.lastPongTime = Date.now();
    this.pingInterval = setInterval(() => {
      if (this.isActive()) {
        this.sendPing();
        
        // Check if we received a pong recently
        const now = Date.now();
        if (now - this.lastPongTime > 60000) {
          this.log('No pong received for 60 seconds, reconnecting...');
          this.reconnect();
        }
      }
    }, 30000) as unknown as NodeJS.Timeout; // 30 seconds
  }
  
  /**
   * Stop the ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Send a leave message and close the connection
   */
  disconnect(): void {
    if (this.socket && this.isConnected) {
      this.sendMessage('leave', {
        clientId: this.options.clientId,
        websiteId: this.options.websiteId
      });
      
      this.socket.close(1000);
    }
    
    this.stopPingInterval();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
  
  /**
   * Force a reconnection
   */
  reconnect(): void {
    if (this.socket) {
      this.socket.close(1001);
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(error => {
        this.log('Reconnect failed', error);
      });
    }, 100) as unknown as NodeJS.Timeout;
  }

  /**
   * Register a handler for a specific message type
   */
  on(type: 'stats' | 'connect' | 'disconnect' | 'error', handler: MessageHandler): void {
    if (!this.handlers[type]) {
      this.handlers[type] = [];
    }
    
    this.handlers[type].push(handler);
  }

  /**
   * Remove a handler for a specific message type
   */
  off(type: 'stats' | 'connect' | 'disconnect' | 'error', handler: MessageHandler): void {
    if (this.handlers[type]) {
      this.handlers[type] = this.handlers[type].filter(h => h !== handler);
    }
  }

  /**
   * Check if the connection is active
   */
  isActive(): boolean {
    return this.isConnected && this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Send a message to the server
   */
  private sendMessage(type: string, data: any): void {
    if (this.socket && this.isConnected) {
      try {
        this.socket.send(JSON.stringify({
          type,
          ...data
        }));
      } catch (error) {
        this.log('Error sending message', error);
      }
    } else {
      this.log('Cannot send message, not connected');
    }
  }

  /**
   * Notify all handlers of a specific type
   */
  private notifyHandlers(type: string, data: any): void {
    if (this.handlers[type]) {
      this.handlers[type].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          this.log(`Error in ${type} handler`, error);
        }
      });
    }
  }

  /**
   * Attempt to reconnect to the server
   */
  private attemptReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    const maxAttempts = this.options.reconnectMaxAttempts || 5;
    
    if (this.reconnectAttempts >= maxAttempts) {
      this.log(`Maximum reconnect attempts (${maxAttempts}) reached`);
      return;
    }
    
    this.reconnectAttempts++;
    
    // Fixed delay for all reconnect attempts (simple approach)
    const delay = 10000; // 10 seconds
    
    this.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${maxAttempts} in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.log(`Attempting to reconnect (${this.reconnectAttempts}/${maxAttempts})...`);
      this.connect().catch(error => {
        this.log('Reconnect failed', error);
      });
    }, delay) as unknown as NodeJS.Timeout;
  }
  
  /**
   * Build the complete WebSocket URL with query parameters
   */
  private buildWebSocketUrl(): string {
    // Get base URL
    let wsUrl = this.options.serverUrl;
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('clientId', this.options.clientId);
    params.append('websiteId', this.options.websiteId);
    
    // Return complete URL
    return `${wsUrl}?${params.toString()}`;
  }
  
  /**
   * Log messages if debug is enabled
   */
  private log(message: string, ...args: any[]): void {
    if (this.options.debug) {
      console.log(`ProovdPulse Socket: ${message}`, ...args);
    }
  }
}