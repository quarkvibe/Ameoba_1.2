import type { Request, Response, NextFunction } from 'express';
import { integrationService } from '../services/integrationService';
import type { ApiKey } from '@shared/schema';

declare module 'express' {
  interface Request {
    apiKey?: ApiKey;
    integration?: {
      source: string;
      startTime: number;
    };
  }
}

/**
 * Middleware to authenticate API requests using API keys
 */
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key required. Use Authorization: Bearer <your-api-key>',
      });
    }
    
    const key = authHeader.substring(7); // Remove "Bearer " prefix
    const apiKey = await integrationService.validateApiKey(key);
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired API key',
      });
    }
    
    // Attach API key info to request
    req.apiKey = apiKey;
    req.integration = {
      source: apiKey.name,
      startTime,
    };
    
    next();
    
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
};

/**
 * Middleware to check specific permissions
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }
    
    if (!integrationService.hasPermission(req.apiKey, permission)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Permission '${permission}' required`,
      });
    }
    
    next();
  };
};

/**
 * Middleware to log API usage
 */
export const logApiUsage = (req: Request, res: Response, next: NextFunction) => {
  if (!req.integration) {
    return next();
  }
  
  const originalSend = res.send;
  
  res.send = function (body: any) {
    const responseTime = Date.now() - req.integration!.startTime;
    
    // Log the API usage asynchronously
    integrationService.logApiUsage(
      req.integration!.source,
      req.path,
      req.method,
      res.statusCode,
      responseTime,
      {
        query: req.query,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      }
    ).catch(error => {
      console.error('Failed to log API usage:', error);
    });
    
    return originalSend.call(this, body);
  };
  
  next();
};

/**
 * Rate limiting middleware for API endpoints
 */
export const rateLimitIntegration = (maxRequests: number = 100, windowMs: number = 60000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return next();
    }
    
    const key = req.apiKey.id;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean up old entries
    for (const [k, v] of requests.entries()) {
      if (v.resetTime < windowStart) {
        requests.delete(k);
      }
    }
    
    const usage = requests.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (usage.count >= maxRequests && usage.resetTime > now) {
      const resetIn = Math.ceil((usage.resetTime - now) / 1000);
      
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetIn.toString(),
      });
      
      return res.status(429).json({
        error: 'Rate Limit Exceeded',
        message: `Maximum ${maxRequests} requests per minute exceeded`,
        retryAfter: resetIn,
      });
    }
    
    // Update usage
    if (usage.resetTime <= now) {
      usage.count = 1;
      usage.resetTime = now + windowMs;
    } else {
      usage.count++;
    }
    
    requests.set(key, usage);
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, maxRequests - usage.count).toString(),
      'X-RateLimit-Reset': Math.ceil((usage.resetTime - now) / 1000).toString(),
    });
    
    next();
  };
};