import { RateLimiterMemory } from "rate-limiter-flexible";
import { config } from "../config/config";

export class RateLimitService {
  private limiters = new Map();

  constructor() {
    this.initializeDefaultLimiters();
  }

  private initializeDefaultLimiters(): void {
    this.limiters.set("global", new RateLimiterMemory({
      keyPrefix: "global_rl",
      points: config.rateLimit.global.points,
      duration: config.rateLimit.global.duration
    }));

    this.limiters.set("auth", new RateLimiterMemory({
      keyPrefix: "auth_rl",
      points: config.rateLimit.auth.points,
      duration: config.rateLimit.auth.duration
    }));
  }

  async checkRateLimit(key: string, type = "global") {
    const limiter = this.limiters.get(type);
    if (!limiter) {
      throw new Error(`Rate limiter type not found`);
    }

    try {
      const result = await limiter.consume(key);
      return {
        allowed: true,
        remaining: result.remainingPoints,
        resetTime: new Date(Date.now() + result.msBeforeNext)
      };
    } catch (rejRes) {
      return {
        allowed: false,
        resetTime: new Date(Date.now() + rejRes.msBeforeNext)
      };
    }
  }

  async checkIPRateLimit(ip: string) {
    return this.checkRateLimit(`ip:${ip}`, "global");
  }

  async checkUserRateLimit(userId: string) {
    return this.checkRateLimit(`user:${userId}`, "global");
  }

  async checkAuthRateLimit(identifier: string) {
    return this.checkRateLimit(`auth:${identifier}`, "auth");
  }
}

export const rateLimitService = new RateLimitService();
