'use client';
import { useEffect, useState } from 'react';
import { ChartBarIcon, ArrowUpIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useWebsiteStats } from '@/app/lib/hooks';
function StatsCard({ title, value, icon, description, isLoading = false }) {
    return (<div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="rounded-full bg-primary/10 p-1.5 text-primary">
          {icon}
        </div>
      </div>
      <div className="mt-4">
        {isLoading ? (<div className="h-8 w-24 bg-base-300 animate-pulse rounded"></div>) : (<p className="text-3xl font-bold">{value}</p>)}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>);
}
export default function RealTimeStats({ websiteId, initialStats, onLoadingChange }) {
    // Use the custom hook to fetch and subscribe to website statistics
    const { stats, isLoading, error, refreshStats } = useWebsiteStats(websiteId);
    // Track last refresh time and set up a manual refresh option
    const [lastRefreshed, setLastRefreshed] = useState(new Date());
    useEffect(() => {
        // Notify parent component about loading state changes
        if (onLoadingChange) {
            onLoadingChange(isLoading);
        }
    }, [isLoading, onLoadingChange]);
    const handleRefresh = () => {
        refreshStats();
        setLastRefreshed(new Date());
    };
    // Use initial stats if API data is not loaded yet
    const displayStats = stats || initialStats;
    if (error) {
        return (<div className="rounded-xl border border-destructive bg-destructive/10 p-6 text-center">
        <h2 className="text-xl font-semibold text-destructive">Error</h2>
        <p className="mt-2 text-sm">Could not load website statistics. Please try again later.</p>
        <button onClick={handleRefresh} className="btn btn-sm btn-error mt-4">Try Again</button>
      </div>);
    }
    return (<div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Website Analytics</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
          <button onClick={handleRefresh} className="btn btn-sm btn-ghost" disabled={isLoading}>
            <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}/>
          </button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard title="Total Impressions" value={displayStats.totalImpressions} icon={<ChartBarIcon className="h-4 w-4"/>} description={`Your notifications have been seen ${displayStats.totalImpressions} times`} isLoading={isLoading}/>
        <StatsCard title="Total Clicks" value={displayStats.totalClicks} icon={<ArrowUpIcon className="h-4 w-4"/>} description={`Your notifications have been clicked ${displayStats.totalClicks} times`} isLoading={isLoading}/>
        <StatsCard title="Conversion Rate" value={`${displayStats.conversionRate.toFixed(2)}%`} icon={<ChartBarIcon className="h-4 w-4"/>} description={`${displayStats.conversionRate.toFixed(2)}% of impressions resulted in clicks`} isLoading={isLoading}/>
      </div>
    </div>);
}
