// app/dashboard/websites/[id]/components/ServerHydratedSettingsTab.tsx
import { getServerSideWebsite } from '@/app/lib/server/data-fetchers';
import { getUserById } from '@/app/lib/services/user.service';
import SettingsTab from './SettingsTab';
import { auth } from '@/auth';

export default async function ServerHydratedSettingsTab({ websiteId }: { websiteId: string }) {
  // Fetch website data from the server
  const website = await getServerSideWebsite(websiteId);

  // Get current user session
  const session = await auth();

  // Fetch user data if session exists
  let user = null;
  if (session?.user?.id) {
    user = await getUserById(session.user.id);
  }

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

  // Serialize website data for client component
  const serializedWebsite = {
    userId: website.userId.toString(),
    _id: website._id.toString(),
    name: website.name || '',
    domain: website.domain || '',
    status: website.status || 'pending',
    settings: {
      position: website.settings?.position || 'bottom-left',
      delay: website.settings?.delay || 5,
      displayDuration: website.settings?.displayDuration || 5,
      maxNotifications: website.settings?.maxNotifications || 5,
      theme: website.settings?.theme || 'light',
      displayOrder: website.settings?.displayOrder || 'newest',
      randomize: website.settings?.randomize || false,
      initialDelay: website.settings?.initialDelay || 5,
      loop: website.settings?.loop || false,
      customStyles: website.settings?.customStyles || '',
    },
    allowedDomains: website.allowedDomains || [],
    createdAt: website.createdAt instanceof Date ?
      website.createdAt.toISOString() :
      (typeof website.createdAt === 'string' ? website.createdAt : new Date().toISOString()),
    updatedAt: website.updatedAt instanceof Date ?
      website.updatedAt.toISOString() :
      (typeof website.updatedAt === 'string' ? website.updatedAt : new Date().toISOString()),
    shopify: (website as any).shopify ? {
      shop: (website as any).shopify.shop,
      isActive: (website as any).shopify.isActive,
      installedAt: (website as any).shopify.installedAt,
      accessToken: '', // Security: Redacted for client
      scope: (website as any).shopify.scope || '',
    } : undefined,
  };

  // Serialize user data for client component
  const serializedUser = user ? {
    _id: user._id.toString(),
    name: user.name || '',
    email: user.email || '',
    image: user.image || '',
    role: user.role || 'user',
    plan: user.plan || 'free',
    emailNotifications: user.emailNotifications !== undefined ? user.emailNotifications : true,
    notificationDigest: user.notificationDigest || 'daily',
    lastLogin: user.lastLogin instanceof Date ?
      user.lastLogin.toISOString() :
      (typeof user.lastLogin === 'string' ? user.lastLogin : null),
    createdAt: user.createdAt instanceof Date ?
      user.createdAt.toISOString() :
      (typeof user.createdAt === 'string' ? user.createdAt : new Date().toISOString()),
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
  } : null;

  // Set initial website data in client component
  return (
    <SettingsTab
      websiteId={websiteId}
      initialWebsite={serializedWebsite}
      initialUserData={serializedUser}
    />
  );
}