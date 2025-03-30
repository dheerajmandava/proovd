import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Website from '@/app/lib/models/website';

/**
 * GET /api/websites/[id]/pulse-widget.js
 * Returns the ProovdPulse widget JavaScript file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get custom origin for CORS if needed
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin') || '*';
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Get the website data
    const website = await Website.findById(params.id);
    
    if (!website) {
      return new NextResponse(`console.error('ProovdPulse: Website not found');`, { 
        status: 404,
        headers: {
          'Content-Type': 'application/javascript',
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
    
    // Check if ProovdPulse is enabled for this website
    if (!website.settings?.pulse?.enabled) {
      return new NextResponse(`console.error('ProovdPulse not enabled for this website');`, { 
        status: 403,
        headers: {
          'Content-Type': 'application/javascript',
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
    
    // Return the widget script
    const script = `
/**
 * ProovdPulse Analytics Widget
 * Version: 1.0.0
 * Website: https://proovd.in
 */

// User activity data interface
class ProovdPulse {
  constructor(config) {
    this.config = this.mergeWithDefaults(config);
    this.sessionId = this.generateSessionId();
    this.path = window.location.pathname;
    this.referrer = document.referrer;
    this.startTime = Date.now();
    this.lastScrollDepth = 0;
    this.totalClicks = 0;
    this.browserInfo = {};
    this.locationInfo = {};
    this.activityInterval = null;
    this.isWidgetVisible = false;
    this.widgetElement = null;
    this.activeUsersCount = 0;
    this.initialized = false;
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.messageQueue = [];
    this.pingInterval = null;
    this.debug = config.debug || false;
    
    // Log init
    this.log('Initializing ProovdPulse with config:', config);
    
    // Detect browser info
    this.detectBrowser();
  }
  
