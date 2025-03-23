import { auth } from '@/auth';
import { connectToDatabase } from '@/app/lib/db';
import User from '@/app/lib/models/user';
import Notification from '@/app/lib/models/notification';
import Website from '@/app/lib/models/website';
import Link from 'next/link';
import CodeSection from './components/CodeSection';
import ClientStatsCard from './components/ClientStatsCard';
import { generateApiKey } from '@/app/lib/server-utils';
import crypto from 'crypto';
import { BellIcon, ChartBarIcon, ArrowUpIcon, CodeBracketIcon } from '@heroicons/react/24/outline';

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }
  
  await connectToDatabase();
  
  // Get user data
  const user = await User.findOne({ email: session.user.email });
  
  if (!user) {
    return (
      <div className="alert alert-error shadow-lg">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>User not found. Please sign in again.</span>
        </div>
      </div>
    );
  }
  
  // Find or create default website
  let website = await Website.findOne({ userId: user._id });
    
  if (!website) {
    // Instead of creating a default website, we'll show a message
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="text-sm breadcrumbs">
            <ul>
              <li><Link href="/">Home</Link></li>
              <li>Dashboard</li>
            </ul>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center py-16">
            <div className="text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h2 className="card-title text-2xl mb-2">No Websites Added</h2>
            <p className="text-base-content/70 mb-6 max-w-md">
              You haven't added any websites to your account yet. Add your first website to start creating social proof notifications.
            </p>
            <div className="card-actions">
              <Link href="/dashboard/websites/new" className="btn btn-primary">
                Add Your First Website
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Get notification stats
  const totalNotifications = await Notification.countDocuments({ siteId: website._id });
  const totalDisplays = await Notification.aggregate([
    { $match: { siteId: website._id } },
    { $group: { _id: null, total: { $sum: '$displayCount' } } }
  ]);
  const totalClicks = await Notification.aggregate([
    { $match: { siteId: website._id } },
    { $group: { _id: null, total: { $sum: '$clickCount' } } }
  ]);
  
  const displayCount = totalDisplays.length > 0 ? totalDisplays[0].total : 0;
  const clickCount = totalClicks.length > 0 ? totalClicks[0].total : 0;
  const clickRate = displayCount > 0 ? (clickCount / displayCount * 100).toFixed(2) : 0;
  
  // Get recent notifications
  const recentNotifications = await Notification.find({ siteId: website._id })
    .sort({ createdAt: -1 })
    .limit(5);
  
  const stats = [
    { name: 'Total Notifications', value: totalNotifications, iconName: 'bell', color: 'primary' },
    { name: 'Total Displays', value: displayCount, iconName: 'chart-bar', color: 'secondary' },
    { name: 'Click Rate', value: `${clickRate}%`, iconName: 'arrow-up', color: 'accent' },
    { name: 'API Key', value: website.apiKeys && website.apiKeys.length > 0 ? website.apiKeys[0].key : '-', iconName: 'code-bracket', color: 'info' },
  ];

  // Determine base URL for the widget
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || `http://${process.env.VERCEL_URL || 'localhost:3000'}`;
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-sm breadcrumbs">
          <ul>
            <li><Link href="/">Home</Link></li>
            <li>Dashboard</li>
          </ul>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={stat.name} className={`stat shadow-md bg-base-100 rounded-box border-t-4 border-${stat.color}`}>
            <div className="stat-figure text-${stat.color}">
              {stat.iconName === 'bell' && <BellIcon className="h-6 w-6" />}
              {stat.iconName === 'chart-bar' && <ChartBarIcon className="h-6 w-6" />}
              {stat.iconName === 'arrow-up' && <ArrowUpIcon className="h-6 w-6" />}
              {stat.iconName === 'code-bracket' && <CodeBracketIcon className="h-6 w-6" />}
            </div>
            <div className="stat-title">{stat.name}</div>
            <div className="stat-value text-${stat.color}">{stat.value}</div>
            {stat.name === 'Click Rate' && Number(String(stat.value).replace('%', '')) < 5 && (
              <div className="stat-desc">↘︎ Needs improvement</div>
            )}
            {stat.name === 'API Key' && (
              <div className="stat-desc text-xs truncate w-full">Used for website integration</div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Notifications</h2>
          <Link
            href={`/dashboard/websites/${website._id}/notifications`}
            className="btn btn-sm btn-primary"
          >
            View all
          </Link>
        </div>
        
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Stats</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentNotifications.map((notification) => (
                    <tr key={notification._id.toString()}>
                      <td className="font-medium">{notification.name}</td>
                      <td>
                        <div className="badge badge-outline">{notification.type}</div>
                      </td>
                      <td>
                        <div className="stats stats-horizontal shadow-none bg-transparent">
                          <div className="stat p-0">
                            <div className="stat-title text-xs">Displays</div>
                            <div className="stat-value text-xs">{notification.displayCount || 0}</div>
                          </div>
                          <div className="stat p-0">
                            <div className="stat-title text-xs">Clicks</div>
                            <div className="stat-value text-xs">{notification.clickCount || 0}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="badge badge-neutral">{notification.location || 'Global'}</div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Link href={`/dashboard/websites/${website._id}/notifications/${notification._id}`} className="btn btn-xs btn-ghost">
                            Edit
                          </Link>
                          <button className="btn btn-xs btn-error btn-ghost">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {recentNotifications.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center gap-4">
                          <div className="text-lg font-semibold">No notifications yet</div>
                          <p className="text-sm opacity-70">Create your first notification to get started</p>
                          <Link href={`/dashboard/websites/${website._id}/notifications/new`} className="btn btn-primary btn-sm">
                            Create Notification
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card bg-base-100 shadow-lg mt-8">
        <div className="card-body">
          <h2 className="card-title">Website Integration</h2>
          <p className="text-base-content/70 mb-4">Add this script to your website to enable notifications:</p>
          <CodeSection 
            code={`<script src="https://cdn.proovd.in/w/${website.id}.js"></script>`} 
            language="html" 
          />
        </div>
      </div>
    </div>
  );
} 