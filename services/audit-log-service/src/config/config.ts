import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 4010,
  db: {
    url: process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/advancia_audit"
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379"
  },
  jwt: {
    secret: process.env.JWT_SECRET || "your-audit-jwt-secret",
    expiry: process.env.JWT_EXPIRY || "24h"
  },
  audit: {
    retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || "2555"), // 7 years default
    batchSize: parseInt(process.env.AUDIT_BATCH_SIZE || "1000"),
    flushInterval: parseInt(process.env.AUDIT_FLUSH_INTERVAL || "5000"), // 5 seconds
    compressionEnabled: process.env.AUDIT_COMPRESSION === "true",
    encryptionEnabled: process.env.AUDIT_ENCRYPTION === "true"
  },
  export: {
    maxRecords: parseInt(process.env.EXPORT_MAX_RECORDS || "100000"),
    timeout: parseInt(process.env.EXPORT_TIMEOUT || "300000"), // 5 minutes
    formats: ["csv", "json", "xml"] as const
  },
  indexing: {
    enabled: process.env.AUDIT_INDEXING === "true",
    batchSize: parseInt(process.env.INDEX_BATCH_SIZE || "500"),
    fields: ["tenant_id", "user_id", "event_type", "severity", "created_at"]
  },
  compliance: {
    immutable: process.env.AUDIT_IMMUTABLE === "true",
    digitalSignatures: process.env.AUDIT_DIGITAL_SIGNATURES === "true",
    hashAlgorithm: process.env.AUDIT_HASH_ALGORITHM || "sha256",
    backupEnabled: process.env.AUDIT_BACKUP === "true",
    backupInterval: process.env.AUDIT_BACKUP_INTERVAL || "0 2 * * *" // Daily at 2 AM
  },
  serviceName: "audit-log-service"
};
