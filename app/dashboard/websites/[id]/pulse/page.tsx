'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Loader2, Clipboard, Share2, Settings, BarChart4, Activity, Users, CheckCircle2 } from 'lucide-react';
import { Tab } from '@headlessui/react';

export default function PulseDashboard() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [websiteData, setWebsiteData] = useState<any>(null);
  const [engagementData, setEngagementData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Fetch website data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch website data
        const websiteResponse = await fetch(`/api/websites/${id}`);
        const websiteResult = await websiteResponse.json();
        
        if (websiteResult.success) {
          setWebsiteData(websiteResult.data);
        } else {
          throw new Error(websiteResult.error || 'Failed to fetch website data');
        }
        
        // Fetch engagement data
        const engagementResponse = await fetch(`/api/websites/${id}/pulse`);
        const engagementResult = await engagementResponse.json();
        
        if (engagementResult.success) {
          setEngagementData(engagementResult.data);
        } else {
          throw new Error(engagementResult.error || 'Failed to fetch engagement data');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    }
    
    fetchData();
  }, [id]);
  
  // Copy widget code to clipboard
  const copyWidgetCode = () => {
    const code = `<script async src="https://cdn.proovd.in/w/${id}/pulse.js"></script>`;
    navigator.clipboard.writeText(code);
    alert('Widget code copied to clipboard');
  };
  
  if (loading) {
    return (
      <div className="flex h-[600px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!websiteData) {
    return (
      <div className="flex h-[600px] w-full flex-col items-center justify-center">
        <h2 className="text-xl font-semibold">Website not found</h2>
        <p className="mt-2 text-gray-500">The requested website could not be found.</p>
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
          <p className="text-gray-500">{websiteData.name} - {websiteData.url}</p>
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
      
      {settingsOpen && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Widget Settings</CardTitle>
            <CardDescription>Customize how the ProovdPulse widget appears on your website</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="font-medium">Widget Position</label>
                <select className="w-full rounded-md border border-gray-300 p-2">
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="font-medium">Theme</label>
                <select className="w-full rounded-md border border-gray-300 p-2">
                  <option value="auto">Auto (System Preference)</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2 h-4 w-4" defaultChecked />
                  Show Active Users
                </label>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2 h-4 w-4" defaultChecked />
                  Show Engagement Metrics
                </label>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2 h-4 w-4" defaultChecked />
                  Show Heatmap
                </label>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2 h-4 w-4" defaultChecked />
                  Show Tooltips
                </label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline">Cancel</Button>
            <Button>Save Settings</Button>
          </CardFooter>
        </Card>
      )}
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="heatmaps">Heatmaps</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{engagementData?.activeUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Users currently active on your site
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Page Views Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{engagementData?.viewCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{Math.floor(Math.random() * 20) + 5}% from yesterday
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg. Time on Page
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {engagementData?.avgTimeOnPage 
                    ? `${Math.floor(engagementData.avgTimeOnPage / 60)}m ${engagementData.avgTimeOnPage % 60}s` 
                    : '0m 0s'}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{Math.floor(Math.random() * 30) + 1}s from last week
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
              <CardDescription>Real-time user activity on your website</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-center justify-center bg-gray-50 rounded-lg">
                {/* Placeholder for activity chart */}
                <p className="text-gray-400">Activity chart will appear here</p>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Most viewed pages on your site</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <li key={i} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{i === 0 ? 'Homepage' : `Page ${i + 1}`}</p>
                        <p className="text-sm text-gray-500">{websiteData.url}{i === 0 ? '/' : `/page-${i + 1}`}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{Math.floor(Math.random() * 200) + 50}</p>
                        <p className="text-sm text-gray-500">views</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Where your users are located</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {['United States', 'India', 'United Kingdom', 'Germany', 'Canada'].map((country, i) => (
                    <li key={i} className="flex items-center justify-between border-b pb-2">
                      <p className="font-medium">{country}</p>
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className="bg-primary h-2.5 rounded-full" 
                            style={{ width: `${Math.floor(Math.random() * 100)}%` }}
                          ></div>
                        </div>
                        <p className="font-medium">{Math.floor(Math.random() * 40) + 10}%</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
              <CardDescription>How users are interacting with your website</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-medium">Scroll Depth</h3>
                  <div className="h-2 w-full bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-primary rounded-full" 
                      style={{ width: '65%' }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500">Users scroll 65% of page content on average</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Interaction Rate</h3>
                  <div className="h-2 w-full bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-primary rounded-full" 
                      style={{ width: '42%' }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500">42% of users interact with page elements</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Return Rate</h3>
                  <div className="h-2 w-full bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-primary rounded-full" 
                      style={{ width: '28%' }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500">28% of users return within 7 days</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Form Completion</h3>
                  <div className="h-2 w-full bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-primary rounded-full" 
                      style={{ width: '76%' }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500">76% of users complete forms they start</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Track how users move through your conversion process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-center justify-center bg-gray-50 rounded-lg">
                {/* Placeholder for funnel visualization */}
                <p className="text-gray-400">Funnel visualization will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Heatmaps Tab */}
        <TabsContent value="heatmaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Page Heatmaps</CardTitle>
              <CardDescription>Visual representation of where users focus their attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="rounded-full">Homepage</Button>
                <Button variant="outline" size="sm" className="rounded-full">Product Page</Button>
                <Button variant="outline" size="sm" className="rounded-full">Checkout</Button>
                <Button variant="outline" size="sm" className="rounded-full">Landing Page</Button>
                <Button variant="outline" size="sm" className="rounded-full">Blog</Button>
              </div>
              
              <div className="relative h-[500px] w-full bg-gray-100 rounded-lg overflow-hidden">
                {/* Placeholder for heatmap */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-400">Heatmap visualization will appear here</p>
                </div>
                
                {/* Simulate heatmap points */}
                <div className="absolute left-[30%] top-[20%] w-12 h-12 rounded-full bg-red-500/30 blur-lg"></div>
                <div className="absolute left-[40%] top-[40%] w-16 h-16 rounded-full bg-red-500/50 blur-lg"></div>
                <div className="absolute left-[60%] top-[30%] w-10 h-10 rounded-full bg-red-500/20 blur-lg"></div>
                <div className="absolute left-[20%] top-[60%] w-8 h-8 rounded-full bg-yellow-500/30 blur-lg"></div>
                <div className="absolute left-[70%] top-[70%] w-14 h-14 rounded-full bg-orange-500/40 blur-lg"></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Segments</CardTitle>
              <CardDescription>Understand different user groups and their behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    <h3 className="font-medium">New Visitors</h3>
                  </div>
                  <p className="text-2xl font-bold">{Math.floor(Math.random() * 500) + 200}</p>
                  <p className="text-sm text-gray-500">First-time visitors in the last 7 days</p>
                </div>
                
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-primary" />
                    <h3 className="font-medium">Returning Users</h3>
                  </div>
                  <p className="text-2xl font-bold">{Math.floor(Math.random() * 300) + 100}</p>
                  <p className="text-sm text-gray-500">Visitors who came back in the last 7 days</p>
                </div>
                
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center">
                    <CheckCircle2 className="h-5 w-5 mr-2 text-primary" />
                    <h3 className="font-medium">Converted Users</h3>
                  </div>
                  <p className="text-2xl font-bold">{Math.floor(Math.random() * 100) + 50}</p>
                  <p className="text-sm text-gray-500">Users who completed a goal</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="font-medium mb-2">Device Distribution</h3>
                <div className="flex items-center mb-4">
                  <div className="w-full bg-gray-200 h-2.5 rounded-full mr-2">
                    <div className="h-2.5 rounded-full bg-primary" style={{ width: '65%' }}></div>
                  </div>
                  <span className="text-sm font-medium">Mobile (65%)</span>
                </div>
                <div className="flex items-center mb-4">
                  <div className="w-full bg-gray-200 h-2.5 rounded-full mr-2">
                    <div className="h-2.5 rounded-full bg-primary" style={{ width: '25%' }}></div>
                  </div>
                  <span className="text-sm font-medium">Desktop (25%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 h-2.5 rounded-full mr-2">
                    <div className="h-2.5 rounded-full bg-primary" style={{ width: '10%' }}></div>
                  </div>
                  <span className="text-sm font-medium">Tablet (10%)</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>User Journey</CardTitle>
              <CardDescription>Track how users navigate through your website</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-center justify-center bg-gray-50 rounded-lg">
                {/* Placeholder for user journey visualization */}
                <p className="text-gray-400">User journey visualization will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 