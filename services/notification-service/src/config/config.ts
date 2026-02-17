import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 4008,
  db: {
    url: process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/advancia_notification"
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379"
  },
  email: {
    smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
    smtpPort: parseInt(process.env.SMTP_PORT || "587"),
    smtpUser: process.env.SMTP_USER || "",
    smtpPass: process.env.SMTP_PASS || "",
    fromAddress: process.env.FROM_ADDRESS || "noreply@advanciapayledger.com"
  },
  sms: {
    twilioSid: process.env.TWILIO_SID || "",
    twilioToken: process.env.TWILIO_TOKEN || "",
    twilioFrom: process.env.TWILIO_FROM || ""
  },
  webhook: {
    timeout: parseInt(process.env.WEBHOOK_TIMEOUT || "10000"),
    retries: parseInt(process.env.WEBHOOK_RETRIES || "3")
  },
  templates: {
    billingReminder: "billing-reminder",
    paymentConfirmation: "payment-confirmation",
    fraudAlert: "fraud-alert",
    systemAlert: "system-alert",
    welcomeEmail: "welcome-email"
  },
  queue: {
    maxRetries: parseInt(process.env.QUEUE_MAX_RETRIES || "3"),
    retryDelay: parseInt(process.env.QUEUE_RETRY_DELAY || "5000")
  },
  serviceName: "notification-service"
};
