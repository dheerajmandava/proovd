/**
 * Socket Manager
 * 
 * A singleton implementation of a shared WebSocket connection manager that:
 * - Creates one connection per browser (shared across tabs)
 * - Handles reconnections efficiently with exponential backoff
 * - Maintains client session identity for proper tracking
 */

class SocketManager {
  constructor() {
    this.socket = null;
    this.clientId = this.getClientId();
    this.websiteId = null;
    this.listeners = [];
    this.isConnecting = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.heartbeatInterval = null;
    this.socketUrl = 'wss://socket.proovd.in';
    this.debug = false;
    this.clickHandlerAdded = false;
    this.scrollPercentage = 0;
    
    // Bind methods
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
  }

  /**
   * Get a stable client ID from localStorage
   */
  getClientId() {
    const storageKey = 'proovd_pulse_client_id';
    let clientId = localStorage.getItem(storageKey);
    
    if (!clientId) {
      clientId = this.generateUUID();
      try {
        localStorage.setItem(storageKey, clientId);
      } catch (e) {
        console.error('Failed to store client ID:', e);
      }
    }
    
    return clientId;
  }
  
  /**
   * Generate UUID for client IDs
   */
  generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Enable or disable debug mode
   */
  setDebug(enabled) {
    this.debug = enabled;
  }

  /**
   * Log messages when in debug mode
   */
  log(...args) {
    if (this.debug) {
      console.log(...args);
    }
  }

  /**
   * Connect to socket server
   */
  connect(websiteId, socketUrl) {
    if (socketUrl) {
      this.socketUrl = socketUrl;
    }
    
    if (this.isConnecting) {
      this.log('Already connecting to socket server');
      return Promise.resolve(this.socket);
    }
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.log('Socket already connected');
      return Promise.resolve(this.socket);
    }
    
    this.websiteId = websiteId;
    this.isConnecting = true;
    
    // Add global click handler if not already added
    if (!this.clickHandlerAdded) {
      document.addEventListener('click', this.handleDocumentClick);
      this.clickHandlerAdded = true;
      this.log('🟢 Global click tracking enabled');
    }
    
    return new Promise((resolve, reject) => {
      // Close existing socket if any
      this.disconnect();
      
      // Create new connection with both websiteId and clientId
      const url = `${this.socketUrl}?websiteId=${websiteId}&clientId=${this.clientId}`;
      this.log('🟢 Connecting to socket server:', url);
      
      this.socket = new WebSocket(url);
      
      // Set connection timeout
      const timeout = setTimeout(() => {
        if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
          this.socket.close();
          this.isConnecting = false;
          reject(new Error('Connection timeout'));
        }
      }, 10000);
      
      this.socket.onopen = () => {
        clearTimeout(timeout);
        this.isConnecting = false;
        this.retryCount = 0;
        this.log('✅ Socket connection established');
        
        // Start heartbeat
        this.startHeartbeat();
        
        // Send join message
        this.send({
          type: 'join',
          websiteId: this.websiteId,
          clientId: this.clientId
        });
        
        resolve(this.socket);
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.log('📩 Received message:', data);
          
          // Notify all listeners about the message
          this.listeners.forEach(listener => {
            if (typeof listener.onMessage === 'function') {
              listener.onMessage(data);
            }
          });
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      };
      
      this.socket.onclose = (event) => {
        clearTimeout(timeout);
        this.isConnecting = false;
        this.stopHeartbeat();
        
        this.log(`🔴 Socket connection closed: ${event.code} ${event.reason}`);
        
        // Only reconnect for abnormal closures
        if (event.code !== 1000 && event.code !== 1001) {
          this.reconnect();
        }
        
        // Notify listeners of disconnection
        this.listeners.forEach(listener => {
          if (typeof listener.onDisconnect === 'function') {
            listener.onDisconnect(event);
          }
        });
      };
      
      this.socket.onerror = (error) => {
        clearTimeout(timeout);
        this.isConnecting = false;
        console.error('❌ Socket error:', error);
        reject(error);
      };
    });
  }
  
  /**
   * Check if socket is currently connected
   */
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
  
  /**
   * Send data to the socket server
   */
  send(data) {
    if (!this.isConnected()) {
      this.log('⚠️ Socket not connected, cannot send message');
      return false;
    }
    
    try {
      this.socket.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return false;
    }
  }
  
  /**
   * Disconnect from the socket server
   */
  disconnect() {
    if (this.socket) {
      try {
        this.stopHeartbeat();
        
        // Send leave message if connected
        if (this.socket.readyState === WebSocket.OPEN) {
          this.send({
            type: 'leave',
            websiteId: this.websiteId,
            clientId: this.clientId
          });
        }
        
        // Remove click handler when disconnecting
        if (this.clickHandlerAdded) {
          document.removeEventListener('click', this.handleDocumentClick);
          this.clickHandlerAdded = false;
        }
        
        this.socket.close(1000, 'Intentional disconnect');
        this.socket = null;
      } catch (error) {
        console.error('❌ Error disconnecting socket:', error);
      }
    }
  }
  
  /**
   * Reconnect with exponential backoff
   */
  reconnect() {
    if (this.retryCount >= this.maxRetries) {
      this.log('⚠️ Maximum reconnection attempts reached');
      return;
    }
    
    this.retryCount++;
    
    // Exponential backoff with jitter
    const delay = Math.min(30000, 1000 * Math.pow(2, this.retryCount)) + 
                 (Math.random() * 1000);
    
    this.log(`🟡 Reconnecting in ${Math.round(delay/1000)}s (attempt ${this.retryCount}/${this.maxRetries})`);
    
    setTimeout(() => {
      if (this.websiteId) {
        this.connect(this.websiteId).catch(() => {});
      }
    }, delay);
  }
  
  /**
   * Add a component as a listener for socket events
   */
  addListener(listener) {
    if (!this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }
  
  /**
   * Remove a listener
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
    
    // If no more listeners, disconnect to save resources
    if (this.listeners.length === 0) {
      this.disconnect();
    }
  }
  
  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing heartbeat
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({
          type: 'ping',
          websiteId: this.websiteId,
          clientId: this.clientId,
          timestamp: Date.now()
        });
      }
    }, 30000); // Send ping every 30 seconds
  }
  
  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  /**
   * Track a click event
   */
  trackClick(scrollPercentage) {
    // Send click immediately
    return this.send({
      type: 'activity',
      websiteId: this.websiteId,
      clientId: this.clientId,
      metrics: {
        clickCount: 1,
        scrollPercentage: scrollPercentage || 0,
        timeOnPage: Math.round((Date.now() - (window.performance.timeOrigin || Date.now())) / 1000)
      }
    });
  }
  
  /**
   * Send regular activity update (without clicks)
   */
  sendActivity(scrollPercentage, timeOnPage) {
    return this.send({
      type: 'activity',
      websiteId: this.websiteId,
      clientId: this.clientId,
      metrics: {
        clickCount: 0, // No clicks here, only tracking
        scrollPercentage: scrollPercentage || 0,
        timeOnPage: timeOnPage || Math.round((Date.now() - (window.performance.timeOrigin || Date.now())) / 1000)
      }
    });
  }

  /**
   * Handle document click event
   */
  handleDocumentClick() {
    this.log('🟢 Click detected, sending to server');
    this.trackClick(this.scrollPercentage);
  }
  
  /**
   * Update current scroll percentage for tracking
   */
  updateScrollPercentage(percentage) {
    this.scrollPercentage = percentage;
  }
}

// Create and export singleton instance
const socketManager = new SocketManager();
export default socketManager; 