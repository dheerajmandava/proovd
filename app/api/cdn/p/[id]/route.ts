import { NextRequest, NextResponse } from 'next/server';
import { getWebsiteById } from '@/app/lib/services/website.service';

// Debug timestamp for cache busting
const BUILD_TIMESTAMP = new Date().toISOString();

/**
 * GET /api/cdn/p/[id]
 * 
 * Returns a simple JavaScript loader for the ProovdPulse widget
 * This is a public endpoint that users will include in their websites using a simple script tag
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[ProovdPulse] Loading script for website ID: ${params.id}`);
  
  // Validate the ID format
  if (!params.id.match(/^[0-9a-fA-F]{24}$/)) {
    console.error(`[ProovdPulse] Invalid website ID format: ${params.id}`);
    return NextResponse.json({ error: 'Invalid website ID format' }, { status: 400 });
  }

  try {
    // Check if website exists
    const website = await getWebsiteById(params.id);
    if (!website) {
      console.error(`[ProovdPulse] Website not found: ${params.id}`);
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Get host from request or use default
    const host = request.headers.get('host') || 'www.proovd.in';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Create the loader script with cache-busting
    const script = `
      // ProovdPulse Widget Loader
      // Version: 1.1.0
      // Website ID: ${params.id}
      // Build: ${BUILD_TIMESTAMP}
      
      (function() {
        console.log("🟢 ProovdPulse Loader Starting - Website ID: ${params.id}");
        
        // Load the main script with cache busting
        const script = document.createElement('script');
        script.src = "${baseUrl}/api/websites/${params.id}/pulse-widget.js?t=" + new Date().getTime();
        script.async = true;
        script.setAttribute('data-website-id', "${params.id}");
        script.setAttribute('data-position', "bottom-right");
        
        // Handle script loading errors
        script.onerror = function(err) {
          console.error("❌ Failed to load ProovdPulse widget script:", err);
        };
        
        // Handle successful loading
        script.onload = function() {
          console.log("✅ ProovdPulse widget script loaded successfully");
        };
        
        // Add to document
        document.head.appendChild(script);
        
        // Debug information
        console.log("ℹ️ Widget configuration:", {
          websiteId: "${params.id}",
          apiEndpoint: "${baseUrl}/api/websites/${params.id}/pulse-widget.js",
          timestamp: new Date().toISOString(),
          serverTimestamp: "${BUILD_TIMESTAMP}"
        });
      })();
    `;

    // Create response with JavaScript content type
    const response = new NextResponse(script, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        // CORS headers for cross-origin use
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
    });

    return response;
  } catch (error) {
    console.error(`[ProovdPulse] Error serving pulse script:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 