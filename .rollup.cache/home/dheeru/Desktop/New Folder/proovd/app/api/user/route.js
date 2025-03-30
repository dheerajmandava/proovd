import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserById, updateUserProfile } from '@/app/lib/services';
import { createUnauthorizedError, createNotFoundError, handleApiError } from '@/app/lib/utils/server-error';
/**
 * GET /api/user
 *
 * Fetches the current user's data
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
        // Return user data
        return NextResponse.json(user);
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        const apiError = handleApiError(error);
        return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode });
    }
}
/**
 * PATCH /api/user
 *
 * Updates the current user's profile data
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
        // Update user data
        const user = await updateUserProfile(session.user.id, {
            name: data.name,
            image: data.image
        });
        if (!user) {
            throw createNotFoundError('User not found');
        }
        // Return updated user data
        return NextResponse.json(user);
    }
    catch (error) {
        console.error('Error updating user profile:', error);
        const apiError = handleApiError(error);
        return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode });
    }
}
