import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import Notification from '@/app/lib/models/notification';
import { formatNumber, formatDate, formatTimeAgo } from '@/app/lib/utils';
import Link from 'next/link';
import { 
  ArrowTopRightOnSquareIcon, 
  ChartBarIcon, 
  CogIcon, 
  BellIcon,
  PencilSquareIcon,
  DocumentDuplicateIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon 
} from '@heroicons/react/24/outline';
import ClientStatsCard from '@/app/dashboard/components/ClientStatsCard';
import VerificationStatusBadge from '@/app/components/VerificationStatusBadge';
import CopyButton from './components/CopyButton';

// Client component to handle the copy buttons
export default async function WebsiteDetailsPage({
  params
}){
  const session = await auth();
  if (!session?.user?.id) {
    // Handled by middleware, but just in case
    notFound();
  }

  await connectToDatabase();

  const { id } = await params;
  // Get website details
  const website = await Website.findOne({
    _id: id,
    userId: session.user.id,
  });

  if (!website) {
    notFound();
  }

  // Get recent notifications
  const recentNotifications = await Notification.find({
    websiteId: website._id,
  })
    .sort({ createdAt: -1 })
    .limit(5);

  // Format the website data
  const websiteData = {
    id: website._id.toString(),
    name: website.name,
    domain: website.domain,
    apiKey: website.apiKeys?.[0]?.key || '',
    status: website.status,
    verification: website.verification,
    createdAt: website.createdAt,
    verifiedAt: website.verifiedAt,
    totalImpressions: website.analytics?.totalImpressions || 0,
    totalClicks: website.analytics?.totalClicks || 0,
    conversionRate: website.analytics?.conversionRate || 0,
  };

  // Format notifications for display
  const formattedNotifications = recentNotifications.map((notification) => ({
    id: notification._id.toString(),
    name: notification.name,
    action: notification.action,
    location: notification.location,
    timestamp: notification.timestamp,
    timeAgo: formatTimeAgo(notification.timestamp),
  }));

  // Generate the installation code snippet
  const installationCode = `<script src="https://cdn.socialproofify.io/widget.js" data-website-id="${websiteData.id}" data-api-key="${websiteData.apiKey}" async></script>`;

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{websiteData.name}</h1>
          <div className="flex items-center text-gray-500 mt-1">
            <a
              href={`https://${websiteData.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center hover:text-blue-600"
            >
              {websiteData.domain}
              <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
            </a>
            <span className="mx-2">•</span>
            <VerificationStatusBadge status={websiteData.verification.status} />
          </div>
        </div>

        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          {websiteData.verification.status !== 'verified' && (
            <Link
              href={`/dashboard/websites/${websiteData.id}/verify`}
              className="btn btn-sm btn-primary flex items-center"
            >
              <ShieldCheckIcon className="h-4 w-4 mr-1" />
              Verify Domain
            </Link>
          )}

          <Link
            href={`/dashboard/websites/${websiteData.id}/edit`}
            className="btn btn-sm btn-outline"
          >
            <PencilSquareIcon className="h-4 w-4 mr-1" />
            Edit
          </Link>

          <Link
            href={`/dashboard/websites/${websiteData.id}/settings`}
            className="btn btn-sm btn-outline"
          >
            <CogIcon className="h-4 w-4 mr-1" />
            Settings
          </Link>
        </div>
      </div>

      {websiteData.verification.status !== 'verified' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mb-6">
          <div className="flex">
            <ShieldExclamationIcon className="h-6 w-6 text-yellow-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Domain Verification Required</h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>
                  Your website is not yet verified. Verify domain ownership to
                  start displaying notifications on your website.
                </p>
                <Link
                  href={`/dashboard/websites/${websiteData.id}/verify`}
                  className="inline-flex items-center mt-2 text-yellow-800 hover:text-yellow-900 font-medium"
                >
                  Complete Verification
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ClientStatsCard 
          title="Total Impressions" 
          value={websiteData.totalImpressions} 
          iconName="ChartBarIcon" 
          description="Total number of notification views" 
        />
        <ClientStatsCard 
          title="Total Clicks" 
          value={websiteData.totalClicks} 
          iconName="CursorArrowRippleIcon" 
          description="Total number of notification clicks" 
        />
        <ClientStatsCard 
          title="Conversion Rate" 
          value={`${websiteData.conversionRate.toFixed(1)}%`} 
          iconName="ArrowTrendingUpIcon" 
          description="Percentage of views that led to clicks" 
          valueFormatting={false}
        />
      </div>

      {/* API Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">Integration Details</h2>
        <div className="border rounded-md p-4 bg-gray-50">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <div className="flex">
              <div className="bg-gray-100 rounded-l-md border border-r-0 border-gray-300 px-3 py-2 text-gray-500 text-sm font-mono flex-grow">
                {websiteData.apiKey}
              </div>
              <CopyButton textToCopy={websiteData.apiKey} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Installation Code
            </label>
            <div className="bg-gray-100 rounded-md border border-gray-300 p-3 text-sm font-mono overflow-x-auto">
              {installationCode}
            </div>
            <CopyButton 
              textToCopy={installationCode}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
              iconClassName="h-4 w-4 mr-1"
              label="Copy to clipboard"
            />
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Recent Notifications</h2>
          <Link 
            href={`/dashboard/websites/${websiteData.id}/notifications`}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            View All <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {formattedNotifications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formattedNotifications.map((notification) => (
                  <tr key={notification.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {notification.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {notification.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {notification.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {notification.timeAgo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <BellIcon className="h-12 w-12 mx-auto text-gray-300" />
            <p className="mt-2 text-gray-500">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
} 