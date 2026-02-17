import { apiClient } from "./index";

// Audit Log Service Types
export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
  metadata: Record<string, any>;
}

interface AuditQuery {
  tenant_id?: string;
  user_id?: string;
  action?: string;
  resource?: string;
  severity?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: "asc" | "desc";
}

interface AuditExport {
  format: "json" | "csv" | "xml";
  filters: AuditQuery;
  date_range?: {
    start: string;
    end: string;
  };
  export_url?: string;
}

interface AuditStatistics {
  total_logs: number;
  logs_by_severity: Record<string, number>;
  logs_by_action: Record<string, number>;
  logs_by_resource: Record<string, number>;
  unique_users: number;
  unique_tenants: number;
  date_range: {
    start: string;
    end: string;
  };
}

interface ComplianceReport {
  id: string;
  name: string;
  type: "HIPAA" | "SOX" | "GDPR" | "PCI-DSS" | "SOC2";
  status: "compliant" | "non_compliant" | "pending" | "review_required";
  last_updated: string;
  next_review: string;
  score: number;
  findings: Array<{
    category: string;
    severity: string;
    description: string;
    recommendation: string;
    status: string;
  }>;
  auditor_notes?: string;
}

// Audit Log Service API Methods
export class AuditLogService {
  private client = apiClient;

  async createAuditLog(logData: {
    tenant_id: string;
    user_id: string;
    action: string;
    resource: string;
    details: Record<string, any>;
    ip_address: string;
    user_agent: string;
    metadata: Record<string, any>;
  }): Promise<ApiResponse<AuditLog>> {
    return this.client.post<AuditLog>("/audit/logs", logData);
  }

  async getAuditLog(logId: string): Promise<ApiResponse<AuditLog>> {
    return this.client.get<AuditLog>(`/audit/logs/${logId}`);
  }

  async listAuditLogs(params?: AuditQuery): Promise<ApiResponse<AuditLog[]>> {
    return this.client.get<AuditLog[]>("/audit/logs", params);
  }

  async getAuditStats(params?: {
    tenant_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ApiResponse<AuditStatistics>> {
    return this.client.get<AuditStatistics>("/audit/stats", {
      tenant_id,
      date_from,
      date_to
    });
  }

  async exportAuditLogs(exportData: AuditExport): Promise<ApiResponse<{
    download_url: string;
  message: string;
  }>> {
    return this.client.post<{
      download_url: exportData.download_url,
      message: exportData.message
    }>("/audit/logs/export", exportData);
  }

  async getComplianceReports(params?: {
    type?: string;
    status?: string;
  }): Promise<ApiResponse<ComplianceReport[]>> {
    return this.client.get<ComplianceReport[]>("/audit/compliance", {
      type,
      status
    });
  }

  async getComplianceReport(reportId: string): Promise<ComplianceReport>> {
    return this.client.get<ComplianceReport>(`/audit/compliance/${reportId}`);
  }

  async updateComplianceReport(reportId: string, reportData: Partial<ComplianceReport>): Promise<ComplianceReport>> {
    return this.client.patch<ComplianceReport>(`/audit/compliance/${reportId}`, reportData);
  }

  async deleteComplianceReport(reportId: string): Promise<ComplianceReport>> {
    return this.client.delete<ComplianceReport>(`/audit/compliance/${reportId}`);
  }

  async searchAuditLogs(searchParams: {
    query: string;
    tenant_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }): Promise<ApiResponse<AuditLog[]>> {
    return this.client.get<AuditLog[]>("/audit/search", searchParams);
  }

  async getAuditTrail(params?: {
    resource?: string;
    user_id?: string;
    tenant_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }): Promise<ApiResponse<AuditLog[]>> {
    return this.client.get<AuditLog[]>("/audit/trail", params);
  }

  async getAuditTrailByTenant(tenantId: string, params?: QueryParams): Promise<ApiResponse<AuditLog[]>> {
    return this.client.get<AuditLog[]>("/audit/tenants/${tenantId}/logs`, params);
  }

  async getAuditTrailByUser(userId: string, params?: QueryParams): Promise<ApiResponse<AuditLog[]>> {
    return this.client.get<AuditLog[]>("/audit/users/${userId}/logs`, params);
  }
}

export const auditLogService = new AuditLogService();
