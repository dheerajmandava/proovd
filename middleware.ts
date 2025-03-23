// Instead of directly importing auth from auth.ts (which uses Mongoose)
// Define a lightweight middleware that only handles session validation

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { join } from 'path'

const AUTH_PAGES = ['/login', '/register', '/auth']
const PUBLIC_PAGES = ['/', '/auth/signin', '/auth/signup', '/pricing', '/docs', '/help', '/contact', '/blog', '/_next', '/images', '/fonts', '/api/auth', '/favicon.ico']
const API_PUBLIC_ENDPOINTS = [
  '/api/auth',
  '/api/websites/*/widget.js',
  '/api/notifications/*/impression',
  '/api/notifications/*/click',
  '/cdn/w/[id].js',
  '/api/cdn/w'
]

/**
 * Middleware function that runs on every request
 */
export async function middleware(request: NextRequest) {
  const { nextUrl, headers } = request
  const pathname = nextUrl.pathname

  // Function to check if a path matches a pattern
  function matchesPattern(path: string, pattern: string): boolean {
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/\//g, '\\/') // Escape forward slashes
      .replace(/\*/g, '[^\\/]+') // * matches any segment
      .replace(/\[([^\]]+)\]/g, '([^\\/]+)') // [xxx] matches a dynamic segment
    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(path)
  }

  // Check if the path is a public API endpoint
  function isPublicApiEndpoint(path: string): boolean {
    return API_PUBLIC_ENDPOINTS.some(pattern => matchesPattern(path, pattern))
  }

  // Handle public CDN endpoints (for widget scripts)
  if (pathname.startsWith('/cdn/')) {
    // Extract the part after /cdn/
    const cdnPath = pathname.substring('/cdn/'.length)
    
    // Redirect /cdn/w/ID.js to /api/cdn/w/ID.js
    if (cdnPath.startsWith('w/') && cdnPath.endsWith('.js')) {
      const id = cdnPath.substring(2, cdnPath.length - 3) // Remove 'w/' prefix and '.js' suffix
      return NextResponse.rewrite(new URL(`/api/cdn/w/${id}.js`, request.url))
    }
  }
  
  // Allow public pages and API endpoints
  if (PUBLIC_PAGES.some(page => pathname.startsWith(page)) || isPublicApiEndpoint(pathname)) {
    return NextResponse.next()
  }

  // Check for authentication token
  const token = await getToken({ req: request })

  // If not logged in and trying to access protected pages, redirect to login
  if (!token && !AUTH_PAGES.some(page => pathname.startsWith(page))) {
    // Create a new URL for redirection
    const url = new URL('/auth/signin', request.url)
    // Add the current URL as a callback parameter
    if (pathname !== '/dashboard') {
      url.searchParams.set('callbackUrl', pathname)
    }
    // Redirect to login
    return NextResponse.redirect(url)
  }

  // If logged in and accessing auth pages, redirect to dashboard
  if (token && AUTH_PAGES.some(page => pathname.startsWith(page))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Default: continue with the request
  return NextResponse.next()
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
    '/((?!_next/static|_next/image).*)',
  ],
} 