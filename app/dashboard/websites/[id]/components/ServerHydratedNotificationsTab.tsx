// 2. ServerHydratedNotificationsTab.tsx
import { getServerSideWebsite, getServerSideNotifications } from '@/app/lib/server/data-fetchers';
import NotificationsTab from './NotificationsTab';

export default async function ServerHydratedNotificationsTab({ websiteId }: { websiteId: string }) {
  const website = await getServerSideWebsite(websiteId);
  const notifications = await getServerSideNotifications(websiteId);
  
  if (!website) {
    return <div className="alert alert-error">Website not found</div>;
  }
  
  const serializedWebsite = {
    _id: website._id.toString(),
    name: website.name || '',
    domain: website.domain || '',
    userId: website.userId.toString(),
    status: website.status || 'inactive',
    verification: website.status === 'verified' ? {
      status: 'verified',
      code: '',
      verifiedAt: ''
    } : {
      status: 'unverified',
      code: '',
      verifiedAt: ''
    },
    settings: website.settings || {
      position: 'top',
      delay: 0,
      displayDuration: 0,
      maxNotifications: 0,
      theme: 'light',
      displayOrder: 'random',
      randomize: false,
      initialDelay: 0,
      loop: false,
      customStyles: ''
    },
    allowedDomains: website.allowedDomains || []
  };
  
  const serializedNotifications = notifications.map(notification => ({
    _id: notification._id.toString(),
    name: notification.name || '',
    message: notification.message || '',
    url: notification.url || '',
    image: notification.image || '',
    status: notification.status || 'inactive',
    siteId: notification.siteId.toString(),
    impressions: notification.impressions || 0,
    clicks: notification.clicks || 0,
    createdAt: notification.createdAt instanceof Date ? 
      notification.createdAt.toISOString() : 
      (typeof notification.createdAt === 'string' ? notification.createdAt : new Date().toISOString()),
    updatedAt: notification.updatedAt instanceof Date ? 
      notification.updatedAt.toISOString() : 
      (typeof notification.updatedAt === 'string' ? notification.updatedAt : new Date().toISOString()),
    priority: notification.priority || 0,
    type: notification.type || 'custom'
  }));
  
  return <NotificationsTab 
    websiteId={websiteId}
    website={JSON.parse(JSON.stringify(serializedWebsite))}
    initialNotifications={JSON.parse(JSON.stringify(serializedNotifications))}
  />;
}