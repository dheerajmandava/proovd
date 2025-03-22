/**
 * SocialProofify Widget
 * This script creates and manages the social proof notifications on client websites.
 */

interface SocialProofifyOptions {
  apiKey: string;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  delay?: number;
  displayDuration?: number;
  maxNotifications?: number;
  theme?: 'light' | 'dark';
}

interface Notification {
  id: string;
  name: string;
  type: string;
  message: string;
  productName?: string;
  url?: string;
  image?: string;
  timestamp: string;
}

class SocialProofify {
  private options: Required<SocialProofifyOptions>;
  private container: HTMLElement | null = null;
  private notifications: Notification[] = [];
  private currentNotificationIndex = 0;
  private intervalId: number | null = null;
  private apiUrl = 'https://api.socialproofify.com'; // Replace with actual API URL in production
  private currentUrl: string;
  private sessionId: string;
  private clientId: string;

  constructor(options: SocialProofifyOptions) {
    // Set default options
    this.options = {
      apiKey: options.apiKey,
      position: options.position || 'bottom-left',
      delay: options.delay || 5,
      displayDuration: options.displayDuration || 5,
      maxNotifications: options.maxNotifications || 5,
      theme: options.theme || 'light',
    };

    // Store current URL
    this.currentUrl = window.location.href;
    
    // Generate or retrieve session ID
    this.sessionId = this.getOrCreateSessionId();
    
    // Generate or retrieve client ID (persists across sessions)
    this.clientId = this.getOrCreateClientId();

    // Initialize the widget
    this.init();
  }
  
  // Generate a unique identifier
  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  // Get existing session ID or create a new one
  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('socialproofify_session');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('socialproofify_session', sessionId);
    }
    return sessionId;
  }
  
  // Get existing client ID or create a new one (persists across sessions)
  private getOrCreateClientId(): string {
    let clientId = localStorage.getItem('socialproofify_client');
    if (!clientId) {
      clientId = this.generateId();
      localStorage.setItem('socialproofify_client', clientId);
    }
    return clientId;
  }

  private async init(): Promise<void> {
    try {
      console.log('SocialProofify: Initializing widget...');
      
      // Create container
      this.createContainer();
      
      // Fetch notifications
      await this.fetchNotifications();
      
      // Start displaying notifications if we have any
      if (this.notifications.length > 0) {
        console.log(`SocialProofify: Found ${this.notifications.length} notifications`);
        setTimeout(() => {
          this.startNotifications();
        }, this.options.delay * 1000);
      } else {
        console.log('SocialProofify: No notifications found');
      }
    } catch (error) {
      console.error('SocialProofify initialization error:', error);
    }
  }

  private createContainer(): void {
    // Create container element
    this.container = document.createElement('div');
    this.container.className = 'socialproofify-container';
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
      console.log('SocialProofify: Fetching notifications...');
      const response = await fetch(
        `${this.apiUrl}/api/notifications?apiKey=${this.options.apiKey}&url=${encodeURIComponent(this.currentUrl)}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Apply settings from server if available
      if (data.settings) {
        this.options.position = data.settings.position || this.options.position;
        this.options.theme = data.settings.theme || this.options.theme;
        this.options.displayDuration = data.settings.displayDuration || this.options.displayDuration;
        this.options.delay = data.settings.delay || this.options.delay;
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
    } catch (error) {
      console.error('Error fetching notifications:', error);
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
    notificationElement.className = `socialproofify-notification socialproofify-${this.options.theme}`;
    notificationElement.style.backgroundColor = this.options.theme === 'light' ? '#ffffff' : '#333333';
    notificationElement.style.color = this.options.theme === 'light' ? '#333333' : '#ffffff';
    notificationElement.style.padding = '15px';
    notificationElement.style.borderRadius = '8px';
    notificationElement.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    notificationElement.style.marginBottom = '10px';
    notificationElement.style.animation = 'socialproofify-fade-in 0.5s ease-in-out';
    notificationElement.style.position = 'relative';
    notificationElement.style.cursor = notification.url ? 'pointer' : 'default';
    
    // Add click handler if URL exists
    if (notification.url) {
      notificationElement.onclick = (e) => {
        // Don't trigger if clicking the close button
        if ((e.target as HTMLElement).classList.contains('socialproofify-close')) {
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
    closeButton.className = 'socialproofify-close';
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
      await fetch(`${this.apiUrl}/api/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.options.apiKey,
          notificationId: notificationId,
          action: 'impression',
          url: this.currentUrl,
          sessionId: this.sessionId,
          clientId: this.clientId
        }),
      });
    } catch (error) {
      console.error('Error tracking notification display:', error);
    }
  }

  private async trackClick(notificationId: string): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/api/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.options.apiKey,
          notificationId: notificationId,
          action: 'click',
          url: this.currentUrl,
          sessionId: this.sessionId,
          clientId: this.clientId
        }),
      });
    } catch (error) {
      console.error('Error tracking notification click:', error);
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
(window as any).SocialProofify = SocialProofify;

// Add CSS to document
const style = document.createElement('style');
style.textContent = `
  @keyframes socialproofify-fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);

// Export for module usage
export default SocialProofify; 