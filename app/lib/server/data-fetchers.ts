import { connectToDatabase } from '@/app/lib/database/connection';
import { 
  getUserById, 
  updateUserPreferences 
} from '@/app/lib/services/user.service';
import { 
  getWebsiteById, 
  getWebsitesByUserId, 
  getWebsitesRaw 
} from '@/app/lib/services/website.service';
import { 
  getNotificationsByWebsiteId,
  getNotificationById
} from '@/app/lib/services/notification.service';
import { auth } from '@/auth';
import { cache } from 'react';

// User data fetching
export const getServerSideUserData = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  await connectToDatabase();
  return getUserById(session.user.id);
});

// User preferences fetching
export const getServerSideUserPreferences = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  await connectToDatabase();
  const user = await getUserById(session.user.id);
  return {
    emailNotifications: user?.emailNotifications ?? true,
    notificationDigest: user?.notificationDigest || 'daily',
  };
});

// Website data fetching
export const getServerSideWebsites = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return [];
  
  await connectToDatabase();
  return getWebsitesByUserId(session.user.id);
});

export const getServerSideWebsitesRaw = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return [];
  
  await connectToDatabase();
  return getWebsitesRaw(session.user.id);
});

export const getServerSideWebsite = cache(async (websiteId: string) => {
  if (!websiteId) return null;
  
  await connectToDatabase();
  return getWebsiteById(websiteId);
});

// Notifications fetching
export const getServerSideNotifications = cache(async (websiteId: string, limit = 5) => {
  if (!websiteId) return [];
  
  await connectToDatabase();
  return getNotificationsByWebsiteId(websiteId, limit);
});

export const getServerSideNotification = cache(async (notificationId: string) => {
  if (!notificationId) return null;
  
  await connectToDatabase();
  return getNotificationById(notificationId);
}); 