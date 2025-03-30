import { connectToDatabase } from '@/app/lib/database/connection';
import { getUserById } from '@/app/lib/services/user.service';
import { getWebsiteById, getWebsitesByUserId, getWebsitesRaw } from '@/app/lib/services/website.service';
import { getNotificationsByWebsiteId, getNotificationById } from '@/app/lib/services/notification.service';
import { auth } from '@/auth';
import { cache } from 'react';
// User data fetching
export const getServerSideUserData = cache(async () => {
    var _a;
    const session = await auth();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id))
        return null;
    await connectToDatabase();
    return getUserById(session.user.id);
});
// User preferences fetching
export const getServerSideUserPreferences = cache(async () => {
    var _a, _b;
    const session = await auth();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id))
        return null;
    await connectToDatabase();
    const user = await getUserById(session.user.id);
    return {
        emailNotifications: (_b = user === null || user === void 0 ? void 0 : user.emailNotifications) !== null && _b !== void 0 ? _b : true,
        notificationDigest: (user === null || user === void 0 ? void 0 : user.notificationDigest) || 'daily',
    };
});
// Website data fetching
export const getServerSideWebsites = cache(async () => {
    var _a;
    const session = await auth();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id))
        return [];
    await connectToDatabase();
    return getWebsitesByUserId(session.user.id);
});
export const getServerSideWebsitesRaw = cache(async () => {
    var _a;
    const session = await auth();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id))
        return [];
    await connectToDatabase();
    return getWebsitesRaw(session.user.id);
});
export const getServerSideWebsite = cache(async (websiteId) => {
    if (!websiteId)
        return null;
    await connectToDatabase();
    return getWebsiteById(websiteId);
});
// Notifications fetching
export const getServerSideNotifications = cache(async (websiteId, limit = 5) => {
    if (!websiteId)
        return [];
    await connectToDatabase();
    return getNotificationsByWebsiteId(websiteId, limit);
});
export const getServerSideNotification = cache(async (notificationId) => {
    if (!notificationId)
        return null;
    await connectToDatabase();
    return getNotificationById(notificationId);
});
