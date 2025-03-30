import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getServerSideUserData, getServerSideWebsites, getServerSideNotifications } from '@/app/lib/server/data-fetchers';
import DashboardContent from './components/DashboardContent';
export default async function DashboardPage() {
    var _a;
    // Get the session and user data
    const session = await auth();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        redirect('/auth/signin');
    }
    // Fetch data with server components
    const userData = await getServerSideUserData();
    const websites = await getServerSideWebsites();
    if (!userData) {
        redirect('/auth/signin');
    }
    // If we have at least one website, get the notifications for it
    let websiteWithNotifications = [];
    if (websites.length > 0) {
        const firstWebsite = websites[0];
        const notifications = await getServerSideNotifications(firstWebsite._id.toString(), 3);
        // Attach notifications to the website object and serialize data
        websiteWithNotifications = websites.map((site, index) => {
            // Convert MongoDB ObjectId to string
            const serializedSite = {
                _id: site._id.toString(),
                name: site.name,
                domain: site.domain,
                userId: site.userId.toString(),
                status: site.status,
                analytics: site.analytics ? {
                    totalImpressions: site.analytics.totalImpressions || 0,
                    totalClicks: site.analytics.totalClicks || 0,
                    conversionRate: site.analytics.conversionRate || 0,
                } : undefined,
                // Convert Date objects to ISO strings or use current date
                createdAt: site.createdAt instanceof Date
                    ? site.createdAt.toISOString()
                    : new Date().toISOString(),
                updatedAt: site.updatedAt instanceof Date
                    ? site.updatedAt.toISOString()
                    : new Date().toISOString(),
            };
            if (index === 0) {
                return Object.assign(Object.assign({}, serializedSite), { 
                    // Serialize notifications too
                    notifications: notifications.map(notification => ({
                        _id: notification._id.toString(),
                        title: notification.title,
                        message: notification.message,
                        createdAt: notification.createdAt instanceof Date
                            ? notification.createdAt.toISOString()
                            : new Date().toISOString(),
                    })) });
            }
            return serializedSite;
        });
    }
    else {
        // Set an empty array if no websites
        websiteWithNotifications = [];
    }
    // Serialize user data to plain object
    const serializedUserData = userData ? {
        _id: userData._id.toString(),
        name: userData.name,
        email: userData.email,
        image: userData.image,
        role: userData.role,
        plan: userData.plan,
        lastLogin: userData.lastLogin instanceof Date
            ? userData.lastLogin.toISOString()
            : undefined,
        emailNotifications: userData.emailNotifications,
        notificationDigest: userData.notificationDigest,
        createdAt: userData.createdAt instanceof Date
            ? userData.createdAt.toISOString()
            : undefined,
        updatedAt: userData.updatedAt instanceof Date
            ? userData.updatedAt.toISOString()
            : undefined,
    } : null;
    return (<div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Pass the serialized data to the client component */}
      <DashboardContent userData={serializedUserData} websites={websiteWithNotifications}/>
    </div>);
}
