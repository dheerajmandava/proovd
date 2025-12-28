import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Minimal legacy endpoint for widget initialization
 * Returns empty campaigns to stop 404s in storefront console
 */
export async function GET() {
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');

    return NextResponse.json({
        success: true,
        campaigns: []
    }, { headers });
}

export async function OPTIONS() {
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return new NextResponse(null, {
        status: 204,
        headers
    });
}
