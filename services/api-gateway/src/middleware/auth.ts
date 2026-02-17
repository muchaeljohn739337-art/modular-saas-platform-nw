import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/config";

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Access token required",
      correlation_id: req.headers["x-correlation-id"]
    });
  }

  jwt.verify(token, config.jwt.accessSecret, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({
        error: "Invalid or expired token",
        correlation_id: req.headers["x-correlation-id"]
      });
    }

    (req as any).user = decoded;
    (req as any).user_id = decoded.user_id;
    (req as any).tenant_id = decoded.tenant_id;
    (req as any).roles = decoded.roles;
    next();
  });
};
