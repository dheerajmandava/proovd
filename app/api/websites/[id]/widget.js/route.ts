import { NextRequest, NextResponse } from 'next/server';
import { getWebsiteById } from '@/app/lib/services';
import { isValidObjectId } from 'mongoose';
import { handleApiError } from '@/app/lib/utils/error';
import { sanitizeInput } from '@/app/lib/server-utils';

/**
 * GET /api/websites/[id]/widget.js
 * 
 * Returns the widget script for a website.
 * This is a public endpoint that returns JavaScript to be embedded in customer websites.
 * 
 * Authentication is based on the website ID and domain verification.
 */
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    // Get the website ID from the params
    const { id } = params;
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return new NextResponse(`console.error("Invalid website ID");`, {
        status: 400,
        headers: {
          'Content-Type': 'application/javascript',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Get the website using service layer
    const website = await getWebsiteById(id);

    if (!website) {
      return new NextResponse(`console.error("Website not found");`, {
        status: 404,
        headers: {
          'Content-Type': 'application/javascript',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    
    // Check if the website is active
    if (website.status !== 'active' && website.status !== 'verified') {
      return new NextResponse(`console.error("Website is not active");`, {
        status: 403,
        headers: {
          'Content-Type': 'application/javascript',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    
    // Get the referer domain
    const referer = request.headers.get('referer');
    
    // Domain validation: Check if the referer matches the website domain or allowed domains
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        let refererDomain = refererUrl.hostname.toLowerCase();
        
         // Normalize domain by removing www. prefix
        refererDomain = refererDomain.replace(/^www\./i, '');

        // Also normalize the website domain
        const normalizedSiteDomain = website.domain.replace(/^www\./i, '');
        
        // Check if domain matches or is in allowed domains
        const allowedDomainsList = website.allowedDomains || [];

        // Normalize each allowed domain too
        const normalizedAllowedDomains = allowedDomainsList.map(d => d.replace(/^www\./i, ''));

        // Check if domain matches or is in allowed domains
        const domainMatches = 
          normalizedSiteDomain === refererDomain || 
          normalizedAllowedDomains.includes(refererDomain);
        
        if (!domainMatches) {
          // Log the mismatch but don't block in development
          console.warn(`Domain mismatch: ${refererDomain} vs ${website.domain} or ${website.allowedDomains}`);
          
          // In production, block mismatched domains
         
            return new NextResponse(`console.error("Domain not authorized");`, {
              status: 403,
              headers: {
                'Content-Type': 'application/javascript',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Max-Age': '86400',
              },
            });
          
        }
      } catch (error) {
        console.error('Error parsing referer:', error);
      }
    }
    
    // Get the website settings
    const settings = website.settings || {
      position: 'bottom-left',
      delay: 5,
      displayDuration: 5,
      maxNotifications: 5,
      theme: 'light',
    };
    
    // Get the API URL from the current request
    const host = request.headers.get('host') || '';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const apiUrl = `${protocol}://${host}`;
    
    // Build the widget script
    const widgetScript = `
      // Proovd Social Proof Widget
      (function() {
        const websiteId = "${id}";
        const widgetSettings = ${JSON.stringify(settings)};
        const apiBaseUrl = '${apiUrl}';
        
        // Create container element
        const container = document.createElement('div');
        container.id = 'proovd-notifications';
        container.style.position = 'fixed';
        container.style.zIndex = '9999';
        
        // Set position based on settings
        switch(widgetSettings.position) {
          case 'bottom-left':
            container.style.bottom = '20px';
            container.style.left = '20px';
            break;
          case 'bottom-right':
            container.style.bottom = '20px';
            container.style.right = '20px';
            break;
          case 'top-left':
            container.style.top = '20px';
            container.style.left = '20px';
            break;
          case 'top-right':
            container.style.top = '20px';
            container.style.right = '20px';
            break;
          default:
            container.style.bottom = '20px';
            container.style.left = '20px';
        }
        
        // Append to body
        document.body.appendChild(container);
        
        // State management
        let notificationQueue = [];
        let currentNotification = null;
        let isDisplaying = false;
        let displayTimer = null;
        
        // Helper functions for frequency management
        const storage = {
          isNotificationSeen: (id, frequency) => {
            const key = \`proovd_notification_\${id}\`;
            if (frequency === 'once_per_session') {
              return sessionStorage.getItem(key) !== null;
            } else if (frequency === 'once_per_browser') {
              return localStorage.getItem(key) !== null;
            }
            return false;
          },
          markNotificationSeen: (id, frequency) => {
            const key = \`proovd_notification_\${id}\`;
            if (frequency === 'once_per_session') {
              sessionStorage.setItem(key, Date.now().toString());
            } else if (frequency === 'once_per_browser') {
              localStorage.setItem(key, Date.now().toString());
            }
          }
        };
        
        // Format time ago strings
        function formatTimeAgo(timestamp) {
          if (!timestamp) return 'recently';
          
          const now = new Date();
          const time = new Date(timestamp);
          const diff = Math.floor((now - time) / 1000);
          
          if (diff < 60) return 'just now';
          if (diff < 120) return '1 minute ago';
          if (diff < 3600) return Math.floor(diff / 60) + ' minutes ago';
          if (diff < 7200) return '1 hour ago';
          if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
          if (diff < 172800) return 'yesterday';
          return Math.floor(diff / 86400) + ' days ago';
        }
        
        // Sanitize text to prevent XSS
        function sanitizeText(text) {
          const element = document.createElement('div');
          element.textContent = text;
          return element.innerHTML;
        }
        
        // Analytics tracking (impressions and clicks)
        function trackEvent(notificationId, eventType, callback) {
          // Create XHR request for better browser compatibility
          const xhr = new XMLHttpRequest();
          xhr.open('POST', apiBaseUrl + '/api/notifications/' + notificationId + '/' + eventType, true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          
          // Handle response
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
              if (xhr.status >= 200 && xhr.status < 300) {
                console.log('Tracked ' + eventType + ' successfully');
              } else {
                console.error('Failed to track ' + eventType + ': ' + xhr.status);
              }
              
              // Execute callback if provided
              if (typeof callback === 'function') {
                callback();
              }
            }
          };
          
          // Prepare and send data
          xhr.send(JSON.stringify({
            websiteId: websiteId,
            timestamp: new Date().toISOString(),
            metadata: {
              url: window.location.href,
              referrer: document.referrer,
              userAgent: navigator.userAgent,
              deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
            }
          }));
          
          // For impression tracking or if no callback, return immediately
          return eventType === 'impression' || !callback;
        }
        
        // Load all notifications at startup
        async function loadNotifications() {
          try {
            const response = await fetch(\`\${apiBaseUrl}/api/websites/\${websiteId}/notifications/show\`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (!response.ok) {
              throw new Error('Failed to fetch notifications');
            }
            
            const data = await response.json();
            
            if (data.notifications && data.notifications.length > 0) {
              // Filter notifications based on frequency settings
              notificationQueue = data.notifications.filter(notification => {
                const frequency = notification.displayFrequency || 'always';
                return frequency === 'always' || !storage.isNotificationSeen(notification._id, frequency);
              });
              
              // Randomize slightly if needed
              if (widgetSettings.randomize) {
                shuffleArray(notificationQueue);
              }
              
              // Start display process after initial delay
              setTimeout(processQueue, (widgetSettings.initialDelay || widgetSettings.delay || 5) * 1000);
            }
          } catch (error) {
            console.error('Error loading notifications:', error);
          }
        }
        
        // Process notification queue
        function processQueue() {
          if (notificationQueue.length === 0 || isDisplaying) {
            return;
          }
          
          // Get the next notification
          currentNotification = notificationQueue.shift();
          
          // Display notification
          displayNotification(currentNotification);
          
          // If loop is enabled, add it back to the end
          if (widgetSettings.loop && notificationQueue.length < widgetSettings.maxNotifications) {
            notificationQueue.push(currentNotification);
          }
        }
        
        // Display a notification
        function displayNotification(notification) {
          isDisplaying = true;
          
          // Mark as seen based on frequency setting
          const frequency = notification.displayFrequency || 'always';
          if (frequency !== 'always') {
            storage.markNotificationSeen(notification._id, frequency);
          }
          
          // Create notification element
          const notificationEl = document.createElement('div');
          notificationEl.className = 'proovd-notification';
          notificationEl.style.backgroundColor = widgetSettings.theme === 'dark' ? '#333' : '#fff';
          notificationEl.style.color = widgetSettings.theme === 'dark' ? '#fff' : '#333';
          notificationEl.style.borderRadius = '8px';
          notificationEl.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          notificationEl.style.padding = '12px';
          notificationEl.style.marginTop = '10px';
          notificationEl.style.width = '384px'; // Updated to match Real Estate template width
          notificationEl.style.maxWidth = '90vw';
          notificationEl.style.opacity = '0';
          notificationEl.style.transform = 'translateY(20px)';
          notificationEl.style.transition = 'opacity 0.3s, transform 0.3s';
          notificationEl.style.cursor = notification.url ? 'pointer' : 'default';
          
          // Check if this is a component-based notification
          if (notification.isComponentBased && notification.components && notification.components.length > 0) {
            console.log('Rendering component-based notification:', notification.name);
            renderComponentBasedNotification(notificationEl, notification);
          } else {
            // Traditional notification rendering
            let content = '';
            
            switch(notification.type) {
              case 'conversion':
                content = \`
                  <div style="display: flex; align-items: center;">
                    <div style="margin-right: 10px;">
                      <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                        \${notification.image ? \`<img src="\${notification.image}" style="width: 100%; height: 100%; object-fit: cover;">\` : '<div style="font-size: 16px; font-weight: bold;">' + (notification.name || 'Someone').charAt(0) + '</div>'}
                      </div>
                    </div>
                    <div>
                      <div style="font-weight: bold;">\${sanitizeText(notification.name || 'Someone')}</div>
                      <div>\${sanitizeText(notification.message || 'purchased recently')}</div>
                      <div style="font-size: 12px; margin-top: 4px; color: #999;">\${formatTimeAgo(notification.timestamp || notification.createdAt)}</div>
                    </div>
                  </div>
                \`;
                break;
                
              default:
                content = \`
                  <div style="display: flex; align-items: center;">
                    <div style="margin-right: 10px;">
                      <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                        \${notification.image ? \`<img src="\${notification.image}" style="width: 100%; height: 100%; object-fit: cover;">\` : '<div style="font-size: 16px; font-weight: bold;">' + (notification.title || notification.name || 'Notification').charAt(0) + '</div>'}
                      </div>
                    </div>
                    <div>
                      <div style="font-weight: bold;">\${sanitizeText(notification.title || notification.name || '')}</div>
                      <div>\${sanitizeText(notification.message || '')}</div>
                      <div style="font-size: 12px; margin-top: 4px; color: #999;">\${formatTimeAgo(notification.fakeTimestamp || notification.timestamp || notification.createdAt)}</div>
                    </div>
                  </div>
                \`;
            }
            
            notificationEl.innerHTML = content;
          }
          
          // Add close button
          const closeButton = document.createElement('div');
          closeButton.style.position = 'absolute';
          closeButton.style.top = '8px';
          closeButton.style.right = '8px';
          closeButton.style.fontSize = '16px';
          closeButton.style.fontWeight = 'bold';
          closeButton.style.cursor = 'pointer';
          closeButton.style.color = widgetSettings.theme === 'dark' ? '#ccc' : '#888';
          closeButton.innerHTML = '×';
          closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            hideNotification(notificationEl);
          });
          
          notificationEl.style.position = 'relative';
          
          // Only append close button if not already in the notification
          if (!notificationEl.querySelector('.proovd-close-btn')) {
            notificationEl.appendChild(closeButton);
          }
          
          // Add link handler
          if (notification.url) {
            notificationEl.addEventListener('click', () => {
              // Track click then navigate
              trackEvent(notification._id, 'click', function() {
                // Open the link in a new tab
                window.open(notification.url, '_blank');
              });
            });
          }
          
          // Display with animation
          container.appendChild(notificationEl);
          
          // Forces a reflow, allowing the transition to take effect
          void notificationEl.offsetWidth;
          
          // Show notification with animation
          notificationEl.style.opacity = '1';
          notificationEl.style.transform = 'translateY(0)';
          
          // Track impression
          setTimeout(() => {
            trackEvent(notification._id, 'impression');
          }, 200);
          
          // Set display duration
          const duration = notification.displayDuration || widgetSettings.displayDuration || 5;
          displayTimer = setTimeout(() => {
            hideNotification(notificationEl);
          }, duration * 1000);
        }
        
        // Render component-based notification
        function renderComponentBasedNotification(container, notification) {
          console.log('Components:', notification.components);
          
          // Set container as relative positioning context
          container.style.position = 'relative';
          container.style.minHeight = '100px'; // Ensure minimum height
          
          // Calculate bounding box to adjust for negative coordinates
          let minX = 0, minY = 0;
          notification.components.forEach(component => {
            if (component && component.position) {
              minX = Math.min(minX, component.position.x || 0);
              minY = Math.min(minY, component.position.y || 0);
            }
          });
          
          // Adjust container padding to accommodate negative positions
          if (minX < 0 || minY < 0) {
            console.log('Adjusting for negative coordinates:', minX, minY);
            container.style.padding = \`\${Math.abs(minY) + 12}px \${Math.abs(minX) + 12}px 12px 12px\`;
          }
          
          // Render each component
          notification.components.forEach((component, index) => {
            // Skip if missing essential data
            if (!component || !component.type) {
              console.error('Invalid component:', component);
              return;
            }
            
            const id = component.id || \`comp-\${index}\`;
            const type = component.type;
            const content = component.content || '';
            const position = component.position || { x: 0, y: 0 };
            const style = component.style || {};
            
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
                // Use innerHTML to render formatted text
                element.innerHTML = content;
                // Apply default text styles if not provided
                if (!style.fontSize) element.style.fontSize = '14px';
                if (!style.color) element.style.color = '#333333';
                break;
            }
            
            // Add debug classes and attributes
            element.className = \`proovd-component proovd-\${type}\`;
            element.setAttribute('data-component-id', id);
            element.setAttribute('data-component-type', type);
            element.setAttribute('data-component-index', index);
            
            // Position the element - account for negative coordinates
            element.style.position = 'absolute';
            element.style.left = \`\${position.x + Math.abs(minX)}px\`;
            element.style.top = \`\${position.y + Math.abs(minY)}px\`;
            element.style.transform = 'translate(0, 0)'; 
            element.style.display = 'block';
            element.style.whiteSpace = 'nowrap';
            
            // Apply custom styles
            for (const prop in style) {
              try {
                element.style[prop] = style[prop];
              } catch (err) {
                console.error('Error setting style', prop, style[prop], err);
              }
            }
            
            // Add to container
            container.appendChild(element);
          });
        }
        
        // Hide notification with animation
        function hideNotification(el) {
          clearTimeout(displayTimer);
          
          el.style.opacity = '0';
          el.style.transform = 'translateY(20px)';
          
          setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
            isDisplaying = false;
            
            // Schedule next notification
            setTimeout(() => {
              processQueue();
            }, (widgetSettings.delay || 5) * 1000);
          }, 300); // Animation duration
        }
        
        // Helper to shuffle array for randomization
        function shuffleArray(array) {
          for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
          }
          return array;
        }
        
        // Start loading after DOM is ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', loadNotifications);
        } else {
          loadNotifications();
        }
      })();
    `;
    
    // Return the widget script with appropriate headers
    return new NextResponse(widgetScript, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Max-Age': '86400',
      },
    });
    
  } catch (error) {
    console.error('Error generating widget script:', error);
    return handleApiError(error);
  }
}

// Helper function to sanitize text for inclusion in JavaScript
function sanitizeText(text: string): string {
  if (!text) return '';
  return sanitizeInput(text)
    .replace(/"/g, '\\"')  // Escape double quotes
    .replace(/\n/g, ' ');  // Replace newlines with spaces
} 