'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useWebSocket } from '@/hooks/use-websocket';
import { formatDuration, formatNumber } from '@/lib/utils';

interface WebsiteStats {
  activeUsers: number;
  totalClicks: number;
  avgScrollPercentage: number;
  avgTimeOnPage: number;
  updatedAt: string;
}

export default function PulseDashboard() {
  const [stats, setStats] = useState<WebsiteStats>({
    activeUsers: 0,
    totalClicks: 0,
    avgScrollPercentage: 0,
    avgTimeOnPage: 0,
    updatedAt: new Date().toISOString(),
  });

  const websiteId = '67e0e2226fd66457ee2d2549'; // Replace with dynamic ID from your auth context
  const socketUrl = `wss://socket.proovd.in?websiteId=${websiteId}`;

  const { lastMessage } = useWebSocket(socketUrl);

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage);
        if (data.type === 'stats') {
          setStats({
            activeUsers: data.activeUsers || 0,
            totalClicks: data.totalClicks || 0,
            avgScrollPercentage: data.avgScrollPercentage || 0,
            avgTimeOnPage: data.avgTimeOnPage || 0,
            updatedAt: data.updatedAt || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error parsing websocket message:', error);
      }
    }
  }, [lastMessage]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">ProovdPulse Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Users Card */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-blue-600 dark:text-blue-300">Active Users</h3>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-200">
              {formatNumber(stats.activeUsers)}
            </div>
            <p className="text-xs text-blue-500 dark:text-blue-400">Real-time visitors</p>
          </div>
        </Card>

        {/* Total Clicks Card */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-green-600 dark:text-green-300">Total Clicks</h3>
            <div className="text-3xl font-bold text-green-700 dark:text-green-200">
              {formatNumber(stats.totalClicks)}
            </div>
            <p className="text-xs text-green-500 dark:text-green-400">Cumulative interactions</p>
          </div>
        </Card>

        {/* Scroll Depth Card */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-purple-600 dark:text-purple-300">Avg. Scroll Depth</h3>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-200">
              {stats.avgScrollPercentage.toFixed(1)}%
            </div>
            <div className="w-full bg-purple-200 dark:bg-purple-700 rounded-full h-2.5">
              <div 
                className="bg-purple-600 dark:bg-purple-400 h-2.5 rounded-full" 
                style={{ width: `${stats.avgScrollPercentage}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Time on Page Card */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-orange-600 dark:text-orange-300">Avg. Time on Page</h3>
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-200">
              {formatDuration(stats.avgTimeOnPage)}
            </div>
            <p className="text-xs text-orange-500 dark:text-orange-400">Per session</p>
          </div>
        </Card>
      </div>

      <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">
        Last updated: {new Date(stats.updatedAt).toLocaleString()}
      </div>
    </div>
  );
} 