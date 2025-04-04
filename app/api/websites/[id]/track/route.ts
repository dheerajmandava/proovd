import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const websiteId = params.id;
    const body = await request.json();
    const { event, notificationId, timestamp = new Date().toISOString() } = body;

    if (!['impression', 'click'].includes(event)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Record the event
    await db.collection('analytics_events').insertOne({
      websiteId: new ObjectId(websiteId),
      notificationId: new ObjectId(notificationId),
      event,
      timestamp: new Date(timestamp),
      metadata: body.metadata || {}
    });

    // Update aggregated metrics
    const updateField = event === 'impression' ? 'impressions' : 'clicks';
    await db.collection('notifications').updateOne(
      { _id: new ObjectId(notificationId) },
      { 
        $inc: { 
          [`metrics.${updateField}`]: 1,
          ...(event === 'impression' ? { 'metrics.uniqueImpressions': 1 } : {})
        } 
      }
    );

    // Update website analytics
    await db.collection('websites').updateOne(
      { _id: new ObjectId(websiteId) },
      {
        $inc: {
          [`analytics.total${event === 'impression' ? 'Impressions' : 'Clicks'}`]: 1
        }
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking event:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
} 