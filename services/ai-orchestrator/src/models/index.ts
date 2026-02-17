export interface Agent {
  id: string;
  tenant_id: string;
  name: string;
  type: "chat" | "analysis" | "automation" | "compliance" | "fraud_detection";
  model: string;
  configuration: any;
  status: "active" | "inactive" | "training";
  capabilities: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Task {
  id: string;
  tenant_id: string;
  agent_id: string;
  user_id: string;
  type: string;
  input: any;
  output?: any;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  progress: number;
  error_message?: string;
  started_at?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  type: "api" | "database" | "file" | "webhook" | "custom";
  configuration: any;
  authentication?: any;
  rate_limit?: number;
  status: "active" | "inactive";
  created_at: Date;
  updated_at: Date;
}

export interface AgentTool {
  id: string;
  agent_id: string;
  tool_id: string;
  permissions: string[];
  configuration: any;
  created_at: Date;
}

export interface ExecutionLog {
  id: string;
  task_id: string;
  agent_id: string;
  tool_id?: string;
  action: string;
  input: any;
  output: any;
  duration: number;
  status: "success" | "error";
  error_message?: string;
  created_at: Date;
}

export interface PromptTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: string;
  version: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
