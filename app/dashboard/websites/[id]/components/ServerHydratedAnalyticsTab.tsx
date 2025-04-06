import { getWebsiteMetricsSummary, getWebsiteTimeSeries } from '@/app/lib/services/analytics.service';
import { getServerSideWebsite, getServerSideNotifications } from '@/app/lib/server/data-fetchers';
import AnalyticsTab from './AnalyticsTab';

export default async function ServerHydratedAnalyticsTab({ websiteId }: { websiteId: string }) {
  // Fetch core data
  const [website, notifications, metrics, timeSeriesData] = await Promise.all([
    getServerSideWebsite(websiteId),
    getServerSideNotifications(websiteId),
    getWebsiteMetricsSummary(websiteId),
    getWebsiteTimeSeries(websiteId, 'week', 'day') // Default to weekly data grouped by day
  ]);
  
  if (!website) {
    return (
      <div className="alert alert-error shadow-lg">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Website not found</span>
        </div>
      </div>
    );
  }
  
  // Get notification performance data
  const notificationMetrics = notifications.map(notification => ({
    id: notification._id.toString(),
    name: notification.name || '',
    impressions: notification.impressions || 0,
    clicks: notification.clicks || 0,
    conversionRate: notification.impressions > 0 
      ? ((notification.clicks / notification.impressions) * 100).toFixed(2) 
      : '0.00',
    createdAt: notification.createdAt instanceof Date 
      ? notification.createdAt.toISOString() 
      : (typeof notification.createdAt === 'string' ? notification.createdAt : new Date().toISOString())
  }));
  
  // Serialize website basic info
  const serializedWebsite = {
    _id: website._id.toString(),
    name: website.name || '',
    domain: website.domain || '',
    status: website.status || 'pending'
  };
  
  // Serialize metrics data
  const serializedMetrics = {
    totalImpressions: metrics.totalImpressions || 0,
    totalClicks: metrics.totalClicks || 0,
    totalNotifications: metrics.totalNotifications || 0,
    conversionRate: metrics.conversionRate || '0.00',
    period: 'all_time'
  };
  
  // Serialize time series data (ensuring dates are ISO strings)
  const serializedTimeSeriesData = timeSeriesData.map(point => ({
    date: point.date instanceof Date 
      ? point.date.toISOString() 
      : (typeof point.date === 'string' ? point.date : new Date().toISOString()),
    impressions: point.impressions || 0,
    clicks: point.clicks || 0,
    conversionRate: point.conversionRate || '0.00'
  }));
  
  // Get top performing notifications
  const topNotifications = [...notificationMetrics]
    .sort((a, b) => b.impressions - a.impressions) 
    .slice(0, 5);
  
  // Calculate totals for notifications
  const notificationTotals = {
    impressions: notificationMetrics.reduce((total, n) => total + n.impressions, 0),
    clicks: notificationMetrics.reduce((total, n) => total + n.clicks, 0),
    conversionRate: notificationMetrics.reduce((total, n) => total + n.impressions, 0) > 0
      ? ((notificationMetrics.reduce((total, n) => total + n.clicks, 0) / 
          notificationMetrics.reduce((total, n) => total + n.impressions, 0)) * 100).toFixed(2)
      : '0.00'
  };
  
  return (
    <AnalyticsTab 
      websiteId={websiteId}
      website={serializedWebsite}
      metrics={serializedMetrics}
      timeSeriesData={serializedTimeSeriesData}
      notificationMetrics={notificationMetrics}
      topNotifications={topNotifications}
      totals={notificationTotals}
    />
  );
}
