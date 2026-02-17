import { apiClient } from "./index";

// Security Service Types
export interface SecurityIncident {
  id: string;
  tenant_id?: string;
  type: "unauthorized_access" | "data_breach" | "malware_detected" | "suspicious_activity" | "compliance_violation" | "system_anomaly";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  ip_address: string;
  user_agent: string;
  location?: string;
  metadata: Record<string, any>;
  status: "open" | "investigating" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  assigned_to?: string;
  tags: string[];
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  type: "access_control" | "data_protection" | "threat_detection" | "audit_logging" | "encryption" | "backup" | "monitoring";
  rules: Array<{
    condition: string;
    action: string;
    severity: string;
    enabled: boolean;
  }>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SecurityStats {
  total_incidents: number;
  open_incidents: number;
  critical_incidents: number;
  resolved_incidents: number;
  avg_resolution_time: number;
  threats_blocked: number;
  vulnerabilities_found: number;
  last_scan: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  tenant_id: string;
  ip_address: string;
  user_agent: string;
  login_time: string;
  last_activity: string;
  session_id: string;
  expires_at: string;
  is_active: boolean;
  location?: {
    country: string;
    city: string;
    region: string;
  };
  device: {
    type: string;
    os: string;
    browser: string;
    version: string;
  };
}

export interface SecurityAlert {
  id: string;
  tenant_id?: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
  expires_at?: string;
  acknowledged?: boolean;
}

// Security Service API Methods
export class SecurityService {
  private client = apiClient;

  async createIncident(incidentData: {
    tenant_id?: string;
    type: string;
    severity: string;
    title: string;
    description: string;
    ip_address?: string;
    user_agent?: string;
    location?: {
      country: string;
      city: string;
      region: string;
    };
    metadata: Record<string, any>;
  }): Promise<ApiResponse<SecurityIncident>> {
    return this.client.post<SecurityIncident>("/security/incidents", incidentData);
  }

  async getIncident(incidentId: string): Promise<ApiResponse<SecurityIncident>> {
    return this.client.get<SecurityIncident>(`/security/incidents/${incidentId}`);
  }

  async listIncidents(params?: QueryParams): Promise<ApiResponse<SecurityIncident[]>> {
    return this.client.get<SecurityIncident[]>("/security/incidents", params);
  }

  async updateIncident(incidentId: string, incidentData: Partial<SecurityIncident>): Promise<SecurityIncident>> {
    return this.client.patch<SecurityIncident>(`/security/incidents/${incidentId}`, incidentData);
  async resolveIncident(incidentId: string, resolution: string): Promise<SecurityIncident>> {
    return this.client.post<SecurityIncident>(`/security/incidents/${incidentId}/resolve`, { resolution });
  }

  async closeIncident(incidentId: string): Promise<SecurityIncident>> {
    return this.client.post<SecurityIncident>(`/security/incidents/${incidentId}/close`);
  }

  async getUserSessions(userId: string, params?: QueryParams): Promise<ApiResponse<UserSession[]>> {
    return this.client.get<UserSession[]>(`/security/users/${userId}/sessions`, params);
  async getActiveSessions(tenantId?: string, params?: QueryParams): Promise<ApiResponse<UserSession[]>> {
    return this.client.get<UserSession[]>(`/security/sessions`, {
      tenant_id: tenantId,
      ...params
    });
  }

  async terminateSession(sessionId: string): Promise<ApiResponse<null>> {
    return this.client.post<null>(`/security/sessions/${sessionId}/terminate`);
  }

  async listPolicies(params?: QueryParams): Promise<SecurityPolicy[]>> {
    return this.client.get<SecurityPolicy[]>("/security/policies", params);
  }

  async getPolicy(policyId: string): Promise<SecurityPolicy>> {
    return this.client.get<SecurityPolicy>(`/security/policies/${policyId}`);
  }

  async createPolicy(policyData: {
    name: string;
    description: string;
    type: string;
    rules: Array<{
      condition: string;
      action: string;
      severity: string;
      enabled: boolean;
    }>;
    enabled: boolean;
  }): Promise<SecurityPolicy>> {
    return this.client.post<SecurityPolicy>("/security/policies", policyData);
  }

  async updatePolicy(policyId: string, policyData: Partial<SecurityPolicy>): Promise<SecurityPolicy>> {
    return this.client.patch<SecurityPolicy>(`/security/policies/${policyId}`, policyData);
  }

  async deletePolicy(policyId: string): Promise<SecurityPolicy>> {
    return this.client.delete<SecurityPolicy>(`/security/policies/${policyId}`);
  }

  async getSecurityStats(): Promise<SecurityStats>> {
    return this.client.get<SecurityStats>("/security/stats");
  }

  async scanVulnerabilities(service?: string): Promise<ApiResponse<{
    vulnerabilities: Array<{
      severity: string;
      description: string;
      cve: string;
      affected_component: string;
      recommendation: string;
    }>;
  }>> {
    return this.client.post<{ vulnerabilities: Array<{
      severity: string;
      description: string;
      cve: string;
      affected_component: string;
      recommendation: string;
    }>>(`/security/scan`, {
      service
    });
  }

  async getSecurityAlerts(params?: QueryParams): Promise<SecurityAlert[]>> {
    return this.client.get<SecurityAlert[]>("/security/alerts", params);
  }

  async acknowledgeAlert(alertId: string): Promise<SecurityAlert>> {
    return this.client.post<SecurityAlert>(`/security/alerts/${alertId}/acknowledge`, {});
  }

  async getThreats(): Promise<ApiResponse<{
    threats: Array<{
      type: string;
      description: string;
      severity: string;
      source: string;
      confidence: number;
      timestamp: string;
    }>> {
    return this.client.get<{ threats: Array<{
      type: string;
      description: string;
      severity: string;
      source: string;
      confidence: number;
      timestamp: string;
    }>>("/security/threats");
  }
}

export const securityService = new SecurityService();
