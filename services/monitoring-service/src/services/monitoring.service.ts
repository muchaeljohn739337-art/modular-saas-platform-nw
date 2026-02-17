import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from "prom-client";
import { config } from "../config/config";
import { Metric, Alert, ServiceHealth } from "../models";

const registry = new register();
collectDefaultMetrics({ register: registry });

export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [registry]
});

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [registry]
});

export class MonitoringService {
  private serviceMetrics: Map<string, ServiceHealth> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();

  constructor() {
    this.startMetricsCollection();
  }

  async recordMetric(serviceName: string, metricName: string, value: number, labels: Record<string, string> = {}): Promise<void> {
    const metric: Metric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      service_name: serviceName,
      metric_name: metricName,
      value,
      labels,
      timestamp: new Date(),
      created_at: new Date()
    };

    await this.storeMetric(metric);
    await this.checkAlertConditions(metric);
  }

  async updateServiceHealth(serviceName: string, health: Partial<ServiceHealth>): Promise<void> {
    const currentHealth = this.serviceMetrics.get(serviceName) || {
      service_name: serviceName,
      status: "healthy",
      response_time: 0,
      error_rate: 0,
      cpu_usage: 0,
      memory_usage: 0,
      last_check: new Date(),
      uptime: 0,
      version: "1.0.0"
    };

    const updatedHealth: ServiceHealth = {
      ...currentHealth,
      ...health,
      last_check: new Date()
    };

    this.serviceMetrics.set(serviceName, updatedHealth);

    await this.recordMetric(serviceName, "response_time", updatedHealth.response_time);
    await this.recordMetric(serviceName, "error_rate", updatedHealth.error_rate);
    await this.recordMetric(serviceName, "cpu_usage", updatedHealth.cpu_usage);
    await this.recordMetric(serviceName, "memory_usage", updatedHealth.memory_usage);
  }

  async getServiceHealth(serviceName: string): Promise<ServiceHealth | null> {
    return this.serviceMetrics.get(serviceName) || null;
  }

  async getAllServiceHealth(): Promise<ServiceHealth[]> {
    return Array.from(this.serviceMetrics.values());
  }

  async createAlert(alert: Omit<Alert, "id" | "created_at" | "updated_at">): Promise<Alert> {
    const newAlert: Alert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date(),
      updated_at: new Date()
    };

    this.activeAlerts.set(newAlert.id, newAlert);
    await this.sendAlertNotification(newAlert);
    return newAlert;
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.activeAlerts.values()).filter(alert => alert.status === "active");
  }

  private async storeMetric(metric: Metric): Promise<void> {
    console.log("Storing metric:", metric);
  }

  private async checkAlertConditions(metric: Metric): Promise<void> {
    const thresholds = config.monitoring.alertThresholds;
    let alertTriggered = false;
    let severity: "info" | "warning" | "critical" = "info";
    let message = "";

    switch (metric.metric_name) {
      case "cpu_usage":
        if (metric.value > thresholds.cpu) {
          alertTriggered = true;
          severity = metric.value > 90 ? "critical" : "warning";
          message = `CPU usage is ${metric.value}% for service ${metric.service_name}`;
        }
        break;
      case "memory_usage":
        if (metric.value > thresholds.memory) {
          alertTriggered = true;
          severity = metric.value > 95 ? "critical" : "warning";
          message = `Memory usage is ${metric.value}% for service ${metric.service_name}`;
        }
        break;
    }

    if (alertTriggered) {
      await this.createAlert({
        service_name: metric.service_name,
        metric_name: metric.metric_name,
        threshold: thresholds[metric.metric_name as keyof typeof thresholds] || 0,
        current_value: metric.value,
        severity,
        status: "active",
        message,
        triggered_at: new Date()
      });
    }
  }

  private async sendAlertNotification(alert: Alert): Promise<void> {
    console.log("ALERT TRIGGERED:", alert);
  }

  private startMetricsCollection(): void {
    setInterval(async () => {
      await this.collectSystemMetrics();
    }, config.monitoring.interval);
  }

  private async collectSystemMetrics(): Promise<void> {
    const services = ["auth-service", "tenant-service", "billing-service", "web3-service", "ai-orchestrator"];
    
    for (const serviceName of services) {
      const cpu = Math.random() * 100;
      const memory = Math.random() * 100;
      const responseTime = Math.random() * 2000;
      const errorRate = Math.random() * 10;

      await this.updateServiceHealth(serviceName, {
        cpu_usage: cpu,
        memory_usage: memory,
        response_time: responseTime,
        error_rate: errorRate,
        status: cpu > 90 || memory > 95 ? "degraded" : "healthy"
      });
    }
  }

  getRegistry(): typeof registry {
    return registry;
  }
}

export const monitoringService = new MonitoringService();
