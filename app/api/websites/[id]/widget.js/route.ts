import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import { isValidObjectId } from 'mongoose';
import { sanitizeInput } from '@/app/lib/server-utils';

/**
 * GET /api/websites/[id]/widget.js
 * 
 * Returns the widget script for a website.
 * This is a public endpoint that returns JavaScript to be embedded in customer websites.
 * 
 * Authentication is based on the website ID and domain verification.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the website ID from the params
    const { id } = params;
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return new NextResponse(`console.error("Invalid website ID");`, {
        status: 400,
        headers: {
          'Content-Type': 'application/javascript',
        },
      });
    }

    // Connect to the database
    await connectToDatabase();

    // Get the website
    const website = await Website.findOne({ _id: id });

    if (!website) {
      return new NextResponse(`console.error("Website not found");`, {
        status: 404,
        headers: {
          'Content-Type': 'application/javascript',
        },
      });
    }
    
    // Check if the website is active
    if (website.status !== 'active' && website.status !== 'verified') {
      return new NextResponse(`console.error("Website is not active");`, {
        status: 403,
        headers: {
          'Content-Type': 'application/javascript',
        },
      });
    }
    
    // Get the referer domain
    const referer = request.headers.get('referer');
    
    // Domain validation: Check if the referer matches the website domain or allowed domains
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const refererDomain = refererUrl.hostname.toLowerCase();
        
        // Check if domain matches or is in allowed domains
        const domainMatches = 
          website.domain === refererDomain || 
          (website.allowedDomains && website.allowedDomains.includes(refererDomain));
        
        if (!domainMatches) {
          // Log the mismatch but don't block in development
          console.warn(`Domain mismatch: ${refererDomain} vs ${website.domain} or ${website.allowedDomains}`);
          
          // In production, block mismatched domains
         
            return new NextResponse(`console.error("Domain not authorized");`, {
              status: 403,
              headers: {
                'Content-Type': 'application/javascript',
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
    
    // Build the widget script
    const widgetScript = `
      // Proovd Social Proof Widget
      (function() {
        const websiteId = "${id}";
        const widgetSettings = ${JSON.stringify(settings)};
        
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
        
        // Load the notifications
        const api = '${process.env.NEXTAUTH_URL || 'http://localhost:3000'}';
        
        // Track seen notifications
        const seenNotifications = new Set();
        
        // Function to fetch notifications
        async function fetchNotifications() {
          try {
            const response = await fetch(\`\${api}/api/websites/\${websiteId}/notifications/show\`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (!response.ok) {
              throw new Error('Failed to fetch notifications');
            }
            
            const data = await response.json();
            return data.notifications || [];
          } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
          }
        }
        
        // Function to show a notification
        function showNotification(notification) {
          // Skip if already seen
          if (seenNotifications.has(notification.id)) {
            return;
          }
          
          // Mark as seen
          seenNotifications.add(notification.id);
          
          // Create notification element
          const notificationEl = document.createElement('div');
          notificationEl.className = 'proovd-notification';
          notificationEl.style.backgroundColor = widgetSettings.theme === 'dark' ? '#333' : '#fff';
          notificationEl.style.color = widgetSettings.theme === 'dark' ? '#fff' : '#333';
          notificationEl.style.borderRadius = '8px';
          notificationEl.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          notificationEl.style.padding = '12px';
          notificationEl.style.marginTop = '10px';
          notificationEl.style.width = '300px';
          notificationEl.style.maxWidth = '90vw';
          notificationEl.style.opacity = '0';
          notificationEl.style.transform = 'translateY(20px)';
          notificationEl.style.transition = 'opacity 0.3s, transform 0.3s';
          
          // Create content based on notification type
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
                    <div style="font-size: 12px; margin-top: 4px; color: #999;">\${formatTimeAgo(notification.timestamp)}</div>
                  </div>
                </div>
              \`;
              break;
              
            case 'signup':
              content = \`
                <div style="display: flex; align-items: center;">
                  <div style="margin-right: 10px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                      \${notification.image ? \`<img src="\${notification.image}" style="width: 100%; height: 100%; object-fit: cover;">\` : '<div style="font-size: 16px; font-weight: bold;">' + (notification.name || 'Someone').charAt(0) + '</div>'}
                    </div>
                  </div>
                  <div>
                    <div style="font-weight: bold;">\${sanitizeText(notification.name || 'Someone')}</div>
                    <div>\${sanitizeText(notification.message || 'signed up recently')}</div>
                    <div style="font-size: 12px; margin-top: 4px; color: #999;">\${formatTimeAgo(notification.timestamp)}</div>
                  </div>
                </div>
              \`;
              break;
              
            case 'custom':
            default:
              content = \`
                <div style="display: flex; align-items: center;">
                  <div style="margin-right: 10px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                      \${notification.image ? \`<img src="\${notification.image}" style="width: 100%; height: 100%; object-fit: cover;">\` : '<div style="font-size: 16px; font-weight: bold;">' + (notification.name || 'Activity').charAt(0) + '</div>'}
                    </div>
                  </div>
                  <div>
                    <div style="font-weight: bold;">\${sanitizeText(notification.name || 'Recent Activity')}</div>
                    <div>\${sanitizeText(notification.message || 'Something happened')}</div>
                    <div style="font-size: 12px; margin-top: 4px; color: #999;">\${formatTimeAgo(notification.timestamp)}</div>
                  </div>
                </div>
              \`;
          }
          
          // Set the content
          notificationEl.innerHTML = content;
          
          // Add click handler
          notificationEl.addEventListener('click', function() {
            if (notification.url) {
              recordClick(notification.id);
              window.open(notification.url, '_blank');
            }
          });
          
          // Append to container
          container.appendChild(notificationEl);
          
          // Record impression
          recordImpression(notification.id);
          
          // Animate in
          setTimeout(() => {
            notificationEl.style.opacity = '1';
            notificationEl.style.transform = 'translateY(0)';
          }, 10);
          
          // Remove after display duration
          setTimeout(() => {
            notificationEl.style.opacity = '0';
            notificationEl.style.transform = 'translateY(20px)';
            
            // Remove from DOM after animation
            setTimeout(() => {
              container.removeChild(notificationEl);
            }, 300);
          }, widgetSettings.displayDuration * 1000);
        }
        
        // Function to sanitize text
        function sanitizeText(text) {
          if (!text) return '';
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        }
        
        // Function to format time ago
        function formatTimeAgo(timestamp) {
          if (!timestamp) return 'recently';
          
          const now = new Date();
          const past = new Date(timestamp);
          const diffMs = now - past;
          
          // Convert to seconds
          const diffSec = Math.floor(diffMs / 1000);
          
          if (diffSec < 60) return 'just now';
          if (diffSec < 3600) return \`\${Math.floor(diffSec / 60)} minutes ago\`;
          if (diffSec < 86400) return \`\${Math.floor(diffSec / 3600)} hours ago\`;
          if (diffSec < 2592000) return \`\${Math.floor(diffSec / 86400)} days ago\`;
          
          // Fallback to date
          return past.toLocaleDateString();
        }
        
        // Function to record impression
        async function recordImpression(notificationId) {
          try {
            await fetch(\`\${api}/api/notifications/\${notificationId}/impression\`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ websiteId }),
            });
          } catch (error) {
            console.error('Error recording impression:', error);
          }
        }
        
        // Function to record click
        async function recordClick(notificationId) {
          try {
            await fetch(\`\${api}/api/notifications/\${notificationId}/click\`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ websiteId }),
            });
          } catch (error) {
            console.error('Error recording click:', error);
          }
        }
        
        // Function to start showing notifications
        async function startNotifications() {
          const notifications = await fetchNotifications();
          
          // Queue notifications
          let index = 0;
          let activeCount = 0;
          const maxActive = widgetSettings.maxNotifications || 5;
          
          function showNext() {
            if (index >= notifications.length) {
              // Restart from beginning if we've shown all
              setTimeout(() => {
                index = 0;
                showNext();
              }, 30000); // Wait 30 seconds before restarting
              return;
            }
            
            if (activeCount >= maxActive) {
              // Wait until a notification is removed
              setTimeout(showNext, 1000);
              return;
            }
            
            // Show next notification
            const notification = notifications[index++];
            showNotification(notification);
            activeCount++;
            
            // Decrease active count after notification is removed
            setTimeout(() => {
              activeCount--;
            }, widgetSettings.displayDuration * 1000 + 300);
            
            // Schedule next notification
            setTimeout(showNext, widgetSettings.delay * 1000);
          }
          
          // Start showing notifications after initial delay
          setTimeout(showNext, widgetSettings.delay * 1000);
        }
        
        // Start after DOM is fully loaded
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', startNotifications);
        } else {
          startNotifications();
        }
    })();
    `;

    // Return the widget script with appropriate headers
    return new NextResponse(widgetScript, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error generating widget script:', error);
    
    // Return an error script
    return new NextResponse(`console.error("Error loading Proovd widget");`, {
      status: 500,
      headers: {
        'Content-Type': 'application/javascript',
      },
    });
  }
}

// Helper function to sanitize text for inclusion in JavaScript
function sanitizeText(text: string): string {
  if (!text) return '';
  return sanitizeInput(text)
    .replace(/"/g, '\\"')  // Escape double quotes
    .replace(/\n/g, ' ');  // Replace newlines with spaces
} 