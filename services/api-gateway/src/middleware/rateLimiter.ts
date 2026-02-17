import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { config } from "../config/config";

const limiters = new Map();

export const rateLimiter = (service: string) => {
  if (!limiters.has(service)) {
    const limiter = rateLimit({
      windowMs: config.rateLimiting.windowMs,
      max: config.rateLimiting.max,
      message: {
        error: config.rateLimiting.message,
        service,
        correlation_id: "unknown"
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        res.status(429).json({
          error: config.rateLimiting.message,
          service,
          correlation_id: req.headers["x-correlation-id"]
        });
      }
    });
    limiters.set(service, limiter);
  }
  
  return limiters.get(service);
};
