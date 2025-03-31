/**
 * ProovdPulse UI Component
 * Controls the display of the ProovdPulse widget UI
 */

import { PulseSocketClient } from './socket-client';

export interface PulseUIOptions {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  theme?: 'light' | 'dark' | 'auto';
  showActiveUsers?: boolean;
  showIcon?: boolean;
  customCSS?: string;
  zIndex?: number;
  debug?: boolean;
}

export class PulseWidget {
  private socketClient: PulseSocketClient;
  private container: HTMLElement | null = null;
  private options: PulseUIOptions;
  private activeUsers: number = 0;
  private websiteId: string;
  private clientId: string;
  private serverUrl: string;

  /**
   * Create a new PulseWidget instance
   */
  constructor(clientId: string, websiteId: string, serverUrl: string, options: PulseUIOptions = {}) {
    console.log('🟢 Creating PulseWidget with websiteId:', websiteId);
    this.clientId = clientId;
    this.websiteId = websiteId;
    this.serverUrl = serverUrl;
    
    // Set default options
    this.options = {
      position: options.position || 'bottom-right',
      theme: options.theme || 'auto',
      showActiveUsers: options.showActiveUsers !== false,
      showIcon: options.showIcon !== false,
      zIndex: options.zIndex || 999999,
      debug: options.debug || false
    };
    
    // Create socket client
    this.socketClient = new PulseSocketClient(clientId, websiteId, serverUrl, {
      secure: true,
      debug: this.options.debug
    });
    
    // Register event handlers
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
      // Connect to the socket server
      await this.socketClient.connect();
      
      // Initialize the UI
      this.initUI();
      
      console.log('✅ PulseWidget connected and UI initialized');
      return Promise.resolve();
    } catch (error) {
      console.error('❌ PulseWidget connection failed:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Initialize the UI
   */
  private initUI(): void {
    console.log('🟢 Initializing PulseWidget UI');
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'proovd-pulse-widget';
    this.container.id = 'proovd-pulse-widget';
    
    // Set theme
    if (this.options.theme === 'dark') {
      this.container.classList.add('proovd-pulse-dark');
    } else if (this.options.theme === 'auto') {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.container.classList.add('proovd-pulse-dark');
      }
      
      // Listen for theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (e.matches) {
          this.container?.classList.add('proovd-pulse-dark');
        } else {
          this.container?.classList.remove('proovd-pulse-dark');
        }
      });
    }
    
    // Set position
    this.container.classList.add(`proovd-pulse-${this.options.position}`);
    
    // Set z-index
    if (this.options.zIndex) {
      this.container.style.zIndex = String(this.options.zIndex);
    }
    
    // Create content
    this.updateUI();
    
    // Add to document
    document.body.appendChild(this.container);
    
    // Add styles
    this.addStyles();
    
    console.log('✅ PulseWidget UI initialized');
  }
  
  /**
   * Update the UI with the latest data
   */
  private updateUI(): void {
    if (!this.container) return;
    
    // Create or update content
    this.container.innerHTML = `
      <div class="proovd-pulse-content">
        <div class="proovd-pulse-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
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
   * Add the required styles to the document
   */
  private addStyles(): void {
    // Check if styles already exist
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
      
      .proovd-pulse-icon {
        color: #ff4757;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .proovd-pulse-dark .proovd-pulse-icon {
        color: #ff6b81;
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

  /**
   * Handle stats update from the socket server
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
   * Destroy the widget instance
   */
  destroy(): void {
    console.log('🟢 Destroying PulseWidget instance');
    
    // Disconnect from the socket server
    this.socketClient.disconnect();
    
    // Remove the container from the DOM
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    // Remove the styles
    const styleEl = document.getElementById('proovd-pulse-styles');
    if (styleEl && styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }
    
    console.log('✅ PulseWidget destroyed');
  }
} 