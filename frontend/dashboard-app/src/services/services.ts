import { apiClients } from "./index";

// Type definitions for all services
export type User = import("./auth").User;
export type Tenant = import("./tenant").Tenant;
export type Invoice = import("./billing").Invoice;
export type Payment = import("./billing").Payment;
export type Wallet = import("./web3").Wallet;
export type Transaction = import("./web3").Transaction;
export type AgentTask = import("./ai").AgentTask;
export type SystemMetric = import("./monitoring").SystemMetric;
export type SecurityIncident = import("./security").SecurityIncident;
export type Notification = import("./notification").Notification;
export type AuditLog = import("./audit").AuditLog;

// Service interfaces for type safety
export interface ApiService {
  auth: typeof apiClients.auth;
  tenant: typeof apiClients.tenant;
  billing: typeof apiClients.billing;
  web3: typeof apiClients.web3;
  ai: typeof apiClients.ai;
  monitoring: typeof apiClients.monitoring;
  security: typeof apiClients.security;
  notification: typeof apiClients.notification;
  audit: typeof apiClients.audit;
}

// Helper type for API responses
export type ApiResponse<T> = {
  data: T;
  message: string;
  status: number;
  success: boolean;
  timestamp: string;
}

// Error type for API errors
export type ApiError = {
  code: string;
  message: string;
  response?: {
    data: any;
  };
}

// Pagination type for list endpoints
export type PaginatedResponse<T> = ApiResponse<{
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}>;

// Filter type for search endpoints
export type FilterableParams = {
  search?: string;
  status?: string;
  type?: string;
  date_from?: string;
  date_to?: string;
};

// Query params combining pagination and filtering
export type QueryParams = FilterableParams & {
  page?: number;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: "asc" | "desc";
};

// Service factory function
export function createServiceClient<T>(serviceName: keyof ApiService): T {
  return apiClients[serviceName];
}

// Export all services as a single object for easy consumption
export const services = apiClients;

// Default export for convenience
export default apiClient; // For backward compatibility
