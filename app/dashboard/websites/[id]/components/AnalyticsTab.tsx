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

  const hasData = metrics.totalImpressions > 0 || metrics.totalClicks > 0;
  const hasTimeSeriesData = timeSeriesData.length > 0 && timeSeriesData.some(d => d.impressions > 0 || d.clicks > 0);
  const hasNotifications = topNotifications.length > 0;
  
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
          
          {hasTimeSeriesData ? (
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
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="text-gray-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-lg font-medium">No data available for the selected time period</p>
                <p className="text-sm mt-2">Start tracking impressions and clicks to see analytics over time</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Top Performing Notifications */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">Top Performing Notifications</h2>
          
          {hasNotifications ? (
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
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="text-gray-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">No notification performance data available</p>
                <p className="text-sm mt-2">Your notifications will appear here once they receive impressions and clicks</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {!hasData && (
        <div className="alert alert-info shadow-lg">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-bold">Getting Started with Analytics</h3>
              <div className="text-sm">
                Analytics will be displayed once your notifications start receiving impressions and clicks. 
                Make sure your widget script is properly installed on your website.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 