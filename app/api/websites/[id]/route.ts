import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import Notification from '@/app/lib/models/notification';
import Metric from '@/app/lib/models/metric';
import { sanitizeInput, isValidObjectId, generateApiKey } from '@/app/lib/server-utils';
import { auth } from '@/auth';

/**
 * GET /api/websites/[id]
 * 
 * Fetch a single website by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid website ID' },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Get the website
    const website = await Website.findOne({
      _id: id,
      userId: session.user.id
    });

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Return the website
    return NextResponse.json(website.toResponse());
  } catch (error) {
    console.error('Error fetching website:', error);
    return NextResponse.json(
      { error: 'Failed to fetch website' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/websites/[id]
 * 
 * Update a website
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid website ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Connect to the database
    await connectToDatabase();

    // Get the website
    const website = await Website.findOne({
      _id: id,
      userId: session.user.id
    });

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Update fields that are allowed to be updated
    const updatableFields = [
      'name',
      'domain',
      'status',
      'settings',
      'allowedDomains'
    ];

    // Apply updates to allowed fields
    updatableFields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'name' || field === 'domain') {
          // Sanitize string inputs
          website[field] = sanitizeInput(body[field]);
        } else {
          website[field] = body[field];
        }
      }
    });

    // Save the updated website
    await website.save();

    // Return the updated website
    return NextResponse.json(website.toResponse());
  } catch (error) {
    console.error('Error updating website:', error);
    return NextResponse.json(
      { error: 'Failed to update website' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/websites/[id]
 * 
 * Delete a website and all its associated data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid website ID' },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Get the website
    const website = await Website.findOne({
      _id: id,
      userId: session.user.id
    });

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Delete all associated notifications
    await Notification.deleteMany({ siteId: id });

    // Delete all associated metrics
    await Metric.deleteMany({ siteId: id });

    // Delete the website
    await Website.deleteOne({ _id: id });

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting website:', error);
    return NextResponse.json(
      { error: 'Failed to delete website' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/websites/[id]/regenerate-api-key
 * 
 * Regenerate API key for a website
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check if this is a regenerate API key request
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'regenerate-api-key') {
    try {
      // Get the current user
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const { id } = params;

      // Validate ObjectId
      if (!isValidObjectId(id)) {
        return NextResponse.json(
          { error: 'Invalid website ID' },
          { status: 400 }
        );
      }

      // Connect to the database
      await connectToDatabase();

      // Get the website
      const website = await Website.findOne({
        _id: id,
        userId: session.user.id
      });

      if (!website) {
        return NextResponse.json(
          { error: 'Website not found' },
          { status: 404 }
        );
      }

      // Generate new API key
      website.apiKey = generateApiKey();

      // Save the updated website
      await website.save();

      // Return the updated website
      return NextResponse.json({
        apiKey: website.apiKey
      });
    } catch (error) {
      console.error('Error regenerating API key:', error);
      return NextResponse.json(
        { error: 'Failed to regenerate API key' },
        { status: 500 }
      );
    }
  }

  // If it's not a recognized action, return 404
  return NextResponse.json(
    { error: 'Endpoint not found' },
    { status: 404 }
  );
} 