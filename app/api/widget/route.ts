import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Read the widget file (now using the .js version)
    const widgetPath = path.join(process.cwd(), 'app', 'widget', 'widget.js');
    let widgetContent = fs.readFileSync(widgetPath, 'utf-8');
    
    // Fix the API URL to use the current host
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    widgetContent = widgetContent.replace(
      "apiUrl = ${process.env.NEXTAUTH_URL || 'http://localhost:3000'};",
      `apiUrl = '${protocol}://${host}';`
    );
    
    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/javascript');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate'); // Disable caching during development
    headers.set('Access-Control-Allow-Origin', '*'); // Allow CORS for widget access
    
    return new NextResponse(widgetContent, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error serving widget script:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 