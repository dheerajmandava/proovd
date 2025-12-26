'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import CodeSection from './CodeSection';
import RealTimeStats from './RealTimeStats';

// Define a server-side User interface that matches what we receive
interface ServerUser {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  plan: string;
  lastLogin?: string; // ISO string date
  emailNotifications: boolean;
  notificationDigest: string;
  createdAt?: string; // ISO string date
  updatedAt?: string; // ISO string date
}

// Define a server-side Website interface that matches what we receive
interface ServerWebsite {
  _id: string;
  name: string;
  domain: string;
  userId: string;
  status: string;
  analytics?: {
    totalImpressions?: number;
    totalClicks?: number;
    conversionRate?: number;
  };
  notifications?: Array<{
    _id: string;
    title: string;
    message: string;
    createdAt: string; // ISO string date
  }>;
  verification?: {
    status: string;
    method: string;
    token: string;
    verifiedAt?: string; // ISO string date
  };
  createdAt: string; // ISO string date
  updatedAt: string; // ISO string date
}

interface DashboardContentProps {
  userData: ServerUser;
  websites: ServerWebsite[];
}

export default function DashboardContent({ userData, websites }: DashboardContentProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Use first website or return website creation UI
  const website = websites[0];

  if (!website) {
    // Show website creation message
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)]">
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
      </div>
    );
  }

  // Get analytics data for the website for initial display
  const initialStats = {
    totalImpressions: website.analytics?.totalImpressions || 0,
    totalClicks: website.analytics?.totalClicks || 0,
    conversionRate: website.analytics?.conversionRate || 0,
  };

  // Get recent notifications if available
  const recentNotifications = website.notifications || [];

  return (
    <div className="grid gap-6">
      {/* Analytics and Stats */}
      {/* <div className={isLoading ? "p-6 bg-base-200 rounded-xl animate-pulse" : ""}>
        <RealTimeStats
          websiteId={website._id.toString()}
          initialStats={initialStats}
          onLoadingChange={setIsLoading}
        />
      </div> */}

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Recent Campaigns</h2>
          {recentNotifications.length > 0 ? (
            <div className="mt-4 space-y-4">
              {recentNotifications.slice(0, 3).map((notification) => (
                <div key={notification._id.toString()} className="flex items-start space-x-4 rounded-lg border p-4">
                  <BellIcon className="h-6 w-6 text-primary" />
                  <div className="space-y-1">
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              <Link href={`/dashboard/websites/${website._id.toString()}?tab=campaigns`} className="text-sm text-primary hover:underline">
                View all campaigns &rarr;
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-muted-foreground">No campaigns yet.</p>
          )}
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Installation Code</h2>
          <p className="text-sm text-muted-foreground mt-2 mb-4">
            Add this code to your website to start displaying campaigns
          </p>
          <CodeSection websiteId={website._id.toString()} />
        </div>
      </div>
    </div>
  );
} 