// 1. ServerHydratedOverviewTab.tsx
import OverviewTab from './OverviewTab';
import { getServerSideWebsite, getServerSideNotifications } from '@/app/lib/server/data-fetchers';

export default async function ServerHydratedOverviewTab({ websiteId }: { websiteId: string }) {
  // Fetch exactly what this tab needs
  const website = await getServerSideWebsite(websiteId);
  const notifications = await getServerSideNotifications(websiteId, 100);

  if (!website) {
    return <div className="alert alert-error">Website not found</div>;
  }

  // Serialize the website data - only fields used by OverviewTab
  const serializedWebsite = {
    _id: website._id.toString(),
    name: website.name || '',
    domain: website.domain || '',
    analytics: website.analytics ? {
      totalImpressions: website.analytics.totalImpressions || 0,
      totalClicks: website.analytics.totalClicks || 0,
      conversionRate: website.analytics.conversionRate || 0,
    } : undefined,
    shopify: (website as any).shopify ? {
      shop: (website as any).shopify.shop,
      isActive: (website as any).shopify.isActive,
      installedAt: (website as any).shopify.installedAt,
    } : undefined,
  };

  // Serialize notifications - with fields needed for the display
  const serializedNotifications = notifications.map((notification: any) => ({
    id: notification._id.toString(),
    name: notification.name || '',
    action: notification.type === 'purchase' ? 'Purchased' :
      notification.type === 'signup' ? 'Signed up' :
        notification.type === 'ab-test' ? 'Experiment' : 'Custom',
    location: notification.location || 'Global',
    timestamp: notification.createdAt instanceof Date ?
      notification.createdAt.toISOString() :
      (typeof notification.createdAt === 'string' ? notification.createdAt : new Date().toISOString()),
    impressions: notification.impressions || 0,
    clicks: notification.clicks || 0,
    timeAgo: notification.timeAgo || '',
  }));

  return <OverviewTab
    websiteId={websiteId}
    websiteData={JSON.parse(JSON.stringify(serializedWebsite))}
    formattedNotifications={JSON.parse(JSON.stringify(serializedNotifications))}
  />;
}