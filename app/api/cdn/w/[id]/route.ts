import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const websiteId = params.id;

    // Verify website exists and is active
    const website = await db.collection('websites').findOne({
      _id: new ObjectId(websiteId),
      isActive: true
    });

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Generate a unique session ID for tracking
    const sessionId = Math.random().toString(36).substring(2);

    // The widget loader script
    const script = `
      (function() {
        // Configuration
        const websiteId = '${websiteId}';
        const sessionId = '${sessionId}';
        const config = ${JSON.stringify(website.config || {})};

        // Analytics tracking function
        async function track(event, notificationId = null, metadata = {}) {
          try {
            const response = await fetch(\`${process.env.NEXT_PUBLIC_APP_URL}/api/websites/\${websiteId}/track\`, {
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
                  userAgent: navigator.userAgent,
                  sessionId,
                  viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                  },
                  screenSize: {
                    width: window.screen.width,
                    height: window.screen.height
                  }
                }
              })
            });
            
            if (!response.ok) throw new Error('Failed to track event');
            return await response.json();
          } catch (error) {
            console.error('Proovd tracking error:', error);
          }
        }

        // Load and show notifications
        async function loadNotifications() {
          try {
            const response = await fetch(\`${process.env.NEXT_PUBLIC_APP_URL}/api/websites/\${websiteId}/notifications/active\`);
            if (!response.ok) throw new Error('Failed to load notifications');
            
            const { notifications } = await response.json();
            if (!notifications?.length) return;

            notifications.forEach((notification, index) => {
              setTimeout(() => {
                showNotification(notification);
              }, (config.delay || 2) * 1000 * (index + 1));
            });
          } catch (error) {
            console.error('Proovd error:', error);
          }
        }

        // Show a single notification
        function showNotification(notification) {
          // Create notification element
          const container = document.createElement('div');
          container.className = 'proovd-notification';
          container.innerHTML = \`
            <div class="proovd-content \${config.theme || 'light'}">
              <h4>\${notification.title}</h4>
              <p>\${notification.message}</p>
              \${notification.link ? \`<a href="\${notification.link}" target="_blank">Learn More</a>\` : ''}
            </div>
          \`;

          // Apply styles based on config
          Object.assign(container.style, {
            position: 'fixed',
            [config.position || 'bottom-right']: '20px',
            zIndex: 999999,
            ...getPositionStyles(config.position)
          });

          // Add to page and track impression
          document.body.appendChild(container);
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

        // Helper for positioning
        function getPositionStyles(position) {
          switch(position) {
            case 'top-left': return { top: '20px', left: '20px' };
            case 'top-right': return { top: '20px', right: '20px' };
            case 'bottom-left': return { bottom: '20px', left: '20px' };
            default: return { bottom: '20px', right: '20px' };
          }
        }

        // Add necessary styles
        const styles = document.createElement('style');
        styles.textContent = \`
          .proovd-notification {
            max-width: 400px;
            margin: 10px;
            animation: proovdSlideIn 0.5s ease-out;
          }
          .proovd-content {
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .proovd-content.light {
            background: white;
            color: #1f2937;
          }
          .proovd-content.dark {
            background: #1f2937;
            color: white;
          }
          .proovd-notification h4 {
            margin: 0 0 8px;
            font-size: 16px;
            font-weight: 600;
          }
          .proovd-notification p {
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
          }
          .proovd-notification a {
            display: inline-block;
            margin-top: 10px;
            color: #3b82f6;
            text-decoration: none;
            font-size: 14px;
          }
          @keyframes proovdSlideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        \`;
        document.head.appendChild(styles);

        // Initialize after page load
        window.addEventListener('load', () => {
          // Track pageview
          track('pageview');
          
          // Load notifications after initial delay
          setTimeout(loadNotifications, (config.initialDelay || 2) * 1000);
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
    console.error('Widget loader error:', error);
    return NextResponse.json(
      { error: 'Failed to load widget' },
      { status: 500 }
    );
  }
} 