import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Website from '@/app/lib/models/website';
import fs from 'fs';
import path from 'path';
/**
 * GET /api/websites/[id]/pulse-widget.js
 * Returns the ProovdPulse widget JavaScript file
 */
export async function GET(request, { params }) {
    var _a, _b;
    try {
        // Get custom origin for CORS if needed
        const { searchParams } = new URL(request.url);
        const origin = searchParams.get('origin') || '*';
        // Connect to database
        const { db } = await connectToDatabase();
        // Get the website data
        const website = await Website.findById(params.id);
        if (!website) {
            return new NextResponse(`console.error('ProovdPulse: Website not found');`, {
                status: 404,
                headers: {
                    'Content-Type': 'application/javascript',
                    'Access-Control-Allow-Origin': origin,
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
            });
        }
        // Check if ProovdPulse is enabled for this website
        if (!((_b = (_a = website.settings) === null || _a === void 0 ? void 0 : _a.pulse) === null || _b === void 0 ? void 0 : _b.enabled)) {
            return new NextResponse(`console.error('ProovdPulse not enabled for this website');`, {
                status: 403,
                headers: {
                    'Content-Type': 'application/javascript',
                    'Access-Control-Allow-Origin': origin,
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
            });
        }
        // Get the bundled widget file
        const widgetFilePath = path.join(process.cwd(), 'public', 'pulse-widget.min.js');
        let widgetJs;
        try {
            widgetJs = fs.readFileSync(widgetFilePath, 'utf8');
        }
        catch (error) {
            console.error('Error reading widget file:', error);
            // If the file doesn't exist, return an error
            return new NextResponse(`console.error('ProovdPulse: Widget file not found. Please build the widget first with npm run build:widget');`, {
                status: 500,
                headers: {
                    'Content-Type': 'application/javascript',
                    'Access-Control-Allow-Origin': origin,
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
            });
        }
        // Return the widget script with proper headers
        return new NextResponse(widgetJs, {
            status: 200,
            headers: {
                'Content-Type': 'application/javascript',
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Cache-Control': 'max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
            },
        });
    }
    catch (error) {
        console.error('Error serving ProovdPulse widget script:', error);
        return new NextResponse(`console.error('ProovdPulse: Server error loading widget');`, {
            status: 500,
            headers: {
                'Content-Type': 'application/javascript',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }
}
