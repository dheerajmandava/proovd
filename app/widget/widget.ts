/**
 * Proovd Widget
 * This script creates and manages the social proof notifications on client websites.
 */

interface ProovdOptions {
  websiteId: string;
  position?: string;
  delay?: number;
  displayDuration?: number;
  maxNotifications?: number;
  theme?: string;
}

interface Notification {
  id: string;
  name: string;
  message: string;
  image?: string;
  type: string;
  productName?: string;
  location?: string;
  url?: string;
  timestamp: string;
  timeAgo?: string;
}

class Proovd {
  private container: HTMLElement | null = null;
  private notifications: Notification[] = [];
  private currentNotificationIndex = 0;
  private intervalId: number | null = null;
  private apiUrl = 'http://localhost:3000';
  private currentUrl = window.location.href;
  private options: ProovdOptions;

  constructor(options: ProovdOptions) {
    // Set default options
    this.options = {
      websiteId: options.websiteId,
      position: options.position || 'bottom-left',
      delay: options.delay || 5000, // Default 5 seconds
      displayDuration: options.displayDuration || 5000, // Default 5 seconds
      maxNotifications: options.maxNotifications || 5,
      theme: options.theme || 'light',
    };

    console.log('Proovd: Initialized with options:', this.options);

    // Add CSS animations
    this.addStyles();

    // Initialize the widget
    this.init();
  }

  private dispatchEvent(name: string, detail: any = {}): void {
    const event = new CustomEvent(name, { detail });
    window.dispatchEvent(event);
  }

  private addStyles(): void {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes proovd-fade-in {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes proovd-fade-out {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-20px);
        }
      }

      .proovd-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        font-size: 14px;
        line-height: 1.5;
      }

      .proovd-notification {
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.3s ease;
      }

      .proovd-notification:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
      }

      .proovd-image {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
      }

      .proovd-content {
        flex: 1;
      }

      .proovd-name {
        font-weight: 600;
        margin-bottom: 4px;
      }

      .proovd-message {
        margin-bottom: 4px;
      }

      .proovd-product {
        font-weight: 500;
        color: #2563eb;
      }

      .proovd-time {
        font-size: 12px;
        color: #6b7280;
      }
    `;
    document.head.appendChild(styleSheet);
  }

  private async init(): Promise<void> {
    try {
      console.log('Proovd: Initializing widget...');
      
      // Create container
      this.createContainer();
      
      // Fetch notifications
      await this.fetchNotifications();
      
      // Start displaying notifications if we have any
      if (this.notifications.length > 0) {
        console.log(`Proovd: Found ${this.notifications.length} notifications`);
        this.dispatchEvent('proovdLoaded', { count: this.notifications.length });
        setTimeout(() => {
          this.startNotifications();
        }, this.options.delay as number);
      } else {
        console.log('Proovd: No notifications found');
        this.dispatchEvent('proovdError', { message: 'No notifications found' });
      }
    } catch (error) {
      console.error('Proovd initialization error:', error);
      this.dispatchEvent('proovdError', { message: (error as Error).message });
    }
  }

  private createContainer(): void {
    // Create container element
    this.container = document.createElement('div');
    this.container.className = 'proovd-container';
    this.container.style.position = 'fixed';
    this.container.style.zIndex = '9999';
    this.container.style.maxWidth = '300px';
    
    // Set position
    switch (this.options.position) {
      case 'bottom-left':
        this.container.style.bottom = '20px';
        this.container.style.left = '20px';
        break;
      case 'bottom-right':
        this.container.style.bottom = '20px';
        this.container.style.right = '20px';
        break;
      case 'top-left':
        this.container.style.top = '20px';
        this.container.style.left = '20px';
        break;
      case 'top-right':
        this.container.style.top = '20px';
        this.container.style.right = '20px';
        break;
    }
    
    // Add container to body
    document.body.appendChild(this.container);
  }

  private async fetchNotifications(): Promise<void> {
    try {
      console.log('Proovd: Fetching notifications...');
      const url = `${this.apiUrl}/api/websites/${this.options.websiteId}/notifications/show?url=${encodeURIComponent(this.currentUrl)}`;
      console.log('Proovd: Fetching from URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Proovd: Received data:', data);
      
      // Apply settings from server if available
      if (data.settings) {
        console.log('Proovd: Applying server settings:', data.settings);
        this.options.position = data.settings.position || this.options.position;
        this.options.theme = data.settings.theme || this.options.theme;
        this.options.displayDuration = (data.settings.displayDuration || 5) * 1000; // Convert to ms
        this.options.delay = (data.settings.delay || 5) * 1000; // Convert to ms
        this.options.maxNotifications = data.settings.maxNotifications || this.options.maxNotifications;
        
        // Update container position if needed
        if (this.container) {
          // Reset all positions
          this.container.style.top = '';
          this.container.style.bottom = '';
          this.container.style.left = '';
          this.container.style.right = '';
          
          // Set new position
          switch (this.options.position) {
            case 'bottom-left':
              this.container.style.bottom = '20px';
              this.container.style.left = '20px';
              break;
            case 'bottom-right':
              this.container.style.bottom = '20px';
              this.container.style.right = '20px';
              break;
            case 'top-left':
              this.container.style.top = '20px';
              this.container.style.left = '20px';
              break;
            case 'top-right':
              this.container.style.top = '20px';
              this.container.style.right = '20px';
              break;
          }
        }
      }
      
      this.notifications = data.notifications || [];
      console.log('Proovd: Loaded notifications:', this.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  private startNotifications(): void {
    // Display first notification
    this.displayNotification(this.notifications[0]);
    
    // Set interval for subsequent notifications
    this.intervalId = window.setInterval(() => {
      this.currentNotificationIndex = (this.currentNotificationIndex + 1) % this.notifications.length;
      this.displayNotification(this.notifications[this.currentNotificationIndex]);
    }, this.options.displayDuration * 1000);
  }

  private displayNotification(notification: Notification): void {
    if (!this.container) return;
    
    // Clear previous notifications
    this.container.innerHTML = '';
    
    // Create notification element
    const notificationElement = document.createElement('div');
    notificationElement.className = `proovd-notification proovd-${this.options.theme}`;
    notificationElement.style.backgroundColor = this.options.theme === 'light' ? '#ffffff' : '#333333';
    notificationElement.style.color = this.options.theme === 'light' ? '#333333' : '#ffffff';
    notificationElement.style.padding = '15px';
    notificationElement.style.borderRadius = '8px';
    notificationElement.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    notificationElement.style.marginBottom = '10px';
    notificationElement.style.animation = 'proovd-fade-in 0.5s ease-in-out';
    notificationElement.style.position = 'relative';
    notificationElement.style.cursor = notification.url ? 'pointer' : 'default';
    
    // Add click handler if URL exists
    if (notification.url) {
      notificationElement.onclick = (e) => {
        // Don't trigger if clicking the close button
        if ((e.target as HTMLElement).classList.contains('proovd-close')) {
          return;
        }
        this.trackClick(notification.id);
        window.open(notification.url, '_blank');
      };
    }
    
    // Create content
    const content = document.createElement('div');
    content.innerHTML = notification.message;
    
    // Add product name if available
    if (notification.productName) {
      const productNameElement = document.createElement('div');
      productNameElement.style.fontWeight = 'bold';
      productNameElement.style.marginTop = '5px';
      productNameElement.textContent = notification.productName;
      content.appendChild(productNameElement);
    }
    
    // Add timestamp
    if (notification.timestamp) {
      const timestampElement = document.createElement('div');
      timestampElement.style.fontSize = '12px';
      timestampElement.style.marginTop = '5px';
      timestampElement.style.opacity = '0.7';
      
      // Format date
      const date = new Date(notification.timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.round(diffMs / 60000);
      
      if (diffMins < 1) {
        timestampElement.textContent = 'Just now';
      } else if (diffMins < 60) {
        timestampElement.textContent = `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
      } else if (diffMins < 1440) {
        const hours = Math.floor(diffMins / 60);
        timestampElement.textContent = `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      } else {
        const days = Math.floor(diffMins / 1440);
        timestampElement.textContent = `${days} ${days === 1 ? 'day' : 'days'} ago`;
      }
      
      content.appendChild(timestampElement);
    }
    
    // Add content to notification
    notificationElement.appendChild(content);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.className = 'proovd-close';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '5px';
    closeButton.style.right = '5px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '16px';
    closeButton.style.color = this.options.theme === 'light' ? '#333333' : '#ffffff';
    closeButton.onclick = (e) => {
      e.stopPropagation();
      if (this.container) {
        this.container.innerHTML = '';
      }
    };
    
    notificationElement.appendChild(closeButton);
    
    // Add notification to container
    this.container.appendChild(notificationElement);
    
    // Track display
    this.trackImpression(notification.id);
  }

  private async trackImpression(notificationId: string): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/api/websites/${this.options.websiteId}/notifications/${notificationId}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'impression',
          url: window.location.href
        }),
      });
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  }

  private async trackClick(notificationId: string): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/api/websites/${this.options.websiteId}/notifications/${notificationId}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'click',
          url: window.location.href
        }),
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }

  public stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Add to window object
(window as any).Proovd = Proovd;

// Add CSS to document
const style = document.createElement('style');
style.textContent = `
  @keyframes proovd-fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);

