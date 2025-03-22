import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple CORS middleware for API routes that need to be accessed from different origins
 * 
 * @param req - The incoming request
 * @returns NextResponse if the request is an OPTIONS request, otherwise null
 */
export function cors(req: NextRequest): NextResponse | null {
  // Get origin from request
  const origin = req.headers.get('origin') || '*';
  
  // Define allowed methods
  const methods = ['GET', 'POST', 'OPTIONS'];
  
  // Define allowed headers
  const allowedHeaders = [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ];
  
  // Create headers for response
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': methods.join(', '),
    'Access-Control-Allow-Headers': allowedHeaders.join(', '),
    'Access-Control-Max-Age': '86400' // 24 hours
  };
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    // Create new response with CORS headers
    const response = new NextResponse(null, { status: 204 });
    
    // Add CORS headers to response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
  
  // For non-OPTIONS requests, return null
  // and let the route handler handle the request
  // The route handler should add CORS headers to its response
  return null;
}

/**
 * Add CORS headers to a response
 * 
 * @param res - The response object
 * @param origin - The allowed origin (defaults to '*')
 * @returns The response with CORS headers
 */
export function addCorsHeaders(
  res: NextResponse,
  origin: string = '*'
): NextResponse {
  // Add CORS headers
  res.headers.set('Access-Control-Allow-Origin', origin);
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Origin'
  );
  
  return res;
} 