export interface AuditLog {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  session_id?: string;
  correlation_id?: string;
  event_type: string;
  category: "auth" | "tenant" | "billing" | "ai" | "web3" | "security" | "deployment" | "system" | "compliance";
  severity: "info" | "warning" | "error" | "critical";
  action: string;
  resource_type?: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
  success: boolean;
  error_message?: string;
  duration_ms?: number;
  metadata: {
    service_name: string;
    version?: string;
    environment: string;
    region?: string;
    data_center?: string;
  };
  hash?: string;
  created_at: Date;
  indexed_at?: Date;
}

export interface AuditQuery {
  tenant_id?: string;
  user_id?: string;
  event_type?: string;
  category?: string;
  severity?: string;
  action?: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  success?: boolean;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
  sort_by?: "created_at" | "severity" | "event_type";
  sort_order?: "asc" | "desc";
}

export interface AuditStatistics {
  tenant_id?: string;
  time_period: string;
  total_events: number;
  events_by_category: Record<string, number>;
  events_by_severity: Record<string, number>;
  events_by_action: Record<string, number>;
  top_users: Array<{
    user_id: string;
    event_count: number;
  }>;
  error_rate: number;
  average_duration_ms: number;
  generated_at: Date;
}
