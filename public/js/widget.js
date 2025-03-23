/**
 * Proovd Widget
 * 
 * This script creates and manages social proof notifications on your website.
 * It fetches notification data from the Proovd API and displays them
 * according to your configuration.
 * 
 * @version 1.0.0
 */

(function() {
  // Configuration defaults
  const DEFAULT_CONFIG = {
    position: 'bottom-left', // bottom-left, bottom-right, top-left, top-right
    delay: 3000, // Time before first notification appears (ms)
    displayTime: 5000, // How long each notification stays visible (ms)
    maxNotifications: 5, // Maximum number of notifications to show before stopping
    animationDuration: 300, // Animation duration in ms
    gap: 1000, // Time between notifications
    pulsateEffect: true, // Whether to add a subtle pulse effect
    theme: 'light', // light or dark
  };

  // Widget state
  let config = {};
  let apiKey = null;
  let containerEl = null;
  let notifications = [];
  let currentNotification = null;
  let notificationIndex = 0;
  let notificationsShown = 0;
  let isActive = false;
  let timer = null;
  let baseUrl = 'https://proovd.vercel.app'; // Replace with your actual API base URL
  
  // DOM Helpers
  function createStyle() {
    const styleEl = document.createElement('style');
    styleEl.id = 'proovd-style';
    styleEl.textContent = `
      .sp-notification-container {
        position: fixed;
        z-index: 9999;
        width: 300px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        transition: all 0.3s ease;
      }
      .sp-notification-container.bottom-left {
        left: 20px;
        bottom: 20px;
      }
      .sp-notification-container.bottom-right {
        right: 20px;
        bottom: 20px;
      }
      .sp-notification-container.top-left {
        left: 20px;
        top: 20px;
      }
      .sp-notification-container.top-right {
        right: 20px;
        top: 20px;
      }
      .sp-notification {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 14px;
        margin-top: 10px;
        display: flex;
        align-items: center;
        transform: translateY(20px);
        opacity: 0;
        transition: all ${config.animationDuration}ms ease;
        overflow: hidden;
        position: relative;
      }
      .sp-notification.active {
        transform: translateY(0);
        opacity: 1;
      }
      .sp-notification.dark {
        background: #1f2937;
        color: #fff;
      }
      .sp-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        overflow: hidden;
        margin-right: 12px;
        flex-shrink: 0;
      }
      .sp-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .sp-content {
        flex: 1;
      }
      .sp-name {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 2px;
      }
      .sp-message {
        font-size: 13px;
        color: #4b5563;
        margin-bottom: 4px;
      }
      .sp-notification.dark .sp-message {
        color: #d1d5db;
      }
      .sp-time {
        font-size: 12px;
        color: #6b7280;
      }
      .sp-notification.dark .sp-time {
        color: #9ca3af;
      }
      .sp-close {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 0.2s;
      }
      .sp-close:hover {
        opacity: 1;
      }
      .sp-close:before, .sp-close:after {
        content: '';
        position: absolute;
        width: 10px;
        height: 2px;
        background: #6b7280;
      }
      .sp-notification.dark .sp-close:before,
      .sp-notification.dark .sp-close:after {
        background: #d1d5db;
      }
      .sp-close:before {
        transform: rotate(45deg);
      }
      .sp-close:after {
        transform: rotate(-45deg);
      }
      .sp-pulse {
        animation: sp-pulse 2s infinite;
      }
      @keyframes sp-pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(66, 153, 225, 0.5);
        }
        70% {
          box-shadow: 0 0 0 6px rgba(66, 153, 225, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(66, 153, 225, 0);
        }
      }
    `;
    document.head.appendChild(styleEl);
  }

  function createContainer() {
    containerEl = document.createElement('div');
    containerEl.className = `sp-notification-container ${config.position}`;
    containerEl.id = 'proovd-container';
    document.body.appendChild(containerEl);
  }

  function createNotificationElement(notification) {
    const el = document.createElement('div');
    el.className = `sp-notification ${config.theme}`;
    
    if (config.pulsateEffect) {
      el.classList.add('sp-pulse');
    }

    const timeAgo = formatTimeAgo(new Date(notification.timestamp));
    
    el.innerHTML = `
      <div class="sp-avatar">
        <img src="${notification.image || `${baseUrl}/placeholder-avatar.png`}" alt="${notification.name || 'User'}">
      </div>
      <div class="sp-content">
        <div class="sp-name">${notification.name || 'Someone'}</div>
        <div class="sp-message">${notification.message || `purchased ${notification.productName}`}</div>
        <div class="sp-time">${timeAgo}</div>
      </div>
      <div class="sp-close" title="Close"></div>
    `;
    
    // Add click event to notification
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('sp-close')) {
        hideNotification(el);
        return;
      }
      
      // Track click
      trackEvent('click', notification.id);
      
      // Open URL if available
      if (notification.url) {
        window.open(notification.url, '_blank');
      }
    });
    
    return el;
  }

  function showNotification(notification) {
    if (!containerEl || !notification) return;
    
    // Track impression
    trackEvent('impression', notification.id);
    
    const notificationEl = createNotificationElement(notification);
    containerEl.appendChild(notificationEl);
    currentNotification = {
      element: notificationEl,
      data: notification
    };
    
    // Trigger reflow to ensure the transition works
    notificationEl.offsetHeight;
    notificationEl.classList.add('active');
    
    notificationsShown++;
    
    // Set timeout to hide notification
    timer = setTimeout(() => {
      hideNotification(notificationEl);
    }, config.displayTime);
  }

  function hideNotification(el) {
    if (!el) return;
    
    el.classList.remove('active');
    
    setTimeout(() => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
      
      currentNotification = null;
      
      // Show next notification after a gap, if there are more
      if (isActive && notifications.length > notificationIndex && notificationsShown < config.maxNotifications) {
        timer = setTimeout(() => {
          showNextNotification();
        }, config.gap);
      } else if (notificationsShown >= config.maxNotifications) {
        isActive = false;
      }
    }, config.animationDuration);
  }

  function showNextNotification() {
    if (!isActive || currentNotification) return;
    
    if (notificationIndex < notifications.length) {
      showNotification(notifications[notificationIndex]);
      notificationIndex++;
    } else {
      // We've gone through all notifications, reset index to loop
      notificationIndex = 0;
      if (notifications.length > 0) {
        showNotification(notifications[notificationIndex]);
        notificationIndex++;
      }
    }
  }

  // Utility functions
  function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
    } else if (diffDay < 7) {
      return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  function trackEvent(type, notificationId) {
    if (!apiKey || !notificationId) return;
    
    // Don't wait for the response
    fetch(`${baseUrl}/api/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        notificationId,
        type, // 'impression' or 'click'
        url: window.location.href,
        timestamp: new Date().toISOString()
      }),
    }).catch(err => console.error('Proovd tracking error:', err));
  }

  // API functions
  async function fetchNotifications() {
    if (!apiKey) {
      console.error('Proovd: API key is required');
      return;
    }
    
    try {
      const response = await fetch(`${baseUrl}/api/notifications?apiKey=${apiKey}&url=${encodeURIComponent(window.location.href)}`);
      
      if (!response.ok) {
        throw new Error(`Proovd API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data.notifications)) {
        notifications = data.notifications;
        if (notifications.length > 0 && isActive) {
          // Reset notification index
          notificationIndex = 0;
          
          // Clear any existing timer
          if (timer) {
            clearTimeout(timer);
          }
          
          // Start showing notifications
          if (!currentNotification) {
            timer = setTimeout(() => {
              showNextNotification();
            }, config.delay);
          }
        }
      }
    } catch (err) {
      console.error('Proovd: Failed to fetch notifications', err);
    }
  }

  // Public API
  window.Proovd = {
    /**
     * Initialize the Proovd widget
     * @param {string} key - Your Proovd API key
     * @param {Object} options - Configuration options
     */
    init: function(key, options = {}) {
      if (!key) {
        console.error('Proovd: API key is required');
        return;
      }
      
      // Already initialized
      if (apiKey) {
        console.warn('Proovd: Widget already initialized');
        return;
      }
      
      apiKey = key;
      config = { ...DEFAULT_CONFIG, ...options };
      
      // Create widget elements
      createStyle();
      createContainer();
      
      // Fetch initial notifications
      fetchNotifications();
      
      // Set refresh interval
      setInterval(fetchNotifications, 60000); // Refresh every minute
      
      // Start showing notifications
      isActive = true;
      
      console.log('Proovd: Widget initialized');
    },
    
    /**
     * Start showing notifications
     */
    start: function() {
      if (!apiKey) {
        console.error('Proovd: Widget not initialized');
        return;
      }
      
      isActive = true;
      notificationsShown = 0; // Reset count
      
      if (!currentNotification && notifications.length > 0) {
        timer = setTimeout(() => {
          showNextNotification();
        }, config.delay);
      }
    },
    
    /**
     * Stop showing notifications
     */
    stop: function() {
      isActive = false;
      
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      
      if (currentNotification) {
        hideNotification(currentNotification.element);
      }
    },
    
    /**
     * Update widget configuration
     * @param {Object} options - New configuration options
     */
    updateConfig: function(options) {
      if (!apiKey) {
        console.error('Proovd: Widget not initialized');
        return;
      }
      
      config = { ...config, ...options };
      
      // Update container position if it was changed
      if (containerEl) {
        containerEl.className = `sp-notification-container ${config.position}`;
      }
    },
    
    /**
     * Manually refresh notifications
     */
    refresh: function() {
      if (!apiKey) {
        console.error('Proovd: Widget not initialized');
        return;
      }
      
      fetchNotifications();
    }
  };
})(); 