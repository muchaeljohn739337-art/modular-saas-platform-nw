import { Router } from "express";
import { Request, Response } from "express";

const router = Router();

// Get application metrics
router.get("/", (req: Request, res: Response) => {
  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || "2.0.0",
    environment: process.env.NODE_ENV || "development",
    service: "advancia-payledger-backend",
  });
});

// Get health status with metrics
router.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  });
});

export default router;
