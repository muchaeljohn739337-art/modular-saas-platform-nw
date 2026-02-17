import { Request, Response, NextFunction } from 'express';
import { Redis } from 'ioredis';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  message?: string;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export class RateLimitService {
  constructor(private redis: Redis) {}

  createRateLimit(config: RateLimitConfig) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const key = config.keyGenerator ? config.keyGenerator(req) : this.generateKey(req);
        const window = Math.ceil(config.windowMs / 1000); // Convert to seconds

        // Use sliding window algorithm
        const now = Math.floor(Date.now() / 1000);
        const pipeline = this.redis.pipeline();

        // Remove old entries
        pipeline.zremrangebyscore(key, 0, now - window);

        // Add current request
        pipeline.zadd(key, now, `${now}-${Math.random()}`);

        // Count requests in window
        pipeline.zcard(key);

        // Set expiration
        pipeline.expire(key, window);

        const results = await pipeline.exec();
        const requestCount = results?.[2]?.[1] as number || 0;

        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': config.max,
          'X-RateLimit-Remaining': Math.max(0, config.max - requestCount),
          'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString()
        });

        if (requestCount > config.max) {
          const message = config.message || 'Too many requests, please try again later';
          
          // Log rate limit violation
          logger.warn('Rate limit exceeded', {
            key,
            requestCount,
            limit: config.max,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });

          ApiResponse.tooManyRequests(res, message);
          return;
        }

        next();
      } catch (error) {
        logger.error('Rate limiting error:', error);
        // Fail open - allow request if rate limiting fails
        next();
      }
    };
  }

  private generateKey(req: Request): string {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const path = req.path;
    return `rate_limit:${ip}:${path}`;
  }

  // Tenant-specific rate limiting
  createTenantRateLimit(config: RateLimitConfig) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const tenantId = (req as any).tenantId;
        if (!tenantId) {
          // Fall back to IP-based limiting
          return this.createRateLimit(config)(req, res, next);
        }

        const key = `rate_limit:tenant:${tenantId}:${req.path}`;
        const window = Math.ceil(config.windowMs / 1000);
        const now = Math.floor(Date.now() / 1000);

        const pipeline = this.redis.pipeline();
        pipeline.zremrangebyscore(key, 0, now - window);
        pipeline.zadd(key, now, `${now}-${Math.random()}`);
        pipeline.zcard(key);
        pipeline.expire(key, window);

        const results = await pipeline.exec();
        const requestCount = results?.[2]?.[1] as number || 0;

        res.set({
          'X-RateLimit-Limit': config.max,
          'X-RateLimit-Remaining': Math.max(0, config.max - requestCount),
          'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString()
        });

        if (requestCount > config.max) {
          logger.warn('Tenant rate limit exceeded', {
            tenantId,
            requestCount,
            limit: config.max,
            path: req.path
          });

          ApiResponse.tooManyRequests(res, config.message || 'Tenant rate limit exceeded');
          return;
        }

        next();
      } catch (error) {
        logger.error('Tenant rate limiting error:', error);
        next();
      }
    };
  }

  // User-specific rate limiting
  createUserRateLimit(config: RateLimitConfig) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = (req as any).user?.userId;
        if (!userId) {
          return this.createRateLimit(config)(req, res, next);
        }

        const key = `rate_limit:user:${userId}:${req.path}`;
        const window = Math.ceil(config.windowMs / 1000);
        const now = Math.floor(Date.now() / 1000);

        const pipeline = this.redis.pipeline();
        pipeline.zremrangebyscore(key, 0, now - window);
        pipeline.zadd(key, now, `${now}-${Math.random()}`);
        pipeline.zcard(key);
        pipeline.expire(key, window);

        const results = await pipeline.exec();
        const requestCount = results?.[2]?.[1] as number || 0;

        res.set({
          'X-RateLimit-Limit': config.max,
          'X-RateLimit-Remaining': Math.max(0, config.max - requestCount),
          'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString()
        });

        if (requestCount > config.max) {
          logger.warn('User rate limit exceeded', {
            userId,
            requestCount,
            limit: config.max,
            path: req.path
          });

          ApiResponse.tooManyRequests(res, config.message || 'User rate limit exceeded');
          return;
        }

        next();
      } catch (error) {
        logger.error('User rate limiting error:', error);
        next();
      }
    };
  }

  // Global rate limiting (across all users)
  createGlobalRateLimit(config: RateLimitConfig) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const key = `rate_limit:global:${req.path}`;
        const window = Math.ceil(config.windowMs / 1000);
        const now = Math.floor(Date.now() / 1000);

        const pipeline = this.redis.pipeline();
        pipeline.zremrangebyscore(key, 0, now - window);
        pipeline.zadd(key, now, `${now}-${Math.random()}`);
        pipeline.zcard(key);
        pipeline.expire(key, window);

        const results = await pipeline.exec();
        const requestCount = results?.[2]?.[1] as number || 0;

        res.set({
          'X-RateLimit-Limit': config.max,
          'X-RateLimit-Remaining': Math.max(0, config.max - requestCount),
          'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString()
        });

        if (requestCount > config.max) {
          logger.warn('Global rate limit exceeded', {
            requestCount,
            limit: config.max,
            path: req.path
          });

          ApiResponse.tooManyRequests(res, config.message || 'Global rate limit exceeded');
          return;
        }

        next();
      } catch (error) {
        logger.error('Global rate limiting error:', error);
        next();
      }
    };
  }

  // Get current rate limit status
  async getRateLimitStatus(key: string, windowMs: number): Promise<{
    current: number;
    max: number;
    resetTime: Date;
  }> {
    try {
      const window = Math.ceil(windowMs / 1000);
      const now = Math.floor(Date.now() / 1000);

      const pipeline = this.redis.pipeline();
      pipeline.zremrangebyscore(key, 0, now - window);
      pipeline.zcard(key);

      const results = await pipeline.exec();
      const current = results?.[1]?.[1] as number || 0;

      return {
        current,
        max: 0, // Would need to be stored separately
        resetTime: new Date(now * 1000 + windowMs)
      };
    } catch (error) {
      logger.error('Get rate limit status error:', error);
      return {
        current: 0,
        max: 0,
        resetTime: new Date()
      };
    }
  }

  // Reset rate limit for a specific key
  async resetRateLimit(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      logger.info('Rate limit reset', { key });
    } catch (error) {
      logger.error('Reset rate limit error:', error);
    }
  }
}

// Pre-configured rate limiters
export const createRateLimiters = (redis: Redis) => {
  const rateLimitService = new RateLimitService(redis);

  return {
    // API endpoints
    auth: rateLimitService.createRateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per 15 minutes
      message: 'Too many authentication attempts, please try again later'
    }),

    // General API
    api: rateLimitService.createRateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 100, // 100 requests per minute
      message: 'API rate limit exceeded'
    }),

    // File uploads
    upload: rateLimitService.createRateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 10, // 10 uploads per minute
      message: 'Upload rate limit exceeded'
    }),

    // Data export
    export: rateLimitService.createRateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // 5 exports per hour
      message: 'Export rate limit exceeded'
    }),

    // Tenant-specific
    tenantApi: rateLimitService.createTenantRateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 1000, // 1000 requests per minute per tenant
      message: 'Tenant API rate limit exceeded'
    }),

    // User-specific
    userApi: rateLimitService.createUserRateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 200, // 200 requests per minute per user
      message: 'User API rate limit exceeded'
    })
  };
};
