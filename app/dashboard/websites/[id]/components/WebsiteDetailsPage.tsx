// app/dashboard/websites/[id]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import TabNavigation from './TabNavigation';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ServerHydratedOverviewTab from './ServerHydratedOverviewTab';
import ServerHydratedNotificationsTab from './ServerHydratedNotificationsTab';
import ServerHydratedSettingsTab from './ServerHydratedSettingsTab';

export default function WebsiteDetailsPage({ params, searchParams }: { 
  params: { id: string },
  searchParams: { tab?: string }
}) {
  const websiteId = params.id;
  const activeTab = searchParams.tab || 'overview';

  return (
    <div className="space-y-6">
      <TabNavigation activeTab={activeTab} websiteId={websiteId} initialWebsite={undefined} />
      
      <Suspense fallback={<LoadingSpinner />}>
        {activeTab === 'overview' && (
          <ServerHydratedOverviewTab websiteId={websiteId} />
        )}
        {activeTab === 'notifications' && (
          <ServerHydratedNotificationsTab websiteId={websiteId} />
        )}
        {activeTab === 'settings' && (
          <ServerHydratedSettingsTab websiteId={websiteId} />
        )}
      </Suspense>
    </div>
  );
} 