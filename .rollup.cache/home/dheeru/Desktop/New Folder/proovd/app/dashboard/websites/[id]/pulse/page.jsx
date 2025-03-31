'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Loader2, Clipboard, Settings, BarChart4, Activity, Users, CheckCircle2 } from 'lucide-react';
// Add a new component for the live ProovdPulse widget
function LiveProovdPulseWidget({ websiteId, position, theme }) {
    const widgetRef = useRef(null);
    const [token, setToken] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        async function getAuthToken() {
            try {
                const response = await fetch(`/api/pulse-auth?websiteId=${websiteId}`);
                if (!response.ok) {
                    throw new Error('Failed to get authentication token');
                }
                const data = await response.json();
                setToken(data.token);
            }
            catch (error) {
                console.error('Error getting token:', error);
                setError(error.message || 'Failed to get authentication token');
            }
            finally {
                setLoading(false);
            }
        }
        getAuthToken();
    }, [websiteId]);
    useEffect(() => {
        // This is where we would initialize the ProovdPulse widget
        // In a real dashboard, we would load the script from CDN and initialize
        // For now, we'll just simulate the widget appearance
        if (!widgetRef.current || !token)
            return;
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
        countElement.textContent = '1 active user';
        widgetDiv.appendChild(pulseIndicator);
        widgetDiv.appendChild(countElement);
        widgetContainer.appendChild(widgetDiv);
        return () => {
            // Clean up
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        };
    }, [token, position, theme]);
    if (loading) {
        return <div className="h-16 w-32 animate-pulse rounded-md bg-gray-200"></div>;
    }
    if (error) {
        return <div className="text-sm text-red-500">{error}</div>;
    }
    return (<div className="border-rounded mt-4 p-4 border border-dashed border-gray-300">
      <p className="mb-2 text-sm text-gray-500">Live Widget Preview:</p>
      <div ref={widgetRef} className="min-h-8"></div>
    </div>);
}
export default function PulseDashboard() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [websiteData, setWebsiteData] = useState(null);
    const [websiteStats, setWebsiteStats] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [settingsOpen, setSettingsOpen] = useState(false);
    // Parse country and city data
    const usersByCountry = (websiteStats === null || websiteStats === void 0 ? void 0 : websiteStats.usersByCountry) ?
        JSON.parse(websiteStats.usersByCountry) : {};
    const usersByCity = (websiteStats === null || websiteStats === void 0 ? void 0 : websiteStats.usersByCity) ?
        JSON.parse(websiteStats.usersByCity) : {};
    // Fetch website data
    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch website data from REST API
                const websiteResponse = await fetch(`/api/websites/${id}`);
                const websiteResult = await websiteResponse.json();
                if (websiteResult.success) {
                    setWebsiteData(websiteResult);
                }
                else {
                    throw new Error(websiteResult.error || 'Failed to fetch website data');
                }
                // Fetch website stats from REST API
                const statsResponse = await fetch(`/api/websites/${id}/pulse`);
                const statsResult = await statsResponse.json();
                if (statsResult.success) {
                    setWebsiteStats(statsResult.data);
                }
                else {
                    console.error('Failed to fetch website stats:', statsResult.error);
                    // Continue with empty stats
                }
                setLoading(false);
            }
            catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        }
        fetchData();
        // Setup a polling interval to refresh stats every 30 seconds
        const intervalId = setInterval(async () => {
            try {
                const statsResponse = await fetch(`/api/websites/${id}/pulse`);
                const statsResult = await statsResponse.json();
                if (statsResult.success) {
                    setWebsiteStats(statsResult.data);
                }
            }
            catch (error) {
                console.error('Error refreshing stats:', error);
            }
        }, 30000);
        return () => {
            clearInterval(intervalId);
        };
    }, [id]);
    // Copy widget code to clipboard
    const copyWidgetCode = () => {
        var _a, _b, _c, _d;
        const code = `<script src="https://cdn.jsdelivr.net/npm/uuid@9.0.0/dist/umd/uuidv4.min.js"></script>
<script type="module">
  import { ProovdPulse } from 'https://cdn.proovd.in/pulse-widget/proovd-pulse.js';
  
  // Initialize ProovdPulse
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      // Get auth token from your backend
      const response = await fetch('${window.location.origin}/api/pulse-auth?websiteId=${id}');
      const { token } = await response.json();
      
      // Initialize with authentication token
      window.proovdPulse = new ProovdPulse({
        websiteId: '${id}',
        serverUrl: 'wss://socket.proovd.in',
        authToken: token,
        position: '${((_b = (_a = websiteData.settings) === null || _a === void 0 ? void 0 : _a.pulse) === null || _b === void 0 ? void 0 : _b.position) || 'bottom-right'}',
        theme: '${((_d = (_c = websiteData.settings) === null || _c === void 0 ? void 0 : _c.pulse) === null || _d === void 0 ? void 0 : _d.theme) || 'light'}'
      });
      
      await window.proovdPulse.init();
    } catch (error) {
      console.error('Failed to initialize ProovdPulse:', error);
    }
  });
</script>`;
        navigator.clipboard.writeText(code);
        alert('Widget code copied to clipboard');
    };
    // Save settings
    const saveSettings = async (settings) => {
        try {
            const response = await fetch(`/api/websites/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    settings: {
                        pulse: settings
                    }
                }),
            });
            const result = await response.json();
            if (result.success) {
                setWebsiteData(Object.assign(Object.assign({}, websiteData), { settings: Object.assign(Object.assign({}, websiteData.settings), { pulse: settings }) }));
                setSettingsOpen(false);
            }
            else {
                throw new Error(result.error || 'Failed to update settings');
            }
        }
        catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        }
    };
    if (loading) {
        return (<div className="flex h-[600px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      </div>);
    }
    if (!websiteData) {
        return (<div className="flex h-[600px] w-full flex-col items-center justify-center">
        <h2 className="text-xl font-semibold">Website not found</h2>
        <p className="mt-2 text-gray-500">The requested website could not be found.</p>
        <Link href="/dashboard" className="mt-4">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>);
    }
    return (<div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ProovdPulse Dashboard</h1>
          <p className="text-gray-500">{websiteData.name} - {websiteData.domain}</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => setSettingsOpen(!settingsOpen)}>
            <Settings className="mr-2 h-4 w-4"/>
            Settings
          </Button>
          <Button onClick={copyWidgetCode}>
            <Clipboard className="mr-2 h-4 w-4"/>
            Get Widget Code
          </Button>
        </div>
      </div>
      
      {settingsOpen && (<Card className="mb-6">
          <CardHeader>
            <CardTitle>Widget Settings</CardTitle>
            <CardDescription>Customize how the ProovdPulse widget appears on your website</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                saveSettings({
                    position: formData.get('position'),
                    theme: formData.get('theme'),
                    showActiveUsers: formData.get('showActiveUsers') === 'on',
                    showEngagementMetrics: formData.get('showEngagementMetrics') === 'on',
                    showHeatmap: formData.get('showHeatmap') === 'on',
                });
            }}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="font-medium">Widget Position</label>
                  <select name="position" className="w-full rounded-md border border-gray-300 p-2" defaultValue={((_b = (_a = websiteData.settings) === null || _a === void 0 ? void 0 : _a.pulse) === null || _b === void 0 ? void 0 : _b.position) || 'bottom-right'}>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="font-medium">Theme</label>
                  <select name="theme" className="w-full rounded-md border border-gray-300 p-2" defaultValue={((_d = (_c = websiteData.settings) === null || _c === void 0 ? void 0 : _c.pulse) === null || _d === void 0 ? void 0 : _d.theme) || 'auto'}>
                    <option value="auto">Auto (System Preference)</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" name="showActiveUsers" className="mr-2 h-4 w-4" defaultChecked={((_f = (_e = websiteData.settings) === null || _e === void 0 ? void 0 : _e.pulse) === null || _f === void 0 ? void 0 : _f.showActiveUsers) !== false}/>
                    Show Active Users
                  </label>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" name="showEngagementMetrics" className="mr-2 h-4 w-4" defaultChecked={((_h = (_g = websiteData.settings) === null || _g === void 0 ? void 0 : _g.pulse) === null || _h === void 0 ? void 0 : _h.showEngagementMetrics) !== false}/>
                    Show Engagement Metrics
                  </label>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" name="showHeatmap" className="mr-2 h-4 w-4" defaultChecked={((_k = (_j = websiteData.settings) === null || _j === void 0 ? void 0 : _j.pulse) === null || _k === void 0 ? void 0 : _k.showHeatmap) !== false}/>
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
        </Card>)}
      
      {/* Live Widget Preview */}
      {settingsOpen && (<Card className="mb-6">
          <CardHeader>
            <CardTitle>Widget Preview</CardTitle>
            <CardDescription>This is how the widget will appear on your website</CardDescription>
          </CardHeader>
          <CardContent>
            <LiveProovdPulseWidget websiteId={id} position={((_m = (_l = websiteData.settings) === null || _l === void 0 ? void 0 : _l.pulse) === null || _m === void 0 ? void 0 : _m.position) || 'bottom-right'} theme={((_p = (_o = websiteData.settings) === null || _o === void 0 ? void 0 : _o.pulse) === null || _p === void 0 ? void 0 : _p.theme) || 'light'}/>
          </CardContent>
        </Card>)}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="heatmaps">Heatmaps</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <span className="text-3xl font-bold">{(websiteStats === null || websiteStats === void 0 ? void 0 : websiteStats.activeUsers) || 0}</span>
                    <Activity className="ml-2 h-5 w-5 text-blue-500"/>
                  </div>
                  <span className="text-xs text-gray-500">Real-time visitors</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <span className="text-3xl font-bold">{(websiteStats === null || websiteStats === void 0 ? void 0 : websiteStats.totalClicks) || 0}</span>
                    <CheckCircle2 className="ml-2 h-5 w-5 text-green-500"/>
                  </div>
                  <span className="text-xs text-gray-500">User interactions</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Scroll Depth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-3xl font-bold">{Math.round((websiteStats === null || websiteStats === void 0 ? void 0 : websiteStats.avgScrollPercentage) || 0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-2 bg-amber-500 rounded-full" style={{ width: `${(websiteStats === null || websiteStats === void 0 ? void 0 : websiteStats.avgScrollPercentage) || 0}%` }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Time on Page</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-3xl font-bold">
                      {(websiteStats === null || websiteStats === void 0 ? void 0 : websiteStats.avgTimeOnPage)
            ? `${Math.floor(websiteStats.avgTimeOnPage / 60)}m ${Math.floor(websiteStats.avgTimeOnPage % 60)}s`
            : '0m 0s'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (((websiteStats === null || websiteStats === void 0 ? void 0 : websiteStats.avgTimeOnPage) || 0) / 300) * 100)}%` }}></div>
                  </div>
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
                {Object.keys(usersByCountry).length > 0 ? (<ul className="space-y-2">
                    {Object.entries(usersByCountry)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([country, count]) => (<li key={country} className="flex justify-between items-center">
                          <span>{country}</span>
                          <span className="font-semibold">{String(count)}</span>
                        </li>))}
                  </ul>) : (<div className="flex flex-col items-center justify-center h-40">
                    <Users className="h-12 w-12 text-gray-300 mb-4"/>
                    <p className="text-gray-500">No location data available yet</p>
                  </div>)}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Users by City</CardTitle>
                <CardDescription>Cities your visitors are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(usersByCity).length > 0 ? (<ul className="space-y-2">
                    {Object.entries(usersByCity)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([city, count]) => (<li key={city} className="flex justify-between items-center">
                          <span>{city}</span>
                          <span className="font-semibold">{String(count)}</span>
                        </li>))}
                  </ul>) : (<div className="flex flex-col items-center justify-center h-40">
                    <Users className="h-12 w-12 text-gray-300 mb-4"/>
                    <p className="text-gray-500">No location data available yet</p>
                  </div>)}
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
                <BarChart4 className="h-12 w-12 text-gray-300 mb-4"/>
                <p className="text-gray-500">Heatmap visualization coming soon</p>
                <p className="text-sm text-gray-400 mt-2">Collecting data from your site visitors</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);
}
