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
      websiteId: options.websiteId,
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
      const url = `${this.apiUrl}/api/websites/${this.options.websiteId}/notifications/show?url=${encodeURIComponent(this.currentUrl)}`;
      console.log('proovd: Fetching from URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('proovd: Received data:', JSON.stringify(data, null, 2));
      
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
      
      // Log each notification to inspect them
      if (this.notifications.length > 0) {
        console.log(`proovd: Loaded ${this.notifications.length} notifications`);
        this.notifications.forEach((notification, index) => {
          console.log(`proovd: Notification #${index+1}: ${notification.name || 'Unnamed'}`);
          console.log(`proovd: Is component based? ${notification.isComponentBased}`);
          if (notification.components) {
            console.log(`proovd: Has ${notification.components.length} components`);
            console.log(`proovd: First component: ${JSON.stringify(notification.components[0])}`);
          } else {
            console.log('proovd: No components array found!');
          }
        });
      } else {
        console.log('proovd: No notifications received');
      }
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
    console.log('proovd: Showing notification with data:', notification);
    console.log('proovd: Is component based?', notification.isComponentBased);
    console.log('proovd: Components:', notification.components);
    
    // Ensure notification has proper ID for tracking
    const notificationId = notification._id || notification.id;
    if (!notificationId) {
      console.error('proovd: Notification missing ID:', notification);
      return;
    }
    
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
    
    // Set notification title and id attributes for debugging
    notificationElement.setAttribute('data-notification-id', notificationId);
    notificationElement.setAttribute('data-notification-name', notification.name || 'Unnamed');
    
    // Set defaults for positioning content
    notificationElement.style.position = 'relative';
    notificationElement.style.width = '384px'; // Set fixed width for Real Estate template
    notificationElement.style.minHeight = '100px';
    notificationElement.style.overflow = 'hidden';

    // Check if this is a component-based notification
    if (notification.isComponentBased && notification.components && notification.components.length > 0) {
      // Render components
      this.renderComponents(notificationElement, notification.components);
    } else {
      // Traditional notification rendering
      // Create image if available
      if (notification.image) {
        const image = document.createElement('img');
        image.src = notification.image;
        image.className = 'proovd-image';
        image.style.width = '60px';
        image.style.height = '60px';
        image.style.borderRadius = '4px';
        image.style.marginRight = '10px';
        image.style.objectFit = 'cover';
        notificationElement.appendChild(image);
      }

      // Create content container
      const content = document.createElement('div');
      content.className = 'proovd-content';
      content.style.flex = '1';

      // Add name
      const nameElement = document.createElement('div');
      nameElement.className = 'proovd-name';
      nameElement.textContent = notification.name;
      nameElement.style.fontWeight = 'bold';
      nameElement.style.marginBottom = '4px';
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
        productElement.style.fontWeight = 'bold';
        productElement.style.marginTop = '4px';
        content.appendChild(productElement);
      }

      // Add timestamp
      const timeElement = document.createElement('div');
      timeElement.className = 'proovd-time';
      timeElement.textContent = notification.timeAgo || 'Just now';
      timeElement.style.fontSize = '12px';
      timeElement.style.color = '#6b7280';
      timeElement.style.marginTop = '4px';
      content.appendChild(timeElement);

      notificationElement.appendChild(content);
    }
    
    // Add click handler if URL exists
    if (notification.url) {
      notificationElement.onclick = (e) => {
        this.trackClick(notificationId);
        window.open(notification.url, '_blank');
      };
    }

    // Track impression
    this.trackImpression(notificationId);
    
    // Add to container
    this.container.appendChild(notificationElement);

    // Dispatch event
    this.dispatchEvent('proovdNotification', { 
      id: notificationId,
      name: notification.name,
      message: notification.message,
      type: notification.type,
      productName: notification.productName
    });
  }

  // New method to render component-based notifications
  renderComponents(container, components) {
    if (!components || !components.length) {
      console.error('proovd: No components to render');
      return;
    }
    
    console.log('proovd: Rendering components:', JSON.stringify(components));
    
    // Create a wrapper for absolute positioning
    container.style.position = 'relative';
    
    // Calculate bounding box to adjust for negative coordinates
    let minX = 0, minY = 0;
    components.forEach(component => {
      if (component.position) {
        minX = Math.min(minX, component.position.x || 0);
        minY = Math.min(minY, component.position.y || 0);
      }
    });
    
    // Adjust container to accommodate negative positions
    if (minX < 0 || minY < 0) {
      console.log(`proovd: Adjusting container for negative coordinates: x=${minX}, y=${minY}`);
      container.style.padding = `${Math.abs(minY) + 15}px ${Math.abs(minX) + 15}px 15px 15px`;
    }
    
    // Render each component
    components.forEach((component, index) => {
      // Skip if missing essential data
      if (!component || !component.type) {
        console.error(`proovd: Invalid component at index ${index}:`, component);
        return;
      }
      
      const id = component.id || `comp-${index}`;
      const type = component.type;
      const content = component.content || '';
      const position = component.position || { x: 0, y: 0 };
      const style = component.style || {};
      
      console.log(`proovd: Rendering component[${index}]: ${type} id=${id}, position=${JSON.stringify(position)}, content="${content.substring(0, 20)}${content.length > 20 ? '...' : ''}"`);
      
      // Create the component element
      let element;
      
      switch (type) {
        case 'image':
          element = document.createElement('img');
          element.src = content;
          element.alt = 'Notification image';
          element.onerror = () => {
            element.src = 'https://placehold.co/60x60?text=Error';
          };
          break;
          
        case 'badge':
          element = document.createElement('div');
          element.textContent = content;
          // Apply default badge styles if not provided
          if (!style.backgroundColor) element.style.backgroundColor = '#4338ca';
          if (!style.color) element.style.color = 'white';
          if (!style.padding) element.style.padding = '2px 6px';
          if (!style.borderRadius) element.style.borderRadius = '4px';
          if (!style.fontSize) element.style.fontSize = '12px';
          if (!style.fontWeight) element.style.fontWeight = 'bold';
          break;
          
        case 'user':
          element = document.createElement('div');
          element.textContent = content;
          if (!style.fontWeight) element.style.fontWeight = 'bold';
          if (!style.color) element.style.color = '#333333';
          break;
          
        case 'price':
          element = document.createElement('div');
          element.textContent = content;
          if (!style.color) element.style.color = '#10b981';
          if (!style.fontWeight) element.style.fontWeight = 'bold';
          if (!style.fontSize) element.style.fontSize = '16px';
          break;
          
        case 'rating':
          element = document.createElement('div');
          element.textContent = content;
          if (!style.color) element.style.color = '#f59e0b';
          if (!style.fontSize) element.style.fontSize = '16px';
          break;
          
        case 'location':
          element = document.createElement('div');
          element.textContent = content;
          if (!style.color) element.style.color = '#6b7280';
          if (!style.fontSize) element.style.fontSize = '12px';
          break;
          
        case 'time':
          element = document.createElement('div');
          element.textContent = content;
          if (!style.color) element.style.color = '#6b7280';
          if (!style.fontSize) element.style.fontSize = '12px';
          if (!style.fontStyle) element.style.fontStyle = 'italic';
          break;
          
        case 'text':
        default:
          element = document.createElement('div');
          element.textContent = content;
          if (!style.fontSize) element.style.fontSize = '14px';
          if (!style.color) element.style.color = '#333333';
          break;
      }
      
      // Add debug classes and attributes
      element.className = `proovd-component proovd-${type}`;
      element.setAttribute('data-component-id', id);
      element.setAttribute('data-component-type', type);
      element.setAttribute('data-component-index', index);
      
      // Position the element - account for negative coordinates
      element.style.position = 'absolute';
      element.style.left = `${position.x + Math.abs(minX)}px`;
      element.style.top = `${position.y + Math.abs(minY)}px`;
      element.style.transform = 'translate(0, 0)'; 
      element.style.display = 'block';
      element.style.whiteSpace = 'nowrap';
      
      // Apply custom styles
      Object.keys(style).forEach(prop => {
        try {
          element.style[prop] = style[prop];
          console.log(`proovd: Setting style ${prop} = ${style[prop]}`);
        } catch (err) {
          console.error(`proovd: Error setting style ${prop}:`, err);
        }
      });
      
      // Add to container
      container.appendChild(element);
    });
  }

  async trackImpression(notificationId) {
    try {
      // If no ID, log an error and return
      if (!notificationId) {
        console.error('proovd: Cannot track impression - missing notification ID');
        return;
      }
      
      console.log(`proovd: Tracking impression for notification ${notificationId}`);
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

  async trackClick(notificationId) {
    try {
      // If no ID, log an error and return
      if (!notificationId) {
        console.error('proovd: Cannot track click - missing notification ID');
        return;
      }
      
      console.log(`proovd: Tracking click for notification ${notificationId}`);
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