import { OpenAI } from "openai";
import { config } from "../config/config";
import { Agent, Task, Tool, ExecutionLog } from "../models";

export class AIOrchestratorService {
  private openai: OpenAI;
  private activeTasks: Map<string, Task> = new Map();

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
  }

  async createAgent(tenantId: string, name: string, type: string, configuration: any): Promise<Agent> {
    const agent: Agent = {
      id: `agent_${Date.now()}`,
      tenant_id: tenantId,
      name,
      type: type as any,
      model: config.openai.model,
      configuration,
      status: "active",
      capabilities: this.getCapabilitiesForType(type),
      created_at: new Date(),
      updated_at: new Date()
    };

    return agent;
  }

  async executeTask(task: Task): Promise<Task> {
    this.activeTasks.set(task.id, task);
    task.status = "running";
    task.started_at = new Date();

    try {
      const agent = await this.getAgent(task.agent_id);
      if (!agent) {
        throw new Error("Agent not found");
      }

      const result = await this.processTaskWithAgent(task, agent);
      
      task.output = result;
      task.status = "completed";
      task.progress = 100;
      task.completed_at = new Date();

    } catch (error) {
      task.status = "failed";
      task.error_message = error instanceof Error ? error.message : "Unknown error";
    }

    this.activeTasks.delete(task.id);
    return task;
  }

  private async processTaskWithAgent(task: Task, agent: Agent): Promise<any> {
    const startTime = Date.now();

    try {
      switch (agent.type) {
        case "chat":
          return await this.handleChatTask(task, agent);
        case "analysis":
          return await this.handleAnalysisTask(task, agent);
        case "automation":
          return await this.handleAutomationTask(task, agent);
        case "compliance":
          return await this.handleComplianceTask(task, agent);
        case "fraud_detection":
          return await this.handleFraudDetectionTask(task, agent);
        default:
          throw new Error(`Unknown agent type: ${agent.type}`);
      }
    } finally {
      const duration = Date.now() - startTime;
      await this.logExecution(task.id, agent.id, "process_task", task.input, task.output, duration);
    }
  }

  private async handleChatTask(task: Task, agent: Agent): Promise<any> {
    const completion = await this.openai.chat.completions.create({
      model: agent.model,
      messages: [
        {
          role: "system",
          content: agent.configuration.systemPrompt || "You are a helpful AI assistant."
        },
        {
          role: "user",
          content: task.input.message
        }
      ],
      max_tokens: config.openai.maxTokens,
      temperature: config.openai.temperature
    });

    return {
      response: completion.choices[0].message.content,
      usage: completion.usage
    };
  }

  private async handleAnalysisTask(task: Task, agent: Agent): Promise<any> {
    const { data, analysisType } = task.input;

    const prompt = this.buildAnalysisPrompt(analysisType, data, agent.configuration);
    
    const completion = await this.openai.chat.completions.create({
      model: agent.model,
      messages: [
        {
          role: "system",
          content: "You are a data analysis expert. Provide detailed insights and recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: config.openai.maxTokens,
      temperature: 0.3
    });

    return {
      analysis: completion.choices[0].message.content,
      insights: this.extractInsights(completion.choices[0].message.content || ""),
      recommendations: this.extractRecommendations(completion.choices[0].message.content || ""),
      confidence: this.calculateConfidence(completion.choices[0].message.content || "")
    };
  }

  private getCapabilitiesForType(type: string): string[] {
    const capabilities = {
      chat: ["text_generation", "conversation", "context_awareness"],
      analysis: ["data_analysis", "pattern_recognition", "insight_generation"],
      automation: ["task_execution", "workflow_automation", "api_integration"],
      compliance: ["rule_validation", "policy_checking", "risk_assessment"],
      fraud_detection: ["anomaly_detection", "pattern_analysis", "risk_scoring"]
    };

    return capabilities[type as keyof typeof capabilities] || [];
  }

  private buildAnalysisPrompt(analysisType: string, data: any, config: any): string {
    return `Please analyze the following data for ${analysisType}:

Data: ${JSON.stringify(data, null, 2)}

Focus on: ${config.focus || "general insights"}

Provide:
1. Key findings
2. Patterns and trends
3. Recommendations
4. Risk factors (if applicable)`;
  }

  private extractInsights(content: string): string[] {
    const insights: string[] = [];
    const lines = content.split("\n");
    
    for (const line of lines) {
      if (line.includes("insight") || line.includes("finding") || line.includes("discovery")) {
        insights.push(line.trim());
      }
    }
    
    return insights;
  }

  private extractRecommendations(content: string): string[] {
    const recommendations: string[] = [];
    const lines = content.split("\n");
    
    for (const line of lines) {
      if (line.includes("recommend") || line.includes("suggest") || line.includes("advise")) {
        recommendations.push(line.trim());
      }
    }
    
    return recommendations;
  }

  private calculateConfidence(content: string): number {
    const hasSpecificNumbers = /\d+/.test(content);
    const hasActionItems = /(should|must|recommend|suggest)/i.test(content);
    const hasDetailedAnalysis = content.length > 500;
    
    let confidence = 0.5;
    
    if (hasSpecificNumbers) confidence += 0.2;
    if (hasActionItems) confidence += 0.2;
    if (hasDetailedAnalysis) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private async logExecution(taskId: string, agentId: string, action: string, input: any, output: any, duration: number): Promise<void> {
    const log: ExecutionLog = {
      id: `log_${Date.now()}`,
      task_id: taskId,
      agent_id: agentId,
      action,
      input,
      output,
      duration,
      status: "success",
      created_at: new Date()
    };

    console.log("Execution logged:", log);
  }

  async getAgent(agentId: string): Promise<Agent | null> {
    return null;
  }

  async getTask(taskId: string): Promise<Task | null> {
    return this.activeTasks.get(taskId) || null;
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.status = "cancelled";
      task.completed_at = new Date();
      this.activeTasks.delete(taskId);
      return true;
    }
    return false;
  }

  getActiveTasks(): Task[] {
    return Array.from(this.activeTasks.values());
  }
}
