// Instead of directly importing auth from auth.ts (which uses Mongoose)
// Define a lightweight middleware that only handles session validation

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  // Public API endpoints that need CORS but not auth
  const publicApiPaths = [
    '/api/notifications',
    '/api/track',
    '/api/widget',
    '/api/websites/*/widget.js',
    '/api/domains/validate',
    '/api/dev/create-test-notifications',
    '/api/dev/create-test-website'
  ]

  // Check if the current path is a public API endpoint
  const isPublicApiPath = publicApiPaths.some(path => {
    if (path.includes('*')) {
      const pattern = new RegExp(path.replace('*', '.*'));
      return pattern.test(request.nextUrl.pathname);
    }
    return request.nextUrl.pathname.startsWith(path);
  })

  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // For public API endpoints, just add CORS headers
    if (isPublicApiPath) {
      const response = NextResponse.next();
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return response;
    }
  }

  // Get token for protected routes
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })
  
  // Public paths that don't require authentication
  const publicPaths = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/register',
    '/auth/error',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/api/auth/signin',
    '/api/auth/signout',
    '/api/auth/session',
    '/api/auth/csrf',
    '/api/auth/providers',
    '/api/auth/callback',
    '/api/auth/register',
    '/api/auth/signup',
    '/api/auth',
    '/favicon.ico',
    '/widget.js'
  ]
  
  // Check if the path is a public path or starts with one
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith(`${path}/`)
  ) || 
  isPublicApiPath ||
  request.nextUrl.pathname.startsWith('/_next/') ||
  request.nextUrl.pathname.startsWith('/static/')
  
  // Protected routes that require authentication
  const protectedPaths = [
    '/dashboard',
    '/api/websites',
    '/api/notifications',
    '/api/users'
  ]
  
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname === path ||
    request.nextUrl.pathname.startsWith(`${path}/`)
  )
  
  // If not authenticated and trying to access a protected path, redirect to sign in
  if (!token && isProtectedPath) {
    const url = new URL('/auth/signin', request.url)
    url.searchParams.set('callbackUrl', request.nextUrl.pathname)
    console.log(`Redirecting unauthenticated user from ${request.nextUrl.pathname} to signin`)
    return NextResponse.redirect(url)
  }

  // For protected API routes, add CORS headers and check auth
  if (request.nextUrl.pathname.startsWith('/api') && !isPublicApiPath && !isPublicPath) {
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }
  
  return NextResponse.next()
}

// Update matcher to include all paths except static assets
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
} 