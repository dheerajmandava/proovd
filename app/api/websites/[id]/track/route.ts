import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { event, notificationId, timestamp, metadata } = await request.json();
    const websiteId = params.id;

    const { db } = await connectToDatabase();

    // Validate the event type
    if (!['impression', 'click', 'conversion'].includes(event)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Create the analytics event
    const analyticsEvent = {
      websiteId: new ObjectId(websiteId),
      notificationId: notificationId ? new ObjectId(notificationId) : null,
      event,
      timestamp: new Date(timestamp),
      metadata: {
        ...metadata,
        url: metadata.url,
        referrer: metadata.referrer,
        userAgent: metadata.userAgent,
        sessionId: metadata.sessionId,
      },
    };

    // Insert the event
    await db.collection('analytics_events').insertOne(analyticsEvent);

    // Update aggregated metrics
    const updateQuery = {
      $inc: {
        [`metrics.${event}s`]: 1,
        ...(event === 'impression' && { 'metrics.totalImpressions': 1 }),
        ...(event === 'click' && { 'metrics.totalClicks': 1 }),
      },
      $set: {
        lastUpdated: new Date(),
      },
    };

    // Update website metrics
    await db.collection('websites').updateOne(
      { _id: new ObjectId(websiteId) },
      updateQuery
    );

    // If this is for a specific notification, update its metrics too
    if (notificationId) {
      await db.collection('notifications').updateOne(
        { _id: new ObjectId(notificationId) },
        updateQuery
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
} 