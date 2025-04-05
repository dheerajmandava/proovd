/**
 * ProovdPulse Widget - Simple blue pulsing dot
 */

// Global variables
console.log('🟢 ProovdPulse Widget Script Loaded');
let widgetInstance = null;

/**
 * Widget class
 */
class PulseWidget {
  constructor(options = {}) {
    this.options = {
      position: 'bottom-right',
      theme: 'light',
      socketUrl: 'wss://socket.proovd.in',
      updateInterval: 5000,
      debug: false,
      ...options
    };
    
    this.websiteId = options.websiteId;
    this.socketUrl = options.socketUrl || 'wss://socket.proovd.in';
    this.activeUsers = 0;
    this.socket = null;
    this.container = null;
    this.reconnectAttempts = 0;
    this.reconnectTimeout = null;
    this.pageLoadTime = Date.now();
    this.activityInterval = null;
    this.pulseInterval = null;
    this.pingInterval = null; // Added for socket health checks
    
    // Activity metrics
    this.activityMetrics = {
      clickCount: 0,
      scrollPercentage: 0,
      timeOnPage: 0
    };
    
    // Bind event handlers
    this.handleClick = this.handleClick.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    
    console.log('🟢 PulseWidget created with options:', this.options);
  }
  
  /**
   * Initialize the widget
   */
  init() {
    return new Promise((resolve, reject) => {
      console.log('🟢 Initializing PulseWidget');
      this.initUI();
      
      // Start tracking user activity
      this.startActivityTracking();
      
      // Connect to real-time socket
      this.connectSocket()
        .then(() => {
          console.log('✅ Socket connected successfully');
          resolve();
        })
        .catch(error => {
          console.error('❌ Socket connection failed:', error);
          // Fallback to random data if connection fails
          this.activeUsers = Math.floor(Math.random() * 5) + 1;
          this.updateUI();
          
          // Simulate updates with random data as fallback
          setInterval(() => {
            this.activeUsers = Math.floor(Math.random() * 5) + 1;
            this.updateUI();
          }, this.options.updateInterval);
          
          reject(error);
        });
    });
  }
  
