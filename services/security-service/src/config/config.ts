import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 4009,
  db: {
    url: process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/advancia_security"
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379"
  },
  jwt: {
    secret: process.env.JWT_SECRET || "your-security-jwt-secret",
    expiry: process.env.JWT_EXPIRY || "24h"
  },
  mfa: {
    issuer: process.env.MFA_ISSUER || "Advancia PayLedger",
    window: parseInt(process.env.MFA_WINDOW || "1")
  },
  rateLimit: {
    global: {
      points: parseInt(process.env.RATE_LIMIT_GLOBAL_POINTS || "100"),
      duration: parseInt(process.env.RATE_LIMIT_GLOBAL_DURATION || "60")
    },
    auth: {
      points: parseInt(process.env.RATE_LIMIT_AUTH_POINTS || "5"),
      duration: parseInt(process.env.RATE_LIMIT_AUTH_DURATION || "900")
    },
    sensitive: {
      points: parseInt(process.env.RATE_LIMIT_SENSITIVE_POINTS || "3"),
      duration: parseInt(process.env.RATE_LIMIT_SENSITIVE_DURATION || "3600")
    }
  },
  waf: {
    enabled: process.env.WAF_ENABLED === "true",
    maxPayloadSize: parseInt(process.env.WAF_MAX_PAYLOAD_SIZE || "1048576"),
    blockedPatterns: [
      /union\s+select/i,
      /<script[^>]*>.*?<\/script>/gi,
      /\.\.\//g,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /exec\s*\(/gi,
      /system\s*\(/gi
    ]
  },
  audit: {
    retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || "365"),
    batchSize: parseInt(process.env.AUDIT_BATCH_SIZE || "100"),
    flushInterval: parseInt(process.env.AUDIT_FLUSH_INTERVAL || "5000")
  },
  security: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || "5"),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || "900000"),
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || "8"),
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || "3600000")
  },
  serviceName: "security-service"
};
