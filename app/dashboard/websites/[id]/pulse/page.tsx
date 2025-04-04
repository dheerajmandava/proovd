'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Loader2, Clipboard, Share2, Settings, BarChart4, Activity, Users, CheckCircle2 } from 'lucide-react';
import { useWebSocket } from '@/hooks/use-websocket';
import { formatDuration, formatNumber } from '@/lib/utils';
import { string } from 'zod';

interface WebsiteData {
  id: string;
  name: string;
  domain: string;
  url: string;
  settings: {
    pulse?: {
      position: string;
      theme: string;
      showActiveUsers: boolean;
      showEngagementMetrics: boolean;
      showHeatmap: boolean;
    }
  }
}

interface WebsiteStats {
  id: string;
  activeUsers: number;
  usersByCountry: string; // JSON string
  usersByCity: string; // JSON string
  avgTimeOnPage: number;
  avgScrollPercentage: number;
  totalClicks: number;
  updatedAt: string;
}

// Add a new component for the live ProovdPulse widget
function LiveProovdPulseWidget({ 
  websiteId, 
  position = 'bottom-right', 
  theme = 'light' 
}: { 
  websiteId: string, 
  position?: string, 
  theme?: string 
}) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeUsersCount, setActiveUsersCount] = useState<number | null>(null);
  
  // Get active users count from API
  useEffect(() => {
    async function getActiveUsers() {
      try {
        const response = await fetch(`/api/websites/${websiteId}/pulse`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setActiveUsersCount(data.data.activeUsers || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching active users:', error);
      }
    }
    
    getActiveUsers();
    const interval = setInterval(getActiveUsers, 10000);
    
    return () => clearInterval(interval);
  }, [websiteId]);
  
  useEffect(() => {
    async function getAuthToken() {
      try {
        const response = await fetch(`/api/pulse-auth?websiteId=${websiteId}`);
        if (!response.ok) {
          throw new Error('Failed to get authentication token');
        }
        
        const data = await response.json();
        setToken(data.token);
      } catch (error: any) {
        console.error('Error getting token:', error);
        setError(error.message || 'Failed to get authentication token');
      } finally {
        setLoading(false);
      }
    }
    
    getAuthToken();
  }, [websiteId]);
  
  useEffect(() => {
    // Create widget UI
    if (!widgetRef.current || !token) return;
    
    const widgetContainer = widgetRef.current;
    widgetContainer.innerHTML = ''; // Clear any previous widget
    
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'proovd-pulse-demo-widget';
    widgetDiv.style.position = 'relative';
    widgetDiv.style.display = 'flex';
    widgetDiv.style.alignItems = 'center';
    widgetDiv.style.padding = '8px 12px';
    widgetDiv.style.backgroundColor = theme === 'dark' ? '#1f2937' : '#ffffff';
    widgetDiv.style.color = theme === 'dark' ? '#e5e7eb' : '#111827';
    widgetDiv.style.borderRadius = '8px';
    widgetDiv.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    widgetDiv.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    widgetDiv.style.fontSize = '14px';
    widgetDiv.style.width = 'fit-content';
    
    // Create pulse indicator
    const pulseIndicator = document.createElement('div');
    pulseIndicator.style.width = '10px';
    pulseIndicator.style.height = '10px';
    pulseIndicator.style.borderRadius = '50%';
    pulseIndicator.style.backgroundColor = '#4338ca';
    pulseIndicator.style.marginRight = '8px';
    pulseIndicator.style.position = 'relative';
    
    // Add pulse animation
    const pulse = document.createElement('div');
    pulse.style.position = 'absolute';
    pulse.style.width = '100%';
    pulse.style.height = '100%';
    pulse.style.borderRadius = '50%';
    pulse.style.backgroundColor = '#4338ca';
    pulse.style.opacity = '0.6';
    pulse.style.animation = 'proovdPulseLive 1.5s infinite';
    
    // Add animation style
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes proovdPulseLive {
        0% {
          transform: scale(1);
          opacity: 0.6;
        }
        100% {
          transform: scale(2.5);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    
    pulseIndicator.appendChild(pulse);
    
    // Create count element
    const countElement = document.createElement('div');
    countElement.textContent = activeUsersCount !== null && activeUsersCount > 0 
      ? `${activeUsersCount} active user${activeUsersCount !== 1 ? 's' : ''}` 
      : 'ProovdPulse';
    
    widgetDiv.appendChild(pulseIndicator);
    widgetDiv.appendChild(countElement);
    
    widgetContainer.appendChild(widgetDiv);
    
    return () => {
      // Clean up
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [token, position, theme, activeUsersCount]);
  
  if (loading) {
    return <div className="h-16 w-32 animate-pulse rounded-md bg-gray-200"></div>;
  }
  
  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }
  
  return (
    <div className="border-rounded mt-4 p-4 border border-dashed border-gray-300">
      <p className="mb-2 text-sm text-gray-500">Live Widget Preview:</p>
      <div ref={widgetRef} className="min-h-8"></div>
    </div>
  );
}

export default function PulseDashboard() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>({});
  const [websiteStats, setWebsiteStats] = useState<WebsiteStats>({
    id: '',
    activeUsers: 0,
    totalClicks: 0,
    avgScrollPercentage: 0,
    avgTimeOnPage: 0,
    updatedAt: new Date().toISOString(),
    usersByCountry: '',
    usersByCity: '',
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const socketUrl = `wss://socket.proovd.in?websiteId=${id}`;

  const { lastMessage} = useWebSocket(socketUrl);

  // Parse country and city data
  const usersByCountry = {};
  const usersByCity = {};

    useEffect(() => {
   
      if (lastMessage) {
        try {
          const data = JSON.parse(lastMessage);

          if (data.type === 'stats') {

            setWebsiteStats({
              id: data.id,
              activeUsers: data.activeUsers || 0,
              totalClicks: data.totalClicks || 0,
              avgScrollPercentage: data.avgScrollPercentage || 0,
              avgTimeOnPage: data.avgTimeOnPage || 0,
              updatedAt: data.updatedAt || new Date().toISOString(),
              usersByCountry: data.usersByCountry || {},
              usersByCity: data.usersByCity || {},
            });
            setIsSocketConnected(true);
          }
        } catch (error) {
          console.error('Error parsing websocket message:', error);
        }
      }
    }, [lastMessage]);

  // useEffect(() => {
  //   async function fetchData() {
  //     try {
  //       setLoading(true);

  //       // Fetch website data from REST API
  //       const websiteResponse = await fetch(`/api/websites/${id}`);
  //       let websiteResponseData;
        
  //       try {
  //         websiteResponseData = await websiteResponse.json();
  //       } catch (parseError) {
  //         console.error('Error parsing website response:', parseError);
  //         throw new Error(`Failed to parse website API response: ${websiteResponse.status}`);
  //       }
        
  //       if (!websiteResponse.ok) {
  //         // We've already parsed the response, so we can access the error message
  //         throw new Error(websiteResponseData.error || `Error fetching website: ${websiteResponse.status}`);
  //       }
        
  //       // Website API returns data directly, not wrapped in success/data properties
  //       if (websiteResponseData && websiteResponseData._id) {
  //         setWebsiteData({
  //           id: websiteResponseData._id,
  //           name: websiteResponseData.name,
  //           domain: websiteResponseData.domain,
  //           url: websiteResponseData.domain, // Use domain as URL if not provided
  //           settings: websiteResponseData.settings || {}
  //         });
  //       } else {
  //         throw new Error('Failed to fetch website data');
  //       }
        
  //       // Fetch website stats from REST API
  //       const statsResponse = await fetch(`/api/websites/${id}/pulse`);
        
  //       if (!statsResponse.ok) {
  //         console.error(`Stats fetch error: ${statsResponse.status}`);
  //         // Don't throw here, just log the error and continue with null stats
  //       } else {
  //         const statsResult = await statsResponse.json();
          
  //         if (statsResult.success) {
  //           setWebsiteStats(statsResult.data);
  //           setIsSocketConnected(true);
  //         } else {
  //           console.error('Failed to fetch website stats:', statsResult.error);
  //           // Continue with empty stats
  //         }
  //       }
        
  //       setError(null);
  //       setLoading(false);
  //     } catch (error: any) {
  //       console.error('Error fetching data:', error);
  //       setError(error.message || 'An error occurred while fetching data');
  //       setLoading(false);
  //     }
  //   }
    
  //   fetchData();
    
    // Setup a polling interval to refresh stats every 10 seconds
  //   const intervalId = setInterval(async () => {
  //     if (!websiteData) return; // Don't poll if we don't have website data
      
  //     try {
  //       const statsResponse = await fetch(`/api/websites/${id}/pulse`);
        
  //       if (statsResponse.ok) {
  //         const statsResult = await statsResponse.json();
          
  //         if (statsResult.success) {
  //           setWebsiteStats(statsResult.data);
  //           setIsSocketConnected(true);
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Error refreshing stats:', error);
  //       setIsSocketConnected(false);
  //     }
  //   }, 10000); // Refresh every 10 seconds
    
  //   return () => {
  //     clearInterval(intervalId);
  //   };
  // }, [id]);
  
  // Copy widget code to clipboard
  const copyWidgetCode = () => {
    // Create a more visible prompt
    const code = `<script src="${window.location.origin}/api/cdn/p/${id}"></script>`;
    navigator.clipboard.writeText(code);
    alert('Widget code copied to clipboard! Add this single line to your website to enable ProovdPulse tracking.');
  };
  
  // Save settings
  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const settings = {
      position: String(formData.get('position') || 'bottom-right'),
      theme: String(formData.get('theme') || 'auto'),
      showActiveUsers: formData.get('showActiveUsers') === 'on',
      showEngagementMetrics: formData.get('showEngagementMetrics') === 'on',
      showHeatmap: formData.get('showHeatmap') === 'on'
    };
    
    try {
      const response = await fetch(`/api/websites/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: {
            ...websiteData?.settings,
            pulse: settings
          }
        }),
      });
      
      const result = await response.json();
      
      if (result.success || result._id) {
        // Update local state
        setWebsiteData({
          ...websiteData!,
          settings: {
            ...websiteData!.settings,
            pulse: settings
          }
        });
        
        setSettingsOpen(false);
        
        // Show success message
        alert('Settings saved successfully!');
      } else {
        throw new Error(result.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <div className="flex h-[600px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !websiteData) {
    return (
      <div className="flex h-[600px] w-full flex-col items-center justify-center">
        <h2 className="text-xl font-semibold">Website not found</h2>
        <p className="mt-2 text-gray-500">{error || 'The requested website could not be found.'}</p>
        <Link href="/dashboard" className="mt-4">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ProovdPulse Dashboard</h1>
          <p className="text-gray-500">{websiteData.name} - {websiteData.domain}</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => setSettingsOpen(!settingsOpen)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button onClick={copyWidgetCode}>
            <Clipboard className="mr-2 h-4 w-4" />
            Get Widget Code
          </Button>
        </div>
      </div>
      
      {isSocketConnected ? (
        <div className="alert alert-success mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 stroke-current mr-2" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold">Connected</h3>
            <p>Real-time data is being received from your website.</p>
          </div>
        </div>
      ) : (
        <div className="alert alert-warning mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 stroke-current mr-2" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="font-bold">Waiting for Data</h3>
            <p>Add the widget to your website to start receiving real-time data.</p>
          </div>
        </div>
      )}
      
      {settingsOpen && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Widget Settings</CardTitle>
            <CardDescription>Customize how the ProovdPulse widget appears on your website</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveSettings}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="font-medium">Widget Position</label>
                  <select 
                    name="position" 
                    className="w-full rounded-md border border-gray-300 p-2"
                    defaultValue={websiteData.settings?.pulse?.position || 'bottom-right'}
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="font-medium">Theme</label>
                  <select 
                    name="theme" 
                    className="w-full rounded-md border border-gray-300 p-2"
                    defaultValue={websiteData.settings?.pulse?.theme || 'auto'}
                  >
                    <option value="auto">Auto (System Preference)</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      name="showActiveUsers" 
                      className="mr-2 h-4 w-4" 
                      defaultChecked={websiteData.settings?.pulse?.showActiveUsers !== false}
                    />
                    Show Active Users
                  </label>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      name="showEngagementMetrics" 
                      className="mr-2 h-4 w-4" 
                      defaultChecked={websiteData.settings?.pulse?.showEngagementMetrics === true}
                    />
                    Show Engagement Metrics
                  </label>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      name="showHeatmap" 
                      className="mr-2 h-4 w-4" 
                      defaultChecked={websiteData.settings?.pulse?.showHeatmap === true}
                    />
                    Show Heatmap
                  </label>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setSettingsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Settings
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      {/* Live Widget Preview */}
      {settingsOpen && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Widget Preview</CardTitle>
            <CardDescription>This is how the widget will appear on your website</CardDescription>
          </CardHeader>
          <CardContent>
            <LiveProovdPulseWidget 
              websiteId={id as string} 
              position={websiteData.settings?.pulse?.position || 'bottom-right'} 
              theme={websiteData.settings?.pulse?.theme || 'light'} 
            />
          </CardContent>
        </Card>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="heatmaps">Heatmaps</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card key="active-users">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <span className="text-3xl font-bold">{websiteStats?.activeUsers || 0}</span>
                    <Activity className="ml-2 h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-xs text-gray-500">Real-time visitors</span>
                </div>
              </CardContent>
            </Card>
            
            <Card key="total-clicks">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <span className="text-3xl font-bold">{websiteStats?.totalClicks || 0}</span>
                    <CheckCircle2 className="ml-2 h-5 w-5 text-green-500" />
                  </div>
                  <span className="text-xs text-gray-500">User interactions</span>
                </div>
              </CardContent>
            </Card>
            
            <Card key="scroll-depth">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Scroll Depth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-3xl font-bold">{Math.round(websiteStats?.avgScrollPercentage || 0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div 
                      className="h-2 bg-amber-500 rounded-full" 
                      style={{ width: `${websiteStats?.avgScrollPercentage || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">Average scroll percentage</span>
                </div>
              </CardContent>
            </Card>
            
            <Card key="avg-time">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Time on Page</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-3xl font-bold">
                      {websiteStats?.avgTimeOnPage 
                        ? `${Math.floor(websiteStats.avgTimeOnPage / 60)}m ${Math.floor(websiteStats.avgTimeOnPage % 60)}s` 
                        : '0m 0s'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div 
                      className="h-2 bg-indigo-500 rounded-full" 
                      style={{ width: `${Math.min(100, ((websiteStats?.avgTimeOnPage || 0) / 300) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">Average session duration</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Users by Country</CardTitle>
                <CardDescription>Geographic distribution of your visitors</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(usersByCountry).length > 0 ? (
                  <ul className="space-y-2">
                    {Object.entries(usersByCountry)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 10)
                      .map(([country, count]) => (
                        <li key={country} className="flex justify-between items-center">
                          <span>{country}</span>
                          <span className="font-semibold">{String(count)}</span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40">
                    <Users className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">No location data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Users by City</CardTitle>
                <CardDescription>Cities your visitors are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(usersByCity).length > 0 ? (
                  <ul className="space-y-2">
                    {Object.entries(usersByCity)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 10)
                      .map(([city, count]) => (
                        <li key={city} className="flex justify-between items-center">
                          <span>{city}</span>
                          <span className="font-semibold">{String(count)}</span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40">
                    <Users className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">No location data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Heatmaps Tab */}
        <TabsContent value="heatmaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Click Heatmap</CardTitle>
              <CardDescription>Visual representation of where users click on your site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-[400px] bg-gray-50 rounded-lg">
                <BarChart4 className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">Heatmap visualization coming soon</p>
                <p className="text-sm text-gray-400 mt-2">Collecting data from your site visitors</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 