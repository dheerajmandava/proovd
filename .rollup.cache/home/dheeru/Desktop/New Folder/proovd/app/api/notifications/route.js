import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sanitizeInput } from '@/app/lib/server-utils';
import { createNotification, getNotificationsByWebsiteId, getWebsiteById } from '@/app/lib/services';
import { createNotFoundError, createUnauthorizedError, createBadRequestError, handleApiError } from '@/app/lib/utils/error';
/**
 * API endpoint for creating notifications through the dashboard
 */
export async function POST(request) {
    try {
        // Check authentication for dashboard users
        const session = await auth();
        if (!session || !session.user) {
            throw createUnauthorizedError('Authentication required');
        }
        // Parse the request body
        const body = await request.json();
        // Validate required fields
        const { name, message, type, productName, location, url, status, websiteId } = body;
        if (!name || !message || !type || !location || !websiteId) {
            throw createBadRequestError('Required fields are missing');
        }
        // Check if website exists and belongs to user
        const website = await getWebsiteById(websiteId);
        if (!website) {
            throw createNotFoundError('Website not found');
        }
        if (website.userId !== session.user.id) {
            throw createUnauthorizedError('You do not have permission to create notifications for this website');
        }
        // Sanitize user input
        const sanitizedMessage = sanitizeInput(message);
        const sanitizedName = sanitizeInput(name);
        const sanitizedProductName = productName ? sanitizeInput(productName) : undefined;
        const sanitizedLocation = sanitizeInput(location);
        // Create notification data
        const notificationData = {
            title: sanitizedName,
            message: sanitizedMessage,
            siteId: websiteId,
            status: status || 'active',
            link: url,
            priority: type === 'purchase' ? 2 : type === 'signup' ? 1 : 0,
            image: body.image
        };
        // Create notification
        const notification = await createNotification(notificationData);
        return NextResponse.json({
            success: true,
            notification
        }, { status: 201 });
    }
    catch (error) {
        console.error('Error creating notification:', error);
        const apiError = handleApiError(error);
        return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode });
    }
}
/**
 * GET notifications for a website
 */
export async function GET(request) {
    var _a;
    try {
        // Check authentication
        const session = await auth();
        if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
            throw createUnauthorizedError('Authentication required');
        }
        // Get website ID from URL
        const { searchParams } = new URL(request.url);
        const websiteId = searchParams.get('websiteId');
        if (!websiteId) {
            throw createBadRequestError('Website ID is required');
        }
        // Check if website exists and belongs to user
        const website = await getWebsiteById(websiteId);
        if (!website) {
            throw createNotFoundError('Website not found');
        }
        if (website.userId !== session.user.id) {
            throw createUnauthorizedError('You do not have permission to view notifications for this website');
        }
        // Get notifications
        const notifications = await getNotificationsByWebsiteId(websiteId);
        return NextResponse.json({ notifications });
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        const apiError = handleApiError(error);
        return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode });
    }
}
