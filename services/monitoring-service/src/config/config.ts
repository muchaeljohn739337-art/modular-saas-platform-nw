import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 4006,
  db: {
    url: process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/advancia_monitoring"
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379"
  },
  prometheus: {
    port: parseInt(process.env.PROMETHEUS_PORT || "9090"),
    endpoint: process.env.PROMETHEUS_ENDPOINT || "/metrics"
  },
  grafana: {
    url: process.env.GRAFANA_URL || "http://localhost:3001",
    apiKey: process.env.GRAFANA_API_KEY || "",
    datasource: process.env.GRAFANA_DATASOURCE || "prometheus"
  },
  alerting: {
    webhookUrl: process.env.ALERT_WEBHOOK_URL || "",
    emailEnabled: process.env.EMAIL_ENABLED === "true",
    slackEnabled: process.env.SLACK_ENABLED === "true",
    slackWebhook: process.env.SLACK_WEBHOOK_URL || ""
  },
  monitoring: {
    interval: parseInt(process.env.MONITORING_INTERVAL || "30000"), // 30 seconds
    retentionDays: parseInt(process.env.RETENTION_DAYS || "30"),
    alertThresholds: {
      cpu: parseFloat(process.env.CPU_THRESHOLD || "80"),
      memory: parseFloat(process.env.MEMORY_THRESHOLD || "85"),
      responseTime: parseFloat(process.env.RESPONSE_TIME_THRESHOLD || "1000"),
      errorRate: parseFloat(process.env.ERROR_RATE_THRESHOLD || "5")
    }
  },
  serviceName: "monitoring-service"
};
