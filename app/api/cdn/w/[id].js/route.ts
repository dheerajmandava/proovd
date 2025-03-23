import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';

/**
 * GET /api/cdn/w/[id].js
 * 
 * Returns a small JavaScript loader that loads the main widget script
 * This is the public endpoint that users will include in their websites
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the website ID from the params
    const { id } = params;
    
    // Validate the ID format (simple validation, not checking if it exists)
    if (!id || !isValidObjectId(id)) {
      return new NextResponse(`console.error("Invalid website ID format");`, {
        status: 400,
        headers: {
          'Content-Type': 'application/javascript',
        },
      });
    }
    
    // Get the base URL for loading the widget script
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    
    // Create a simple loader script that loads the main widget script
    const loaderScript = `
      // Proovd Widget Loader
      (function() {
        const websiteId = "${id}";
        
        // Create and append the main widget script
        const widgetScript = document.createElement('script');
        widgetScript.async = true;
        widgetScript.src = "${baseUrl}/api/websites/${id}/widget.js";
        
        // Insert the script into the page
        document.head.appendChild(widgetScript);
      })();
    `;
    
    // Return the loader script with appropriate cache headers
    return new NextResponse(loaderScript, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
    
  } catch (error) {
    console.error('Error generating widget loader:', error);
    
    // Return an error script
    return new NextResponse(`console.error("Error loading Proovd widget");`, {
      status: 500,
      headers: {
        'Content-Type': 'application/javascript',
      },
    });
  }
} 