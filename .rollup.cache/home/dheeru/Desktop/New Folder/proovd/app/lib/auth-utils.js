import { NextResponse } from 'next/server';
import { auth } from '@/auth';
/**
 * Utility function to check authentication for API routes
 * Can be reused across all API routes for consistent auth checks
 *
 * @param req The Next.js request object
 * @returns Object with auth status and (if authenticated) session data
 */
export async function checkApiAuth(req) {
    var _a;
    try {
        const session = await auth();
        if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
            console.log(`API auth check failed: ${req.nextUrl.pathname}`);
            return {
                authenticated: false,
                response: NextResponse.json({ error: 'Authentication required' }, { status: 401 })
            };
        }
        return {
            authenticated: true,
            session,
            userId: session.user.id
        };
    }
    catch (error) {
        console.error('Error in API auth check:', error);
        return {
            authenticated: false,
            response: NextResponse.json({ error: 'Authentication error' }, { status: 500 })
        };
    }
}
/**
 * Checks if a user owns a resource
 * Use this to verify that a user has permission to access a specific resource
 *
 * @param userId The ID of the authenticated user
 * @param resourceOwnerId The ID of the resource owner to compare against
 * @returns Object with ownership verification result
 */
export function checkResourceOwnership(userId, resourceOwnerId) {
    const ownershipMatch = userId === resourceOwnerId.toString();
    if (!ownershipMatch && process.env.NODE_ENV === 'development') {
        console.log(`Ownership check failed: User ${userId} tried to access resource owned by ${resourceOwnerId}`);
    }
    return {
        isOwner: ownershipMatch,
        response: ownershipMatch ? null : NextResponse.json({ error: 'Access denied: You do not have permission to access this resource' }, { status: 403 })
    };
}