// Export for module usage
export default Proovd;

/**
 * ProovdPulse Widget Loader
 * Dynamically loads and initializes the ProovdPulse tracking widget
 */

interface ProovdPulseConfig {
  websiteId: string;
  token?: string;
  socketUrl?: string;
  widgetPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  widgetColors?: {
    background?: string;
    text?: string;
    pulse?: string;
  };
  customText?: {
    activeUserLabel?: string;
    pulseLabel?: string;
  };
  hideWidgetOnMobile?: boolean;
}

// Function to load the ProovdPulse script
function loadProovdPulse(config: ProovdPulseConfig): void {
  // Skip if already loaded
  if (window.ProovdPulse) {
    console.log('ProovdPulse already loaded');
    return;
  }

  // Check if we have required parameters
  if (!config.websiteId) {
    console.error('ProovdPulse: websiteId is required');
    return;
  }

  try {
    // Create script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    
    // Set script attributes
    const scriptSrc = `https://app.proovd.in/api/websites/${config.websiteId}/pulse-widget.js`;
    script.src = scriptSrc;
    
    // Initialize widget when script is loaded
    script.onload = () => {
      if (window.ProovdPulse) {
        // Initialize the widget with configuration
        const pulse = new window.ProovdPulse(config);
        pulse.init().catch((err: Error) => {
          console.error('Failed to initialize ProovdPulse:', err);
        });
      } else {
        console.error('ProovdPulse failed to load');
      }
    };
    
    // Add script to head
    document.head.appendChild(script);
    
    console.log('ProovdPulse script added to page');
  } catch (error) {
    console.error('Error loading ProovdPulse:', error);
  }
}

// Add ProovdPulse to the window object
declare global {
  interface Window {
    ProovdPulse: any;
    loadProovdPulse: typeof loadProovdPulse;
  }
}

// Expose the load function globally
window.loadProovdPulse = loadProovdPulse;

export { loadProovdPulse }; 