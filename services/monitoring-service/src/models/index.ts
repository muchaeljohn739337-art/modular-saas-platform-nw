export interface Metric {
  id: string;
  service_name: string;
  metric_name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
  created_at: Date;
}

export interface Alert {
  id: string;
  service_name: string;
  metric_name: string;
  threshold: number;
  current_value: number;
  severity: "info" | "warning" | "critical";
  status: "active" | "resolved" | "suppressed";
  message: string;
  triggered_at: Date;
  resolved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ServiceHealth {
  service_name: string;
  status: "healthy" | "degraded" | "down";
  response_time: number;
  error_rate: number;
  cpu_usage: number;
  memory_usage: number;
  last_check: Date;
  uptime: number;
  version: string;
}

export interface Dashboard {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  panels: DashboardPanel[];
  layout: DashboardLayout;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DashboardPanel {
  id: string;
  title: string;
  type: "graph" | "stat" | "table" | "heatmap";
  metrics: string[];
  queries: string[];
  position: { x: number; y: number; w: number; h: number };
  visualization: any;
}

export interface DashboardLayout {
  rows: number;
  columns: number;
  gap: number;
}

export interface LogEntry {
  id: string;
  service_name: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  metadata: Record<string, any>;
  correlation_id?: string;
  tenant_id?: string;
  user_id?: string;
  timestamp: Date;
  created_at: Date;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "closed";
  service_name: string;
  affected_services: string[];
  started_at: Date;
  resolved_at?: Date;
  assigned_to?: string;
  tags: string[];
  timeline: IncidentEvent[];
  created_at: Date;
  updated_at: Date;
}

export interface IncidentEvent {
  id: string;
  incident_id: string;
  type: "status_change" | "note" | "alert" | "resolution";
  message: string;
  data?: any;
  created_by: string;
  created_at: Date;
}
