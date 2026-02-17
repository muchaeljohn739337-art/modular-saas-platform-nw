import axios, { AxiosResponse, AxiosError } from "axios";
import { config } from "../config/config";
import { GatewayRequest, GatewayResponse, ServiceHealth } from "../models";

export class GatewayService {
  private serviceHealth: Map<string, ServiceHealth> = new Map();

  constructor() {
    this.initializeServiceHealth();
    this.startHealthChecks();
  }

  async proxyRequest(request: GatewayRequest, targetService: string): Promise<GatewayResponse> {
    const startTime = Date.now();
    const serviceUrl = config.services[targetService as keyof typeof config.services].url;

    try {
      const response: AxiosResponse = await axios({
        method: request.method as any,
        url: `${serviceUrl}${request.path}`,
        headers: {
          ...request.headers,
          "x-correlation-id": request.correlation_id,
          "x-tenant-id": request.tenant_id,
          "x-user-id": request.user_id
        },
        data: request.body,
        params: request.query,
        timeout: config.services[targetService as keyof typeof config.services].timeout
      });

      const duration = Date.now() - startTime;

      await this.updateServiceHealth(targetService, true, duration);

      return {
        status: response.status,
        headers: response.headers as any,
        body: response.data,
        duration,
        service_name: targetService,
        correlation_id: request.correlation_id
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.updateServiceHealth(targetService, false, duration);

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        return {
          status: axiosError.response?.status || 500,
          headers: axiosError.response?.headers as any || {},
          body: axiosError.response?.data || { error: "Service unavailable" },
          duration,
          service_name: targetService,
          correlation_id: request.correlation_id
        };
      }

      return {
        status: 500,
        headers: {},
        body: { error: "Internal gateway error" },
        duration,
        service_name: targetService,
        correlation_id: request.correlation_id
      };
    }
  }

  async getServiceHealth(serviceName?: string): Promise<ServiceHealth | ServiceHealth[]> {
    if (serviceName) {
      return this.serviceHealth.get(serviceName) || {
        name: serviceName,
        url: "",
        status: "unhealthy",
        response_time: 0,
        last_check: new Date(),
        error_count: 0
      };
    }

    return Array.from(this.serviceHealth.values());
  }

  async getGatewayMetrics(): Promise<any> {
    const services = await this.getServiceHealth();
    const healthyServices = services.filter(s => s.status === "healthy").length;
    const totalServices = services.length;

    return {
      timestamp: new Date(),
      gateway_status: healthyServices === totalServices ? "healthy" : "degraded",
      services: services,
      healthy_services: healthyServices,
      total_services: totalServices,
      uptime: process.uptime()
    };
  }

  private initializeServiceHealth(): void {
    Object.entries(config.services).forEach(([name, config]) => {
      this.serviceHealth.set(name, {
        name,
        url: config.url,
        status: "unhealthy",
        response_time: 0,
        last_check: new Date(),
        error_count: 0
      });
    });
  }

  private async updateServiceHealth(serviceName: string, isHealthy: boolean, responseTime: number): Promise<void> {
    const current = this.serviceHealth.get(serviceName);
    if (!current) return;

    const updated: ServiceHealth = {
      ...current,
      status: isHealthy ? "healthy" : "unhealthy",
      response_time: responseTime,
      last_check: new Date(),
      error_count: isHealthy ? 0 : current.error_count + 1
    };

    this.serviceHealth.set(serviceName, updated);
  }

  private startHealthChecks(): void {
    setInterval(async () => {
      await this.performHealthChecks();
    }, 30000);
  }

  private async performHealthChecks(): Promise<void> {
    for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
      try {
        const startTime = Date.now();
        const response = await axios.get(`${serviceConfig.url}/health`, {
          timeout: 5000
        });
        const responseTime = Date.now() - startTime;

        await this.updateServiceHealth(serviceName, response.status === 200, responseTime);
      } catch (error) {
        await this.updateServiceHealth(serviceName, false, 0);
      }
    }
  }
}

export const gatewayService = new GatewayService();
