/**
 * Proovd Widget
 * Version: 1.0.0
 * 
 * This is the main widget script that gets embedded on websites
 * to display social proof notifications.
 */
(function() {
  'use strict';

  // Check if widget is already initialized
  if (window._proovdInitialized) return;
  window._proovdInitialized = true;

  // Config
  const config = {
    websiteId: getWebsiteId(),
    baseUrl: window.location.origin,
    position: window._proovd?.position || 'bottom-right',
    delay: window._proovd?.delay || 3,
    displayTime: window._proovd?.displayTime || 5,
    theme: window._proovd?.theme || 'light',
    maxNotifications: window._proovd?.maxNotifications || 10,
    initialDelay: window._proovd?.initialDelay || 3,
    loop: window._proovd?.loop || false,
    randomize: window._proovd?.randomize || false,
    displayOrder: window._proovd?.displayOrder || 'newest',
    customStyles: window._proovd?.customStyles || ''
  };

  // Elements
  let container;
  let shadow;

  // Initialize
  function init() {
    // Only initialize if we have a valid website ID
  if (!config.websiteId) {
      console.error('Proovd: No website ID provided');
    return;
  }

    // Track pageview for analytics
  trackPageView();

    // Initialize shadow DOM
    initializeShadowDOM();
    
    // Add container to document
  document.body.appendChild(container);
  
    // Fetch notifications after delay
  setTimeout(() => {
    fetchNotifications();
    }, config.initialDelay * 1000);
  
  // Set up interval to refresh notifications
  setInterval(fetchNotifications, 30000);
  }

  /**
   * Set position of the container based on the position setting
   */
  function setPosition(element, position) {
    // Reset all positions
    element.style.top = 'auto';
    element.style.right = 'auto';
    element.style.bottom = 'auto';
    element.style.left = 'auto';
    
    // Set position based on setting
    switch (position) {
      case 'top-left':
        element.style.top = '20px';
        element.style.left = '20px';
        break;
      case 'top-right':
        element.style.top = '20px';
        element.style.right = '20px';
        break;
      case 'bottom-left':
        element.style.bottom = '20px';
        element.style.left = '20px';
        break;
      case 'bottom-right':
      default:
        element.style.bottom = '20px';
        element.style.right = '20px';
        break;
      case 'top-center':
        element.style.top = '20px';
        element.style.left = '50%';
        element.style.transform = 'translateX(-50%)';
        break;
      case 'bottom-center':
        element.style.bottom = '20px';
        element.style.left = '50%';
        element.style.transform = 'translateX(-50%)';
        break;
    }
  }

  /**
   * Track pageview for analytics
   */
  function trackPageView() {
    try {
      fetch(`${config.baseUrl}/api/websites/${config.websiteId}/pageview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: window.location.href,
          referrer: document.referrer,
          title: document.title
        })
      }).catch(error => {
        console.error('Proovd pageview tracking error:', error);
      });
    } catch (error) {
      console.error('Proovd pageview tracking error:', error);
    }
  }


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
        // Update config with server settings if provided
        if (data.settings) {
          console.log('Proovd: Received server settings:', data.settings);
          
          // Save previous settings for comparison
          const prevPosition = config.position;
          const prevTheme = config.theme;
          
          // Apply all settings from server
          config.position = data.settings.position || config.position;
          config.theme = data.settings.theme || config.theme;
          config.delay = data.settings.delay || config.delay;
          config.displayTime = data.settings.displayDuration || config.displayTime;
          config.maxNotifications = data.settings.maxNotifications || config.maxNotifications;
          config.initialDelay = data.settings.initialDelay || config.initialDelay;
          config.loop = typeof data.settings.loop === 'boolean' ? data.settings.loop : config.loop;
          config.randomize = typeof data.settings.randomize === 'boolean' ? data.settings.randomize : config.randomize;
          config.displayOrder = data.settings.displayOrder || config.displayOrder;
          config.customStyles = data.settings.customStyles || config.customStyles;
          
          // Always update container position when settings change
          if (prevPosition !== config.position) {
            console.log('Proovd: Updating position to', config.position);
            setPosition(container, config.position);
          }
          
          // Update theme on existing notifications if changed
          if (prevTheme !== config.theme && shadow) {
            console.log('Proovd: Updating theme to', config.theme);
            const notifications = shadow.querySelectorAll('.proovd-notification');
            notifications.forEach(notification => {
              // Remove old theme classes
              notification.classList.remove('proovd-theme-light', 'proovd-theme-dark', 'proovd-theme-blue', 'proovd-theme-green', 'proovd-theme-red', 'proovd-theme-minimal');
              // Add new theme class
              notification.classList.add(`proovd-theme-${config.theme}`);
            });
          }
          
          // Apply custom styles if provided
          if (config.customStyles && shadow) {
            let customStyleElement = shadow.querySelector('#proovd-custom-styles');
            if (!customStyleElement) {
              customStyleElement = document.createElement('style');
              customStyleElement.id = 'proovd-custom-styles';
              shadow.appendChild(customStyleElement);
            }
            customStyleElement.textContent = config.customStyles;
          }
        }
        
        if (data.notifications && data.notifications.length) {
          let notifications = data.notifications;
          
          // Apply display order setting
          if (config.randomize || config.displayOrder === 'random') {
            // Randomize order
            notifications = shuffleArray([...notifications]);
          } else if (config.displayOrder === 'oldest') {
            // Reverse to show oldest first
            notifications = [...notifications].reverse();
          }
          // 'newest' is default (no sorting needed as API already returns newest first)
          
          // Limit to max notifications
          if (config.maxNotifications > 0) {
            notifications = notifications.slice(0, config.maxNotifications);
          }
          
          displayNotificationsSequentially(notifications);
        }
      })
      .catch(error => {
        console.error('Proovd error:', error);
      });
  }
  
  /**
   * Shuffles array in place
   */
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  /**
   * Display notifications one at a time with delays
   */
  function displayNotificationsSequentially(notifications) {
    let notificationsQueue = [...notifications];
    
    // Clear any existing notifications if container exists
    if (shadow) {
      const existingNotifications = shadow.querySelectorAll('.proovd-notification');
      existingNotifications.forEach(notification => {
        removeNotification(notification);
      });
    }
    
    const showNext = () => {
      if (notificationsQueue.length === 0) {
        // If looping is enabled and we've gone through all notifications,
        // refill the queue and continue
        if (config.loop && notifications.length > 0) {
          console.log('Proovd: Looping notifications');
          // Reset the queue with a fresh copy of notifications
          notificationsQueue = [...notifications];
          
          // If randomize is enabled, shuffle the notifications again
          if (config.randomize || config.displayOrder === 'random') {
            notificationsQueue = shuffleArray(notificationsQueue);
          }
          
          // Add a small delay before starting the loop again
          setTimeout(() => {
            showNext();
          }, config.delay * 1000); // Use the configured delay between loops
        }
        return;
      }
      
      const notification = notificationsQueue.shift();
      displayNotification(notification);
      
      // Track impression
      trackImpression(notification._id);
      
      // Set timeout for next notification
      setTimeout(() => {
        showNext();
      }, (config.displayTime + config.delay) * 1000);
    };
    
    // Start showing notifications
    showNext();
  }
  
  /**
   * Display an individual notification
   */
  function displayNotification(notification) {
    if (!container || !shadow) return;
    
    // Create notification element
    const notificationEl = document.createElement('div');
    notificationEl.className = 'proovd-notification';
    notificationEl.dataset.id = notification._id;
    
    // Apply theme
    notificationEl.classList.add(`proovd-theme-${config.theme}`);
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'proovd-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      removeNotification(notificationEl);
    });
    
    // Create content
    const content = document.createElement('div');
    content.className = 'proovd-content';
    
    // Create message
    const message = document.createElement('div');
    message.className = 'proovd-message';
    message.textContent = notification.message;
    
    // Create image if available
    if (notification.image) {
      const img = document.createElement('img');
      img.src = notification.image;
      img.className = 'proovd-image';
      img.alt = '';
      content.appendChild(img);
    }
    
    // Assemble notification
    content.appendChild(message);
    notificationEl.appendChild(content);
    notificationEl.appendChild(closeButton);
    
    // Make entire notification clickable if there's a link
    if (notification.link) {
      notificationEl.classList.add('proovd-clickable');
      notificationEl.addEventListener('click', () => {
        // Track the click
        trackClick(notification._id);
        
        // Open the link in a new tab
        window.open(notification.link, '_blank');
      });
    }
    
    // Add to container
    container.appendChild(notificationEl);
    
    // Add animation class after a brief delay for transition effect
    setTimeout(() => {
      notificationEl.classList.add('proovd-show');
    }, 10);
    
    // Set timeout to remove notification
    setTimeout(() => {
      removeNotification(notificationEl);
    }, config.displayTime * 1000);
  }
  
  /**
   * Remove notification element with animation
   */
  function removeNotification(element) {
    element.classList.remove('proovd-show');
    element.classList.add('proovd-hide');
    
    // Remove from DOM after animation completes
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 500); // animation duration
  }
  
  /**
   * Track notification impression
   */
  function trackImpression(notificationId) {
    if (!notificationId) return;
    
    const url = new URL(`${config.baseUrl}/api/notifications/${notificationId}/impression`);
    
    fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ websiteId: config.websiteId })
    }).catch(error => {
      console.error('Proovd impression tracking error:', error);
    });
  }
  
  /**
   * Track notification click
   */
  function trackClick(notificationId) {
    if (!notificationId) return;
    
    const url = new URL(`${config.baseUrl}/api/notifications/${notificationId}/click`);
    
    fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ websiteId: config.websiteId })
    }).catch(error => {
      console.error('Proovd click tracking error:', error);
    });
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
   * Set up the shadow root and initial styles
   */
  function initializeShadowDOM() {
    // Create container
    container = document.createElement('div');
    container.className = 'proovd-container';
    
    // Set initial position
    setPosition(container, config.position);
    
    // Create shadow root
    shadow = container.attachShadow({ mode: 'open' });
    
    // Add base styles
    const style = document.createElement('style');
    style.textContent = `
      .proovd-container {
        position: fixed;
        z-index: 9999;
        width: 300px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        font-size: 14px;
      }
      
      .proovd-notification {
        position: relative;
        margin-bottom: 10px;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(20px);
        overflow: hidden;
      }
      
      .proovd-notification.proovd-show {
        opacity: 1;
        transform: translateY(0);
      }
      
      .proovd-notification.proovd-hide {
        opacity: 0;
        transform: translateY(-20px);
      }
      
      .proovd-close {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 20px;
        height: 20px;
        border: none;
        background: transparent;
        font-size: 16px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        opacity: 0.6;
        transition: opacity 0.2s;
      }
      
      .proovd-close:hover {
        opacity: 1;
      }
      
      .proovd-content {
        display: flex;
        align-items: center;
      }
      
      .proovd-image {
        width: 40px;
        height: 40px;
        margin-right: 12px;
        border-radius: 4px;
        object-fit: cover;
      }
      
      .proovd-message {
        flex: 1;
      }
      
      .proovd-clickable {
        cursor: pointer;
      }
      
      /* Theme: Light */
      .proovd-theme-light {
        background-color: #ffffff;
        color: #333333;
        border: 1px solid #e0e0e0;
      }
      
      .proovd-theme-light .proovd-close {
        color: #555555;
      }
      
      /* Theme: Dark */
      .proovd-theme-dark {
        background-color: #2d2d2d;
        color: #f0f0f0;
        border: 1px solid #444444;
      }
      
      .proovd-theme-dark .proovd-close {
        color: #d0d0d0;
      }
      
      /* Theme: Blue */
      .proovd-theme-blue {
        background-color: #eef5ff;
        color: #1a365d;
        border: 1px solid #c6d8ff;
      }
      
      .proovd-theme-blue .proovd-close {
        color: #4a5568;
      }
      
      /* Theme: Green */
      .proovd-theme-green {
        background-color: #f0fff4;
        color: #22543d;
        border: 1px solid #c6f6d5;
      }
      
      .proovd-theme-green .proovd-close {
        color: #4a5568;
      }
      
      /* Theme: Red */
      .proovd-theme-red {
        background-color: #fff5f5;
        color: #742a2a;
        border: 1px solid #fed7d7;
      }
      
      .proovd-theme-red .proovd-close {
        color: #4a5568;
      }
      
      /* Theme: Minimal */
      .proovd-theme-minimal {
        background-color: rgba(255, 255, 255, 0.9);
        color: #333333;
        border: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
      
      .proovd-theme-minimal .proovd-close {
        color: #555555;
      }
    `;
    
    shadow.appendChild(style);
  }

  /**
   * Get website ID from script attribute or window object
   */
  function getWebsiteId() {
    // Try to get from window object
    if (window._proovd && window._proovd.websiteId) {
      return window._proovd.websiteId;
    }
    
    // Try to get from script tag
    const scriptTags = document.querySelectorAll('script');
    for (let i = 0; i < scriptTags.length; i++) {
      const script = scriptTags[i];
      const src = script.src || '';
      
      if (src.includes('/widget.js')) {
        const urlParams = new URLSearchParams(src.split('?')[1]);
        if (urlParams.has('id')) {
          return urlParams.get('id');
        }
      }
    }
    
    // Try to extract from the current script URL
    const scriptSrc = document.currentScript?.src || '';
    const websiteIdMatch = scriptSrc.match(/\/w\/([^.]+)\.js/);
    return websiteIdMatch ? websiteIdMatch[1] : null;
  }
  
  // Initialize the widget
  init();
})(); 