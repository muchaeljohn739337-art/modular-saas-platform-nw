export interface SecurityEvent {
  id: string;
  tenant_id: string;
  user_id?: string;
  event_type: "login" | "logout" | "mfa_enabled" | "mfa_disabled" | "password_change" | "role_change" | "api_access" | "suspicious_activity" | "blocked_request" | "rate_limit_exceeded";
  severity: "low" | "medium" | "high" | "critical";
  ip_address: string;
  user_agent?: string;
  details: Record<string, any>;
  timestamp: Date;
  created_at: Date;
}

export interface SecurityIncident {
  id: string;
  tenant_id: string;
  incident_type: "brute_force" | "sql_injection" | "xss_attempt" | "path_traversal" | "ddos_attack" | "unauthorized_access" | "data_breach_attempt";
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "false_positive";
  description: string;
  affected_users: string[];
  affected_ips: string[];
  mitigation_actions: string[];
  started_at: Date;
  resolved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface MFASetup {
  id: string;
  tenant_id: string;
  user_id: string;
  secret: string;
  backup_codes: string[];
  is_enabled: boolean;
  verified_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface RateLimitRule {
  id: string;
  tenant_id?: string;
  name: string;
  key_pattern: string;
  points: number;
  duration: number;
  block_duration?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface WAFRule {
  id: string;
  tenant_id?: string;
  name: string;
  pattern: string;
  action: "block" | "log" | "alert";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  is_active: boolean;
  match_count: number;
  last_matched?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SecurityPolicy {
  id: string;
  tenant_id: string;
  policy_type: "password_policy" | "session_policy" | "mfa_policy" | "access_policy";
  rules: Record<string, any>;
  is_enforced: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SecurityMetrics {
  tenant_id: string;
  time_period: string;
  total_events: number;
  blocked_requests: number;
  failed_logins: number;
  successful_logins: number;
  mfa_usage: number;
  security_incidents: number;
  top_threats: Array<{
    threat_type: string;
    count: number;
    severity: string;
  }>;
  generated_at: Date;
}
