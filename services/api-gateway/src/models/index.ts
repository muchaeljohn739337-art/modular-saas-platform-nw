export interface GatewayRequest {
  id: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
  query: Record<string, string>;
  params: Record<string, string>;
  correlation_id: string;
  tenant_id?: string;
  user_id?: string;
  timestamp: Date;
}

export interface GatewayResponse {
  status: number;
  headers: Record<string, string>;
  body?: any;
  duration: number;
  service_name: string;
  correlation_id: string;
}

export interface ServiceRoute {
  path: string;
  service: keyof typeof services;
  methods: string[];
  authentication: boolean;
  tenant_required: boolean;
  rate_limit?: {
    windowMs: number;
    max: number;
  };
  cache?: {
    ttl: number;
  };
}

export interface AuthenticationContext {
  user_id: string;
  tenant_id: string;
  roles: string[];
  permissions: string[];
  token_type: "access" | "refresh";
}

export interface TenantContext {
  tenant_id: string;
  tenant_name: string;
  plan: string;
  features: string[];
  limits: {
    api_calls: number;
    storage: number;
    users: number;
  };
}

export interface ServiceHealth {
  name: string;
  url: string;
  status: "healthy" | "unhealthy" | "degraded";
  response_time: number;
  last_check: Date;
  error_count: number;
}

const services = {
  auth: "http://localhost:4001",
  tenant: "http://localhost:4002",
  billing: "http://localhost:4003",
  web3: "http://localhost:4004",
  ai: "http://localhost:4005",
  monitoring: "http://localhost:4006"
} as const;

export { services };
