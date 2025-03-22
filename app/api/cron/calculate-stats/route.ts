import { NextResponse } from 'next/server';
import { runAllAnalytics } from '@/app/lib/analytics-worker';

/**
 * API Handler for scheduled statistics calculation
 * This endpoint is meant to be called by a cron job or scheduler
 * to regularly update cached statistics.
 */
export async function GET(request: Request) {
  // Check for a secret token to secure the endpoint
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  // Verify the token - in production, use a strong env variable
  const validToken = process.env.CRON_SECRET_TOKEN || 'REPLACE_WITH_SECURE_TOKEN';
  
  if (token !== validToken) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401 }
    );
  }
  
  try {
    // Run the background analytics processes
    const result = await runAllAnalytics();
    
    // Return success response
    return new NextResponse(
      JSON.stringify({ success: true, message: 'Analytics processing completed successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in analytics job:', error);
    
    // Return error response
    return new NextResponse(
      JSON.stringify({ error: 'Failed to run analytics job' }),
      { status: 500 }
    );
  }
}

/**
 * This endpoint is designed to be called by a cron job
 * Example cron schedule:
 * 
 * For hourly updates:
 * 0 * * * * curl https://example.com/api/cron/calculate-stats?token=REPLACE_WITH_SECURE_TOKEN
 * 
 * For daily updates:
 * 0 0 * * * curl https://example.com/api/cron/calculate-stats?token=REPLACE_WITH_SECURE_TOKEN
 */ 