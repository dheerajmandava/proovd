import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Website from '@/app/lib/models/website';
import { sanitizeInput, extractDomain } from '@/app/lib/server-utils';
import { auth } from '@/auth';
import { VerificationMethod } from '@/app/lib/domain-verification';
import { initializeDomainVerification, verifyDomainWithDetails } from '@/app/lib/server-domain-verification';
import Notification from '@/app/lib/models/notification';
import mongoose from 'mongoose';
import { isValidObjectId } from 'mongoose';
import { getServerSession } from '@/auth';
import { authOptions } from '@/auth';
import { UserModel } from '@/app/lib/models/user';
import { WebsiteModel } from '@/app/lib/models/website';
import { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { getUserWebsiteLimit, handleApiError } from '@/app/lib/api-helpers';
import { Session } from 'next-auth';

/**
 * NOTE: MongoDB transactions require a replica set or mongos deployment.
 * For production deployment, ensure your MongoDB connection is to:
 * 1. MongoDB Atlas (recommended for production)
 * 2. A self-hosted MongoDB replica set
 * 3. A sharded MongoDB cluster
 * 
 * If using MongoDB locally, you must configure a replica set.
 * See: https://www.mongodb.com/docs/manual/tutorial/deploy-replica-set/
 */

// Corrected return type of createWebsiteWithRetry
interface WebsiteDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  domain: string;
  status: string;
  verification: any;
  createdAt: Date;
  save: Function;
}

/**
 * Helper function to create a website with transaction support
 * Will retry on write conflicts up to the specified number of retries
 */
