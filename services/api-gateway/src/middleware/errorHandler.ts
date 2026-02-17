import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  const correlationId = req.headers["x-correlation-id"] as string;

  console.error("Gateway Error:", {
    error: err.message,
    stack: err.stack,
    correlation_id: correlationId,
    path: req.path,
    method: req.method
  });

  const isDevelopment = process.env.NODE_ENV === "development";
  
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    correlation_id: correlationId,
    timestamp: new Date(),
    ...(isDevelopment && { stack: err.stack })
  });
};
