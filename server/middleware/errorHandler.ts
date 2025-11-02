import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Custom API Error class with status codes
 */
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async route handler wrapper
 * Automatically catches errors and passes to error handler
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Centralized error handler middleware
 * Must be registered AFTER all routes
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  console.error('Error occurred:', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Handle API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Handle database errors
  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      error: 'Conflict',
      message: 'A record with this value already exists',
    });
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({
      error: 'Invalid Reference',
      message: 'Referenced record does not exist',
    });
  }

  // Default server error
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : message,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err,
    }),
  });
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
}

/**
 * Validation helper - validates and extracts userId
 */
export function getUserId(req: any): string {
  const userId = req.user?.claims?.sub;
  
  if (!userId) {
    throw new ApiError('User ID not found in session', 401);
  }
  
  return userId;
}

/**
 * Common error creators
 */
export const Errors = {
  BadRequest: (message: string) => new ApiError(message, 400),
  Unauthorized: (message = 'Unauthorized') => new ApiError(message, 401),
  Forbidden: (message = 'Forbidden') => new ApiError(message, 403),
  NotFound: (message: string) => new ApiError(message, 404),
  Conflict: (message: string) => new ApiError(message, 409),
  TooManyRequests: (message = 'Too many requests') => new ApiError(message, 429),
  InternalError: (message = 'Internal server error') => new ApiError(message, 500),
};



