import { Router } from "express";
import {
  detectAnomalyHandler,
  detectOutageRiskHandler,
  detectFraudHandler,
  detectWeb3FraudHandler,
  getPredictiveInsightsHandler,
  updateBaselineHandler
} from "../controllers/predictive.controller";
import { recordMetricHandler, getMetricsHandler, createAlertHandler } from "../controllers/monitoring.controller";
import { authGuard } from "../middleware/authGuard";
import { tenantGuard } from "../middleware/tenantGuard";

const router = Router();

// Original monitoring endpoints
router.post("/metrics", authGuard, tenantGuard, recordMetricHandler);
router.get("/metrics", authGuard, tenantGuard, getMetricsHandler);
router.post("/alerts", authGuard, tenantGuard, createAlertHandler);

// Predictive monitoring endpoints
router.post("/predict/anomaly", authGuard, tenantGuard, detectAnomalyHandler);
router.post("/predict/outage-risk", authGuard, tenantGuard, detectOutageRiskHandler);
router.post("/predict/fraud", authGuard, tenantGuard, detectFraudHandler);
router.post("/predict/web3-fraud", authGuard, tenantGuard, detectWeb3FraudHandler);
router.get("/predict/insights", authGuard, tenantGuard, getPredictiveInsightsHandler);
router.post("/baseline/update", authGuard, tenantGuard, updateBaselineHandler);

export { router as monitoringRouter };
