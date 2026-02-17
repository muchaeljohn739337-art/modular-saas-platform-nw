import pino from "pino";
import { Request, Response, NextFunction } from "express";

const logger = pino({ name: "api-gateway" });

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      correlation_id: req.headers["x-correlation-id"],
      user_agent: req.headers["user-agent"],
      ip: req.ip
    }, "request_completed");
  });

  logger.info({
    method: req.method,
    path: req.path,
    correlation_id: req.headers["x-correlation-id"]
  }, "request_started");

  next();
};
