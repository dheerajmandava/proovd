import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ServerHydratedOverviewTab from './components/ServerHydratedOverviewTab';
import ServerHydratedNotificationsTab from './components/ServerHydratedNotificationsTab';
import ServerHydratedSettingsTab from './components/ServerHydratedSettingsTab';
import ServerHydratedAnalyticsTab from './components/ServerHydratedAnalyticsTab';
import TabNavigation from './components/TabNavigation';
import { auth } from '@/auth';
import { getServerSideWebsite } from '@/app/lib/server/data-fetchers';

export default async function WebsitePage({ 
  params, 
  searchParams 
}: { 
  params: { id: string }; 
  searchParams: { tab?: string }; 
}) {
  if (!params || !params.id) {
    return notFound();
  }

  const session = await auth();
  
  if (!session || !session.user || !session.user.id) {
    return notFound();
  }
  
  try {
    const websiteId = params.id;
    const activeTab = searchParams.tab || 'overview';
    
    // Fetch website data for the header
    const website = await getServerSideWebsite(websiteId);
    
    if (!website) {
      return notFound();
    }
    
    // Serialize the website data for the client component
    const serializedWebsite = {
      _id: website._id.toString(),
      name: website.name || '',
      domain: website.domain || '',
      status: website.status || 'pending'
    };
 
    return (
      <div className="space-y-6">
        <TabNavigation 
          websiteId={websiteId} 
          activeTab={activeTab} 
          initialWebsite={serializedWebsite} 
        />
        
        <Suspense fallback={<div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>}>
          {activeTab === 'overview' && (
            <ServerHydratedOverviewTab websiteId={websiteId} />
          )}
          {activeTab === 'notifications' && (
            <ServerHydratedNotificationsTab websiteId={websiteId} />
          )}
          {activeTab === 'analytics' && (
            <ServerHydratedAnalyticsTab websiteId={websiteId} />
          )}
          {activeTab === 'settings' && (
            <ServerHydratedSettingsTab websiteId={websiteId} />
          )}
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Error rendering website page:', error);
    return notFound();
  }
} 