  /**
   * Start tracking user activity
   */
  startActivityTracking() {
    console.log('🟢 Starting activity tracking');
    
    // Track clicks
    document.addEventListener('click', this.handleClick);
    
    // Track scroll position
    document.addEventListener('scroll', this.handleScroll);
    
    // Initial scroll check
    this.handleScroll();
    
    // Send activity data periodically
    this.activityInterval = setInterval(() => {
      // Update time on page
      this.activityMetrics.timeOnPage = Math.round((Date.now() - this.pageLoadTime) / 1000);
      
      // Only send other metrics periodically (not clicks - clicks are sent immediately)
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        const message = {
          type: 'activity',
          websiteId: this.websiteId,
          clientId: this.getClientId(),
          metrics: {
            clickCount: 0, // Don't send clicks in the interval - they are sent immediately
            scrollPercentage: this.activityMetrics.scrollPercentage,
            timeOnPage: this.activityMetrics.timeOnPage
          }
        };
        
        if (this.options.debug) {
          console.log('🟢 Sending activity metrics:', message);
        }
        this.sendMessage(message);
      }
    }, 10000); // Send activity metrics every 10 seconds
  }
  
  /**
   * Handle scroll event
   */
  handleScroll = () => {
    // Calculate scroll percentage
    const scrollPosition = window.scrollY;
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    );
    const windowHeight = window.innerHeight;
    
    // Calculate percentage (prevent division by zero)
    if (documentHeight > windowHeight) {
      const scrollableHeight = documentHeight - windowHeight;
      const scrollPercentage = Math.min(100, Math.round((scrollPosition / scrollableHeight) * 100));
      this.activityMetrics.scrollPercentage = scrollPercentage;
    } else {
      this.activityMetrics.scrollPercentage = 0;
    }
  };
  
  /**
   * Connect to WebSocket server
   */
  connectSocket() {
    return new Promise((resolve, reject) => {
      try {
        // First, clean up any existing connection properly
        if (this.socket) {
          try {
            console.log('🟡 Cleaning up existing socket connection before creating a new one');
            this.socket.onclose = null; // Prevent triggering reconnect on intentional close
            this.socket.close(1000, 'Intentional close before reconnect');
            this.socket = null;
          } catch (e) {
            console.error('❌ Error closing existing socket:', e);
          }
        }
        
        // Create the connection URL with both websiteId and clientId
        const clientId = this.getClientId();
        const url = `${this.socketUrl}?websiteId=${this.websiteId}&clientId=${clientId}`;
        console.log('🟢 Connecting to socket:', url);
        
        this.socket = new WebSocket(url);
        
        // Set connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
            console.error('❌ Socket connection timeout');
            this.socket.close(1000, 'Connection timeout');
            reject(new Error('Connection timeout'));
          }
        }, 10000); // 10 second timeout
        
        this.socket.onopen = () => {
          console.log('✅ Socket connection opened');
          this.reconnectAttempts = 0;
          clearTimeout(connectionTimeout);
          
          // Join the website's room
          this.sendMessage({
            type: 'join',
            websiteId: this.websiteId,
            clientId: clientId
          });
          
          // Request initial stats
          this.sendMessage({
            type: 'stats',
            websiteId: this.websiteId
          });
          
          // Send initial activity - SEND ONLY INITIAL METRICS WITHOUT CLICKS
          const initialMetrics = { ...this.activityMetrics };
          initialMetrics.clickCount = 0; // Reset clicks to prevent auto-counting
          
          this.sendMessage({
            type: 'activity',
            websiteId: this.websiteId,
            clientId: clientId,
            metrics: initialMetrics
          });
          
          // Set up regular heartbeat to keep connection alive
          if (this.pingInterval) {
            clearInterval(this.pingInterval);
          }
          
          this.pingInterval = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
              this.sendMessage({
                type: 'ping',
                websiteId: this.websiteId,
                clientId: clientId,
                timestamp: Date.now()
              });
            }
          }, 30000); // 30 second ping
          
          resolve();
        };
        
        this.socket.onmessage = (event) => {
          try {
            // For debugging only
            if (this.options.debug) {
              console.log('🟢 Received message:', event.data);
            }
            
            const data = JSON.parse(event.data);
            
            if (data.type === 'stats') {
              if (data.activeUsers !== undefined) {
                this.activeUsers = data.activeUsers;
                this.updateUI();
              } else if (data.stats && data.stats.activeUsers !== undefined) {
                this.activeUsers = data.stats.activeUsers;
                this.updateUI();
              }
            } else if (data.type === 'pong') {
              // For debugging only
              if (this.options.debug) {
                console.log('🟢 Pong received');
              }
            }
          } catch (error) {
            console.error('❌ Error parsing message:', error);
          }
        };
        
        this.socket.onclose = (event) => {
          console.log('🔴 Socket connection closed:', event.code, event.reason);
          clearTimeout(connectionTimeout);
          
          // Clear ping interval
          if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
          }
          
          // Only attempt reconnect for abnormal closures
          if (event.code !== 1000 && event.code !== 1001) {
            this.attemptReconnect();
          }
        };
        
        this.socket.onerror = (error) => {
          console.error('❌ Socket error:', error);
          clearTimeout(connectionTimeout);
          reject(error);
        };
        
      } catch (error) {
        console.error('❌ Error connecting to socket:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Get or generate a unique client ID
   */
  getClientId() {
    const storageKey = 'proovd_pulse_client_id';
    let clientId = localStorage.getItem(storageKey);
    
    if (!clientId) {
      clientId = this.generateUUID();
      try {
        localStorage.setItem(storageKey, clientId);
      } catch (e) {
        console.error('❌ Failed to store client ID:', e);
      }
    }
    
    return clientId;
  }
  
  /**
   * Generate a UUID v4
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
   * Send message to socket
   */
  sendMessage(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }
  
  /**
   * Attempt reconnection
   */
  attemptReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    if (this.reconnectAttempts >= 5) {
      console.log('🔴 Maximum reconnect attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = 3000 * this.reconnectAttempts;
    
    console.log(`🟡 Attempting reconnect in ${delay}ms (${this.reconnectAttempts}/5)`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connectSocket().catch(error => {
        console.error('❌ Reconnection failed:', error);
      });
    }, delay);
  }
  
  /**
   * Initialize UI
   */
  initUI() {
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'proovd-pulse-widget';
    this.container.id = 'proovd-pulse-widget';
    
    // Apply theme
    if (this.options.theme === 'dark') {
      this.container.classList.add('proovd-pulse-dark');
    } else if (this.options.theme === 'auto') {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.container.classList.add('proovd-pulse-dark');
      }
      
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (e.matches) {
          this.container.classList.add('proovd-pulse-dark');
        } else {
          this.container.classList.remove('proovd-pulse-dark');
        }
      });
    }
    
    // Apply position
    this.container.classList.add(`proovd-pulse-${this.options.position}`);
    
    // Apply z-index
    if (this.options.zIndex) {
      this.container.style.zIndex = String(this.options.zIndex);
    }
    
    this.updateUI();
    document.body.appendChild(this.container);
    this.addStyles();
    
    // Start pulsing animation
    this.startPulseAnimation();
    
    console.log('✅ PulseWidget UI initialized');
  }
  
  /**
   * Start pulsing animation
   */
  startPulseAnimation() {
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
    }
    
    this.pulseInterval = setInterval(() => {
      const dot = document.querySelector('.proovd-pulse-dot');
      if (dot) {
        dot.classList.add('pulse');
        setTimeout(() => {
          if (dot && dot.classList) {
            dot.classList.remove('pulse');
          }
        }, 1000);
      }
    }, 2000); // Pulse every 2 seconds
  }
  
  /**
   * Update UI with current data
   */
  updateUI() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="proovd-pulse-content">
        <div class="proovd-pulse-dot"></div>
        <div class="proovd-pulse-count">${this.activeUsers}</div>
        <div class="proovd-pulse-label">active now</div>
      </div>
    `;
    
    // Add click handler
    const content = this.container.querySelector('.proovd-pulse-content');
    if (content) {
      content.addEventListener('click', () => {
        if (this.container) {
          this.container.classList.toggle('proovd-pulse-expanded');
        }
      });
    }
  }
  
  /**
   * Add styles to document
   */
  addStyles() {
    // Don't add styles if they already exist
    if (document.getElementById('proovd-pulse-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'proovd-pulse-styles';
    
    // Insert custom pulse color
    const pulseColor = this.options.pulseColor || '#2563eb';
    
    style.textContent = `
      .proovd-pulse-widget {
        position: fixed;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        color: #333;
        background-color: #fff;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 10px 16px;
        display: flex;
        align-items: center;
        cursor: pointer;
        transition: all 0.3s ease;
        box-sizing: border-box;
        margin: 20px;
        min-width: 120px;
        user-select: none;
      }
      
      .proovd-pulse-dark {
        color: #eee;
        background-color: #333;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      
      .proovd-pulse-top-left {
        top: 0;
        left: 0;
      }
      
      .proovd-pulse-top-right {
        top: 0;
        right: 0;
      }

      .proovd-pulse-bottom-left {
        bottom: 0;
        left: 0;
      }
      
      .proovd-pulse-bottom-right {
        bottom: 0;
        right: 0;
      }
      
      .proovd-pulse-content {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .proovd-pulse-dot {
        width: 12px;
        height: 12px;
        background-color: ${pulseColor};
        border-radius: 50%;
        position: relative;
      }
      
      @keyframes pulse {
        0% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7);
        }
        
        70% {
          transform: scale(1.1);
          box-shadow: 0 0 0 10px rgba(37, 99, 235, 0);
        }
        
        100% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
        }
      }
      
      .proovd-pulse-dot.pulse {
        animation: pulse 1s cubic-bezier(0.66, 0, 0, 1);
      }
      
      .proovd-pulse-count {
        font-weight: bold;
        font-size: 16px;
      }
      
      .proovd-pulse-label {
        opacity: 0.8;
        font-size: 13px;
      }
      
      .proovd-pulse-widget:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }
      
      .proovd-pulse-dark:hover {
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
      }
      
      .proovd-pulse-expanded {
        min-width: 240px;
        padding: 16px;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Destroy the widget
   */
  destroy() {
    console.log('🟢 Destroying PulseWidget');
    
    // Send leave message if connected
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.sendMessage({
        type: 'leave', 
        websiteId: this.websiteId,
        clientId: this.getClientId()
      });
    }
    
    // Remove event listeners
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('scroll', this.handleScroll);
    
    // Clear intervals
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }
    
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
      this.activityInterval = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Close socket
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    // Remove DOM elements
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
    
    // Remove styles
    const style = document.getElementById('proovd-pulse-styles');
    if (style && style.parentNode) {
      style.parentNode.removeChild(style);
    }
    
    console.log('✅ PulseWidget destroyed');
  }

  /**
   * Handle click event
   */
  handleClick = () => {
    this.activityMetrics.clickCount += 1;
    
    // Immediately send click event if socket is open
    // This ensures clicks are sent as they happen and not batched
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.sendMessage({
        type: 'activity',
        websiteId: this.websiteId,
        clientId: this.getClientId(),
        metrics: {
          clickCount: 1,  // Send only this single click
          scrollPercentage: this.activityMetrics.scrollPercentage,
          timeOnPage: Math.round((Date.now() - this.pageLoadTime) / 1000)
        }
      });
      
      // Reset click count after sending
      this.activityMetrics.clickCount = 0;
    }
  };
}

