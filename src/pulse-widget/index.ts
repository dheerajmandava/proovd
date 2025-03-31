/**
 * ProovdPulse Widget - Real-time social proof widget
 */
import { PulseSocketClient } from './socket-client';

declare global {
  interface Window {
    ProovdPulse: {
      init: (websiteId: string, options?: PulseWidgetOptions) => PulseWidget | null;
      getInstance: () => PulseWidget | null;
      version: string;
    };
  }
}

// Global instance
let widgetInstance: PulseWidget | null = null;

/**
 * PulseWidget class to create and manage the social proof widget
 */
class PulseWidget {
  private container: HTMLElement | null = null;
  private activeUsers: number = 0;
  private clientId: string;
  private websiteId: string;
  private serverUrl: string;
  private options: PulseWidgetOptions;
  private socketClient: PulseSocketClient;
  private pulseInterval: number | null = null;

  constructor(clientId: string, websiteId: string, serverUrl: string, options: PulseWidgetOptions = {}) {
    this.container = null;
    this.activeUsers = 0;
    console.log('🟢 Creating Pulse Widget with websiteId:', websiteId);

    this.clientId = clientId;
    this.websiteId = websiteId;
    this.serverUrl = serverUrl;
    this.options = {
      position: options.position || 'bottom-right',
      theme: options.theme || 'auto',
      showActiveUsers: options.showActiveUsers !== false,
      showIcon: options.showIcon !== false,
      zIndex: options.zIndex || 999999,
      debug: options.debug || false,
      pulseColor: options.pulseColor || '#2563eb', // Default blue color
      updateInterval: options.updateInterval || 10000 // Default 10 seconds
    };

    this.socketClient = new PulseSocketClient(clientId, websiteId, serverUrl, {
      secure: true,
      debug: this.options.debug,
      updateInterval: this.options.updateInterval
    });

    this.socketClient.on('stats', this.handleStatsUpdate.bind(this));
    this.socketClient.on('connect', this.handleConnect.bind(this));
    this.socketClient.on('disconnect', this.handleDisconnect.bind(this));
    this.socketClient.on('error', this.handleError.bind(this));

    console.log('🟢 PulseWidget created with options:', this.options);
  }

