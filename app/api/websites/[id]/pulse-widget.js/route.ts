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
    const widgetFilePath = path.join(process.cwd(), 'public', 'widget.js');
    
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
    
    // Add explicit console logs to debug
    const debugScript = `
// Force console log to display in all environments
console.log = console.log || function() {};
console.error = console.error || function() {};

// Add initial debugging info
console.log('🟢 ProovdPulse Loader Starting - Website ID: ${params.id}');
console.log('ℹ️ Widget configuration: ' + JSON.stringify({
  websiteId: '${params.id}',
  apiEndpoint: '${request.url}',
  timestamp: new Date().toISOString(),
  serverTimestamp: '${new Date().toISOString()}'
}));

// Force immediate initialization on script load
(function() {
  // Wait for DOM to be ready
  function initWidget() {
    if (typeof window.ProovdPulse === 'undefined' || !window.ProovdPulse.init) {
      console.error('❌ ProovdPulse API not found or init method missing!');
      return;
    }
    
    try {
      window.ProovdPulse.init('${params.id}', {
        position: "${position}",
        theme: "${theme}",
        debug: true,
        socketUrl: "wss://socket.proovd.in"
      });
      console.log('✅ ProovdPulse widget script loaded successfully');
    } catch (e) {
      console.error('❌ Error initializing ProovdPulse widget:', e);
    }
  }
  
  // Run initialization when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();`;
    
    // Append our debug script at the end
    widgetJs += debugScript;
    
    // Return the widget script with proper headers
    return new NextResponse(widgetJs, { 
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Prevent caching
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });
  } catch (error) {
    console.error('Error serving ProovdPulse widget script:', error);
    
    return new NextResponse(`
      console.error('ProovdPulse: Server error loading widget');
      console.error('${error}');
    `, { 
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