'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart } from '@/components/ui/line-chart';
import { formatNumber } from '@/lib/utils';

interface NotificationMetrics {
  id: string;
  name: string;
  type: string;
  impressions: number;
  clicks: number;
  conversionRate: number;
  displayCount: number;
  uniqueImpressionCount: number;
}

interface AnalyticsData {
  summary: {
    totalImpressions: number;
    totalClicks: number;
    totalNotifications: number;
    conversionRate: number;
  };
  timeSeriesData: {
    date: string;
    impressions: number;
    clicks: number;
  }[];
  topNotifications: NotificationMetrics[];
}

interface AnalyticsTabProps {
  websiteId: string;
}

export default function AnalyticsTab({ websiteId }: AnalyticsTabProps) {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>({
    summary: {
      totalImpressions: 0,
      totalClicks: 0,
      totalNotifications: 0,
      conversionRate: 0
    },
    timeSeriesData: [],
    topNotifications: []
  });

  // Fetch analytics data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/websites/${websiteId}/analytics?timeRange=${timeRange}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setData(result.data);
        } else {
          console.error('API returned unsuccessful response:', result);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [websiteId, timeRange]);

  // Helper function to get display text for time range
  const getTimeRangeDisplay = (range: string) => {
    switch (range) {
      case 'day': return 'Daily';
      case 'week': return 'Weekly';
      case 'month': return 'Monthly';
      case 'year': return 'Yearly';
      default: return range;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate notification types from topNotifications
  const notificationTypes = data.topNotifications.reduce((acc, notification) => {
    const existingType = acc.find(t => t.type === notification.type);
    if (existingType) {
      existingType.count += 1;
    } else {
      acc.push({ type: notification.type, count: 1, percentage: 0 });
    }
    return acc;
  }, [] as { type: string; count: number; percentage: number }[])
  .map(type => ({
    ...type,
    percentage: (type.count / data.topNotifications.length * 100) || 0
  }));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-gray-500 text-sm">Notification performance metrics</p>
        </div>
        <div className="flex gap-2">
          {(['day', 'week', 'month', 'year'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              onClick={() => setTimeRange(range)}
              className="text-sm"
            >
              {getTimeRangeDisplay(range)}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">Total Impressions</h3>
            <div className="text-3xl font-bold">{formatNumber(data.summary.totalImpressions)}</div>
            <p className="text-xs text-gray-500">Total notification views</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">Total Clicks</h3>
            <div className="text-3xl font-bold">{formatNumber(data.summary.totalClicks)}</div>
            <p className="text-xs text-gray-500">Total notification clicks</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
            <div className="text-3xl font-bold">{(data.summary.conversionRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-gray-500">Click-through rate</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">Total Notifications</h3>
            <div className="text-3xl font-bold">{formatNumber(data.summary.totalNotifications)}</div>
            <p className="text-xs text-gray-500">Active notifications</p>
          </div>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Performance Overview</h2>
              <p className="text-sm text-gray-500">Impressions and clicks over time</p>
            </div>
          </div>
          <div className="h-[300px]">
            {data.timeSeriesData?.length > 0 ? (
              <LineChart data={data.timeSeriesData} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available for the selected time period
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Top Performing Notifications */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Top Performing Notifications</h2>
              <p className="text-sm text-gray-500">Notifications with highest engagement</p>
            </div>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
          {data.topNotifications?.length > 0 ? (
            <div className="divide-y">
              {data.topNotifications.map((notification) => (
                <div key={notification.id} className="py-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{notification.name}</h3>
                    <p className="text-sm text-gray-500">
                      {notification.type} • {formatNumber(notification.impressions)} views • {formatNumber(notification.clicks)} clicks
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{(notification.conversionRate || 0).toFixed(1)}%</div>
                    <p className="text-sm text-gray-500">conversion rate</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No notification data available
            </div>
          )}
        </div>
      </Card>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notification Types */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Notification Types</h2>
              <p className="text-sm text-gray-500">Distribution by notification type</p>
            </div>
            {notificationTypes.length > 0 ? (
              <div className="space-y-4">
                {notificationTypes.map((type) => (
                  <div key={type.type} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{type.type}</span>
                      <span className="font-medium">{type.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${type.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No notification type data available
              </div>
            )}
          </div>
        </Card>

        {/* Engagement Metrics */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Engagement Details</h2>
              <p className="text-sm text-gray-500">Detailed notification metrics</p>
            </div>
            <div className="space-y-4">
              {data.topNotifications?.slice(0, 5).map((notification) => (
                <div key={notification.id} className="flex justify-between items-center">
                  <span className="text-sm truncate max-w-[200px]">{notification.name}</span>
                  <div className="text-right">
                    <div className="font-medium">{formatNumber(notification.uniqueImpressionCount)}</div>
                    <p className="text-sm text-gray-500">unique views</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 