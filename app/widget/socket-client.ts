import { UserActivity, PulseWidgetConfig } from './proovd-pulse';

/**
 * PulseSocketClient
 * Handles WebSocket communication for the ProovdPulse widget
 */
export class PulseSocketClient {
  private config: PulseWidgetConfig;
  private socket: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 3000; // 3 seconds
  private activeUsersCallback: ((count: number) => void) | null = null;
  private messageQueue: any[] = [];
  private pingInterval: any = null;

  /**
   * Constructor
   * @param config Configuration for the socket client
   */
  constructor(config: PulseWidgetConfig) {
    this.config = config;
  }

  /**
   * Connect to the WebSocket server
   * @returns Promise that resolves when connected
   */
  public connect(): Promise<void> {
    if (this.socket && this.isConnected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const url = this.getSocketUrl();
        
        this.socket = new WebSocket(url);
        
        // Connection opened
        this.socket.addEventListener('open', () => {
          console.log('ProovdPulse: Connected to WebSocket server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Set up ping interval to keep connection alive
          this.setupPingInterval();
          
          // Process any queued messages
          this.processQueue();
          
          resolve();
        });
        
        // Connection error
        this.socket.addEventListener('error', (event) => {
          console.error('ProovdPulse: WebSocket connection error:', event);
          this.isConnected = false;
          
          if (this.reconnectAttempts === 0) {
            reject(new Error('WebSocket connection error'));
          }
        });
        
        // Connection closed
        this.socket.addEventListener('close', () => {
          console.log('ProovdPulse: WebSocket connection closed');
          this.isConnected = false;
          this.clearPingInterval();
          
          // Attempt to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              console.log(`ProovdPulse: Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
              this.connect().catch(() => {
                console.error('ProovdPulse: Reconnection attempt failed');
              });
            }, this.reconnectInterval * this.reconnectAttempts);
          }
        });
        
        // Listen for messages
        this.socket.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Handle active users update
            if (data.type === 'activeUsers' && data.count !== undefined) {
              if (this.activeUsersCallback) {
                this.activeUsersCallback(data.count);
              }
            }
            
            // Handle server pong
            if (data.type === 'pong') {
              console.log('ProovdPulse: Received pong from server');
            }
          } catch (error) {
            console.error('ProovdPulse: Error parsing message:', error);
          }
        });
      } catch (error) {
        console.error('ProovdPulse: Error connecting to WebSocket server:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    this.clearPingInterval();
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.isConnected = false;
  }

  /**
   * Check if currently connected to the server
   * @returns Connection status
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Send user activity data to the server
   * @param activity User activity data
   */
  public sendActivity(activity: UserActivity): void {
    const message = {
      type: 'activity',
      websiteId: this.config.websiteId,
      data: activity
    };
    
    this.sendMessage(message);
  }

  /**
   * Send message to the server
   * @param message Message to send
   */
  private sendMessage(message: any): void {
    if (!this.socket || !this.isConnected) {
      // Queue message for later
      this.messageQueue.push(message);
      this.connect().catch(err => {
        console.error('ProovdPulse: Failed to connect when sending message:', err);
      });
      return;
    }
    
    try {
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('ProovdPulse: Error sending message:', error);
      this.messageQueue.push(message);
    }
  }

  /**
   * Process queued messages
   */
  private processQueue(): void {
    if (this.messageQueue.length === 0 || !this.isConnected) {
      return;
    }
    
    console.log(`ProovdPulse: Processing ${this.messageQueue.length} queued messages`);
    
    // Process all queued messages
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      try {
        if (this.socket) {
          this.socket.send(JSON.stringify(message));
        }
      } catch (error) {
        console.error('ProovdPulse: Error sending queued message:', error);
        // Re-queue if sending failed
        this.messageQueue.push(message);
        break;
      }
    }
  }

  /**
   * Set up ping interval to keep connection alive
   */
  private setupPingInterval(): void {
    this.clearPingInterval();
    
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.socket) {
        try {
          this.socket.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.error('ProovdPulse: Error sending ping:', error);
        }
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Clear the ping interval
   */
  private clearPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Get complete WebSocket URL with authentication token
   * @returns WebSocket URL with token
   */
  private getSocketUrl(): string {
    const baseUrl = this.config.socketUrl || 'wss://socket.proovd.in';
    const websiteId = this.config.websiteId;
    const token = this.config.token || '';
    
    let url = `${baseUrl}?websiteId=${encodeURIComponent(websiteId)}`;
    
    if (token) {
      url += `&token=${encodeURIComponent(token)}`;
    }
    
    return url;
  }

  /**
   * Set callback for active users updates
   * @param callback Function to call when active user count changes
   */
  public onActiveUsersUpdate(callback: (count: number) => void): void {
    this.activeUsersCallback = callback;
  }
} 