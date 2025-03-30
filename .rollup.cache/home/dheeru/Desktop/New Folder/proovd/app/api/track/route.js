import { NextResponse } from 'next/server';
import { getWebsiteByApiKey, getNotificationById, updateNotification, createMetric, hasSessionSeenNotification } from '@/app/lib/services';
import { sanitizeInput } from '@/app/lib/server-utils';
import { isBot } from '@/app/lib/bot-detection';
import { handleApiError } from '@/app/lib/utils/server-error';
/**
 * API endpoint for tracking impressions and clicks on notifications
 */
export async function POST(request) {
    // Allow requests from any origin
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 204,
            headers
        });
    }
    try {
        // Parse request body
        const body = await request.json();
        const { apiKey, notificationId, action, url, sessionId, clientId } = body;
        // Validate required fields
        if (!apiKey || !notificationId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, {
                status: 400,
                headers
            });
        }
        // Validate API key and get website
        const website = await getWebsiteByApiKey(apiKey);
        if (!website) {
            return NextResponse.json({ error: 'Invalid API key' }, {
                status: 401,
                headers
            });
        }
        // Find notification
        const notification = await getNotificationById(notificationId);
        if (!notification || notification.siteId.toString() !== website._id.toString()) {
            return NextResponse.json({ error: 'Notification not found' }, {
                status: 404,
                headers
            });
        }
        // Get request information for bot detection
        const userAgent = request.headers.get('user-agent');
        const ip = request.headers.get('x-forwarded-for') || '';
        const referrer = request.headers.get('referer');
        // Detect if this is a bot
        const botDetectionData = {
            userAgent,
            ip,
            referrer
        };
        const detectedAsBot = isBot(botDetectionData);
        // Determine if this is a unique impression or click
        let isUnique = true;
        // For impressions, check if this session has already seen this notification
        if (action === 'impression' && sessionId) {
            isUnique = !(await hasSessionSeenNotification(notificationId, sessionId));
        }
        // Create metric entry
        await createMetric({
            siteId: website._id,
            notificationId: notification._id,
            type: action === 'impression' ? 'impression' : 'click',
            url: url ? sanitizeInput(url) : undefined,
            userAgent,
            ipAddress: ip,
            referrer,
            sessionId,
            clientId,
            isBot: detectedAsBot,
            isUnique
        });
        // Only update notification counts for non-bot traffic and unique impressions for impressions
        if (!detectedAsBot && (action !== 'impression' || isUnique)) {
            // Update notification counts
            const updates = {};
            if (action === 'impression') {
                updates.impressions = (notification.impressions || 0) + 1;
            }
            else if (action === 'click') {
                updates.clicks = (notification.clicks || 0) + 1;
            }
            await updateNotification(notificationId, updates);
        }
        return NextResponse.json({ success: true }, {
            status: 200,
            headers
        });
    }
    catch (error) {
        console.error('Error tracking event:', error);
        const apiError = handleApiError(error);
        return NextResponse.json({ error: apiError.message }, {
            status: apiError.statusCode,
            headers
        });
    }
}
// Disable body parsing to increase performance for high-volume endpoint
export const config = {
    api: {
        bodyParser: false,
    },
};
