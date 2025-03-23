import { auth } from '@/auth';
import { connectToDatabase } from '@/app/lib/db';
import User from '@/app/lib/models/user';
import Notification from '@/app/lib/models/notification';
import Website from '@/app/lib/models/website';
import Link from 'next/link';
import CodeSection from './components/CodeSection';
import ClientStatsCard from './components/ClientStatsCard';
import { BellIcon, ChartBarIcon, ArrowUpIcon } from '@heroicons/react/24/outline';

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }
  
  try {
    await connectToDatabase();
    
    // Find user by email
    const user = await User.findOneWithRetry({ email: session.user.email });
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Find or create default website
    let website = await Website.findOneWithRetry({ userId: user._id });
    
    if (!website) {
      // Show website creation message
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
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
    
    // Get analytics data for the website
    const totalImpressions = website.analytics?.totalImpressions || 0;
    const totalClicks = website.analytics?.totalClicks || 0;
    const conversionRate = website.analytics?.conversionRate || 0;
    
    // Get recent notifications
    const recentNotifications = await Notification.find({ siteId: website._id })
      .sort({ createdAt: -1 })
      .limit(3);
    
    return (
      <div className="grid gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ClientStatsCard
            title="Total Impressions"
            value={totalImpressions}
            icon={<ChartBarIcon className="h-4 w-4" />}
            description={`Your notifications have been seen ${totalImpressions} times`}
          />
          <ClientStatsCard
            title="Total Clicks"
            value={totalClicks}
            icon={<ArrowUpIcon className="h-4 w-4" />}
            description={`Your notifications have been clicked ${totalClicks} times`}
          />
          <ClientStatsCard
            title="Conversion Rate"
            value={`${conversionRate.toFixed(2)}%`}
            icon={<ChartBarIcon className="h-4 w-4" />}
            description={`${conversionRate.toFixed(2)}% of impressions resulted in clicks`}
          />
        </div>
        
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-xl font-semibold">Recent Notifications</h2>
            {recentNotifications.length > 0 ? (
              <div className="mt-4 space-y-4">
                {recentNotifications.map((notification) => (
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
                <Link href="/dashboard/notifications" className="text-sm text-primary hover:underline">
                  View all notifications &rarr;
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-muted-foreground">No notifications yet.</p>
            )}
          </div>
          
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-xl font-semibold">Installation Code</h2>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              Add this code to your website to start displaying notifications
            </p>
            <CodeSection websiteId={website._id.toString()} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading dashboard:', error);
    return (
      <div className="rounded-xl border bg-card p-6 text-center">
        <h2 className="text-xl font-semibold text-destructive">Error</h2>
        <p className="mt-2">An error occurred while loading your dashboard. Please try again later.</p>
      </div>
    );
  }
} 