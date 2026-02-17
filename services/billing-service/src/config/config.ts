import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 4003,
  db: {
    url: process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/advancia_billing"
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "sk_test_...",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "whsec_..."
  },
  serviceName: "billing-service"
};
