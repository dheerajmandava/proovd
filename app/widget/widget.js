/**
 * proovd Widget
 * This script creates and manages the social proof notifications on client websites.
 */

class proovd {
  constructor(options) {
    // Initialize class properties
    this.container = null;
    this.notifications = [];
    this.currentNotificationIndex = 0;
    this.intervalId = null;
    this.apiUrl = 'http://localhost:3000';
    this.currentUrl = window.location.href;

    // Set default options
    this.options = {
      apiKey: options.apiKey,
      position: options.position || 'bottom-left',
      delay: options.delay || 5000, // Default 5 seconds
      displayDuration: options.displayDuration || 5000, // Default 5 seconds
      maxNotifications: options.maxNotifications || 5,
      theme: options.theme || 'light',
    };

    console.log('proovd: Initialized with options:', this.options);

    // Add CSS animations
    this.addStyles();

    // Initialize the widget
    this.init();
  }

  dispatchEvent(name, detail = {}) {
    const event = new CustomEvent(name, { detail });
    window.dispatchEvent(event);
  }

  addStyles() {
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

  async init() {
    try {
      console.log('proovd: Initializing widget...');
      
      // Create container
      this.createContainer();
      
      // Fetch notifications
      await this.fetchNotifications();
      
      // Start displaying notifications if we have any
      if (this.notifications.length > 0) {
        console.log(`proovd: Found ${this.notifications.length} notifications`);
        this.dispatchEvent('proovdLoaded', { count: this.notifications.length });
        setTimeout(() => {
          this.startNotifications();
        }, this.options.delay * 1000);
      } else {
        console.log('proovd: No notifications found');
        this.dispatchEvent('proovdError', { message: 'No notifications found' });
      }
    } catch (error) {
      console.error('proovd initialization error:', error);
      this.dispatchEvent('proovdError', { message: error.message });
    }
  }

  createContainer() {
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

  async fetchNotifications() {
    try {
      console.log('proovd: Fetching notifications...');
      const url = `${this.apiUrl}/api/notifications?apiKey=${this.options.apiKey}&url=${encodeURIComponent(this.currentUrl)}`;
      console.log('proovd: Fetching from URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('proovd: Received data:', data);
      
      // Apply settings from server if available
      if (data.settings) {
        console.log('proovd: Applying server settings:', data.settings);
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
      console.log('proovd: Loaded notifications:', this.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  startNotifications() {
    console.log('proovd: Starting notifications display');
    if (this.notifications.length === 0) {
      console.log('proovd: No notifications to display');
      return;
    }

    // Display first notification
    this.displayNotification(this.notifications[0]);
    
    // Set interval for subsequent notifications
    if (this.notifications.length > 1) {
      console.log(`proovd: Setting up rotation interval for ${this.options.displayDuration}ms`);
      this.intervalId = window.setInterval(() => {
        this.currentNotificationIndex = (this.currentNotificationIndex + 1) % this.notifications.length;
        console.log(`proovd: Showing notification ${this.currentNotificationIndex + 1} of ${this.notifications.length}`);
        this.displayNotification(this.notifications[this.currentNotificationIndex]);
      }, this.options.displayDuration);
    }
  }

  displayNotification(notification) {
    if (!this.container) {
      console.error('proovd: Container not found');
      return;
    }
    
    console.log('proovd: Displaying notification:', notification);
    
    // Clear previous notifications
    const oldNotification = this.container.querySelector('.proovd-notification');
    if (oldNotification) {
      oldNotification.style.animation = 'proovd-fade-out 0.3s ease-out forwards';
      setTimeout(() => {
        this.container.innerHTML = '';
        this.showNewNotification(notification);
      }, 300);
    } else {
      this.showNewNotification(notification);
    }
  }

  showNewNotification(notification) {
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
    notificationElement.style.cursor = notification.url ? 'pointer' : 'default';

    // Create image if available
    if (notification.image) {
      const image = document.createElement('img');
      image.src = notification.image;
      image.className = 'proovd-image';
      notificationElement.appendChild(image);
    }

    // Create content container
    const content = document.createElement('div');
    content.className = 'proovd-content';

    // Add name
    const nameElement = document.createElement('div');
    nameElement.className = 'proovd-name';
    nameElement.textContent = notification.name;
    content.appendChild(nameElement);

    // Add message
    const messageElement = document.createElement('div');
    messageElement.className = 'proovd-message';
    messageElement.textContent = notification.message;
    content.appendChild(messageElement);

    // Add product name if available
    if (notification.productName) {
      const productElement = document.createElement('div');
      productElement.className = 'proovd-product';
      productElement.textContent = notification.productName;
      content.appendChild(productElement);
    }

    // Add timestamp
    const timeElement = document.createElement('div');
    timeElement.className = 'proovd-time';
    timeElement.textContent = 'Just now';
    content.appendChild(timeElement);

    notificationElement.appendChild(content);
    
    // Add click handler if URL exists
    if (notification.url) {
      notificationElement.onclick = (e) => {
        this.trackClick(notification.id);
        window.open(notification.url, '_blank');
      };
    }

    // Track impression
    this.trackImpression(notification.id);
    
    // Add to container
    this.container.appendChild(notificationElement);

    // Dispatch event
    this.dispatchEvent('proovdNotification', { 
      id: notification._id,
      name: notification.name,
      message: notification.message,
      type: notification.type,
      productName: notification.productName
    });
  }

  async trackImpression(notificationId) {
    try {
      await fetch(`${this.apiUrl}/api/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.options.apiKey,
          notificationId,
          action: 'impression',
          url: this.currentUrl
        }),
      });
    } catch (error) {
      console.error('Error tracking notification display:', error);
    }
  }

  async trackClick(notificationId) {
    try {
      await fetch(`${this.apiUrl}/api/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.options.apiKey,
          notificationId,
          action: 'click',
          url: this.currentUrl
        }),
      });
    } catch (error) {
      console.error('Error tracking notification click:', error);
    }
  }

  stop() {
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
window.proovd = proovd;

// Add CSS to document
const style = document.createElement('style');
style.textContent = `
  @keyframes proovd-fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);

// Initialize from global configuration if available
document.addEventListener('DOMContentLoaded', () => {
  if (window.proovdOptions) {
    console.log('proovd: Found global configuration:', window.proovdOptions);
    try {
      window.proovdWidget = new proovd(window.proovdOptions);
      // Dispatch event when widget is loaded
      window.dispatchEvent(new Event('proovdLoaded'));
    } catch (error) {
      console.error('Failed to initialize proovd:', error);
      window.dispatchEvent(new CustomEvent('proovdError', { 
        detail: { message: error.message } 
      }));
    }
  } else {
    const error = 'proovd configuration not found. Please set window.proovdOptions before loading the script.';
    console.error(error);
    window.dispatchEvent(new CustomEvent('proovdError', { 
      detail: { message: error } 
    }));
  }
}); 