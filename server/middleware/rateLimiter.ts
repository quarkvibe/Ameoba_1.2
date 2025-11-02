import { Request, Response, NextFunction } from 'express';
import { activityMonitor } from '../services/activityMonitor';

/**
 * Rate Limiter Middleware
 * Simple, in-memory rate limiter following the Simplicity Doctrine
 * 
 * For production: use Redis-backed rate limiter (express-rate-limit + Redis)
 * For now: lightweight, memory-based rate limiting
 */

interface RateLimitConfig {
  windowMs: number;     // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  message?: string;     // Custom error message
  keyGenerator?: (req: Request) => string; // Custom key generator
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup() {
    const now = Date.now();
    const entriesToDelete: string[] = [];
    
    this.store.forEach((entry, key) => {
      if (entry.resetAt < now) {
        entriesToDelete.push(key);
      }
    });
    
    entriesToDelete.forEach(key => this.store.delete(key));
  }

  /**
   * Create rate limiting middleware
   */
  create(config: RateLimitConfig) {
    const {
      windowMs,
      maxRequests,
      message = 'Too many requests, please try again later',
      keyGenerator = (req: Request) => {
        // Default: use IP address + userId if authenticated
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const userId = (req as any).user?.claims?.sub || 'anonymous';
        return `${ip}:${userId}`;
      },
    } = config;

    return (req: Request, res: Response, next: NextFunction) => {
      const key = keyGenerator(req);
      const now = Date.now();
      
      let entry = this.store.get(key);
      
      if (!entry || entry.resetAt < now) {
        // Create new entry or reset expired entry
        entry = {
          count: 1,
          resetAt: now + windowMs,
        };
        this.store.set(key, entry);
        return next();
      }
      
      // Increment count
      entry.count++;
      
      if (entry.count > maxRequests) {
        const resetIn = Math.ceil((entry.resetAt - now) / 1000);
        
        activityMonitor.logActivity(
          'warning',
          `⚠️  Rate limit exceeded for ${key.split(':')[1]} (${entry.count}/${maxRequests})`
        );
        
        return res.status(429).json({
          message,
          retryAfter: resetIn,
          limit: maxRequests,
          current: entry.count,
        });
      }
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - entry.count).toString());
      res.setHeader('X-RateLimit-Reset', new Date(entry.resetAt).toISOString());
      
      next();
    };
  }

  /**
   * Stop cleanup interval (for graceful shutdown)
   */
  stop() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Predefined rate limit configurations
 */

// Strict rate limit for expensive operations (5 requests per minute)
export const strictRateLimit = rateLimiter.create({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  message: 'Too many requests to this endpoint. Please try again in a minute.',
});

// Standard rate limit for authenticated APIs (60 requests per minute)
export const standardRateLimit = rateLimiter.create({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
});

// Generous rate limit for reads (120 requests per minute)
export const generousRateLimit = rateLimiter.create({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 120,
});

// Public endpoint rate limit (30 requests per minute per IP)
export const publicRateLimit = rateLimiter.create({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
  keyGenerator: (req: Request) => {
    // Only use IP for public endpoints
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

// AI generation rate limit (10 generations per minute)
export const aiGenerationRateLimit = rateLimiter.create({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'AI generation rate limit reached. Please wait before generating more content.',
});

