import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import { cors, addCorsHeaders } from '@/app/lib/cors';

/**
 * GET /api/websites/[id]/widget.js
 * 
 * Generates and serves the JavaScript widget file for embedding on customer websites
 * Now uses domain verification instead of API key for authentication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply CORS headers for cross-origin requests
  const corsResponse = cors(request);
  if (corsResponse instanceof NextResponse) return corsResponse;

  try {
    const { id } = params;
    
    // Get the referer header (the domain that loaded the script)
    const referer = request.headers.get('referer');
    const refererDomain = referer ? new URL(referer).hostname : null;
    
    // Connect to the database
    await connectToDatabase();

    // Get the website by ID
    const website = await Website.findOne({ _id: id });

    if (!website) {
      const jsError = `console.error('Proovd: Invalid website ID');`;
      return new NextResponse(jsError, {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript',
        }
      });
    }

    // Check if the domain is verified
    const websiteDomain = website.domain;
    const isVerified = website.verification?.status === 'verified';
    
    // If the domain is not verified or the referer doesn't match the verified domain
    if (!isVerified) {
      const jsError = `console.error('Proovd: Website domain is not verified');`;
      return new NextResponse(jsError, {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript',
        }
      });
    }
    
    // Check if the referer matches the verified domain
    // Skip this check in development or if no referer
    if (process.env.NODE_ENV === 'production' && refererDomain) {
      // Extract the base domain for comparison, accounting for subdomains
      const refererBaseDomain = refererDomain.split('.').slice(-2).join('.');
      const websiteBaseDomain = websiteDomain.split('.').slice(-2).join('.');
      
      if (refererBaseDomain !== websiteBaseDomain && !refererDomain.endsWith(websiteDomain)) {
        const jsError = `console.error('Proovd: Domain mismatch - widget is only authorized for ${websiteDomain}');`;
        return new NextResponse(jsError, {
          status: 200,
          headers: {
            'Content-Type': 'application/javascript',
          }
        });
      }
    }

    // Build the widget JavaScript
    const widgetJs = `
    (function() {
      // Proovd Widget v1.0
      // Website ID: ${id}
      
      const ENDPOINT = "${process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin}/api/websites/${id}/widget";
      const SITE_ID = "${id}";
      const DEFAULT_SETTINGS = ${JSON.stringify(website.settings || {
        position: "bottom-left",
        theme: "light",
        displayDuration: 5,
        delay: 5,
        maxNotifications: 5,
      })};
      
      // Create widget container
      const container = document.createElement('div');
      container.id = 'proovd-container';
      container.style.cssText = \`
        position: fixed;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 350px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      \`;
      
      // Set container position based on settings
      switch (DEFAULT_SETTINGS.position) {
        case 'top-left':
          container.style.top = '20px';
          container.style.left = '20px';
          break;
        case 'top-right':
          container.style.top = '20px';
          container.style.right = '20px';
          break;
        case 'bottom-right':
          container.style.bottom = '20px';
          container.style.right = '20px';
          break;
        case 'bottom-left':
        default:
          container.style.bottom = '20px';
          container.style.left = '20px';
          break;
      }
      
      document.body.appendChild(container);
      
      // CSS for notifications
      const style = document.createElement('style');
      style.textContent = \`
        .proovd-notification {
          background-color: \${DEFAULT_SETTINGS.theme === 'dark' ? '#1f2937' : '#ffffff'};
          color: \${DEFAULT_SETTINGS.theme === 'dark' ? '#e5e7eb' : '#1f2937'};
          border-radius: 8px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
          padding: 12px;
          animation: proovd-slide-in 0.3s ease-out;
          transition: opacity 0.3s, transform 0.3s;
          cursor: pointer;
          max-width: 100%;
        }
        
        .proovd-notification:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
        }
        
        .proovd-notification .header {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .proovd-notification .product-image {
          width: 50px;
          height: 50px;
          border-radius: 4px;
          object-fit: cover;
          margin-right: 10px;
        }
        
        .proovd-notification .message {
          font-size: 14px;
          line-height: 1.4;
        }
        
        .proovd-notification .time {
          font-size: 12px;
          color: \${DEFAULT_SETTINGS.theme === 'dark' ? '#9ca3af' : '#6b7280'};
          margin-top: 6px;
        }
        
        @keyframes proovd-slide-in {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes proovd-slide-out {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(20px); opacity: 0; }
        }
      \`;
      
      document.head.appendChild(style);
      
      // Time ago function
      function timeAgo(dateString) {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date() - date) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) return interval + " year" + (interval === 1 ? "" : "s") + " ago";
        
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return interval + " month" + (interval === 1 ? "" : "s") + " ago";
        
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return interval + " day" + (interval === 1 ? "" : "s") + " ago";
        
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return interval + " hour" + (interval === 1 ? "" : "s") + " ago";
        
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return interval + " minute" + (interval === 1 ? "" : "s") + " ago";
        
        return "just now";
      }
      
      // Create notification element
      function createNotification(notification) {
        const elem = document.createElement('div');
        elem.className = 'proovd-notification';
        elem.dataset.id = notification.id;
        
        let content = '';
        
        // Product image if available
        if (notification.productImage) {
          content += \`<div class="header">
            <img src="\${notification.productImage}" alt="\${notification.productName || 'Product'}" class="product-image">
          </div>\`;
        }
        
        // Message
        content += \`<div class="message">\${notification.message}</div>\`;
        
        // Time
        if (notification.createdAt) {
          content += \`<div class="time">\${timeAgo(notification.createdAt)}</div>\`;
        }
        
        elem.innerHTML = content;
        
        // Add click handler
        elem.addEventListener('click', () => {
          // Record click
          fetch(\`\${ENDPOINT}/click\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }).catch(err => console.error('Failed to track click:', err));
          
          // Redirect if product URL is available
          if (notification.productUrl) {
            window.open(notification.productUrl, '_blank');
          }
          
          // Remove notification
          removeNotification(elem);
        });
        
        return elem;
      }
      
      // Remove notification with animation
      function removeNotification(element) {
        element.style.animation = 'proovd-slide-out 0.3s forwards';
        setTimeout(() => {
          if (element.parentNode === container) {
            container.removeChild(element);
          }
        }, 300);
      }
      
      // Display notification queue
      let queue = [];
      let isDisplaying = false;
      
      function displayNextNotification() {
        if (queue.length === 0 || isDisplaying) return;
        
        isDisplaying = true;
        const notification = queue.shift();
        const element = createNotification(notification);
        container.appendChild(element);
        
        // Remove after display duration
        setTimeout(() => {
          removeNotification(element);
          isDisplaying = false;
          
          // Display next notification after a delay
          setTimeout(displayNextNotification, DEFAULT_SETTINGS.delay * 1000);
        }, DEFAULT_SETTINGS.displayDuration * 1000);
      }
      
      // Fetch notifications from API
      async function fetchNotifications() {
        try {
          const response = await fetch(\`\${ENDPOINT}\`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          const data = await response.json();
          
          if (!data.notifications) return;
          
          // Add new notifications to queue
          queue = data.notifications;
          
          // Start displaying notifications
          if (!isDisplaying) {
            displayNextNotification();
          }
        } catch (err) {
          console.error('Failed to fetch notifications:', err);
        }
      }
      
      // Init
      setTimeout(() => {
        fetchNotifications();
        // Refresh every 5 minutes
        setInterval(fetchNotifications, 5 * 60 * 1000);
      }, 1000); // Delay initial load by 1 second
    })();
    `;

    // Create JavaScript response
    const response = new NextResponse(widgetJs, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });

    // Add CORS headers to response
    return addCorsHeaders(response, '*');
  } catch (error) {
    console.error('Error generating widget script:', error);
    const jsError = `console.error('Proovd: Failed to load widget');`;
    
    const response = new NextResponse(jsError, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript'
      }
    });
    
    // Add CORS headers to response
    return addCorsHeaders(response, '*');
  }
} 