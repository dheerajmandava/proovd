import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getWebsiteById } from '@/app/lib/services/website.service';
import { connectToDatabase } from '@/app/lib/database/connection';
import { CustomError } from '@/app/lib/utils/error';

/**
 * GET /api/websites/[id]/stats
 * Retrieves website analytics statistics
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await auth();

    // Check authentication
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Access params from context to ensure it's properly resolved
    const { id } = (await context.params);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { status: 400 }
      );
    }

    // Get website and verify ownership
    const website = await getWebsiteById(id);
    
    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Extract analytics data or provide defaults
    const totalImpressions = website.analytics?.totalImpressions || 0;
    const totalClicks = website.analytics?.totalClicks || 0;
    
    // Calculate conversion rate
    const conversionRate = totalImpressions > 0 
      ? (totalClicks / totalImpressions) * 100 
      : 0;

    return NextResponse.json({
      totalImpressions,
      totalClicks,
      conversionRate,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching website stats:', error);
    
    if (error instanceof CustomError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch website statistics' },
      { status: 500 }
    );
  }
} 