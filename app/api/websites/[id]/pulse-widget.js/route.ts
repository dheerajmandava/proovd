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
    
    // Add explicit console logs to debug
    const debugScript = `
// Force console log to display in all environments
console.log = console.log || function() {};
console.error = console.error || function() {};

// Display ProovdPulse initialization status
console.log('🟢 ProovdPulse widget script loaded for website: ${params.id}');

// Test if WebSocket is available
if (typeof WebSocket === 'undefined') {
  console.error('❌ WebSocket is not available in this browser');
} else {
  console.log('✅ WebSocket is available');
}

// Force immediate initialization on script load
(function() {
  console.log('🟢 Initializing ProovdPulse widget...');
  
  if (typeof window.ProovdPulse === 'undefined') {
    console.error('❌ ProovdPulse class not found in window object!');
    return;
  }
  
  var websiteId = "${params.id}";
  console.log('🟢 Using websiteId:', websiteId);
  
  try {
    window._proovdPulseInstance = new window.ProovdPulse({
      websiteId: websiteId,
      position: "${position}",
      theme: "${theme}",
      debug: true,
      serverUrl: "wss://socket.proovd.in",
      container: "body"
    });
    
    window._proovdPulseInstance.init()
      .then(function() {
        console.log('✅ ProovdPulse initialized successfully!');
      })
      .catch(function(error) {
        console.error('❌ ProovdPulse initialization failed:', error);
      });
  } catch (e) {
    console.error('❌ Error during ProovdPulse initialization:', e);
  }
})();`;
    
    // Remove any potentially conflicting initialization code
    widgetJs = widgetJs.replace(/if\s*\(\s*typeof\s+window\s+!==\s*['"]undefined['"]\s*&&\s*!window\.location\.href\.includes\s*\(\s*['"]localhost['"]\s*\)\s*\)\s*\{[\s\S]*?\}\s*\}\s*\)\s*\)\s*\}\s*\}\s*\)/g, '');
    
    // Add our debug script at the end
    widgetJs += debugScript;
    
    // Return the widget script with proper headers
    return new NextResponse(widgetJs, { 
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'no-cache, no-store, must-revalidate' // Prevent caching
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