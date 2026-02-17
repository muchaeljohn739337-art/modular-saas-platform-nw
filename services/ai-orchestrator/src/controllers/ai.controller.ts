import { Request, Response, NextFunction } from "express";
import { AIOrchestratorService } from "../services/aiOrchestrator.service";

const aiService = new AIOrchestratorService();

export const createAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, name, type, configuration } = req.body;
    const agent = await aiService.createAgent(tenantId, name, type, configuration);
    res.json(agent);
  } catch (error) {
    next(error);
  }
};

export const executeTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, agentId, userId, type, input, priority } = req.body;
    
    const task = {
      id: `task_${Date.now()}`,
      tenant_id: tenantId,
      agent_id: agentId,
      user_id: userId,
      type,
      input,
      status: "pending" as const,
      priority: priority || "medium" as const,
      progress: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    const executedTask = await aiService.executeTask(task);
    res.json(executedTask);
  } catch (error) {
    next(error);
  }
};

export const getTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const task = await aiService.getTask(taskId);
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    res.json(task);
  } catch (error) {
    next(error);
  }
};

export const cancelTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const cancelled = await aiService.cancelTask(taskId);
    
    if (!cancelled) {
      return res.status(404).json({ error: "Task not found or cannot be cancelled" });
    }
    
    res.json({ message: "Task cancelled successfully" });
  } catch (error) {
    next(error);
  }
};

export const getActiveTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = aiService.getActiveTasks();
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

export const chatWithAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId, message, conversationHistory } = req.body;
    
    const task = {
      id: `chat_${Date.now()}`,
      tenant_id: req.headers["x-tenant-id"] as string,
      agent_id: agentId,
      user_id: "temp_user",
      type: "chat",
      input: { message, conversationHistory },
      status: "pending" as const,
      priority: "medium" as const,
      progress: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await aiService.executeTask(task);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const analyzeData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId, data, analysisType, focus } = req.body;
    
    const task = {
      id: `analysis_${Date.now()}`,
      tenant_id: req.headers["x-tenant-id"] as string,
      agent_id: agentId,
      user_id: "temp_user",
      type: "analysis",
      input: { data, analysisType, focus },
      status: "pending" as const,
      priority: "medium" as const,
      progress: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await aiService.executeTask(task);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const runComplianceCheck = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId, data, complianceType } = req.body;
    
    const task = {
      id: `compliance_${Date.now()}`,
      tenant_id: req.headers["x-tenant-id"] as string,
      agent_id: agentId,
      user_id: "temp_user",
      type: "compliance",
      input: { data, complianceType },
      status: "pending" as const,
      priority: "high" as const,
      progress: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await aiService.executeTask(task);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const detectFraud = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId, transactions, userProfile } = req.body;
    
    const task = {
      id: `fraud_${Date.now()}`,
      tenant_id: req.headers["x-tenant-id"] as string,
      agent_id: agentId,
      user_id: "temp_user",
      type: "fraud_detection",
      input: { transactions, userProfile },
      status: "pending" as const,
      priority: "urgent" as const,
      progress: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await aiService.executeTask(task);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
