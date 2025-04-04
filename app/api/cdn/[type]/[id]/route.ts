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
        const apiBase = '${process.env.NEXT_PUBLIC_API_URL || ''}';
        
        // Tracking function
        async function track(type, notificationId) {
          try {
            await fetch(\`\${apiBase}/api/notifications/\${notificationId}/\${type}\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                websiteId,
                timestamp: new Date().toISOString()
              })
            });
          } catch (error) {
            console.error('Failed to track event:', error);
          }
        }

        // Create and show notification
        function showNotification(notification) {
          const container = document.createElement('div');
          container.className = 'proovd-notification';
          
          // Apply theme styles
          const theme = config.theme || 'light';
          container.classList.add(\`proovd-theme-\${theme}\`);
          
          container.innerHTML = \`
            <div class="proovd-content">
              <h4>\${notification.title}</h4>
              <p>\${notification.message}</p>
              \${notification.link ? \`<a href="\${notification.link}" target="_blank">Learn More</a>\` : ''}
            </div>
          \`;

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
            animation: 'proovdSlideIn 0.3s ease-out'
          });

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

          // Track impression
          track('impression', notification._id);

          // Track clicks if there's a link
          if (notification.link) {
            container.querySelector('a').addEventListener('click', () => {
              track('click', notification._id);
            });
          }

          // Auto-hide after duration
          setTimeout(() => {
            container.style.animation = 'proovdSlideOut 0.3s ease-in forwards';
            setTimeout(() => container.remove(), 300);
          }, (config.displayDuration || 5) * 1000);
        }

        // Fetch and display notifications
        async function fetchNotifications() {
          try {
            const response = await fetch(\`\${apiBase}/api/websites/\${websiteId}/notifications/show\`);
            if (!response.ok) throw new Error('Failed to fetch notifications');
            
            const data = await response.json();
            
            if (data.notifications?.length) {
              // Randomize if configured
              let notifications = [...data.notifications];
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
            console.error('Failed to fetch notifications:', error);
          }
        }

        // Initialize after page load
        window.addEventListener('load', () => {
          setTimeout(fetchNotifications, (config.initialDelay || 5) * 1000);
        });
      })();
    `;

    return new NextResponse(script, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Error serving widget script:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 