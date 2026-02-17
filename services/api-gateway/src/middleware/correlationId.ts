import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export const correlationId = (req: Request, res: Response, next: NextFunction) => {
  const existingId = req.headers["x-correlation-id"] as string;
  const correlationId = existingId || uuidv4();
  
  req.headers["x-correlation-id"] = correlationId;
  res.set("x-correlation-id", correlationId);
  
  next();
};
