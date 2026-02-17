import { Router } from "express";
import {
  createSubscription,
  getSubscription,
  updateSubscription,
  cancelSubscription,
  getInvoices,
  createInvoice,
  processPayment,
  recordUsage,
  getUsageMetrics
} from "../controllers/billing.controller";

const router = Router();

// Subscription routes
router.post("/subscriptions", createSubscription);
router.get("/subscriptions/:tenantId", getSubscription);
router.put("/subscriptions/:subscriptionId", updateSubscription);
router.delete("/subscriptions/:subscriptionId", cancelSubscription);

// Invoice routes
router.get("/invoices/:tenantId", getInvoices);
router.post("/invoices", createInvoice);

// Payment routes
router.post("/payments/:invoiceId", processPayment);

// Usage tracking
router.post("/usage", recordUsage);
router.get("/usage/:tenantId", getUsageMetrics);

export { router as billingRouter };
