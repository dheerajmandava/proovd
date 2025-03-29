import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Website from '@/app/lib/models/website';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/websites/[id]/pulse-widget.js
 * 
 * Serves the main ProovdPulse widget script
 * This endpoint is called by the loader script
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    
    // Get website ID from params
    const websiteId = params.id;
    
    // Get website from database to validate
    const website = await Website.findById(websiteId);
    
    if (!website) {
      return new NextResponse('Widget not found', { status: 404 });
    }
    
    // Get the host from request headers
    const host = request.headers.get('host') || 'www.proovd.in';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const apiUrl = `${protocol}://${host}`;
    
    // For production, we would use a bundled version of the widget
    // For now, we'll return a script that loads all dependencies and initializes the widget
    
    const widgetScript = `
    /**
     * ProovdPulse Widget
     * Version: 1.0.0
     * Website ID: ${websiteId}
     */
    (function() {
      // Load dependencies (lit-html and tippy.js)
      function loadScript(url, callback) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.onload = callback;
        document.head.appendChild(script);
      }
      
      // Load CSS file
      function loadCSS(url) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
      }
      
      // Load dependencies in sequence
      loadScript('https://cdn.jsdelivr.net/npm/lit-html@2.7.5/lit-html.min.js', function() {
        loadScript('https://cdn.jsdelivr.net/npm/tippy.js@6.3.7/dist/tippy-bundle.umd.min.js', function() {
          loadCSS('https://cdn.jsdelivr.net/npm/tippy.js@6.3.7/dist/tippy.css');
          
          // Initialize ProovdPulse functionality
          window.ProovdPulse = class {
            constructor(options) {
              this.options = {
                websiteId: '${websiteId}',
                apiKey: '${website.apiKey || ''}',
                position: 'bottom-right',
                theme: 'auto',
                showHeatmap: true,
                showActiveUsers: true,
                showEngagementMetrics: true,
                ...options
              };
              
              this.apiUrl = '${apiUrl}';
              this.initDomObserver();
              this.initHeatmap();
              this.initActiveUsers();
              this.initEngagementMetrics();
              this.reportEngagement();
              
              // Log initialization
              console.log('ProovdPulse initialized with websiteId:', this.options.websiteId);
              
              // Dispatch loaded event
              window.dispatchEvent(new CustomEvent('proovdPulseLoaded'));
            }
            
            initDomObserver() {
              // Initialize DOM Observer for tracking interactions
              // Implementation details would go here
            }
            
            initHeatmap() {
              // Initialize heatmap visualization
              if (this.options.showHeatmap) {
                // Implementation details would go here
              }
            }
            
            initActiveUsers() {
              // Initialize active users counter
              if (this.options.showActiveUsers) {
                // Implementation details would go here
              }
            }
            
            initEngagementMetrics() {
              // Initialize engagement metrics
              if (this.options.showEngagementMetrics) {
                // Implementation details would go here
              }
            }
            
            reportEngagement() {
              // Send periodic engagement data to the server
              setInterval(() => {
                fetch(\`\${this.apiUrl}/api/websites/\${this.options.websiteId}/pulse\`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': \`Bearer \${this.options.apiKey}\`
                  },
                  body: JSON.stringify({
                    url: window.location.href,
                    referrer: document.referrer,
                    screenSize: {
                      width: window.innerWidth,
                      height: window.innerHeight
                    },
                    // Additional engagement data would be included here
                  })
                }).catch(err => console.error('Error reporting engagement:', err));
              }, 30000); // Every 30 seconds
            }
          };
          
          // Initialize the widget
          window.proovdPulseWidget = new window.ProovdPulse();
        });
      });
    })();`;
    
    // Return the script with proper content type and CORS headers
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
    console.error('Error serving ProovdPulse widget:', error);
    
    // Return an error script
    return new NextResponse(`console.error("Error initializing ProovdPulse widget");`, {
      status: 500,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
} 