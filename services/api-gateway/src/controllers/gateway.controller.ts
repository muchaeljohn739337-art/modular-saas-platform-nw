import { Request, Response, NextFunction } from "express";
import { gatewayService } from "../services/gateway.service";
import { GatewayRequest } from "../models";

export const proxyToService = (serviceName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const gatewayRequest: GatewayRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        method: req.method,
        path: req.path,
        headers: req.headers as Record<string, string>,
        body: req.body,
        query: req.query as Record<string, string>,
        params: req.params as Record<string, string>,
        correlation_id: req.headers["x-correlation-id"] as string || generateCorrelationId(),
        tenant_id: (req as any).tenant_id,
        user_id: (req as any).user_id,
        timestamp: new Date()
      };

      const response = await gatewayService.proxyRequest(gatewayRequest, serviceName);

      Object.entries(response.headers).forEach(([key, value]) => {
        if (typeof value === "string") {
          res.set(key, value);
        }
      });

      res.set("x-correlation-id", response.correlation_id);
      res.status(response.status).json(response.body);

    } catch (error) {
      next(error);
    }
  };
};

export const getGatewayHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await gatewayService.getGatewayMetrics();
    res.json(metrics);
  } catch (error) {
    next(error);
  }
};

export const getServiceHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serviceName } = req.params;
    const health = await gatewayService.getServiceHealth(serviceName);
    res.json(health);
  } catch (error) {
    next(error);
  }
};

export const getAllServiceHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await gatewayService.getServiceHealth();
    res.json(health);
  } catch (error) {
    next(error);
  }
};

function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
