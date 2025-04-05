/**
 * ProovdPulse Widget - Simple blue pulsing dot
 */

// Global variables
console.log('🟢 ProovdPulse Widget Script Loaded');
let widgetInstance = null;

/**
 * Widget class
 */
import socketManager from './socket-manager.js';

export class PulseWidget {
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
    this.container = null;
    this.pageLoadTime = Date.now();
    this.activityInterval = null;
    this.pulseInterval = null;
    
    // Activity metrics
    this.activityMetrics = {
      scrollPercentage: 0,
      timeOnPage: 0
    };
    
    // Set socket manager debug mode
    socketManager.setDebug(this.options.debug);
    
    // Bind event handlers
    this.handleScroll = this.handleScroll.bind(this);
    this.onMessage = this.onMessage.bind(this);
    
    // Register with socket manager
    socketManager.addListener(this);
    
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
      
      // Connect to real-time socket via socket manager
      socketManager.connect(this.websiteId, this.socketUrl)
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
   * Socket message handler
   */
  onMessage(data) {
    try {
      if (data.type === 'stats') {
        if (data.activeUsers !== undefined) {
          this.activeUsers = data.activeUsers;
          this.updateUI();
        } else if (data.stats && data.stats.activeUsers !== undefined) {
          this.activeUsers = data.stats.activeUsers;
          this.updateUI();
        }
      }
    } catch (error) {
      console.error('❌ Error handling message:', error);
    }
  }
  
  /**
   * Handle socket disconnection
   */
  onDisconnect(event) {
    console.log('🔴 Socket disconnected:', event.code, event.reason);
  }
  
  /**
   * Start tracking user activity
   */
  startActivityTracking() {
    console.log('🟢 Starting activity tracking');
    
    // Track scroll position
    document.addEventListener('scroll', this.handleScroll);
    
    // Initial scroll check
    this.handleScroll();
    
    // Send activity data periodically (without clicks)
    this.activityInterval = setInterval(() => {
      // Update time on page
      this.activityMetrics.timeOnPage = Math.round((Date.now() - this.pageLoadTime) / 1000);
      
      // Only send other metrics periodically (not clicks)
      socketManager.sendActivity(
        this.activityMetrics.scrollPercentage,
        this.activityMetrics.timeOnPage
      );
    }, 10000); // Send activity metrics every 10 seconds
  }
  
  /**
   * Handle scroll event
   */
  handleScroll() {
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
      
      // Update the socket manager with the current scroll percentage
      socketManager.updateScrollPercentage(scrollPercentage);
    } else {
      this.activityMetrics.scrollPercentage = 0;
      socketManager.updateScrollPercentage(0);
    }
  }

  /**
   * Update UI
   */
  updateUI() {
    if (!this.container) return;
    
    // Match the exact UI from pulse-ui.ts
    this.container.innerHTML = `
      <div class="proovd-pulse-content">
        <div class="proovd-pulse-dot"></div>
        <div class="proovd-pulse-count">${this.activeUsers}</div>
        <div class="proovd-pulse-label">active now</div>
      </div>
    `;

    // Add click handler to toggle expanded view
    this.container.querySelector('.proovd-pulse-content')?.addEventListener('click', () => {
      this.container?.classList.toggle('proovd-pulse-expanded');
    });
  }
  
  /**
   * Destroy the widget
   */
  destroy() {
    console.log('🟢 Destroying PulseWidget');
    
    // Remove event listeners
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
    
    // Unregister from socket manager
    socketManager.removeListener(this);
    
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
   * Add styles to document
   */
  addStyles() {
    if (document.getElementById('proovd-pulse-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'proovd-pulse-styles';
    styleEl.textContent = `
      .proovd-pulse-widget {
        position: fixed;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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
        background-color: #2F80ED;
        border-radius: 50%;
        position: relative;
        display: inline-block;
      }
      
      .proovd-pulse-dot:before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        background-color: #2F80ED;
        border-radius: 50%;
        opacity: 0.7;
        animation: pulse 2s ease-in-out infinite;
      }
      
      @keyframes pulse {
        0% {
          transform: scale(1);
          opacity: 0.7;
        }
        70% {
          transform: scale(2);
          opacity: 0;
        }
        100% {
          transform: scale(1);
          opacity: 0;
        }
      }
      
      .proovd-pulse-dark .proovd-pulse-dot {
        background-color: #60A5FA;
      }
      
      .proovd-pulse-dark .proovd-pulse-dot:before {
        background-color: #60A5FA;
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
    
    // Add custom CSS if provided
    if (this.options.customCSS) {
      styleEl.textContent += this.options.customCSS;
    }
    
    document.head.appendChild(styleEl);
  }
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
export { init, getInstance }; 