import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Read the widget file from public directory
    const widgetPath = path.join(process.cwd(), 'public', 'js', 'widget.js');
    let widgetContent = fs.readFileSync(widgetPath, 'utf-8');

    // Fix the API URL to use the current host
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';

    // The actual string in widget.js is: this.apiUrl = 'http://localhost:3000';
    widgetContent = widgetContent.replace(
      "this.apiUrl = 'http://localhost:3000';",
      `this.apiUrl = '${protocol}://${host}';`
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