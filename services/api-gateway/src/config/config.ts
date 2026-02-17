import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  db: {
    url: process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/advancia_gateway"
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379"
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "your-access-secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "your-refresh-secret",
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d"
  },
  services: {
    auth: {
      url: process.env.AUTH_SERVICE_URL || "http://localhost:4001",
      timeout: parseInt(process.env.AUTH_SERVICE_TIMEOUT || "5000")
    },
    tenant: {
      url: process.env.TENANT_SERVICE_URL || "http://localhost:4002",
      timeout: parseInt(process.env.TENANT_SERVICE_TIMEOUT || "5000")
    },
    billing: {
      url: process.env.BILLING_SERVICE_URL || "http://localhost:4003",
      timeout: parseInt(process.env.BILLING_SERVICE_TIMEOUT || "5000")
    },
    web3: {
      url: process.env.WEB3_SERVICE_URL || "http://localhost:4004",
      timeout: parseInt(process.env.WEB3_SERVICE_TIMEOUT || "10000")
    },
    ai: {
      url: process.env.AI_SERVICE_URL || "http://localhost:4005",
      timeout: parseInt(process.env.AI_SERVICE_TIMEOUT || "30000")
    },
    monitoring: {
      url: process.env.MONITORING_SERVICE_URL || "http://localhost:4006",
      timeout: parseInt(process.env.MONITORING_SERVICE_TIMEOUT || "5000")
    }
  },
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "900000"), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
    message: process.env.RATE_LIMIT_MESSAGE || "Too many requests"
  },
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true
  },
  serviceName: "api-gateway"
};
