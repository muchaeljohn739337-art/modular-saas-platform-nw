import pino from "pino";
import { Request, Response, NextFunction } from "express";

const logger = pino({ name: "ai-orchestrator" });

export const requestLogger = (req: Request, _res: Response, next: NextFunction) => {
  logger.info({
    method: req.method,
    path: req.path,
    correlation_id: req.headers["x-correlation-id"]
  }, "incoming_request");
  next();
};