/**
 * Initialize the widget
 */
function init(websiteId, options = {}) {
  console.log('🟢 ProovdPulse Widget Initializing...', {websiteId, options});
  
  try {
    // Destroy previous instance if exists
    if (widgetInstance) {
      console.log('⚠️ Previous instance found, destroying it');
      widgetInstance.destroy();
      widgetInstance = null;
    }
    
    // Create new instance
    widgetInstance = new PulseWidget({
      ...options,
      websiteId: websiteId
    });
    
    // Initialize it
    widgetInstance.init()
      .then(() => {
        console.log('✅ ProovdPulse Widget initialized successfully');
      })
      .catch(error => {
        console.error('❌ ProovdPulse Widget initialization failed:', error);
      });
    
    return widgetInstance;
  } catch (error) {
    console.error('❌ Failed to initialize ProovdPulse Widget:', error);
    return null;
  }
}

/**
 * Get the instance
 */
function getInstance() {
  return widgetInstance;
}

// Expose API
window.ProovdPulse = {
  init: init,
  getInstance: getInstance,
  version: '1.1.0'
};

// Check for auto-initialization
const scripts = document.querySelectorAll('script[data-website-id]');
if (scripts.length > 0) {
  try {
    const script = scripts[0];
    const websiteId = script.getAttribute('data-website-id');
    const position = script.getAttribute('data-position') || 'bottom-right';
    
    if (websiteId) {
      console.log('🟢 Auto-initializing ProovdPulse Widget with website ID:', websiteId);
      
      // Extract all data attributes as options
      const options = {};
      for (const attr of Array.from(script.attributes)) {
        if (attr.name.startsWith('data-') && attr.name !== 'data-website-id') {
          // Convert data-attribute-name to attributeName
          const key = attr.name.substring(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
          options[key] = attr.value;
        }
      }
      
      console.log('🟢 Auto-initialization options:', options);
      init(websiteId, { position, ...options, debug: true });
    }
  } catch (error) {
    console.error('❌ Error during auto-initialization:', error);
  }
}

// Also check for initialization via script URL
try {
  const currentScript = document.currentScript;
  if (currentScript) {
    const src = currentScript.src;
    console.log('🟢 Current script src:', src);
    
    // Match website ID from URL pattern /api/websites/{id}/pulse-widget.js
    const match = src.match(/\/api\/websites\/([a-zA-Z0-9]+)\/pulse-widget\.js/);
    if (match && match[1]) {
      const websiteId = match[1];
      console.log('🟢 Detected websiteId from script URL:', websiteId);
      init(websiteId, { position: 'bottom-right', debug: true });
    }
  }
} catch (error) {
  console.error('❌ Error during URL-based initialization:', error);
}

// Export for module usage
export { init, getInstance, PulseWidget }; 