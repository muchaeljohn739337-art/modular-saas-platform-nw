import { Request, Response, NextFunction } from "express";

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Missing Authorization header" });

  const token = header.replace("Bearer ", "");

  try {
    // TODO: Verify JWT token with auth service
    // const payload = verifyAccessToken(token);
    (req as any).user = { userId: "temp-user", role: "admin" };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};
