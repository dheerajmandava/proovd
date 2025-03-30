import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import Website from '@/app/lib/models/website';
import jwt from 'jsonwebtoken';
/**
 * GET /api/pulse-auth
 * Generate JWT token for pulse widget authentication
 */
export async function GET(request) {
    var _a, _b;
    try {
        // Connect to the database
        await connectToDatabase();
        // Get the current authenticated session
        const session = await getServerSession(authOptions);
        // Verify user is authenticated
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
        }
        // Get the website ID from query parameters
        const { searchParams } = new URL(request.url);
        const websiteId = searchParams.get('websiteId');
        if (!websiteId) {
            return NextResponse.json({ success: false, error: 'Website ID is required' }, { status: 400 });
        }
        // Verify the website exists and belongs to the user
        const website = await Website.findOne({
            _id: websiteId,
            userId: session.user.id
        });
        if (!website) {
            return NextResponse.json({ success: false, error: 'Website not found' }, { status: 404 });
        }
        // Verify pulse is enabled for this website
        if (!((_b = (_a = website.settings) === null || _a === void 0 ? void 0 : _a.pulse) === null || _b === void 0 ? void 0 : _b.enabled)) {
            return NextResponse.json({ success: false, error: 'ProovdPulse is not enabled for this website' }, { status: 403 });
        }
        // Get the JWT secret from environment variable
        const jwtSecret = process.env.PROOVDPULSE_JWT_SECRET;
        if (!jwtSecret) {
            console.error('PROOVDPULSE_JWT_SECRET is not configured');
            return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
        }
        // Generate token with 24 hour expiration
        const token = jwt.sign({
            websiteId,
            userId: session.user.id,
            domain: website.domain
        }, jwtSecret, { expiresIn: '24h' });
        // Return the token
        return NextResponse.json({
            success: true,
            token,
            socketUrl: process.env.NEXT_PUBLIC_PROOVDPULSE_SOCKET_URL || 'wss://socket.proovd.in'
        });
    }
    catch (error) {
        console.error('Error generating pulse auth token:', error);
        return NextResponse.json({ success: false, error: 'Failed to generate authentication token' }, { status: 500 });
    }
}
