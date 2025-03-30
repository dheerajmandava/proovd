'use client';
import Link from 'next/link';
import { useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import CodeSection from './CodeSection';
import RealTimeStats from './RealTimeStats';
export default function DashboardContent({ userData, websites }) {
    var _a, _b, _c;
    const [isLoading, setIsLoading] = useState(false);
    // Use first website or return website creation UI
    const website = websites[0];
    if (!website) {
        // Show website creation message
        return (<div className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)]">
        <div className="card w-full max-w-xl bg-base-200 shadow-xl">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-2xl">No websites yet!</h2>
            <p className="py-4">You haven't added any websites to your account yet. Get started by adding your first website.</p>
            <div className="card-actions justify-center">
              <Link href="/dashboard/websites/new" className="btn btn-primary">
                Add Website
              </Link>
            </div>
          </div>
        </div>
      </div>);
    }
    // Get analytics data for the website for initial display
    const initialStats = {
        totalImpressions: ((_a = website.analytics) === null || _a === void 0 ? void 0 : _a.totalImpressions) || 0,
        totalClicks: ((_b = website.analytics) === null || _b === void 0 ? void 0 : _b.totalClicks) || 0,
        conversionRate: ((_c = website.analytics) === null || _c === void 0 ? void 0 : _c.conversionRate) || 0,
    };
    // Get recent notifications if available
    const recentNotifications = website.notifications || [];
    return (<div className="grid gap-6">
      {/* Analytics and Stats */}
      <div className={isLoading ? "p-6 bg-base-200 rounded-xl animate-pulse" : ""}>
        <RealTimeStats websiteId={website._id.toString()} initialStats={initialStats} onLoadingChange={setIsLoading}/>
      </div>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Recent Notifications</h2>
          {recentNotifications.length > 0 ? (<div className="mt-4 space-y-4">
              {recentNotifications.slice(0, 3).map((notification) => (<div key={notification._id.toString()} className="flex items-start space-x-4 rounded-lg border p-4">
                  <BellIcon className="h-6 w-6 text-primary"/>
                  <div className="space-y-1">
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>))}
              <Link href={`/dashboard/websites/${website._id.toString()}/notifications`} className="text-sm text-primary hover:underline">
                View all notifications &rarr;
              </Link>
            </div>) : (<p className="mt-4 text-muted-foreground">No notifications yet.</p>)}
        </div>
        
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Installation Code</h2>
          <p className="text-sm text-muted-foreground mt-2 mb-4">
            Add this code to your website to start displaying notifications
          </p>
          <CodeSection websiteId={website._id.toString()}/>
        </div>
      </div>
    </div>);
}
