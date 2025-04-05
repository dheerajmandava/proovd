import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';

/**
 * GET /api/cdn/w/[id].js
 * 
 * Returns a small JavaScript loader that loads the main widget script
 * This is a public endpoint that users will include in their websites
 */
export async function GET(request, props) {
  const params = await props.params;
  try {
    // Get the website ID from the params
    const { id } = params;
    
    // Validate the ID format (simple validation, not checking if it exists)
    if (!id || !isValidObjectId(id)) {
      return new NextResponse(`console.error("Invalid website ID format");`, {
        status: 400,
        headers: {
          'Content-Type': 'application/javascript',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    
    // Get host from request or use default
    const host = request.headers.get('host') || 'www.proovd.in';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    
    // Create a simple loader script that loads the main widget script
    const loaderScript = `
      // Proovd Widget Loader
      (function() {
        const websiteId = "${id}";
        
        console.log("🟢 Proovd Widget Loader Starting - Website ID: ${id}");
        
        // Create and append the main widget script
        const widgetScript = document.createElement('script');
        widgetScript.async = true;
        widgetScript.src = "${baseUrl}/api/websites/${id}/widget.js?t=" + new Date().getTime();
        widgetScript.onerror = function(err) {
          console.error("❌ Failed to load Proovd widget script:", err);
        };
        
        widgetScript.onload = function() {
          console.log("✅ Proovd widget script loaded successfully");
        };
        
        // Debug information
        console.log("ℹ️ Widget configuration:", {
          websiteId: "${id}",
          apiEndpoint: "${baseUrl}/api/websites/${id}/widget.js",
          timestamp: new Date().toISOString()
        });
        
        // Insert the script into the page
        document.head.appendChild(widgetScript);
      })();
    `;
    
    // Return the loader script with appropriate headers
    return new NextResponse(loaderScript, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Max-Age': '86400',
      },
    });
    
  } catch (error) {
    console.error('Error generating widget loader:', error);
    
    // Return an error script
    return new NextResponse(`console.error("Error loading Proovd widget");`, {
      status: 500,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
} 