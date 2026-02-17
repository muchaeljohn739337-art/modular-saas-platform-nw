import { Request, Response, NextFunction } from "express";
import { monitoringService } from "../services/monitoring.service";
import { getRegistry } from "../services/monitoring.service";

export const getMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const registry = getRegistry();
    const metrics = await registry.metrics();
    res.set("Content-Type", registry.contentType);
    res.send(metrics);
  } catch (error) {
    next(error);
  }
};

export const getServiceHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serviceName } = req.params;
    const health = await monitoringService.getServiceHealth(serviceName);
    
    if (!health) {
      return res.status(404).json({ error: "Service not found" });
    }
    
    res.json(health);
  } catch (error) {
    next(error);
  }
};

export const getAllServiceHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await monitoringService.getAllServiceHealth();
    res.json(health);
  } catch (error) {
    next(error);
  }
};

export const getActiveAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = await monitoringService.getActiveAlerts();
    res.json(alerts);
  } catch (error) {
    next(error);
  }
};

export const recordMetric = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serviceName, metricName, value, labels } = req.body;
    await monitoringService.recordMetric(serviceName, metricName, value, labels);
    res.json({ message: "Metric recorded successfully" });
  } catch (error) {
    next(error);
  }
};

export const updateServiceHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serviceName } = req.params;
    const healthData = req.body;
    await monitoringService.updateServiceHealth(serviceName, healthData);
    res.json({ message: "Service health updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const getSystemMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await monitoringService.getSystemMetrics();
    res.json(metrics);
  } catch (error) {
    next(error);
  }
};
