import { apiClient } from "./index";

// AI Orchestrator Service Types
export interface AgentTaskRequest {
  agent_type: "payment_processing" | "fraud_detection" | "compliance_check" | "data_analysis" | "customer_support" | "report_generation";
  tenant_id?: string;
  user_id?: string;
  parameters: Record<string, any>;
  priority?: "low" | "medium" | "high" | "critical";
}

export interface AgentTask {
  id: string;
  agent_type: string;
  tenant_id: string;
  user_id?: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  priority: string;
  progress: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  result?: any;
  logs: Array<{
    timestamp: string;
    level: "INFO" | "WARN" | "ERROR";
    message: string;
  }>;
  metadata: Record<string, any>;
}

export interface AgentConfig {
  id: string;
  name: string;
  agent_type: string;
  description: string;
  enabled: boolean;
  parameters: Record<string, any>;
  last_run?: string;
  success_rate: number;
  avg_execution_time: number;
  created_at: string;
  updated_at: string;
}

export interface AgentRunRequest {
  agent_id: string;
  parameters?: Record<string, any>;
  priority?: "low" | "medium" | "high" | "critical";
}

export interface AgentStats {
  total_tasks: number;
  running_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  avg_execution_time: number;
  success_rate: number;
  agents_enabled: number;
  tasks_by_type: Record<string, number>;
}

// AI Orchestrator API Methods
export class AIService {
  private client = apiClient;

  async runAgent(taskData: AgentTaskRequest): Promise<ApiResponse<AgentTask>> {
    return this.client.post<AgentTask>("/ai/agents/run", taskData);
  }

  async getTask(taskId: string): Promise<ApiResponse<AgentTask>> {
    return this.client.get<AgentTask>(`/ai/agents/tasks/${taskId}`);
  }

  async listTasks(params?: QueryParams): Promise<ApiResponse<AgentTask[]>> {
    return this.client.get<AgentTask[]>("/ai/agents/tasks", params);
  }

  async stopTask(taskId: string): Promise<ApiResponse<AgentTask>> {
    return this.client.post<AgentTask>(`/ai/agents/tasks/${taskId}/stop`);
  }

  async getAgent(agentId: string): Promise<ApiResponse<AgentConfig>> {
    return this.client.get<AgentConfig>(`/ai/agents/${agentId}`);
  }

  async listAgents(params?: QueryParams): Promise<ApiResponse<AgentConfig[]>> {
    return this.client.get<AgentConfig[]>("/ai/agents", params);
  }

  async updateAgent(agentId: string, agentData: Partial<AgentConfig>): Promise<ApiResponse<AgentConfig>> {
    return this.client.patch<AgentConfig>(`/ai/agents/${agentId}`, agentData);
  async createAgent(agentData: {
    name: string;
    agent_type: string;
    description: string;
    parameters: Record<string, any>;
    enabled: boolean;
  }): Promise<ApiResponse<AgentConfig>> {
    return this.client.post<AgentConfig>("/ai/agents", agentData);
  }

  async deleteAgent(agentId: string): Promise<ApiResponse<null>> {
    return this.client.delete<null>(`/ai/agents/${agentId}`);
  }

  async getAgentStats(): Promise<ApiResponse<AgentStats>> {
    return this.client.get<AgentStats>("/ai/agents/stats");
  }

  async getTaskLogs(taskId: string): Promise<ApiResponse<{
    logs: Array<{
      timestamp: string;
      level: "INFO" | "WARN" | "ERROR";
      message: string;
    }>;
  }>> {
    return this.client.get<{
      logs: Array<{
        timestamp: string;
        level: "INFO" | "WARN" | "ERROR";
        message: string;
      }>>(`/ai/agents/tasks/${taskId}/logs`);
  }
}

export const aiService = new AIService();
