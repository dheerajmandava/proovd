'use client';

/**
 * Custom error class with status code for HTTP responses
 */
export class CustomError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
  }
}

/**
 * Helper function to create a 400 Bad Request error
 */
export function createBadRequestError(message = 'Bad Request') {
  return new CustomError(message, 400);
}

/**
 * Helper function to create a 401 Unauthorized error
 */
export function createUnauthorizedError(message = 'Unauthorized') {
  return new CustomError(message, 401);
}

/**
 * Helper function to create a 403 Forbidden error
 */
export function createForbiddenError(message = 'Forbidden') {
  return new CustomError(message, 403);
}

/**
 * Helper function to create a 404 Not Found error
 */
export function createNotFoundError(message = 'Not Found') {
  return new CustomError(message, 404);
}

/**
 * Helper function to create a 500 Internal Server Error
 */
export function createServerError(message = 'Internal Server Error') {
  return new CustomError(message, 500);
}

/**
 * Helper function to handle errors in API routes
 */
export function handleApiError(error: unknown): CustomError {
  if (error instanceof CustomError) {
    return error;
  }
  
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  return createServerError(message);
} 