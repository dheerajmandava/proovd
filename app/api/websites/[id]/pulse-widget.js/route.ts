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
              this.container = null;
              this.metrics = {
                scrollPercentage: 0,
                timeOnPage: 0,
                clickCount: 0,
                focusedElements: []
              };
              this.activeUsers = 0;
              
              // Start tracking timer
              this.startTime = new Date();
              
              // Create container
              this.createContainer();
              
              // Initialize all features
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
            
            createContainer() {
              // Create the main container
              this.container = document.createElement('div');
              this.container.className = 'proovd-pulse-container';
              this.container.style.position = 'fixed';
              this.container.style.zIndex = '9999';
              this.container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
              this.container.style.fontSize = '14px';
              this.container.style.transition = 'all 0.3s ease';
              
              // Set position
              switch(this.options.position) {
                case 'bottom-left':
                  this.container.style.bottom = '20px';
                  this.container.style.left = '20px';
                  break;
                case 'bottom-right':
                  this.container.style.bottom = '20px';
                  this.container.style.right = '20px';
                  break;
                case 'top-left':
                  this.container.style.top = '20px';
                  this.container.style.left = '20px';
                  break;
                case 'top-right':
                  this.container.style.top = '20px';
                  this.container.style.right = '20px';
                  break;
              }
              
              // Add to body
              document.body.appendChild(this.container);
            }
            
            initDomObserver() {
              // Elements to track
              this.clickElements = new Map();
              
              // Add click listener
              document.addEventListener('click', (event) => {
                const target = event.target;
                if (target instanceof Element) {
                  const selector = this.getSelector(target);
                  const count = this.clickElements.get(selector) || 0;
                  this.clickElements.set(selector, count + 1);
                  this.metrics.clickCount++;
                }
              }, true);
              
              // Track scrolling
              window.addEventListener('scroll', () => {
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                const scrollHeight = document.documentElement.scrollHeight;
                const clientHeight = document.documentElement.clientHeight;
                
                this.metrics.scrollPercentage = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
                
                // Update metrics display
                this.updateMetricsDisplay();
              }, { passive: true });
            }
            
            getSelector(element) {
              // Simple selector generation
              if (element.id) return '#' + element.id;
              if (element.className) {
                const classNames = Array.from(element.classList).join('.');
                return element.tagName.toLowerCase() + (classNames ? '.' + classNames : '');
              }
              return element.tagName.toLowerCase();
            }
            
            initHeatmap() {
              // Initialize heatmap visualization
              if (this.options.showHeatmap) {
                this.heatmapContainer = document.createElement('div');
                this.heatmapContainer.className = 'proovd-pulse-heatmap';
                this.heatmapContainer.style.position = 'fixed';
                this.heatmapContainer.style.top = '0';
                this.heatmapContainer.style.left = '0';
                this.heatmapContainer.style.width = '100%';
                this.heatmapContainer.style.height = '100%';
                this.heatmapContainer.style.pointerEvents = 'none';
                this.heatmapContainer.style.zIndex = '9998';
                
                document.body.appendChild(this.heatmapContainer);
                
                // Add click listener for heatmap
                document.addEventListener('click', (event) => {
                  if (!this.options.showHeatmap) return;
                  
                  const heatPoint = document.createElement('div');
                  heatPoint.className = 'proovd-heat-point';
                  heatPoint.style.position = 'absolute';
                  heatPoint.style.width = '30px';
                  heatPoint.style.height = '30px';
                  heatPoint.style.borderRadius = '50%';
                  heatPoint.style.background = 'radial-gradient(circle, rgba(255,0,0,0.8) 0%, rgba(255,0,0,0) 70%)';
                  heatPoint.style.transform = 'translate(-50%, -50%)';
                  heatPoint.style.pointerEvents = 'none';
                  heatPoint.style.left = event.clientX + 'px';
                  heatPoint.style.top = event.clientY + 'px';
                  
                  this.heatmapContainer.appendChild(heatPoint);
                  
                  // Remove after 2 seconds
                  setTimeout(() => {
                    if (heatPoint.parentNode) {
                      heatPoint.parentNode.removeChild(heatPoint);
                    }
                  }, 2000);
                }, { passive: true });
              }
            }
            
            initActiveUsers() {
              // Initialize active users counter
              if (this.options.showActiveUsers) {
                this.usersWidget = document.createElement('div');
                this.usersWidget.className = 'proovd-pulse-widget';
                this.usersWidget.style.backgroundColor = this.getThemeColor('bg');
                this.usersWidget.style.color = this.getThemeColor('text');
                this.usersWidget.style.borderRadius = '8px';
                this.usersWidget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                this.usersWidget.style.overflow = 'hidden';
                this.usersWidget.style.marginBottom = '12px';
                this.usersWidget.style.width = '300px';
                this.usersWidget.style.maxWidth = '90vw';
                
                // Header
                const header = document.createElement('div');
                header.className = 'proovd-pulse-header';
                header.style.display = 'flex';
                header.style.alignItems = 'center';
                header.style.padding = '12px 16px';
                header.style.borderBottom = '1px solid ' + (this.options.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)');
                
                const logo = document.createElement('div');
                logo.className = 'proovd-pulse-logo';
                logo.style.display = 'flex';
                logo.style.alignItems = 'center';
                logo.style.fontWeight = '600';
                
                const logoIcon = document.createElement('div');
                logoIcon.className = 'proovd-pulse-logo-icon';
                logoIcon.style.width = '18px';
                logoIcon.style.height = '18px';
                logoIcon.style.background = '#6366f1';
                logoIcon.style.color = 'white';
                logoIcon.style.borderRadius = '4px';
                logoIcon.style.display = 'flex';
                logoIcon.style.alignItems = 'center';
                logoIcon.style.justifyContent = 'center';
                logoIcon.style.marginRight = '6px';
                logoIcon.style.fontWeight = '700';
                logoIcon.innerText = 'P';
                
                const logoText = document.createElement('span');
                logoText.innerText = 'ProovdPulse';
                
                logo.appendChild(logoIcon);
                logo.appendChild(logoText);
                header.appendChild(logo);
                
                // Content
                const content = document.createElement('div');
                content.className = 'proovd-pulse-content';
                content.style.padding = '12px 16px';
                
                // Active users metric
                this.activeUsersElement = document.createElement('div');
                this.activeUsersElement.className = 'proovd-pulse-metric';
                this.activeUsersElement.style.display = 'flex';
                this.activeUsersElement.style.alignItems = 'center';
                this.activeUsersElement.style.marginBottom = '8px';
                this.activeUsersElement.style.background = this.options.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
                this.activeUsersElement.style.padding = '8px 12px';
                this.activeUsersElement.style.borderRadius = '6px';
                
                const userIcon = document.createElement('div');
                userIcon.className = 'proovd-pulse-metric-icon';
                userIcon.style.marginRight = '8px';
                userIcon.style.color = '#6366f1';
                userIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>';
                
                this.userCountElement = document.createElement('span');
                this.userCountElement.className = 'proovd-pulse-metric-value';
                this.userCountElement.style.fontWeight = '600';
                this.userCountElement.style.marginRight = '4px';
                this.userCountElement.innerText = '...';
                
                const userLabel = document.createElement('span');
                userLabel.className = 'proovd-pulse-metric-label';
                userLabel.style.color = this.options.theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
                userLabel.innerText = 'people viewing now';
                
                this.activeUsersElement.appendChild(userIcon);
                this.activeUsersElement.appendChild(this.userCountElement);
                this.activeUsersElement.appendChild(userLabel);
                content.appendChild(this.activeUsersElement);
                
                // Assemble the widget
                this.usersWidget.appendChild(header);
                this.usersWidget.appendChild(content);
                this.container.appendChild(this.usersWidget);
                
                // Fetch initial data
                this.fetchActiveUsers();
              }
            }
            
            initEngagementMetrics() {
              // Initialize engagement metrics
              if (this.options.showEngagementMetrics) {
                this.metricsWidget = document.createElement('div');
                this.metricsWidget.className = 'proovd-pulse-widget';
                this.metricsWidget.style.backgroundColor = this.getThemeColor('bg');
                this.metricsWidget.style.color = this.getThemeColor('text');
                this.metricsWidget.style.borderRadius = '8px';
                this.metricsWidget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                this.metricsWidget.style.overflow = 'hidden';
                this.metricsWidget.style.marginBottom = '12px';
                this.metricsWidget.style.width = '300px';
                this.metricsWidget.style.maxWidth = '90vw';
                
                // Header
                const header = document.createElement('div');
                header.className = 'proovd-pulse-header';
                header.style.display = 'flex';
                header.style.alignItems = 'center';
                header.style.padding = '12px 16px';
                header.style.borderBottom = '1px solid ' + (this.options.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)');
                
                const logo = document.createElement('div');
                logo.className = 'proovd-pulse-logo';
                logo.style.display = 'flex';
                logo.style.alignItems = 'center';
                logo.style.fontWeight = '600';
                
                const logoIcon = document.createElement('div');
                logoIcon.className = 'proovd-pulse-logo-icon';
                logoIcon.style.width = '18px';
                logoIcon.style.height = '18px';
                logoIcon.style.background = '#6366f1';
                logoIcon.style.color = 'white';
                logoIcon.style.borderRadius = '4px';
                logoIcon.style.display = 'flex';
                logoIcon.style.alignItems = 'center';
                logoIcon.style.justifyContent = 'center';
                logoIcon.style.marginRight = '6px';
                logoIcon.style.fontWeight = '700';
                logoIcon.innerText = 'P';
                
                const logoText = document.createElement('span');
                logoText.innerText = 'Engagement';
                
                logo.appendChild(logoIcon);
                logo.appendChild(logoText);
                header.appendChild(logo);
                
                // Content
                const content = document.createElement('div');
                content.className = 'proovd-pulse-content';
                content.style.padding = '12px 16px';
                
                // Time on page metric
                this.timeElement = document.createElement('div');
                this.timeElement.className = 'proovd-pulse-metric';
                this.timeElement.style.display = 'flex';
                this.timeElement.style.alignItems = 'center';
                this.timeElement.style.marginBottom = '8px';
                this.timeElement.style.background = this.options.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
                this.timeElement.style.padding = '8px 12px';
                this.timeElement.style.borderRadius = '6px';
                
                const timeIcon = document.createElement('div');
                timeIcon.className = 'proovd-pulse-metric-icon';
                timeIcon.style.marginRight = '8px';
                timeIcon.style.color = '#6366f1';
                timeIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
                
                this.timeValueElement = document.createElement('span');
                this.timeValueElement.className = 'proovd-pulse-metric-value';
                this.timeValueElement.style.fontWeight = '600';
                this.timeValueElement.style.marginRight = '4px';
                this.timeValueElement.innerText = '0s';
                
                const timeLabel = document.createElement('span');
                timeLabel.className = 'proovd-pulse-metric-label';
                timeLabel.style.color = this.options.theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
                timeLabel.innerText = 'time on page';
                
                this.timeElement.appendChild(timeIcon);
                this.timeElement.appendChild(this.timeValueElement);
                this.timeElement.appendChild(timeLabel);
                content.appendChild(this.timeElement);
                
                // Scroll percentage metric
                this.scrollElement = document.createElement('div');
                this.scrollElement.className = 'proovd-pulse-metric';
                this.scrollElement.style.display = 'flex';
                this.scrollElement.style.alignItems = 'center';
                this.scrollElement.style.marginBottom = '8px';
                this.scrollElement.style.background = this.options.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
                this.scrollElement.style.padding = '8px 12px';
                this.scrollElement.style.borderRadius = '6px';
                
                const scrollIcon = document.createElement('div');
                scrollIcon.className = 'proovd-pulse-metric-icon';
                scrollIcon.style.marginRight = '8px';
                scrollIcon.style.color = '#6366f1';
                scrollIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="8 17 12 21 16 17"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path></svg>';
                
                this.scrollValueElement = document.createElement('span');
                this.scrollValueElement.className = 'proovd-pulse-metric-value';
                this.scrollValueElement.style.fontWeight = '600';
                this.scrollValueElement.style.marginRight = '4px';
                this.scrollValueElement.innerText = '0%';
                
                const scrollLabel = document.createElement('span');
                scrollLabel.className = 'proovd-pulse-metric-label';
                scrollLabel.style.color = this.options.theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
                scrollLabel.innerText = 'scrolled';
                
                this.scrollElement.appendChild(scrollIcon);
                this.scrollElement.appendChild(this.scrollValueElement);
                this.scrollElement.appendChild(scrollLabel);
                content.appendChild(this.scrollElement);
                
                // Assemble the widget
                this.metricsWidget.appendChild(header);
                this.metricsWidget.appendChild(content);
                this.container.appendChild(this.metricsWidget);
                
                // Update metrics periodically
                setInterval(() => this.updateMetricsDisplay(), 1000);
              }
            }
            
            getThemeColor(type) {
              const isDark = this.options.theme === 'dark' || 
                (this.options.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
              
              if (type === 'bg') {
                return isDark ? '#1e1e1e' : '#ffffff';
              } else if (type === 'text') {
                return isDark ? '#ffffff' : '#333333';
              }
              
              return '';
            }
            
            async fetchActiveUsers() {
              try {
                const response = await fetch(\`\${this.apiUrl}/api/websites/\${this.options.websiteId}/pulse\`);
                
                if (response.ok) {
                  const data = await response.json();
                  if (data.success && data.data) {
                    this.activeUsers = data.data.activeUsers || 0;
                    this.updateActiveUsersDisplay();
                  }
                }
              } catch (error) {
                console.error('Error fetching active users:', error);
              }
              
              // Refresh every 30 seconds
              setTimeout(() => this.fetchActiveUsers(), 30000);
            }
            
            updateActiveUsersDisplay() {
              if (this.userCountElement) {
                this.userCountElement.innerText = this.activeUsers.toString();
              }
            }
            
            updateMetricsDisplay() {
              // Update time on page
              const elapsed = Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000);
              this.metrics.timeOnPage = elapsed;
              
              if (this.timeValueElement) {
                this.timeValueElement.innerText = \`\${elapsed}s\`;
              }
              
              // Update scroll percentage
              if (this.scrollValueElement) {
                this.scrollValueElement.innerText = \`\${this.metrics.scrollPercentage}%\`;
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
                    metrics: this.metrics,
                    clickElements: Array.from(this.clickElements.entries()).map(([selector, count]) => ({ 
                      selector, 
                      count 
                    }))
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