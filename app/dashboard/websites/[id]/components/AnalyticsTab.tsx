'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatNumber } from '@/app/lib/utils';

interface AnalyticsTabProps {
  websiteId: string;
  website: {
    _id: string;
    name: string;
    domain: string;
    status: string;
  };
  metrics: {
    totalImpressions: number;
    totalClicks: number;
    totalNotifications: number;
    conversionRate: string;
    period: string;
  };
  timeSeriesData: Array<{
    date: string;
    impressions: number;
    clicks: number;
    conversionRate: string;
  }>;
  notificationMetrics: Array<{
    id: string;
    name: string;
    impressions: number;
    clicks: number;
    conversionRate: string;
    createdAt: string;
  }>;
  topNotifications: Array<{
    id: string;
    name: string;
    impressions: number;
    clicks: number;
    conversionRate: string;
  }>;
  totals: {
    impressions: number;
    clicks: number;
    conversionRate: string;
  };
}

export default function AnalyticsTab({
  websiteId,
  website,
  metrics,
  timeSeriesData,
  notificationMetrics,
  topNotifications,
  totals
}: AnalyticsTabProps) {
  const [timeRange, setTimeRange] = useState('week');
  
  // Format dates for chart display
  const formattedChartData = timeSeriesData.map(point => ({
    ...point,
    date: new Date(point.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }));
  
  return (
    <div className="space-y-8">
      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="text-sm font-medium text-gray-500">Total Impressions</h3>
            <div className="stat-value text-2xl">{formatNumber(metrics.totalImpressions)}</div>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="text-sm font-medium text-gray-500">Total Clicks</h3>
            <div className="stat-value text-2xl">{formatNumber(metrics.totalClicks)}</div>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
            <div className="stat-value text-2xl">{metrics.conversionRate}%</div>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="text-sm font-medium text-gray-500">Active Notifications</h3>
            <div className="stat-value text-2xl">{metrics.totalNotifications}</div>
          </div>
        </div>
      </div>
      
      {/* Time Range Selector */}
      <div className="flex justify-end mb-4">
        <div className="btn-group">
          <button 
            className={`btn btn-sm ${timeRange === 'day' ? 'btn-active' : ''}`}
            onClick={() => setTimeRange('day')}
          >
            Day
          </button>
          <button 
            className={`btn btn-sm ${timeRange === 'week' ? 'btn-active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            Week
          </button>
          <button 
            className={`btn btn-sm ${timeRange === 'month' ? 'btn-active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            Month
          </button>
        </div>
      </div>
      
      {/* Analytics Chart */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">Performance Over Time</h2>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formattedChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="impressions" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                  name="Impressions"
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#82ca9d" 
                  name="Clicks"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="conversionRate" 
                  stroke="#ff7300" 
                  name="Conversion Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Top Performing Notifications */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">Top Performing Notifications</h2>
          
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Notification</th>
                  <th>Impressions</th>
                  <th>Clicks</th>
                  <th>Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {topNotifications.map(notification => (
                  <tr key={notification.id}>
                    <td>{notification.name}</td>
                    <td>{formatNumber(notification.impressions)}</td>
                    <td>{formatNumber(notification.clicks)}</td>
                    <td>{notification.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td>Total</td>
                  <td>{formatNumber(totals.impressions)}</td>
                  <td>{formatNumber(totals.clicks)}</td>
                  <td>{totals.conversionRate}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 