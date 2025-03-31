'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  Loader2, BarChart4, Activity, Zap, 
  Settings, Globe, Code, Bell, AlertCircle 
} from 'lucide-react';

interface WebsiteData {
  id: string;
  name: string;
  domain: string;
  url: string;
  createdAt: string;
  settings: {
    isPublic: boolean;
    pulse?: {
      enabled: boolean;
      position: string;
      theme: string;
    }
  }
}

export default function WebsiteDashboard() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    async function fetchWebsiteData() {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/websites/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error fetching website: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          setWebsiteData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch website data');
        }
        
        setError(null);
        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching website data:', error);
        setError(error.message || 'An error occurred while fetching data');
        setLoading(false);
      }
    }
    
    fetchWebsiteData();
  }, [id]);
  
  // Functions to navigate to specific pages
  const navigateToAnalytics = () => {
    router.push(`/dashboard/websites/${id}/analytics`);
  };
  
  const navigateToPulse = () => {
    router.push(`/dashboard/websites/${id}/pulse`);
  };
  
  const navigateToSettings = () => {
    router.push(`/dashboard/websites/${id}/settings`);
  };
  
  // Function to handle quick embed code copy
  const copyEmbedCode = () => {
    const code = `<script>
  !function(d,t,w,p){
    w.proovdConfig = {
      websiteId: "${id}",
      domain: "${websiteData?.domain || 'your-domain.com'}"
    };
    
    p=d.createElement(t);
    p.src="https://cdn.proovd.io/tracker.js";
    p.async=1;
    d.getElementsByTagName("head")[0].appendChild(p);
  }(document,"script",window);
</script>`;
    
    navigator.clipboard.writeText(code);
    alert('Embed code copied to clipboard!');
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
          <h1 className="text-2xl font-bold">{websiteData.name}</h1>
          <p className="text-gray-500">{websiteData.domain}</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={copyEmbedCode}>
            <Code className="mr-2 h-4 w-4" />
            Get Embed Code
          </Button>
          <Button variant="outline" onClick={navigateToSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quickActions">Quick Actions</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Analytics Card */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <BarChart4 className="mr-2 h-5 w-5 text-blue-600" />
                  Analytics
                </CardTitle>
                <CardDescription>Track engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-gray-600">
                  View detailed analytics about user interactions, click rates, and conversion metrics for your website.
                </p>
                <Button onClick={navigateToAnalytics} className="w-full">
                  View Analytics
                </Button>
              </CardContent>
            </Card>
            
            {/* ProovdPulse Card */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Activity className="mr-2 h-5 w-5 text-violet-600" />
                  ProovdPulse
                </CardTitle>
                <CardDescription>Real-time engagement widget</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-gray-600">
                  Configure the ProovdPulse widget to display real-time visitor data and social proof elements.
                </p>
                <Button onClick={navigateToPulse} className="w-full">
                  Manage ProovdPulse
                </Button>
              </CardContent>
            </Card>
            
            {/* Website Status Card */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Globe className="mr-2 h-5 w-5 text-green-600" />
                  Website Status
                </CardTitle>
                <CardDescription>Monitoring and health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tracking Status:</span>
                    <span className="flex items-center text-sm font-medium text-green-600">
                      <span className="mr-1 h-2 w-2 rounded-full bg-green-600"></span>
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ProovdPulse:</span>
                    <span className={`flex items-center text-sm font-medium ${websiteData.settings?.pulse?.enabled ? 'text-green-600' : 'text-amber-500'}`}>
                      <span className={`mr-1 h-2 w-2 rounded-full ${websiteData.settings?.pulse?.enabled ? 'bg-green-600' : 'bg-amber-500'}`}></span>
                      {websiteData.settings?.pulse?.enabled ? 'Enabled' : 'Not Configured'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Public Access:</span>
                    <span className={`flex items-center text-sm font-medium ${websiteData.settings?.isPublic ? 'text-blue-600' : 'text-gray-600'}`}>
                      <span className={`mr-1 h-2 w-2 rounded-full ${websiteData.settings?.isPublic ? 'bg-blue-600' : 'bg-gray-600'}`}></span>
                      {websiteData.settings?.isPublic ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
                <Button variant="outline" onClick={navigateToSettings} className="w-full">
                  Manage Settings
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest events from your website</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <Bell className="mt-1 h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Tracking script installed</p>
                    <p className="text-sm text-gray-500">Your website tracking is active and collecting data</p>
                    <p className="text-xs text-gray-400">Just now</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <AlertCircle className="mt-1 h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium">Analytics summary generated</p>
                    <p className="text-sm text-gray-500">Your first analytics report is ready to view</p>
                    <p className="text-xs text-gray-400">10 minutes ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Quick Actions Tab */}
        <TabsContent value="quickActions" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>View detailed metrics and reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={navigateToAnalytics} className="w-full">
                  <BarChart4 className="mr-2 h-4 w-4" />
                  Go to Analytics
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>ProovdPulse Dashboard</CardTitle>
                <CardDescription>Configure real-time visitor widgets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={navigateToPulse} className="w-full">
                  <Zap className="mr-2 h-4 w-4" />
                  Manage ProovdPulse
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Integration Guide</CardTitle>
              <CardDescription>Quick setup instructions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="mb-2 font-semibold">Basic Tracking Script</h3>
                <div className="relative rounded bg-gray-100 p-4">
                  <pre className="text-sm">
                    <code>{`<script>
  !function(d,t,w,p){
    w.proovdConfig = {
      websiteId: "${id}",
      domain: "${websiteData?.domain || 'your-domain.com'}"
    };
    
    p=d.createElement(t);
    p.src="https://cdn.proovd.io/tracker.js";
    p.async=1;
    d.getElementsByTagName("head")[0].appendChild(p);
  }(document,"script",window);
</script>`}</code>
                  </pre>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="absolute right-2 top-2"
                    onClick={copyEmbedCode}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="mb-2 font-semibold">Next Steps</h3>
                <ul className="list-inside list-disc space-y-2 text-sm text-gray-600">
                  <li>Add the tracking script to all pages of your website</li>
                  <li>Configure ProovdPulse widget settings in the Pulse dashboard</li>
                  <li>Monitor your first analytics report within 24 hours</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 