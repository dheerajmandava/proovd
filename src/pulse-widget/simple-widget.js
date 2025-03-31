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
  constructor(websiteId, options = {}) {
    this.container = null;
    this.activeUsers = 0;
    this.pulseInterval = null;
    this.websiteId = websiteId;
    
    this.options = {
      position: options.position || 'bottom-right',
      theme: options.theme || 'auto',
      zIndex: options.zIndex || 999999,
      pulseColor: options.pulseColor || '#2563eb', // Default blue color
      updateInterval: options.updateInterval || 3000 // Faster updates: 3 seconds
    };
    
    console.log('🟢 PulseWidget created with options:', this.options);
  }
  
  /**
   * Initialize the widget
   */
  init() {
    console.log('🟢 Initializing PulseWidget');
    this.initUI();
    
    // Simulate active users with random data
    this.activeUsers = Math.floor(Math.random() * 10) + 1;
    this.updateUI();
    
    // Update users periodically
    setInterval(() => {
      this.activeUsers = Math.floor(Math.random() * 10) + 1;
      this.updateUI();
    }, this.options.updateInterval);
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
          if (dot.classList) {
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
    
    // Clear pulse interval
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }
    
    // Remove DOM elements
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    // Remove styles
    const style = document.getElementById('proovd-pulse-styles');
    if (style && style.parentNode) {
      style.parentNode.removeChild(style);
    }
    
    console.log('✅ PulseWidget destroyed');
  }
}

/**
 * Initialize the ProovdPulse Widget
 */
function init(websiteId, options = {}) {
  console.log('🟢 ProovdPulse Widget Initializing...', { websiteId, options });
  
  try {
    // Destroy previous instance if it exists
    if (widgetInstance) {
      console.log('⚠️ ProovdPulse Widget already initialized, destroying previous instance');
      widgetInstance.destroy();
    }
    
    // Create new instance
    widgetInstance = new PulseWidget(websiteId, options);
    
    // Initialize
    widgetInstance.init();
    
    return widgetInstance;
  } catch (error) {
    console.error('❌ Failed to initialize ProovdPulse Widget:', error);
    return null;
  }
}

/**
 * Get the current instance
 */
function getInstance() {
  return widgetInstance;
}

// Expose API
window.ProovdPulse = {
  init,
  getInstance,
  version: '1.0.0'
};

// Auto-initialization from data attributes
console.log('🟢 Checking for auto-initialization...');
const scripts = document.querySelectorAll('script[data-website-id]');

if (scripts.length > 0) {
  try {
    const script = scripts[0];
    const websiteId = script.getAttribute('data-website-id');
    const position = script.getAttribute('data-position') || 'bottom-right';
    
    if (websiteId) {
      console.log('🟢 Auto-initializing ProovdPulse Widget with website ID:', websiteId);
      
      // Parse data attributes as options
      const options = {};
      
      // Convert kebab-case data attributes to camelCase options
      for (const attr of Array.from(script.attributes)) {
        if (attr.name.startsWith('data-') && attr.name !== 'data-website-id') {
          const key = attr.name.substring(5).replace(/-([a-z])/g, (_, m) => m.toUpperCase());
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

// Try to initialize from script URL (for CDN usage)
try {
  const script = document.currentScript;
  if (script) {
    const src = script.src;
    console.log('🟢 Current script src:', src);
    
    // Extract website ID from URL pattern /p/{websiteId}.js
    const match = src.match(/\/p\/([a-zA-Z0-9]+)\.js$/);
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