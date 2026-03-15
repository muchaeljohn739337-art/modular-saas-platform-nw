// Import all service clients
import { authService } from "./auth";
import { tenantService } from "./tenant";
import { billingService } from "./billing";
import { web3Service } from "./web3";
import { aiService } from "./ai";
import { monitoringService } from "./monitoring";
import { securityService } from "./security";
import { notificationService } from "./notification";
import { auditLogService } from "./audit";

// Export all service clients for easy importing
export { authService } from "./auth";
export { tenantService } from "./tenant";
export { billingService } from "./billing";
export { web3Service } from "./web3";
export { aiService } from "./ai";
export { monitoringService } from "./monitoring";
export { securityService } from "./security";
export { notificationService } from "./notification";
export { auditLogService } from "./audit";

// Create a combined API client with all services
export const apiClients = {
  auth: authService,
  tenant: tenantService,
  billing: billingService,
  web3: web3Service,
  ai: aiService,
  monitoring: monitoringService,
  security: securityService,
  notification: notificationService,
  audit: auditLogService,
};