  /**
   * Connect to the socket server and initialize the UI
   */
  async connect(): Promise<void> {
    console.log('🟢 PulseWidget connecting...');
    try {
      await this.socketClient.connect();
      this.initUI();
      console.log('✅ PulseWidget connected and UI initialized');
      return Promise.resolve();
    } catch (error) {
      console.error('❌ PulseWidget connection failed:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Initialize the UI components
   */
  private initUI(): void {
    console.log('🟢 Initializing PulseWidget UI');
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
          this.container?.classList.add('proovd-pulse-dark');
        } else {
          this.container?.classList.remove('proovd-pulse-dark');
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
   * Start the pulsing animation for the dot
   */
  private startPulseAnimation(): void {
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
    }
    
    this.pulseInterval = window.setInterval(() => {
      const dot = document.querySelector('.proovd-pulse-dot');
      if (dot) {
        dot.classList.add('pulse');
        setTimeout(() => {
          dot?.classList.remove('pulse');
        }, 1000);
      }
    }, 2000); // Pulse every 2 seconds
  }

  /**
   * Update the UI with latest data
   */
  private updateUI(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="proovd-pulse-content">
        <div class="proovd-pulse-dot"></div>
        <div class="proovd-pulse-count">${this.activeUsers}</div>
        <div class="proovd-pulse-label">active now</div>
      </div>
    `;

    // Add click handler
    this.container.querySelector('.proovd-pulse-content')?.addEventListener('click', () => {
      this.container?.classList.toggle('proovd-pulse-expanded');
    });
  }

  /**
   * Add necessary styles to the document
   */
  private addStyles(): void {
    // Don't add styles if they already exist
    if (document.getElementById('proovd-pulse-styles')) return;

    const style = document.createElement('style');
    style.id = 'proovd-pulse-styles';
    
    // Insert custom pulse color
    const pulseColor = this.options.pulseColor || '#2563eb';
    
    style.textContent = `
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

    // Add any custom CSS
    if (this.options.customCSS) {
      style.textContent += this.options.customCSS;
    }

    document.head.appendChild(style);
  }

  /**
   * Handle stats update from socket
   */
  private handleStatsUpdate(data: any): void {
    console.log('🟢 Received stats update:', data);
    if (data && data.stats && typeof data.stats.activeUsers === 'number') {
      this.activeUsers = data.stats.activeUsers;
      this.updateUI();
    }
  }

  /**
   * Handle socket connection
   */
  private handleConnect(data: any): void {
    console.log('✅ Socket connected:', data);
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnect(data: any): void {
    console.log('🔴 Socket disconnected:', data);
  }

  /**
   * Handle socket error
   */
  private handleError(data: any): void {
    console.error('❌ Socket error:', data);
  }

  /**
   * Destroy the widget
   */
  destroy(): void {
    console.log('🟢 Destroying PulseWidget instance');
    
    // Disconnect socket
    this.socketClient.disconnect();
    
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
 * Interface for PulseWidget options
 */
interface PulseWidgetOptions {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  theme?: 'light' | 'dark' | 'auto';
  showActiveUsers?: boolean;
  showIcon?: boolean;
  zIndex?: number;
  debug?: boolean;
  customCSS?: string;
  pulseColor?: string;
  updateInterval?: number;
  clientId?: string;
  socketServer?: string;
}

// Generate or retrieve client ID
const CLIENT_ID_KEY = 'proovd_pulse_client_id';

function getClientId(): string {
  // Check if client ID exists in localStorage
  const storedId = localStorage.getItem(CLIENT_ID_KEY);
  if (storedId) {
    console.log('🟢 Using stored client ID:', storedId);
    return storedId;
  }
  
  // Generate new client ID
  const newId = generateUUID();
  
  // Try to store it
  try {
    localStorage.setItem(CLIENT_ID_KEY, newId);
    console.log('🟢 Generated and stored new client ID:', newId);
  } catch (e) {
    console.error('❌ Failed to store client ID:', e);
  }
  
  return newId;
}

/**
 * Generate UUID v4
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Global variables
console.log('🟢 ProovdPulse Widget Script Loaded');

/**
 * Initialize the ProovdPulse Widget
 */
function init(websiteId: string, options: PulseWidgetOptions = {}): PulseWidget | null {
  console.log('🟢 ProovdPulse Widget Initializing...', { websiteId, options });
  try {
    // Destroy previous instance if it exists
    if (widgetInstance) {
      console.log('⚠️ ProovdPulse Widget already initialized, destroying previous instance');
      widgetInstance.destroy();
    }
    
    // Get client ID
    const clientId = options.clientId || getClientId();
    console.log('🟢 Using client ID:', clientId);
    
    // Get socket server
    const socketServer = options.socketServer || 'wss://socket.proovd.in';
    console.log('🟢 Using socket server:', socketServer);
    
    // Force debug for development
    options.debug = true;
    
    // Create new instance
    widgetInstance = new PulseWidget(clientId, websiteId, socketServer, options);
    
    // Connect to socket server
    console.log('🟢 Connecting to socket server...');
    widgetInstance.connect()
      .then(() => {
        console.log('✅ ProovdPulse Widget initialized successfully');
      })
      .catch((error) => {
        console.error('❌ Failed to initialize ProovdPulse Widget:', error);
      });
    
    return widgetInstance;
  } catch (error) {
    console.error('❌ Failed to initialize ProovdPulse Widget:', error);
    return null;
  }
}

/**
 * Get the current instance
 */
function getInstance(): PulseWidget | null {
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
    const script = scripts[0] as HTMLElement;
    const websiteId = script.getAttribute('data-website-id');
    const position = script.getAttribute('data-position') || 'bottom-right';
    
    if (websiteId) {
      console.log('🟢 Auto-initializing ProovdPulse Widget with website ID:', websiteId);
      
      // Parse data attributes as options
      const options: any = {};
      
      // Convert kebab-case data attributes to camelCase options
      for (const attr of Array.from(script.attributes)) {
        if (attr.name.startsWith('data-') && attr.name !== 'data-website-id') {
          const key = attr.name.substring(5).replace(/-([a-z])/g, (m) => m[1].toUpperCase());
          options[key] = attr.value;
        }
      }
      
      console.log('🟢 Auto-initialization options:', options);
      init(websiteId, { position: position as any, ...options, debug: true });
    }
  } catch (error) {
    console.error('❌ Error during auto-initialization:', error);
  }
}

// Try to initialize from script URL (for CDN usage)
try {
  const script = document.currentScript as HTMLScriptElement;
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
export { init, getInstance }; 