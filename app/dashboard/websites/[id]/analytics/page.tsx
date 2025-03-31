'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  Loader2,
  BarChart4,
  Activity,
  Users,
  Bell,
  Calendar,
  MousePointerClick,
  TrendingUp,
  Download
} from 'lucide-react';
import Chart from 'chart.js/auto';

// Define interfaces for data types
interface WebsiteData {
  id: string;
  name: string;
  domain: string;
  url: string;
}

interface AnalyticsSummary {
  totalImpressions: number;
  totalClicks: number;
  conversionRate: number;
  totalNotifications: number;
}

interface TimeSeriesData {
  date: string;
  impressions: number;
  clicks: number;
}

interface TopNotification {
  id: string;
  type: string;
  views: number;
  clicks: number;
  conversionRate: number;
}

export default function AnalyticsDashboard() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [topNotifications, setTopNotifications] = useState<TopNotification[]>([]);
  const [timeRange, setTimeRange] = useState<string>('week');
  
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Fetch website data and analytics
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch website data
        const websiteResponse = await fetch(`/api/websites/${id}`);
        let websiteResponseData;
        
        try {
          websiteResponseData = await websiteResponse.json();
        } catch (parseError) {
          console.error('Error parsing website response:', parseError);
          throw new Error(`Failed to parse website API response: ${websiteResponse.status}`);
        }
        
        if (!websiteResponse.ok) {
          // We've already parsed the response, so we can access the error message
          throw new Error(websiteResponseData.error || `Error fetching website: ${websiteResponse.status}`);
        }
        
        // Website API returns data directly, not wrapped in success/data properties
        if (websiteResponseData && websiteResponseData._id) {
          setWebsiteData({
            id: websiteResponseData._id,
            name: websiteResponseData.name,
            domain: websiteResponseData.domain,
            url: websiteResponseData.domain // Use domain as URL if not provided
          });
        } else {
          throw new Error('Invalid website data format received');
        }
        
        // Fetch analytics data
        const analyticsResponse = await fetch(`/api/websites/${id}/analytics?timeRange=${timeRange}&groupBy=day`);
        let analyticsResult;
        
        try {
          analyticsResult = await analyticsResponse.json();
        } catch (parseError) {
          console.error('Error parsing analytics response:', parseError);
          throw new Error('Invalid analytics data format received from server');
        }
        
        if (!analyticsResponse.ok) {
          // We've already parsed the response, so we can access the error message
          throw new Error(analyticsResult.error || `Failed to fetch analytics data: ${analyticsResponse.status}`);
        }
        
        if (analyticsResult.success) {
          // Ensure we have the expected data structure
          if (analyticsResult.data && typeof analyticsResult.data === 'object') {
            // Set summary data
            setAnalyticsSummary(analyticsResult.data.summary || {
              totalImpressions: 0,
              totalClicks: 0,
              conversionRate: 0,
              totalNotifications: 0
            });
            
            // Set time series data
            setTimeSeriesData(Array.isArray(analyticsResult.data.timeSeriesData) 
              ? analyticsResult.data.timeSeriesData 
              : []);
            
            // Set top notifications
            setTopNotifications(Array.isArray(analyticsResult.data.topNotifications) 
              ? analyticsResult.data.topNotifications 
              : []);
          } else {
            console.error('Invalid data structure in analytics response:', analyticsResult);
            throw new Error('Invalid data structure in analytics response');
          }
        } else {
          throw new Error(analyticsResult.error || 'Failed to fetch analytics data');
        }
        
        setError(null);
        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message || 'An error occurred while fetching data');
        setLoading(false);
      }
    }
    
    fetchData();
  }, [id, timeRange]);
  
  // Initialize and update chart
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    // Check if we have data to display
    if (!timeSeriesData || timeSeriesData.length === 0) {
      // Draw a fallback message on the canvas instead of a chart
      ctx.font = '16px Arial';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.fillText('No data available for the selected time period', chartRef.current.width / 2, chartRef.current.height / 2);
      return;
    }
    
    // Prepare data for the chart
    const labels = timeSeriesData.map(item => item.date);
    const impressionsData = timeSeriesData.map(item => item.impressions);
    const clicksData = timeSeriesData.map(item => item.clicks);
    
    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Impressions',
            data: impressionsData,
            borderColor: '#4338ca',
            backgroundColor: 'rgba(67, 56, 202, 0.1)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Clicks',
            data: clicksData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Impressions & Clicks'
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true
          }
        }
      }
    });
    
    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [timeSeriesData]);
  
  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
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
        <h2 className="text-xl font-semibold">Error Loading Data</h2>
        <p className="mt-2 text-center text-gray-500 max-w-md">
          {error || 'The requested website could not be found.'}
        </p>
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
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-500">{websiteData.name} - {websiteData.domain}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleTimeRangeChange('day')}>
            Daily
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleTimeRangeChange('week')}>
            Weekly
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleTimeRangeChange('month')}>
            Monthly
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleTimeRangeChange('year')}>
            Yearly
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="text-3xl font-bold">{analyticsSummary?.totalImpressions || 0}</span>
                <Activity className="ml-2 h-5 w-5 text-blue-500" />
              </div>
              <span className="text-xs text-gray-500">People who saw notifications</span>
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
                <span className="text-3xl font-bold">{analyticsSummary?.totalClicks || 0}</span>
                <MousePointerClick className="ml-2 h-5 w-5 text-green-500" />
              </div>
              <span className="text-xs text-gray-500">Notification interactions</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="text-3xl font-bold">
                  {analyticsSummary ? `${(analyticsSummary.conversionRate * 100).toFixed(1)}%` : '0%'}
                </span>
                <TrendingUp className="ml-2 h-5 w-5 text-violet-500" />
              </div>
              <span className="text-xs text-gray-500">Click-through rate</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="text-3xl font-bold">{analyticsSummary?.totalNotifications || 0}</span>
                <Bell className="ml-2 h-5 w-5 text-amber-500" />
              </div>
              <span className="text-xs text-gray-500">Active notification types</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>Visualization of impressions and clicks over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <canvas ref={chartRef}></canvas>
          </div>
        </CardContent>
      </Card>
      
      {/* Top Notifications */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center">
          <div>
            <CardTitle>Top Performing Notifications</CardTitle>
            <CardDescription>Notifications with the highest engagement</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="ml-auto">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          {topNotifications && topNotifications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-sm font-medium text-gray-500">Notification Type</th>
                    <th className="text-right text-sm font-medium text-gray-500">Views</th>
                    <th className="text-right text-sm font-medium text-gray-500">Clicks</th>
                    <th className="text-right text-sm font-medium text-gray-500">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topNotifications.map((notification, index) => (
                    <tr key={notification.id || index} className="border-t">
                      <td className="py-3 text-left font-medium">{notification.type}</td>
                      <td className="py-3 text-right">{notification.views}</td>
                      <td className="py-3 text-right">{notification.clicks}</td>
                      <td className="py-3 text-right">{(notification.conversionRate * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center">
              <p className="text-gray-500">No notification data available</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Additional Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Visitor Breakdown</CardTitle>
            <CardDescription>User engagement by source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-center justify-center">
              <p className="text-gray-500">Source breakdown coming soon</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
            <CardDescription>Advanced performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-center justify-center">
              <p className="text-gray-500">Engagement metrics coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 