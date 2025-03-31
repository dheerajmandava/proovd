import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Website from '@/app/lib/models/website';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/websites/[id]/pulse-widget.js
 * Returns the ProovdPulse widget JavaScript file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get custom origin for CORS if needed
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin') || '*';
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Get the website data
    const website = await Website.findById(params.id);
    
    if (!website) {
      return new NextResponse(`console.error('ProovdPulse: Website not found');`, { 
        status: 404,
        headers: {
          'Content-Type': 'application/javascript',
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
    
    // Check if ProovdPulse is enabled for this website
    if (website.settings?.pulse && website.settings.pulse.enabled === false) {
      return new NextResponse(`console.error('ProovdPulse not enabled for this website');`, { 
        status: 403,
        headers: {
          'Content-Type': 'application/javascript',
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
    
    // Get the bundled widget file from the public directory
    const widgetFilePath = path.join(process.cwd(), 'public', 'pulse-widget.min.js');
    
    let widgetJs;
    try {
      widgetJs = fs.readFileSync(widgetFilePath, 'utf8');
    } catch (error) {
      console.error('Error reading widget file:', error);
      return new NextResponse(`console.error('ProovdPulse: Widget file not found');`, {
        status: 500,
        headers: {
          'Content-Type': 'application/javascript',
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
    
    // Get website settings for initialization
    const position = website.settings?.pulse?.position || 'bottom-right';
    const theme = website.settings?.pulse?.theme || 'light';
    
    // Replace WEBSITE_ID_PLACEHOLDER with actual ID and add auto-initialization
    widgetJs = widgetJs.replace(/WEBSITE_ID_PLACEHOLDER/g, params.id);
    
    // Ensure the widget self-initializes with the correct settings
    const initScript = `
// Auto-initialize with website settings
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', function() {
    if (window.ProovdPulse) {
      new window.ProovdPulse({
        websiteId: "${params.id}",
        widgetPosition: "${position}",
        theme: "${theme}",
        serverUrl: "wss://socket.proovd.in"
      }).init().catch(function(err) {
        console.error("ProovdPulse initialization error:", err);
      });
    }
  });
}`;
    
    // Add the initialization code if not already present
    if (!widgetJs.includes(`websiteId: "${params.id}"`)) {
      widgetJs += initScript;
    }
    
    // Return the widget script with proper headers
    return new NextResponse(widgetJs, { 
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
      },
    });
  } catch (error) {
    console.error('Error serving ProovdPulse widget script:', error);
    
    return new NextResponse(`console.error('ProovdPulse: Server error loading widget');`, { 
      status: 500,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
} 