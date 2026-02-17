import { Router } from "express";
import { proxyToService, getGatewayHealth, getServiceHealth, getAllServiceHealth } from "../controllers/gateway.controller";
import { authenticateToken } from "../middleware/auth";
import { resolveTenant } from "../middleware/tenant";
import { rateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/health", getGatewayHealth);
router.get("/health/services", getAllServiceHealth);
router.get("/health/services/:serviceName", getServiceHealth);

router.use("/auth", proxyToService("auth"));
router.use("/tenant", proxyToService("tenant"));
router.use("/billing", authenticateToken, resolveTenant, rateLimiter("billing"), proxyToService("billing"));
router.use("/web3", authenticateToken, resolveTenant, rateLimiter("web3"), proxyToService("web3"));
router.use("/ai", authenticateToken, resolveTenant, rateLimiter("ai"), proxyToService("ai"));
router.use("/monitoring", authenticateToken, resolveTenant, proxyToService("monitoring"));

export { router as gatewayRouter };
