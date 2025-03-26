import { NextRequest, NextResponse } from 'next/server';
import { getWebsiteByApiKey } from '@/app/lib/services/website.service';
import { createEvent } from '@/app/lib/services/event.service';
import { isBot } from '@/app/lib/bot-detection';
import { handleApiError } from '@/app/lib/utils/server-error';
import { z } from 'zod';

// Schema for view event validation
const viewSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  pageUrl: z.string().url('Invalid URL').optional(),
  pageTitle: z.string().optional(),
  sessionId: z.string().optional(),
  clientId: z.string().optional(),
  customData: z.record(z.any()).optional(),
});

/**
 * API endpoint for tracking view events
 */
export async function POST(request: NextRequest) {
  // Set CORS headers
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { 
      status: 204,
      headers
    });
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = viewSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: validationResult.error.errors[0]?.message || 'Invalid request data'
        },
        { 
          status: 400,
          headers 
        }
      );
    }

    const validatedData = validationResult.data;
    const { 
      apiKey, 
      pageUrl,
      pageTitle,
      sessionId, 
      clientId, 
      customData 
    } = validatedData;

    // Get URL from referer if not provided
    const referer = request.headers.get('referer') || '';
    const effectiveUrl = pageUrl || referer || '';

    // Validate API key and get website
    const website = await getWebsiteByApiKey(apiKey);
    if (!website) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid API key' 
        },
        { 
          status: 401,
          headers 
        }
      );
    }

    // Get request information
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || '';

    // Detect if this is a bot
    const botDetectionData = { userAgent, ip, referrer: referer };
    const detectedAsBot = isBot(botDetectionData);

    // Create the event
    const event = await createEvent({
      siteId: website._id,
      type: 'view',
      name: 'Page View',
      data: {
        pageUrl: effectiveUrl,
        pageTitle,
        customData,
      },
      ipAddress: ip,
      userAgent,
      referrer: referer,
      sessionId,
      clientId,
      isBot: detectedAsBot,
      eventTime: new Date(),
    });

    // Count concurrent viewers
    // This could be expanded in the future with Redis for real-time counters

    return NextResponse.json(
      { 
        success: true,
        eventId: event._id.toString()
      },
      { 
        status: 201, 
        headers 
      }
    );
  } catch (error) {
    console.error('Error tracking view event:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { 
        success: false, 
        error: apiError.message 
      },
      { 
        status: apiError.statusCode,
        headers 
      }
    );
  }
}

// Disable body parsing to increase performance
export const config = {
  api: {
    bodyParser: false,
  },
}; 