  /**
   * Merge provided configuration with defaults
   */
  mergeWithDefaults(config) {
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
      debug: config.debug || false
    };
  }

  /**
   * Initialize the tracking and widget
   */
  async init() {
    if (this.initialized) return;
    
    try {
      this.log('Initializing widget...');
      
      // Connect to WebSocket server
      await this.connect();
      
      // Setup tracking event listeners
      this.setupEventListeners();
      
      // Start periodic reporting
      this.startActivityReporting();
      
      // Create widget if needed
      if (!this.isInIframe()) {
        this.createWidget();
      }
      
      this.initialized = true;
      this.log('ProovdPulse initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ProovdPulse:', error);
      // Try creating the widget anyway, even if connection failed
      if (!this.isInIframe()) {
        this.createWidget();
      }
    }
  }
  
  /**
   * Connect to the WebSocket server
   */
  connect() {
    if (this.socket && this.isConnected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const url = this.getSocketUrl();
        this.log('Connecting to WebSocket server:', url);
        
        this.socket = new WebSocket(url);
        
        // Connection opened
        this.socket.addEventListener('open', () => {
          this.log('Connected to WebSocket server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Send join message
          this.sendMessage({
            type: 'join',
            clientId: this.sessionId,
            websiteId: this.config.websiteId
          });
          
          // Set up ping interval to keep connection alive
          this.setupPingInterval();
          
          // Process any queued messages
          this.processQueue();
          
          // Update widget if it exists
          if (this.widgetElement) {
            this.updateWidgetConnectionStatus(true);
          }
          
          resolve();
        });
        
        // Connection error
        this.socket.addEventListener('error', (event) => {
          this.log('WebSocket connection error:', event);
          this.isConnected = false;
          
          // Update widget if it exists
          if (this.widgetElement) {
            this.updateWidgetConnectionStatus(false);
          }
          
          if (this.reconnectAttempts === 0) {
            reject(new Error('WebSocket connection error'));
          }
        });
        
        // Connection closed
        this.socket.addEventListener('close', () => {
          this.log('WebSocket connection closed');
          this.isConnected = false;
          this.clearPingInterval();
          
          // Update widget if it exists
          if (this.widgetElement) {
            this.updateWidgetConnectionStatus(false);
          }
          
          // Attempt to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              this.log(\`Attempting to reconnect (\${this.reconnectAttempts}/\${this.maxReconnectAttempts})...\`);
              this.connect().catch(() => {
                this.log('Reconnection attempt failed');
              });
            }, this.reconnectInterval * this.reconnectAttempts);
          }
        });
        
        // Listen for messages
        this.socket.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            this.log('Received message:', data);
            
            // Handle active users update
            if (data.type === 'stats' && data.activeUsers !== undefined && data.websiteId === this.config.websiteId) {
              this.activeUsersCount = data.activeUsers || 0;
              this.updateWidgetCount(this.activeUsersCount);
              this.log('Updated active users count:', this.activeUsersCount);
            }
            
            // Handle server pong
            if (data.type === 'pong') {
              this.log('Received pong from server');
            }
          } catch (error) {
            this.log('Error parsing message:', error);
          }
        });
      } catch (error) {
        this.log('Error connecting to WebSocket server:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Send a message to the server
   */
  sendMessage(message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.log('Socket not connected, queueing message:', message);
      this.messageQueue.push(message);
      return;
    }
    
    try {
      const messageString = JSON.stringify(message);
      this.socket.send(messageString);
      this.log('Sent message:', message);
    } catch (error) {
      this.log('Error sending message:', error);
    }
  }
  
  /**
   * Process queued messages
   */
  processQueue() {
    if (this.messageQueue.length === 0) return;
    
    this.log(\`Processing \${this.messageQueue.length} queued messages\`);
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.sendMessage(message);
    }
  }
  
  /**
   * Set up ping interval to keep connection alive
   */
  setupPingInterval() {
    this.clearPingInterval();
    
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({
          type: 'ping',
          clientId: this.sessionId,
          timestamp: Date.now()
        });
      }
    }, 30000); // 30 seconds
  }
  
  /**
   * Clear ping interval
   */
  clearPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    this.clearPingInterval();
    
    if (this.socket) {
      if (this.isConnected) {
        this.sendMessage({
          type: 'leave',
          clientId: this.sessionId,
          websiteId: this.config.websiteId
        });
      }
      
      this.socket.close();
      this.socket = null;
    }
    
    this.isConnected = false;
  }
  
  /**
   * Get complete WebSocket URL with authentication token
   */
  getSocketUrl() {
    const baseUrl = this.config.socketUrl || 'wss://socket.proovd.in';
    const websiteId = this.config.websiteId;
    const clientId = this.sessionId;
    const token = this.config.token || '';
    
    // Add client and website ID to URL
    let url = \`\${baseUrl}?websiteId=\${encodeURIComponent(websiteId)}&clientId=\${encodeURIComponent(clientId)}\`;
    
    // Add token if provided
    if (token) {
      url += \`&token=\${encodeURIComponent(token)}\`;
    }
    
    return url;
  }
  
  /**
   * Setup event listeners for tracking
   */
  setupEventListeners() {
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
    });
  }

  /**
   * Start periodic activity reporting
   */
  startActivityReporting() {
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
  reportActivity(isActive = !document.hidden) {
    if (!this.socket || !this.isConnected) {
      this.connect().catch(err => {
        console.error('Failed to reconnect to socket server:', err);
      });
      return;
    }

    const activity = {
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

    this.sendMessage({
      type: 'activity',
      websiteId: this.config.websiteId,
      data: activity
    });
  }
  
  /**
   * Track scroll depth percentage
   */
  trackScrollDepth() {
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
  throttle(callback, delay) {
    let lastCall = 0;
    return function(...args) {
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
  detectBrowser() {
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
  getLocationInfo() {
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
  generateSessionId() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Create and display the widget
   */
  createWidget() {
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
    widget.style.backgroundColor = this.config.widgetColors.background;
    widget.style.color = this.config.widgetColors.text;
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
    pulse.style.backgroundColor = this.config.widgetColors.pulse;
    pulse.style.marginRight = '8px';
    pulse.style.position = 'relative';

    // Pulse animation
    const pulseAnimation = document.createElement('style');
    pulseAnimation.textContent = \`
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
    \`;
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
    labelElement.textContent = this.config.customText.activeUserLabel;

    // Powered by label
    const poweredBy = document.createElement('div');
    poweredBy.className = 'proovd-pulse-powered';
    poweredBy.style.fontSize = '10px';
    poweredBy.style.marginLeft = '8px';
    poweredBy.style.opacity = '0.7';
    poweredBy.textContent = this.config.customText.pulseLabel;

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
  updateWidgetCount(count) {
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
  isInIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  /**
   * Clean up event listeners and intervals
   */
  cleanup() {
    // Clear reporting interval
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
    }

    // Send final update
    this.reportActivity(false);

    // Close WebSocket connection
    this.disconnect();

    // Remove widget
    if (this.widgetElement && this.widgetElement.parentNode) {
      this.widgetElement.parentNode.removeChild(this.widgetElement);
      this.widgetElement = null;
      this.isWidgetVisible = false;
    }

    // Mark as not initialized
    this.initialized = false;
  }

  /**
   * Log messages if debug is enabled
   */
  log(message, ...args) {
    if (this.config.debug) {
      console.log(\`ProovdPulse: \${message}\`, ...args);
    }
  }
}

// Expose ProovdPulse to global scope
window.ProovdPulse = ProovdPulse;
`;

    return new NextResponse(script, { 
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
      },
    });
  } catch (error) {
    console.error('Error serving ProovdPulse widget script:', error);
    
    return new NextResponse(`console.error('ProovdPulse: Server error loading widget');`, { 
      status: 500,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
} 