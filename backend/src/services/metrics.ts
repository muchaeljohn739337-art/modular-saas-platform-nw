import { Request, Response, NextFunction } from "express";

// Simple metrics collection middleware
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();

  // Record request start time
  res.locals.startTime = start;

  // Override res.end to log response time
  const originalEnd = res.end;
  res.end = function (this: Response, ...args: any[]): Response {
    const duration = Date.now() - start;

    // Log metrics (in production, you'd send to a metrics service)
    if (process.env.NODE_ENV === "production") {
      console.log(
        `METRIC: ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`,
      );
    }

    return originalEnd.apply(this, args as any);
  };

  next();
};
