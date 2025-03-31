/**
 * ProovdPulse WebSocket Client
 * Handles communication with the ProovdPulse WebSocket server
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
  reconnectDelay?: number;
  debug?: boolean;
  updateInterval?: number;
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
    // Force debugging on
    const debugEnabled = true;
    
    // Determine if we should use secure protocol based on server URL or explicit option
    const useSecure = options.secure !== undefined 
      ? options.secure 
      : (typeof window !== 'undefined' && window.location.protocol === 'https:' || serverUrl.startsWith('wss://'));
    
    this.options = {
      clientId,
      websiteId,
      serverUrl,
      secure: useSecure,
      reconnectMaxAttempts: options.reconnectMaxAttempts || 10,
      reconnectDelay: options.reconnectDelay || 20000, // Fixed 20 second delay
      debug: debugEnabled,
      updateInterval: options.updateInterval || 10000 // 10 seconds by default (faster updates)
    };
    
    console.log('🟢 PulseSocketClient initialized with options:', this.options);
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🟢 Starting WebSocket connection attempt...');
        
        if (this.socket && this.isConnected) {
          console.log('✅ Already connected to WebSocket server, reusing connection');
          return resolve();
        }
        
        // Reset reconnection attempts if this is a manual connection
        if (this.reconnectAttempts === 0) {
          this.reconnectAttempts = 0;
        }
        
        // Build the WebSocket URL with parameters
        const wsUrl = this.buildWebSocketUrl();
        
        console.log(`🟢 Connecting to WebSocket server: ${wsUrl}`);
        
        try {
          this.socket = new WebSocket(wsUrl);
          console.log('🟢 WebSocket instance created successfully');
        } catch (err) {
          console.error('❌ Failed to create WebSocket instance:', err);
          reject(err);
          return;
        }

        this.socket.onopen = () => {
          console.log('✅ Connected to WebSocket server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Send join message
          try {
            this.sendMessage('join', {
              clientId: this.options.clientId,
              websiteId: this.options.websiteId
            });
            console.log('✅ Sent join message to server');
          } catch (err) {
            console.error('❌ Failed to send join message:', err);
          }
          
          // Start ping interval for keep-alive
          this.startPingInterval();
          
          // Notify handlers
          this.notifyHandlers('connect', { connected: true });
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            console.log('🟢 Received message from server:', event.data);
            const data = JSON.parse(event.data);
            if (data.type === 'stats') {
              console.log('🟢 Received stats update:', data);
              this.notifyHandlers('stats', data);
            } else if (data.type === 'pong') {
              this.lastPongTime = Date.now();
              console.log('🟢 Received pong from server');
            }
          } catch (error) {
            console.error('❌ Error parsing message:', error);
          }
        };

        this.socket.onclose = (event) => {
          console.log(`🔴 Connection closed: ${event.code} ${event.reason}`);
          this.isConnected = false;
          this.stopPingInterval();
          this.notifyHandlers('disconnect', { connected: false, code: event.code, reason: event.reason });
          
          // Try to reconnect if not closed deliberately
          if (event.code !== 1000) {
            console.log('🟡 Connection closed unexpectedly, attempting to reconnect...');
            this.attemptReconnect();
          }
        };

        this.socket.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.notifyHandlers('error', { error });
          reject(error);
        };
        
        // Safety timeout in case onopen never fires
        setTimeout(() => {
          if (this.socket && this.socket.readyState !== WebSocket.OPEN && !this.isConnected) {
            console.error('❌ Connection timeout - WebSocket did not connect within 10 seconds');
            if (this.socket.readyState === WebSocket.CONNECTING) {
              console.log('🟡 Socket still in CONNECTING state, closing it...');
              this.socket.close();
              this.socket = null;
            }
            reject(new Error('Connection timeout'));
          }
        }, 10000);
        
      } catch (error) {
        console.error('❌ Failed to connect:', error);
        this.notifyHandlers('error', { error });
        reject(error);
      }
    });
  }

  /**
   * Send activity metrics to the server
   */
  sendActivity(metrics: PulseMetrics): void {
    console.log('🟢 Sending activity metrics:', metrics);
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
    console.log('🟢 Sending ping to server');
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
    console.log('🟢 Starting ping interval (30s)');
    this.pingInterval = setInterval(() => {
      if (this.isActive()) {
        this.sendPing();
        
        // Check if we received a pong recently
        const now = Date.now();
        const timeSinceLastPong = now - this.lastPongTime;
        console.log(`🟢 Time since last pong: ${Math.round(timeSinceLastPong/1000)}s`);
        
        if (timeSinceLastPong > 60000) {
          console.error('❌ No pong received for 60 seconds, reconnecting...');
          this.reconnect();
        }
      } else {
        console.log('🟡 Socket not active, skipping ping');
      }
    }, this.options.updateInterval) as unknown as NodeJS.Timeout; // Use the shorter update interval
  }
  
  /**
   * Stop the ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval !== null) {
      console.log('🟢 Stopping ping interval');
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Send a leave message and close the connection
   */
  disconnect(): void {
    console.log('🟢 Disconnecting from server...');
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
    console.log('🟢 Forcing reconnection...');
    if (this.socket) {
      this.socket.close(1001);
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(() => {
      console.log('🟢 Executing reconnection...');
      this.connect().catch(error => {
        console.error('❌ Reconnect failed:', error);
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
    console.log(`🟢 Added handler for event type: ${type}, total handlers: ${this.handlers[type].length}`);
  }

  /**
   * Unregister a handler for a specific message type
   */
  off(type: 'stats' | 'connect' | 'disconnect' | 'error', handler: MessageHandler): void {
    if (this.handlers[type]) {
      this.handlers[type] = this.handlers[type].filter(h => h !== handler);
      console.log(`🟢 Removed handler for event type: ${type}, remaining handlers: ${this.handlers[type].length}`);
    }
  }

  /**
   * Check if the socket is currently active and able to send messages
   */
  isActive(): boolean {
    const isActive = this.isConnected && this.socket?.readyState === WebSocket.OPEN;
    // console.log(`🟢 Socket active: ${isActive}, connected: ${this.isConnected}, readyState: ${this.socket?.readyState}`);
    return isActive;
  }

  /**
   * Send a message to the server
   */
  private sendMessage(type: string, data: any): void {
    if (this.socket && this.isConnected) {
      try {
        const message = JSON.stringify({ type, ...data });
        this.socket.send(message);
        console.log(`🟢 Sent message to server: ${type}`);
      } catch (error) {
        console.error(`❌ Error sending message: ${type}`, error);
      }
    } else {
      console.log(`🟡 Cannot send message "${type}", not connected (connected: ${this.isConnected}, socket: ${this.socket ? 'exists' : 'null'})`);
    }
  }

  /**
   * Notify all registered handlers for a specific message type
   */
  private notifyHandlers(type: string, data: any): void {
    if (this.handlers[type]) {
      console.log(`🟢 Notifying ${this.handlers[type].length} handlers for event type: ${type}`);
      this.handlers[type].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`❌ Error in ${type} handler`, error);
        }
      });
    }
  }

  /**
   * Attempt to reconnect to the server with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    const maxAttempts = this.options.reconnectMaxAttempts || 5;
    
    if (this.reconnectAttempts >= maxAttempts) {
      console.log(`🟡 Maximum reconnect attempts (${maxAttempts}) reached, giving up`);
      return;
    }
    
    this.reconnectAttempts++;
    
    // Use fixed delay from options
    const delay = this.options.reconnectDelay || 20000;
    
    console.log(`🟡 Scheduling reconnect attempt ${this.reconnectAttempts}/${maxAttempts} in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      console.log(`🟢 Attempting to reconnect (${this.reconnectAttempts}/${maxAttempts})...`);
      this.connect().catch(error => {
        console.error('❌ Reconnect failed:', error);
      });
    }, delay) as unknown as NodeJS.Timeout;
  }

  /**
   * Build the WebSocket URL with query parameters
   */
  private buildWebSocketUrl(): string {
    let url = this.options.serverUrl;
    const params = new URLSearchParams();
    
    params.append('clientId', this.options.clientId);
    params.append('websiteId', this.options.websiteId);
    
    return `${url}?${params.toString()}`;
  }

  /**
   * Log a message to the console if debugging is enabled
   */
  private log(message: string, ...args: any[]): void {
    if (this.options.debug) {
      console.log(`ProovdPulse Socket: ${message}`, ...args);
    }
  }
}