async function createWebsiteWithRetry(
  websiteData: any,
  maxRetries = 3
): Promise<WebsiteDocument> {
  let attemptCount = 0;
  let lastError: any = null;
  
  while (attemptCount < maxRetries) {
    attemptCount++;
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();
      
      // Create new website with the provided data
      const website = new Website(websiteData);
      
      // Save the website within the transaction
      await website.save({ session });
      console.log(`Website added with ID: ${website._id} (Attempt ${attemptCount})`);
      
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      
      return website;
    } catch (error: any) {
      // Abort the transaction on error
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      
      // If it's a write conflict, retry
      if (error.code === 112 && error.codeName === 'WriteConflict') {
        console.log(`Write conflict encountered, retrying (${attemptCount}/${maxRetries})`);
        lastError = error;
        
        // Add a small delay before retrying to reduce contention
        await new Promise(resolve => setTimeout(resolve, 100 * attemptCount));
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  
  // If we've exhausted retries, throw the last error
  throw lastError || new Error('Failed to create website after maximum retries');
}

/**
 * POST /api/websites
 * Create a new website
 */
export async function POST(req: NextRequest) {
  console.log('Add website API called');
  
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      console.log('Authentication failed for website API');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log(`Auth session accessed: user ${session.user.id} (${session.user.email})`);
    
    // Parse request body
    const body = await req.json();
    const { name, domain, verificationMethod, verificationToken } = body;
    console.log('Request data:', body);
    
    // Basic validation
    if (!name || !domain) {
      return NextResponse.json({ error: 'Name and domain are required' }, { status: 400 });
    }
    
    // Normalize domain
    const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').trim().toLowerCase();
    console.log('Processed domain:', normalizedDomain);
    
    // Connect to database
    await connectToDatabase();
    
    // Check if domain already exists for this user
    const existingWebsite = await Website.findOne({
      userId: session.user.id,
      domain: normalizedDomain
    });
    
    if (existingWebsite) {
      return NextResponse.json({ error: 'You already have a website with this domain' }, { status: 400 });
    }
    
    // Initialize domain verification
    // If a verification token is provided, use it instead of generating a new one
    let verification;
    if (verificationToken) {
      // Use the existing token provided by the client
      verification = {
        status: 'pending',
        method: verificationMethod || 'DNS',
        token: verificationToken,
        attempts: 0
      };
      console.log('Using provided verification token:', verificationToken);
    } else {
      // Generate a new verification token
      verification = initializeDomainVerification(normalizedDomain);
    }
    
    console.log('Verification data:', verification);
    
    // First verify the domain before creating the website
    console.log('Verifying domain before creating website...');
    const verificationResult = await verifyDomainWithDetails(normalizedDomain, verification);
    
    if (!verificationResult.isVerified) {
      console.log('Domain verification failed:', verificationResult.reason);
      
      // Return the verification details so the user can complete verification
      return NextResponse.json({
        error: 'Domain verification required',
        details: verificationResult.reason,
        verification,
        token: verification.token,
      }, { status: 400 });
    }
    
    console.log('Domain verified successfully, creating website');
    
    // Create the website with status active and verification complete
    const websiteData = {
      name: name.trim(),
      domain: normalizedDomain,
      userId: session.user.id,
      status: 'active',
      verification: {
        ...verification,
        status: 'verified',
        verifiedAt: new Date().toISOString()
      },
      createdAt: new Date(),
      notifications: []
    };
    
    // Create new website with retry for transaction conflicts
    const website = await createWebsiteWithRetry(websiteData);
    
    console.log(`Website created with ID: ${website._id}`);
    
    return NextResponse.json({
      id: website._id,
      name: website.name,
      domain: website.domain,
      status: website.status
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating website:', error);
    return NextResponse.json({ 
      error: 'Failed to create website',
      details: error.message 
    }, { status: 500 });
  }
}

// Helper function to generate user-friendly verification instructions
function generateVerificationInstructions(domain: string, method: string, token: string): string {
  let instructions = '';
  
  if (method === 'DNS') {
    instructions = `
Create a DNS TXT record with the following values:
Host/Name: _proovd.${domain}
Value/Content: ${token}

This may take up to 24 hours to propagate, though it often happens within minutes.
`;
  } else if (method === 'FILE') {
    instructions = `
Create a file at the following URL:
https://${domain}/.well-known/proovd-verification.txt

The file should contain the following text (and nothing else):
${token}
`;
  } else if (method === 'META') {
    instructions = `
Add the following meta tag to the <head> section of your website's homepage:
<meta name="proovd-verification" content="${token}">
`;
  }
  
  return instructions;
}

/**
 * GET /api/websites
 * 
 * Fetches all websites for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      console.log('API authentication failed for websites route');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Get all websites for this user
    const websites = await Website.find({ userId: session.user.id })
      .sort({ createdAt: -1 });
    
    // Format response
    const formattedWebsites = websites.map(website => ({
      id: website._id.toString(),
      name: website.name,
      domain: website.domain,
      status: website.status,
      verification: website.verification,
      createdAt: website.createdAt,
      verifiedAt: website.verifiedAt,
      analytics: {
        totalImpressions: website.analytics?.totalImpressions || 0,
        totalClicks: website.analytics?.totalClicks || 0,
        conversionRate: website.analytics?.conversionRate || 0
      }
    }));
    
    return NextResponse.json({ websites: formattedWebsites });
    
  } catch (error) {
    console.error('Error fetching websites:', error);
    
    // More specific error handling
    if (error instanceof mongoose.Error.MongooseServerSelectionError) {
      return NextResponse.json(
        { error: 'Database connection error', details: 'Please try again later' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch websites', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Helper function to delete a website with transaction support
 * Will retry on write conflicts up to the specified number of retries
 */
async function deleteWebsiteWithRetry(
  websiteId: string,
  maxRetries = 3
): Promise<boolean> {
  let attemptCount = 0;
  let lastError: any = null;
  
  while (attemptCount < maxRetries) {
    attemptCount++;
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();
      
      // Delete the website
      const result = await Website.deleteOne(
        { _id: websiteId },
        { session }
      );
      
      // Make sure it was deleted
      if (result.deletedCount !== 1) {
        throw new Error('Website not found or already deleted');
      }
      
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      
      console.log(`Website deleted successfully (Attempt ${attemptCount})`);
      return true;
    } catch (error: any) {
      // Abort the transaction on error
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      
      // If it's a write conflict, retry
      if (error.code === 112 && error.codeName === 'WriteConflict') {
        console.log(`Write conflict encountered during delete, retrying (${attemptCount}/${maxRetries})`);
        lastError = error;
        
        // Add a small delay before retrying to reduce contention
        await new Promise(resolve => setTimeout(resolve, 100 * attemptCount));
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  
  // If we've exhausted retries, throw the last error
  throw lastError || new Error('Failed to delete website after maximum retries');
}

/**
 * DELETE /api/websites
 * 
 * Removes a website by ID, ensuring the current user owns it
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the website ID from the search params
    const url = new URL(request.url);
    const websiteId = url.searchParams.get('id');
    
    if (!websiteId) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { status: 400 }
      );
    }
    
    if (!isValidObjectId(websiteId)) {
      return NextResponse.json(
        { error: 'Invalid website ID' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Check website ownership
    const website = await Website.findOne({
      _id: websiteId,
      userId: session.user.id
    });
    
    if (!website) {
      return NextResponse.json(
        { error: 'Website not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }
    
    // Delete the website with retry logic
    await deleteWebsiteWithRetry(websiteId);
    
    return NextResponse.json({ 
      success: true,
      message: 'Website deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting website:', error);
    
    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json(
        { error: 'Invalid website ID format' },
        { status: 400 }
      );
    }
    
    // Handle transaction not supported error
    if (error.codeName === 'IllegalOperation' && error.code === 20) {
      return NextResponse.json({
        error: 'Database configuration error',
        details: 'MongoDB transactions require a replica set deployment for production use. Please update your MongoDB configuration.'
      }, { status: 500 });
    }
    
    // Handle write conflict errors
    if (error.codeName === 'WriteConflict' && error.code === 112) {
      return NextResponse.json({
        error: 'Database write conflict',
        details: 'Database encountered a conflict when deleting. Please try again.'
      }, { status: 500 });
    }
    
    return NextResponse.json(
      { error: 'Failed to delete website', details: error.message },
      { status: 500 }
    );
  }
} 