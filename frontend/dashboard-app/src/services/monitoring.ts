import { apiClient } from "./index";

// Monitoring Service Types
export interface SystemMetric {
  id: string;
  name: string;
  service: string;
  type: "cpu" | "memory" | "disk" | "network" | "response_time" | "error_rate" | "custom";
  current_value: number;
  threshold: number;
  unit: string;
  status: "healthy" | "warning" | "critical";
  last_updated: string;
  history: Array<{
    timestamp: string;
    value: number;
  }>;
  metadata: Record<string, any>;
}

export interface Alert {
  id: string;
  tenant_id: string;
  type: "security" | "performance" | "billing" | "api" | "system" | "compliance";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  status: "open" | "investigating" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  assigned_to?: string;
  tags: string[];
  metadata: Record<string, any>;
}

export interface HealthCheck {
  service: string;
  status: "healthy" | "degraded" | "down";
  response_time: number;
  uptime: number;
  error_rate: number;
  last_check: string;
  dependencies: Array<{
    service: string;
    status: "healthy" | "degraded" | "down";
    response_time: number;
  }>;
}

export interface MonitoringStats {
  total_services: number;
  healthy_services: number;
  degraded_services: number;
  down_services: number;
  avg_response_time: number;
  avg_error_rate: number;
  system_uptime: number;
  alerts_count: number;
  last_updated: string;
}

export interface AlertRule {
  id: string;
  name: string;
  service: string;
  metric: string;
  condition: string;
  threshold: number;
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
  notification_channels: string[];
  cooldown_period: number;
  created_at: string;
  updated_at: string;
}

// Monitoring Service API Methods
export class MonitoringService {
  private client = apiClient;

  async getMetrics(params?: QueryParams): Promise<ApiResponse<SystemMetric[]>> {
    return this.client.get<SystemMetric[]>("/monitoring/metrics", params);
  }

  async getMetric(metricId: string): Promise<ApiResponse<SystemMetric>> {
    return this.client.get<SystemMetric>(`/monitoring/metrics/${metricId}`);
  }

  async listAlerts(params?: QueryParams): Promise<ApiResponse<Alert[]>> {
    return this.client.get<Alert[]>("/monitoring/alerts", params);
  }

  async getAlert(alertId: string): Promise<Alert>> {
    return this.client.get<Alert>(`/monitoring/alerts/${alertId}`);
  }

  async createAlert(alertData: {
    tenant_id: string;
    type: string;
    severity: string;
    title: string;
    description: string;
    tags: string[];
    notification_channels: string[];
  }): Promise<ApiResponse<Alert>> {
    return this.client.post<Alert>("/monitoring/alerts", alertData);
  }

  async updateAlert(alertId: string, alertData: Partial<Alert>): Promise<Alert>> {
    return this.client.patch<Alert>(`/monitoring/alerts/${alertId}`, alertData);
  async resolveAlert(alertId: string): Promise<Alert>> {
    return this.client.post<Alert>(`/monitoring/alerts/${alertId}/resolve`, {
      resolution: "Auto-resolved by system"
    });
  }

  async deleteAlert(alertId: string): Promise<Alert>> {
    return this.client.delete<Alert>(`/monitoring/alerts/${alertId}`);
  }

  async getHealthChecks(): Promise<ApiResponse<HealthCheck[]>> {
    return this.client.get<HealthCheck[]>("/monitoring/health");
  }

  async getMonitoringStats(): Promise<MonitoringStats>> {
    return this.client.get<MonitoringStats>("/monitoring/stats");
  }

  async createAlertRule(ruleData: {
    name: string;
    service: string;
    metric: string;
    condition: string;
    threshold: number;
    severity: string;
    notification_channels: string[];
    cooldown_period: number;
  }): Promise<ApiResponse<AlertRule>> {
    return this.client.post<AlertRule>("/monitoring/alert-rules", ruleData);
  }

  async listAlertRules(params?: QueryParams): Promise<AlertRule[]> {
    return this.client.get<AlertRule[]>("/monitoring/alert-rules", params);
  }

  async getAlertRule(ruleId: string): Promise<AlertRule>> {
    return this.client.get<AlertRule>(`/monitoring/alert-rules/${ruleId}`);
  }

  async updateAlertRule(ruleId: string, ruleData: Partial<AlertRule>): Promise<AlertRule>> {
    return this.client.patch<AlertRule>(`/monitoring/alert-rules/${ruleId}`, ruleData);
  }

  deleteAlertRule(ruleId: string): Promise<AlertRule>> {
    return this.client.delete<AlertRule>(`/monitoring/alert-rules/${ruleId}`);
  }
}

export const monitoringService = new MonitoringService();
