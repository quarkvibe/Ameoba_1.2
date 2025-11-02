import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { activityMonitor } from '../services/activityMonitor';

/**
 * Validation Middleware Factory
 * Creates Express middleware for validating request body against Zod schema
 * 
 * Following the Simplicity Doctrine:
 * - One function, one purpose
 * - Clear error messages
 * - Minimal overhead
 */

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        activityMonitor.logActivity('warning', `❌ Validation failed: ${JSON.stringify(formattedErrors)}`);
        
        return res.status(400).json({
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }
      
      next(error);
    }
  };
}

/**
 * Validate query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({
          message: 'Invalid query parameters',
          errors: formattedErrors,
        });
      }
      
      next(error);
    }
  };
}

/**
 * Validate route parameters
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({
          message: 'Invalid route parameters',
          errors: formattedErrors,
        });
      }
      
      next(error);
    }
  };
}




