/**
 * Proovd Widget
 * Version: 1.0.0
 * 
 * This is the main widget script that gets embedded on websites
 * to display social proof notifications.
 */
(function() {
  'use strict';

  // Extract website ID from the script URL
  const scriptSrc = document.currentScript.src;
  const websiteIdMatch = scriptSrc.match(/\/w\/([^.]+)\.js/);
  const websiteId = websiteIdMatch ? websiteIdMatch[1] : null;

  // Configuration defaults
  const config = {
    websiteId: websiteId,
    baseUrl: window._proovd?.baseUrl || 'https://proovd.in',
    position: window._proovd?.position || 'bottom-left',
    delay: window._proovd?.delay || 5,
    displayTime: window._proovd?.displayTime || 5,
    theme: window._proovd?.theme || 'light',
    maxNotifications: window._proovd?.maxNotifications || 10
  };

  // Only initialize if website ID is present
  if (!config.websiteId) {
    console.warn('Proovd: Website ID is missing. Widget will not be initialized.');
    return;
  }

  // Track the page view for analytics
  trackPageView();

  // Create container with shadow DOM for style isolation
  const container = document.createElement('div');
  container.id = 'proovd-container';
  container.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;';
  document.body.appendChild(container);
  
  // Create shadow DOM for style isolation
  const shadow = container.attachShadow({mode: 'closed'});
  
  // Position based on configuration
  setPosition(container, config.position);
  
  // Fetch and display notifications
  setTimeout(() => {
    fetchNotifications();
  }, config.delay * 1000);
  
  // Set up interval to refresh notifications
  setInterval(fetchNotifications, 30000);

  /**
   * Fetch notifications from the server
   */
  function fetchNotifications() {
    const url = new URL(`${config.baseUrl}/api/websites/${config.websiteId}/notifications/show`);
    url.searchParams.append('url', window.location.href);
    
    fetch(url.toString())
      .then(response => {
        if (!response.ok) {
          throw new Error(`Proovd: HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.notifications && data.notifications.length) {
          displayNotificationsSequentially(data.notifications);
        }
      })
      .catch(error => {
        console.error('Proovd error:', error);
      });
  }
  
  /**
   * Display notifications one after another
   */
  function displayNotificationsSequentially(notifications) {
    if (!notifications.length) return;
    
    let currentIndex = 0;
    let isDisplaying = false;
    
    function showNext() {
      if (isDisplaying || currentIndex >= notifications.length) return;
      
      isDisplaying = true;
      const notification = notifications[currentIndex++];
      
      displayNotification(notification, () => {
        isDisplaying = false;
        
        // Schedule next notification
        setTimeout(() => {
          showNext();
        }, 1000);
      });
      
      // Reset to beginning if we've shown all notifications
      if (currentIndex >= notifications.length) {
        currentIndex = 0;
      }
    }
    
    // Start the sequence
    showNext();
  }
  
  /**
   * Display a single notification
   */
  function displayNotification(notification, callback) {
    // Create notification element
    const element = document.createElement('div');
    element.className = 'spfy-notification';
    element.style.pointerEvents = 'auto';
    element.innerHTML = buildNotificationHTML(notification);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = getNotificationCSS(config.theme);
    
    // Add to DOM
    shadow.innerHTML = '';
    shadow.appendChild(style);
    shadow.appendChild(element);
    
    // Animate in
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, 10);
    
    // Record impression
    recordMetric('impression', notification._id);
    
    // Add click handler
    element.addEventListener('click', () => {
      recordMetric('click', notification._id);
    });
    
    // Animate out after display time
    setTimeout(() => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      
      // Wait for animation to complete before callback
      setTimeout(() => {
        if (typeof callback === 'function') {
          callback();
        }
      }, 500);
    }, config.displayTime * 1000);
  }
  
  /**
   * Set the position of the notification container
   */
  function setPosition(element, position) {
    const positions = {
      'bottom-left': { left: '20px', bottom: '20px' },
      'bottom-right': { right: '20px', bottom: '20px' },
      'top-left': { left: '20px', top: '20px' },
      'top-right': { right: '20px', top: '20px' }
    };
    
    const pos = positions[position] || positions['bottom-left'];
    
    for (const [key, value] of Object.entries(pos)) {
      element.style[key] = value;
    }
  }
  
  /**
   * Build HTML for a notification based on its type
   */
  function buildNotificationHTML(notification) {
    switch(notification.type) {
      case 'purchase':
        return `
          <div class="spfy-purchase">
            <div class="spfy-avatar">
              <img src="${notification.image || `${config.baseUrl}/images/default-avatar.png`}" alt="">
            </div>
            <div class="spfy-content">
              <p class="spfy-message">
                <strong>${notification.name || 'Someone'}</strong> from ${notification.location || 'somewhere'} 
                just purchased
              </p>
              <p class="spfy-product">${notification.productName || 'a product'}</p>
              <p class="spfy-time">${formatTime(notification.timestamp)}</p>
            </div>
          </div>
        `;
        
      case 'signup':
        return `
          <div class="spfy-signup">
            <div class="spfy-icon">👋</div>
            <div class="spfy-content">
              <p class="spfy-message">
                <strong>${notification.name || 'Someone'}</strong> from ${notification.location || 'somewhere'} 
                just signed up
              </p>
              <p class="spfy-time">${formatTime(notification.timestamp)}</p>
            </div>
          </div>
        `;
        
      case 'pageview':
        return `
          <div class="spfy-pageview">
            <div class="spfy-icon">👁️</div>
            <div class="spfy-content">
              <p class="spfy-message">
                <strong>${notification.count}</strong> people are viewing this page
              </p>
              <p class="spfy-time">right now</p>
            </div>
          </div>
        `;
        
      case 'custom':
      default:
        return `
          <div class="spfy-custom">
            <div class="spfy-icon">🔔</div>
            <div class="spfy-content">
              <p class="spfy-message">${notification.name || notification.productName || 'Notification'}</p>
              <p class="spfy-time">${formatTime(notification.timestamp)}</p>
            </div>
          </div>
        `;
    }
  }
  
  /**
   * Get CSS for notification styling
   */
  function getNotificationCSS(theme) {
    const isDark = theme === 'dark';
    
    const backgroundColor = isDark ? '#1f2937' : 'white';
    const textColor = isDark ? '#e5e7eb' : '#333333';
    const secondaryTextColor = isDark ? '#9ca3af' : '#666666';
    const borderColor = isDark ? '#374151' : '#f3f4f6';
    
    return `
      .spfy-notification {
        display: flex;
        background: ${backgroundColor};
        color: ${textColor};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 12px;
        width: 280px;
        max-width: 90vw;
        transition: all 0.3s ease;
        margin-bottom: 10px;
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        border: 1px solid ${borderColor};
      }
      .spfy-notification:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
      }
      .spfy-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        overflow: hidden;
        margin-right: 12px;
        flex-shrink: 0;
      }
      .spfy-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .spfy-icon {
        width: 48px;
        height: 48px;
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        flex-shrink: 0;
      }
      .spfy-content {
        flex: 1;
      }
      .spfy-message {
        margin: 0 0 4px 0;
        font-size: 14px;
        line-height: 1.4;
      }
      .spfy-product {
        margin: 0 0 4px 0;
        font-size: 13px;
        font-weight: bold;
      }
      .spfy-time {
        margin: 0;
        font-size: 12px;
        color: ${secondaryTextColor};
      }
    `;
  }
  
  /**
   * Format timestamp to relative time
   */
  function formatTime(timestamp) {
    if (!timestamp) return 'just now';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffSeconds = Math.floor((now - time) / 1000);
    
    if (diffSeconds < 60) return 'just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minute${Math.floor(diffSeconds / 60) !== 1 ? 's' : ''} ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hour${Math.floor(diffSeconds / 3600) !== 1 ? 's' : ''} ago`;
    if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)} day${Math.floor(diffSeconds / 86400) !== 1 ? 's' : ''} ago`;
    
    return time.toLocaleDateString();
  }
  
  /**
   * Record a metric (impression or click)
   */
  function recordMetric(type, notificationId) {
    try {
      fetch(`${config.baseUrl}/api/websites/${config.websiteId}/notifications/${notificationId}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          url: window.location.href
        })
      });
    } catch (error) {
      console.error(`Proovd: Error recording ${type}`, error);
    }
  }
  
  /**
   * Track page view for analytics
   */
  function trackPageView() {
    try {
      fetch(`${config.baseUrl}/api/pageview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          websiteId: config.websiteId,
          url: window.location.href,
          referrer: document.referrer,
          title: document.title
        })
      });
    } catch (error) {
      console.error('Proovd: Error tracking page view', error);
    }
  }
})(); 