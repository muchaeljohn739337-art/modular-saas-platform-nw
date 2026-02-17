import { apiClient } from "./index";

// Tenant Service Types
export interface CreateTenantRequest {
  name: string;
  domain: string;
  plan: "starter" | "professional" | "enterprise";
  billing_cycle: "monthly" | "yearly";
  contact_email: string;
  contact_phone: string;
  company_address: string;
  company_size: string;
  industry: string;
  website?: string;
}

export interface UpdateTenantRequest {
  name?: string;
  plan?: "starter" | "professional" | "enterprise";
  billing_cycle?: "monthly" | "yearly";
  status?: "active" | "inactive" | "suspended";
  contact_email?: string;
  contact_phone?: string;
  company_address?: string;
  company_size?: string;
  industry?: string;
  website?: string;
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  plan: string;
  billing_cycle: string;
  status: string;
  contact_email: string;
  contact_phone: string;
  company_address: string;
  company_size: string;
  industry: string;
  website?: string;
  created_at: string;
  updated_at: string;
  subscription_status: string;
  next_billing_date?: string;
  user_count: number;
  storage_used: number;
  storage_limit: number;
  api_calls_used: number;
  api_calls_limit: number;
}

export interface TenantStats {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  total_revenue: number;
  monthly_revenue: number;
  total_api_calls: number;
  total_storage_used: number;
}

// Tenant Service API Methods
export class TenantService {
  private client = apiClient;

  async createTenant(tenantData: CreateTenantRequest): Promise<ApiResponse<Tenant>> {
    return this.client.post<Tenant>("/tenant", tenantData);
  }

  async getTenant(tenantId: string): Promise<ApiResponse<Tenant>> {
    return this.client.get<Tenant>(`/tenant/${tenantId}`);
  }

  async updateTenant(tenantId: string, tenantData: UpdateTenantRequest): Promise<ApiResponse<Tenant>> {
    return this.client.patch<Tenant>(`/tenant/${tenantId}`, tenantData);
  }

  async deleteTenant(tenantId: string): Promise<ApiResponse<null>> {
    return this.client.delete<null>(`/tenant/${tenantId}`);
  }

  async listTenants(params?: QueryParams): Promise<ApiResponse<Tenant[]>> {
    return this.client.get<Tenant[]>("/tenant", params);
  }

  async getTenantStats(): Promise<ApiResponse<TenantStats>> {
    return this.client.get<TenantStats>("/tenant/stats");
  }

  async getTenantUsers(tenantId: string, params?: QueryParams): Promise<ApiResponse<any[]>> {
    return this.client.get<any[]>(`/tenant/${tenantId}/users`, params);
  }

  async upgradeTenant(tenantId: string, plan: string): Promise<ApiResponse<Tenant>> {
    return this.client.post<Tenant>(`/tenant/${tenantId}/upgrade`, { plan });
  }

  async suspendTenant(tenantId: string): Promise<ApiResponse<Tenant>> {
    return this.client.post<Tenant>(`/tenant/${tenantId}/suspend`);
  }

  async activateTenant(tenantId: string): Promise<ApiResponse<Tenant>> {
    return this.client.post<Tenant>(`/tenant/${tenantId}/activate`);
  }
}

export const tenantService = new TenantService();
