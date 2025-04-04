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
        
        // Tracking function
        async function track(event, notificationId, metadata = {}) {
          try {
            await fetch(\`/api/websites/\${websiteId}/track\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event,
                notificationId,
                timestamp: new Date().toISOString(),
                metadata: {
                  ...metadata,
                  url: window.location.href,
                  referrer: document.referrer,
                  userAgent: navigator.userAgent
                }
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
          container.innerHTML = \`
            <div class="proovd-content">
              <h4>\${notification.title}</h4>
              <p>\${notification.message}</p>
              \${notification.link ? \`<a href="\${notification.link}">Learn More</a>\` : ''}
            </div>
          \`;

          // Position the notification based on settings
          Object.assign(container.style, {
            position: 'fixed',
            [config.position || 'bottom-right']: '20px',
            zIndex: '9999',
            // Add more styles based on theme
          });

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
            container.remove();
          }, (config.displayDuration || 5) * 1000);
        }

        // Fetch and display notifications
        async function fetchNotifications() {
          try {
            const response = await fetch(\`/api/websites/\${websiteId}/notifications\`);
            const data = await response.json();
            
            if (data.notifications?.length) {
              // Show notifications with delay between each
              data.notifications.forEach((notification, index) => {
                setTimeout(() => {
                  showNotification(notification);
                }, (config.delay || 5) * 1000 * index);
              });
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