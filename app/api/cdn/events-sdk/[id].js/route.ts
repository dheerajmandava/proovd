import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getWebsiteById } from '@/app/lib/services/website.service';
import { generateRandomString } from '@/app/lib/server-utils';
import Website from '@/app/lib/models/website';

/**
 * Serves the Proovd Events SDK with the website's API key
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return new NextResponse('Website ID is required', { status: 400 });
    }
    
    // Get website using service and fetch directly from DB for Mongoose operations
    const websiteData = await getWebsiteById(id);
    if (!websiteData) {
      return new NextResponse('Website not found', { status: 404 });
    }
    
    // Generate API key
    const apiKey = generateRandomString(32);
    
    // Update the website with the API key in raw MongoDB
    // We're using the DB directly since we don't have an apiKey field in the model yet
    const db = (Website as any).db;
    await db.collection('websites').updateOne(
      { _id: new (Website as any).mongoose.Types.ObjectId(id) },
      { $set: { apiKey: apiKey } }
    );
    
    // Read the SDK file
    const sdkPath = path.join(process.cwd(), 'app/api/cdn/sdk/proovd-events.js');
    const sdkContent = fs.readFileSync(sdkPath, 'utf8');
    
    // Set up response
    const headers = new Headers();
    headers.set('Content-Type', 'application/javascript');
    headers.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Return the SDK with initialization code
    return new NextResponse(
      `${sdkContent}

// Auto-initialize with the website's API key
window.proovdEvents = new ProovdEvents({
  apiKey: "${apiKey}",
  debug: false,
  autoTrackViews: true
});`,
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    console.error('Error serving events SDK:', error);
    return new NextResponse('Server error', { status: 500 });
  }
} 