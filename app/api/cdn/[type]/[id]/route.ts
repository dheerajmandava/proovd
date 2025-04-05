import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { type: string; id: string } }
) {
  const { type, id } = params;

  // Only handle notification widget requests
  if (type !== 'n') {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    const { db } = await connectToDatabase();
    const website = await db.collection('websites').findOne({
      _id: new ObjectId(id)
    });

    if (!website) {
      return new NextResponse('Website not found', { status: 404 });
    }

    // Generate the widget script with tracking
    const script = `
      (function() {
        // Configuration
        const websiteId = '${id}';
        const config = ${JSON.stringify(website.settings || {})};
        const PROOVD_DOMAIN = 'https://www.proovd.in';
        
        // Tracking function with callback
        function track(type, notificationId, callback = null) {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', PROOVD_DOMAIN + '/api/notifications/' + notificationId + '/' + type, true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
              if (xhr.status >= 200 && xhr.status < 300) {
                console.log('Tracked ' + type + ' successfully');
              } else {
                console.error('Failed to track ' + type + ': ' + xhr.status);
              }
              
              // Execute callback regardless of success/failure
              if (typeof callback === 'function') {
                callback();
              }
            }
          };
          
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
          
          // For impressions or if callback is null, return immediately
          // For clicks with callback, it will execute after the XHR completes
          if (type === 'impression' || callback === null) {
            return true;
          }
        }

        // Create and show notification
        function showNotification(notification) {
          const container = document.createElement('div');
          container.className = 'proovd-notification';
          
          // Apply theme styles
          const theme = config.theme || 'light';
          container.classList.add(\`proovd-theme-\${theme}\`);
          
          // Create notification content
          const content = document.createElement('div');
          content.className = 'proovd-content';
          
          // Add title
          const title = document.createElement('h4');
          title.textContent = notification.title;
          content.appendChild(title);
          
          // Add message
          const message = document.createElement('p');
          message.textContent = notification.message;
          content.appendChild(message);
          
          // Add link if present
          if (notification.link) {
            const link = document.createElement('a');
            link.href = notification.link;
            link.textContent = 'Learn More';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            
            // Handle click tracking - using regular anchor with onclick handler
            link.onclick = function(e) {
              e.preventDefault();
              const href = this.href;
              
              track('click', notification._id, function() {
                // Use window.location instead of window.open to prevent popup blocking
                // but still open in new tab using target attribute
                window.open(href, '_blank');
              });
              
              return false; // Prevent default and stop propagation
            };
            
            content.appendChild(link);
          }
          
          container.appendChild(content);

          // Position the notification based on settings
          const position = config.position || 'bottom-right';
          const [vertical, horizontal] = position.split('-');
          
          Object.assign(container.style, {
            position: 'fixed',
            [vertical]: '20px',
            [horizontal]: '20px',
            zIndex: '9999',
            backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a',
            color: theme === 'light' ? '#000000' : '#ffffff',
            padding: '15px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            maxWidth: '400px',
            animation: 'proovdSlideIn 0.3s ease-out',
            cursor: notification.link ? 'pointer' : 'default'
          });

          // Make entire notification clickable if there's a link
          if (notification.link) {
            container.onclick = function(e) {
              // Only trigger for clicks outside the link element
              if (e.target.tagName !== 'A') {
                e.preventDefault();
                const href = notification.link;
                
                track('click', notification._id, function() {
                  window.open(href, '_blank');
                });
                
                return false;
              }
            };
          }

          // Add animation styles
          const style = document.createElement('style');
          style.textContent = \`
            @keyframes proovdSlideIn {
              from {
                transform: translateY(100%);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
            @keyframes proovdSlideOut {
              from {
                transform: translateY(0);
                opacity: 1;
              }
              to {
                transform: translateY(100%);
                opacity: 0;
              }
            }
            .proovd-notification {
              transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .proovd-notification:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
            }
            .proovd-notification h4 {
              margin: 0 0 8px 0;
              font-size: 16px;
              font-weight: 600;
            }
            .proovd-notification p {
              margin: 0 0 12px 0;
              font-size: 14px;
              line-height: 1.5;
            }
            .proovd-notification a {
              color: #007bff;
              text-decoration: none;
              font-size: 14px;
              font-weight: 500;
              display: inline-block;
            }
            .proovd-notification a:hover {
              text-decoration: underline;
            }
            .proovd-theme-dark a {
              color: #66b3ff;
            }
          \`;
          document.head.appendChild(style);
          document.body.appendChild(container);

          // Track impression - do this after adding to DOM
          setTimeout(function() {
            track('impression', notification._id);
          }, 100);

          // Auto-hide after duration
          setTimeout(() => {
            container.style.animation = 'proovdSlideOut 0.3s ease-in forwards';
            setTimeout(() => container.remove(), 300);
          }, (config.displayDuration || 5) * 1000);
        }

        // Fetch and display notifications
        function fetchNotifications() {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', PROOVD_DOMAIN + '/api/websites/' + websiteId + '/notifications/show', true);
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  var data = JSON.parse(xhr.responseText);
                  
                  if (data.notifications?.length) {
                    // Randomize if configured
                    let notifications = [].concat(data.notifications);
                    if (config.randomize) {
                      notifications.sort(() => Math.random() - 0.5);
                    }
                    
                    // Limit number of notifications
                    notifications = notifications.slice(0, config.maxNotifications || 5);
                    
                    // Show notifications with delay between each
                    notifications.forEach((notification, index) => {
                      setTimeout(() => {
                        showNotification(notification);
                      }, (config.delay || 5) * 1000 * index);
                    });
                    
                    // Loop if configured
                    if (config.loop) {
                      setTimeout(fetchNotifications, 
                        ((config.delay || 5) * notifications.length + (config.displayDuration || 5)) * 1000
                      );
                    }
                  }
                } catch (error) {
                  console.error('Failed to parse notifications:', error);
                }
              } else {
                console.error('Failed to fetch notifications:', xhr.status);
              }
            }
          };
          xhr.send();
        }

        // Initialize after page load
        if (document.readyState === 'complete') {
          setTimeout(fetchNotifications, (config.initialDelay || 5) * 1000);
        } else {
          window.addEventListener('load', () => {
            setTimeout(fetchNotifications, (config.initialDelay || 5) * 1000);
          });
        }
      })();
    `;

    return new NextResponse(script, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Error serving widget script:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 