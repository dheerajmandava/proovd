/**
 * ProovdPulse CDN Endpoint
 * Serves the ProovdPulse widget script with the website's API key
 */
import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
/**
 * GET /api/cdn/pulse-sdk/[id].js
 *
 * Returns a small JavaScript loader that loads the ProovdPulse widget script
 * This is a public endpoint that website owners will include in their websites
 */
export async function GET(request, { params }) {
    try {
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
        // Create a simple loader script that loads the main ProovdPulse script
        const loaderScript = `
      // ProovdPulse Widget Loader
      (function() {
        const websiteId = "${id}";
        
        // Create and append the main ProovdPulse script
        const pulseScript = document.createElement('script');
        pulseScript.async = true;
        pulseScript.src = "https://www.proovd.in/api/websites/${id}/pulse-widget.js";
        pulseScript.onerror = function() {
          console.error('Failed to load ProovdPulse widget script');
        };
        
        // Insert the script into the page
        document.head.appendChild(pulseScript);
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
    }
    catch (error) {
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
