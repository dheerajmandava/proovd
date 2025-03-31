import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { getWebsiteById } from '@/app/lib/services/website.service';

/**
 * GET /api/cdn/p/[id]
 * 
 * Returns a simple JavaScript loader for the ProovdPulse widget
 * This is a public endpoint that users will include in their websites using a simple script tag
 */
export async function GET(request, props) {
  const params = await props.params;
  try {
    // Get the website ID from the params
    const { id } = params;
    
    // Validate the ID format
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
    
    // Verify the website exists
    try {
      const website = await getWebsiteById(id);
      if (!website) {
        return new NextResponse(`console.error("Website ID not found");`, {
          status: 404,
          headers: {
            'Content-Type': 'application/javascript',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Max-Age': '86400',
          },
        });
      }
    } catch (error) {
      console.error('Error verifying website:', error);
      // Continue even if website verification fails
    }
    
    // Use the same domain for the widget script
    const host = request.headers.get('host') || '';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    
    // Create a direct loader script - much simpler approach
    const loaderScript = `
      // ProovdPulse Widget Loader
      (function() {
        // Load the widget directly from the API endpoint
        const script = document.createElement('script');
        script.async = true;
        script.src = "${baseUrl}/api/websites/${id}/pulse-widget.js";
        document.head.appendChild(script);
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
    console.error('Error generating ProovdPulse loader:', error);
    
    // Return an error script
    return new NextResponse(`console.error("Error loading ProovdPulse widget");`, {
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