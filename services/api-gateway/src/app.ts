import express from "express";
import { json } from "body-parser";
import helmet from "helmet";
import cors from "cors";
import { gatewayRouter } from "./routes/gateway.routes";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import { correlationId } from "./middleware/correlationId";
import { config } from "./config/config";

export const createApp = () => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors(config.cors));

  // Request parsing
  app.use(json({ limit: "10mb" }));

  // Request correlation and logging
  app.use(correlationId);
  app.use(requestLogger);

  // Main gateway routes
  app.use("/api/v1", gatewayRouter);

  // Root health check
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "api-gateway",
      timestamp: new Date(),
      uptime: process.uptime()
    });
  });

  // Root API info
  app.get("/", (_req, res) => {
    res.json({
      name: "Advancia PayLedger API Gateway",
      version: "1.0.0",
      status: "active",
      services: {
        auth: "/api/v1/auth",
        tenant: "/api/v1/tenant",
        billing: "/api/v1/billing",
        web3: "/api/v1/web3",
        ai: "/api/v1/ai",
        monitoring: "/api/v1/monitoring"
      },
      documentation: "/api/v1/docs"
    });
  });

  // Error handling
  app.use(errorHandler);

  return app;
};
