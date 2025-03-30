import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserById, updateUserPreferences } from '@/app/lib/services';
import { createUnauthorizedError, createNotFoundError, handleApiError } from '@/app/lib/utils/server-error';
/**
 * GET /api/user/preferences
 *
 * Fetches the current user's preferences
 */
export async function GET() {
    var _a;
    try {
        // Authentication
        const session = await auth();
        if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
            throw createUnauthorizedError('Authentication required');
        }
        // Get user data
        const user = await getUserById(session.user.id);
        if (!user) {
            throw createNotFoundError('User not found');
        }
        // Return only preference data
        return NextResponse.json({
            emailNotifications: user.emailNotifications !== undefined ? user.emailNotifications : true,
            notificationDigest: user.notificationDigest || 'daily'
        });
    }
    catch (error) {
        console.error('Error fetching user preferences:', error);
        const apiError = handleApiError(error);
        return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode });
    }
}
/**
 * PATCH /api/user/preferences
 *
 * Updates the current user's preferences
 */
export async function PATCH(request) {
    var _a;
    try {
        // Authentication
        const session = await auth();
        if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
            throw createUnauthorizedError('Authentication required');
        }
        // Parse request body
        const data = await request.json();
        // Update user preferences
        const user = await updateUserPreferences(session.user.id, {
            emailNotifications: data.emailNotifications,
            notificationDigest: data.notificationDigest
        });
        if (!user) {
            throw createNotFoundError('User not found');
        }
        // Return updated preferences
        return NextResponse.json({
            emailNotifications: user.emailNotifications,
            notificationDigest: user.notificationDigest
        });
    }
    catch (error) {
        console.error('Error updating user preferences:', error);
        const apiError = handleApiError(error);
        return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode });
    }
}
