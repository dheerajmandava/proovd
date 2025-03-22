import mongoose from 'mongoose';

/**
 * Get the number of websites allowed for a given plan
 * @param plan The plan level
 * @returns The number of websites allowed
 */
export function getUserWebsiteLimit(plan: string): number {
  switch (plan) {
    case 'free':
      return 1;
    case 'starter':
      return 3;
    case 'growth':
    case 'professional':
      return 10;
    case 'business':
    case 'enterprise':
      return 25;
    default:
      return 1; // Default to free plan
  }
}

/**
 * Handle common API errors with appropriate responses
 * @param error The error object
 * @returns A formatted NextResponse with error details
 */
export function handleApiError(error: any) {
  console.error('API error:', error);
  
  // Validation errors
  if (error instanceof mongoose.Error.ValidationError) {
    return Response.json({ 
      error: 'Invalid data',
      details: error.message
    }, { status: 400 });
  }
  
  // Database connection errors
  if (error instanceof mongoose.Error.MongooseServerSelectionError) {
    return Response.json({ 
      error: 'Database connection error',
      details: 'Could not connect to the database. Please try again later.'
    }, { status: 503 });
  }

  // Transaction not supported error
  if (error.codeName === 'IllegalOperation' && error.code === 20) {
    return Response.json({
      error: 'Database configuration error',
      details: 'MongoDB transactions require a replica set deployment.'
    }, { status: 500 });
  }
  
  // Write conflict errors
  if (error.codeName === 'WriteConflict' && error.code === 112) {
    return Response.json({
      error: 'Database write conflict',
      details: 'Database encountered a conflict when saving. Please try again.'
    }, { status: 500 });
  }
  
  // Generic error
  return Response.json({ 
    error: 'An error occurred',
    details: error.message || 'Unknown error'
  }, { status: 500 });
} 