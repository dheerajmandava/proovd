import Link from 'next/link';
import { auth } from '@/auth';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import Notification from '@/app/lib/models/notification';
import Metric from '@/app/lib/models/metric';
import WebsiteCard from './components/WebsiteCard';
import { GlobeAltIcon, PlusIcon } from '@heroicons/react/24/outline';

export default async function WebsitesPage() {
  // Get the current user
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication required</h1>
          <p className="mb-4">Please sign in to view this page.</p>
          <Link href="/auth/signin" className="btn btn-primary">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  // Connect to the database
  await connectToDatabase();

  // Get all websites for this user
  const websites = await Website.find({ userId: session.user.id })
    .sort({ createdAt: -1 });

  // Get metrics for each website
  const websitesWithMetrics = await Promise.all(
    websites.map(async (website) => {
      // Get notification count
      const notificationsCount = await Notification.countDocuments({ 
        siteId: website._id 
      });

      // Get impression count
      const impressionsCount = await Metric.countDocuments({ 
        siteId: website._id, 
        type: 'impression' 
      });

      // Get click count
      const clicksCount = await Metric.countDocuments({ 
        siteId: website._id, 
        type: 'click' 
      });

      // Calculate conversion rate
      const conversionRate = impressionsCount > 0 
        ? ((clicksCount / impressionsCount) * 100).toFixed(2) 
        : '0.00';

      // Get the first API key from the apiKeys array if it exists
      const apiKey = website.apiKeys && website.apiKeys.length > 0 
        ? website.apiKeys[0].key 
        : null;
        
      // Create a safe copy of apiKeys (if any)
      const safeApiKeys = Array.isArray(website.apiKeys) 
        ? website.apiKeys.map(key => ({
            id: key.id || '',
            key: key.key || '',
            name: key.name || '',
            allowedOrigins: Array.isArray(key.allowedOrigins) ? [...key.allowedOrigins] : [],
            createdAt: key.createdAt || '',
            lastUsed: key.lastUsed || ''
          }))
        : [];

      // Force safe serialization through JSON to prevent circular references
      return JSON.parse(JSON.stringify({
        id: website._id.toString(),
        name: website.name || '',
        domain: website.domain || '',
        apiKey: apiKey,
        apiKeys: safeApiKeys,
        status: website.status || 'pending',
        createdAt: website.createdAt,
        notificationsCount: notificationsCount || 0,
        impressionsCount: impressionsCount || 0,
        clicksCount: clicksCount || 0,
        conversionRate: conversionRate || '0.00'
      }));
    })
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Websites</h1>
          <p className="text-gray-700">Manage your websites using Proovd</p>
        </div>
        <Link href="/dashboard/websites/new" className="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Add Website
        </Link>
      </div>

      {websitesWithMetrics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="card bg-base-100 max-w-lg w-full shadow-lg border border-base-200">
            <div className="card-body p-8">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <GlobeAltIcon className="h-8 w-8 text-primary" />
                </div>
              </div>
              
              <h2 className="card-title text-2xl font-bold text-center mx-auto mb-2">No websites yet</h2>
              <p className="text-base-content/70 mb-6">
                Add your first website to start showing social proof notifications
              </p>
              
              <div className="card-actions justify-center">
                <Link href="/dashboard/websites/new" className="btn btn-primary btn-lg gap-2">
                  <PlusIcon className="h-5 w-5" />
                  Add Your First Website
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {websitesWithMetrics.map((website) => (
            <WebsiteCard key={website.id} website={website} />
          ))}
        </div>
      )}
    </div>
  );
} 