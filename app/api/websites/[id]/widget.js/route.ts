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
          
          // Create notification element
          const notifElement = document.createElement('div');
          notifElement.className = 'proovd-notification';
          
          // Apply theme styles
          const theme = widgetSettings.theme || 'light';
          
          // Set styles based on theme
          const themeStyles = {
            light: {
              background: '#FFFFFF',
              color: '#333333',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              linkColor: '#007bff'
            },
            dark: {
              background: '#1F2937',
              color: '#F9FAFB',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              linkColor: '#60A5FA'
            }
          };
          
          const style = themeStyles[theme] || themeStyles.light;
          
          // Apply styles
          Object.assign(notifElement.style, {
            display: 'flex',
            flexDirection: 'column',
            padding: '12px 16px',
            borderRadius: '8px',
            maxWidth: '320px',
            marginBottom: '12px',
            backgroundColor: style.background,
            color: style.color,
            boxShadow: style.boxShadow,
            animation: 'proovdFadeIn 0.3s ease forwards',
            overflow: 'hidden',
            opacity: '0',
            transition: 'all 0.3s ease',
            cursor: notification.link ? 'pointer' : 'default'
          });
          
          // Set cursor style for clickable notifications
          if (notification.link) {
            notifElement.style.cursor = 'pointer';
          }
          
          // Create content
          let content = '';
          
          if (notification.image) {
            content += \`<div style="display:flex;margin-bottom:8px;align-items:center;">
              <img src="\${sanitizeText(notification.image)}" alt="" style="width:40px;height:40px;border-radius:50%;margin-right:10px;object-fit:cover;">
            </div>\`;
          }
          
          content += \`<div style="display:flex;flex-direction:column;">
            <h3 style="margin:0 0 4px;font-size:14px;font-weight:600;">\${sanitizeText(notification.title)}</h3>
            <p style="margin:0 0 6px;font-size:13px;">\${sanitizeText(notification.message)}</p>
          </div>\`;
          
          if (notification.timeAgo || notification.fakeTimestamp) {
            const timestamp = notification.fakeTimestamp || notification.createdAt;
            const timeAgo = formatTimeAgo(timestamp);
            content += \`<div style="font-size:11px;color:#718096;margin-top:4px;">\${timeAgo}</div>\`;
          }
          
          notifElement.innerHTML = content;
          
          // Add click handler for the entire notification if there's a link
          if (notification.link) {
            notifElement.addEventListener('click', function(event) {
              // Track the click
              trackEvent(notification._id, 'click', function() {
                // Open the link in a new tab
                window.open(notification.link, '_blank');
              });
            });
          }
          
          // Add to container
          container.appendChild(notifElement);
          
          // Add animation styles if not already added
          if (!document.getElementById('proovd-animations')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'proovd-animations';
            styleElement.textContent = \`
              @keyframes proovdFadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes proovdFadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-20px); }
              }
            \`;
            document.head.appendChild(styleElement);
          }
          
          // Trigger fade in
          setTimeout(() => {
            notifElement.style.opacity = '1';
            notifElement.style.transform = 'translateY(0)';
          }, 10);
          
          // Track impression after the notification is visible
          setTimeout(() => {
            trackEvent(notification._id, 'impression');
          }, 200);
          
          // Store the frequency of viewing
          const frequency = notification.displayFrequency || 'always';
          if (frequency !== 'always') {
            storage.markNotificationSeen(notification._id, frequency);
          }
          
          // Set timer to remove notification
          displayTimer = setTimeout(() => {
            // Trigger fade out
            notifElement.style.opacity = '0';
            notifElement.style.transform = 'translateY(-20px)';
            
            // Remove after animation completes
            setTimeout(() => {
              if (container.contains(notifElement)) {
                container.removeChild(notifElement);
              }
              isDisplaying = false;
              currentNotification = null;
              
              // Process next notification after delay
              setTimeout(processQueue, (widgetSettings.delay || 5) * 1000);
            }, 300);
          }, (widgetSettings.displayDuration || 5) * 1000);
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