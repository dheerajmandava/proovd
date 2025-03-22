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
      <div className="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>User not found. Please sign in again.</span>
      </div>
    );
  }
  
  // Find or create default website
  let website = await Website.findOne({ userId: user._id });
    
  if (!website) {
    // Create a default website for the user
    website = await Website.create({
      name: 'Default Website',
      domain: 'example.com',
      userId: user._id,
      status: 'active',
      verification: {
        status: 'verified',
        method: 'DNS',
        token: crypto.randomBytes(16).toString('hex'),
        attempts: 0,
        verifiedAt: new Date().toISOString()
      }
    });
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
    { name: 'API Key', value: website.apiKey, iconName: 'code-bracket', color: 'info' },
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
          <ClientStatsCard key={stat.name} stat={stat} index={index} />
        ))}
      </div>
      
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Notifications</h2>
          <Link
            href="/dashboard/notifications"
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
                        <div className="flex flex-col">
                          <span className="text-xs">Displays: {notification.displayCount || 0}</span>
                          <span className="text-xs">Clicks: {notification.clickCount || 0}</span>
                        </div>
                      </td>
                      <td>
                        <div className="badge">{notification.location || 'Global'}</div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Link href={`/dashboard/notifications/${notification._id}`} className="btn btn-xs btn-ghost">
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
                          <Link href="/dashboard/notifications/create" className="btn btn-primary btn-sm">
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
      
      <div className="mt-8">
        <CodeSection 
          code={`<script src="https://${baseUrl}/api/embed?domain=${website.domain}"></script>`} 
          language="html" 
        />
      </div>
    </div>
  );
} 