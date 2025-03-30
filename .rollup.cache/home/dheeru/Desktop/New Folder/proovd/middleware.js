// Instead of directly importing auth from auth.ts (which uses Mongoose)
// Define a lightweight middleware that only handles session validation
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
const AUTH_PAGES = ['/login', '/register', '/auth'];
const PUBLIC_PAGES = ['/', '/auth/signin', '/auth/signup', '/pricing', '/docs', '/help', '/contact', '/blog', '/_next', '/images', '/fonts', '/api/auth', '/favicon.ico'];
const API_PUBLIC_ENDPOINTS = [
    '/api/auth',
    '/api/websites/*/widget.js',
    '/api/websites/*/notifications/show',
    '/api/notifications/*/impression',
    '/api/notifications/*/click',
    '/api/cdn/w'
];
/**
 * Middleware function that runs on every request
 */
export async function middleware(request) {
    const { nextUrl } = request;
    const pathname = nextUrl.pathname;
    const hostname = request.headers.get('host') || '';
    const method = request.method;
    // Handle CORS preflight requests
    if (method === 'OPTIONS') {
        // Check if this is a preflight request for a public API endpoint
        const isPublicApiPreflight = API_PUBLIC_ENDPOINTS.some(pattern => matchesPattern(pathname, pattern));
        if (isPublicApiPreflight) {
            const origin = request.headers.get('origin') || '*';
            return new NextResponse(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': origin,
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Max-Age': '86400',
                },
            });
        }
    }
    // If request is to cdn subdomain
    if (hostname.startsWith('cdn.')) {
        // Only handle .js files in /w/ directory
        if (pathname.startsWith('/w/') && pathname.endsWith('.js')) {
            const id = pathname.substring(2, pathname.length - 3);
            // Rewrite to the API route on the same domain
            return NextResponse.rewrite(new URL(`/api/cdn/w/${id}.js`, request.url));
        }
        // For all other paths on cdn subdomain, 404
        return new NextResponse('Not Found', { status: 404 });
    }
    // Function to check if a path matches a pattern
    function matchesPattern(path, pattern) {
        const regexPattern = pattern
            .replace(/\//g, '\\/')
            .replace(/\*/g, '[^\\/]+')
            .replace(/\[([^\]]+)\]/g, '([^\\/]+)');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(path);
    }
    // Check if the path is a public API endpoint
    function isPublicApiEndpoint(path) {
        return API_PUBLIC_ENDPOINTS.some(pattern => matchesPattern(path, pattern));
    }
    // Allow public pages and API endpoints
    if (PUBLIC_PAGES.some(page => pathname.startsWith(page)) || isPublicApiEndpoint(pathname)) {
        return NextResponse.next();
    }
    // Check for authentication token
    const token = await getToken({ req: request });
    // If not logged in and trying to access protected pages, redirect to login
    if (!token && !AUTH_PAGES.some(page => pathname.startsWith(page))) {
        const url = new URL('/auth/signin', request.url);
        if (pathname !== '/dashboard') {
            url.searchParams.set('callbackUrl', pathname);
        }
        return NextResponse.redirect(url);
    }
    // If logged in and accessing auth pages, redirect to dashboard
    if (token && AUTH_PAGES.some(page => pathname.startsWith(page))) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Default: continue with the request
    return NextResponse.next();
}
/**
 * Configure paths that the middleware will run on
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
        // Public API routes
        '/api/websites/:id/widget.js',
        '/api/websites/:id/pulse-widget.js',
        '/api/pageview',
    ],
};
