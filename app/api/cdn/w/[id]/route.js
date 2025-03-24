import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';

/**
 * GET /api/cdn/w/[id].js
 * 
 * Returns a small JavaScript loader that loads the main widget script
 * This is a public endpoint that users will include in their websites
 */
export async function GET(request, { params }) {
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
    
    // Use the same domain for the widget script
    const host = request.headers.get('host') || '';
    const protocol = 'https';
    const baseUrl = `${protocol}://${host}`;
    
    // Create a simple loader script that loads the main widget script
    const loaderScript = `
      // Proovd Widget Loader
      (function() {
        const websiteId = "${id}";
        
        // Create and append the main widget script
        const widgetScript = document.createElement('script');
        widgetScript.async = true;
        widgetScript.src = "${baseUrl}/api/websites/${id}/widget.js";
        widgetScript.onerror = function() {
          console.error('Failed to load Proovd widget script');
        };
        
        // Insert the script into the page
        document.head.appendChild(widgetScript);
      })();
    `;
    
    // Return the loader script with appropriate headers
    return new NextResponse(loaderScript, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
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