import { SecurityEvent, SecurityIncident, SecurityMetrics } from "../models";
import { publishSecurityEvent } from "../events/security.events";

export class AuditService {
  private eventQueue: SecurityEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startBatchProcessor();
  }

  async logSecurityEvent(
    tenantId: string,
    eventType: string,
    severity: "low" | "medium" | "high" | "critical",
    details: Record<string, any>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const event: SecurityEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenant_id: tenantId,
      user_id: userId,
      event_type: eventType as any,
      severity,
      ip_address: ipAddress || "unknown",
      user_agent: userAgent,
      details,
      timestamp: new Date(),
      created_at: new Date()
    };

    this.eventQueue.push(event);

    // Publish real-time event for critical events
    if (severity === "critical" || severity === "high") {
      await publishSecurityEvent("security.critical_event", event);
    }

    // Process batch if queue is getting large
    if (this.eventQueue.length >= 100) {
      await this.flushEvents();
    }
  }

  async logLoginEvent(
    tenantId: string,
    userId: string,
    success: boolean,
    ipAddress: string,
    userAgent: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logSecurityEvent(
      tenantId,
      success ? "login" : "suspicious_activity",
      success ? "low" : "medium",
      {
        action: "login_attempt",
        success,
        ...details
      },
      userId,
      ipAddress,
      userAgent
    );
  }

  async logMFAEvent(
    tenantId: string,
    userId: string,
    action: "enabled" | "disabled" | "verified" | "failed",
    ipAddress: string,
    userAgent: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logSecurityEvent(
      tenantId,
      `mfa_${action}`,
      action === "failed" ? "medium" : "low",
      {
        action: `mfa_${action}`,
        ...details
      },
      userId,
      ipAddress,
      userAgent
    );
  }

  async logPasswordChangeEvent(
    tenantId: string,
    userId: string,
    ipAddress: string,
    userAgent: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logSecurityEvent(
      tenantId,
      "password_change",
      "medium",
      {
        action: "password_changed",
        ...details
      },
      userId,
      ipAddress,
      userAgent
    );
  }

  async logRoleChangeEvent(
    tenantId: string,
    adminId: string,
    targetUserId: string,
    oldRole: string,
    newRole: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logSecurityEvent(
      tenantId,
      "role_change",
      "high",
      {
        action: "role_changed",
        target_user_id: targetUserId,
        old_role: oldRole,
        new_role: newRole
      },
      adminId,
      ipAddress,
      userAgent
    );
  }

  async logBlockedRequest(
    tenantId: string,
    reason: string,
    ipAddress: string,
    userAgent: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logSecurityEvent(
      tenantId,
      "blocked_request",
      "medium",
      {
        block_reason: reason,
        ...details
      },
      undefined,
      ipAddress,
      userAgent
    );
  }

  async logRateLimitExceeded(
    tenantId: string,
    limitType: string,
    identifier: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logSecurityEvent(
      tenantId,
      "rate_limit_exceeded",
      "medium",
      {
        limit_type: limitType,
        identifier
      },
      undefined,
      ipAddress,
      userAgent
    );
  }

  async createSecurityIncident(
    tenantId: string,
    incidentType: string,
    severity: "low" | "medium" | "high" | "critical",
    description: string,
    affectedUsers: string[] = [],
    affectedIPs: string[] = [],
    details: Record<string, any> = {}
  ): Promise<SecurityIncident> {
    const incident: SecurityIncident = {
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenant_id: tenantId,
      incident_type: incidentType as any,
      severity,
      status: "open",
      description,
      affected_users: affectedUsers,
      affected_ips: affectedIPs,
      mitigation_actions: [],
      started_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };

    // TODO: Save to database
    console.log("Security Incident Created:", incident);

    await publishSecurityEvent("security.incident_created", incident);

    return incident;
  }

  async getSecurityEvents(
    tenantId: string,
    filters: {
      eventType?: string;
      severity?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<SecurityEvent[]> {
    // TODO: Query from database with filters
    return [];
  }

  async getSecurityIncidents(
    tenantId: string,
    filters: {
      status?: string;
      severity?: string;
      incidentType?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<SecurityIncident[]> {
    // TODO: Query from database with filters
    return [];
  }

  async generateSecurityMetrics(tenantId: string, timePeriod: string): Promise<SecurityMetrics> {
    // TODO: Calculate actual metrics from database
    const metrics: SecurityMetrics = {
      tenant_id: tenantId,
      time_period: timePeriod,
      total_events: 0,
      blocked_requests: 0,
      failed_logins: 0,
      successful_logins: 0,
      mfa_usage: 0,
      security_incidents: 0,
      top_threats: [],
      generated_at: new Date()
    };

    return metrics;
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // TODO: Batch insert events into database
      console.log(`Flushing ${events.length} security events to database`);
      
      // Publish batch event
      await publishSecurityEvent("security.events_batched", {
        event_count: events.length,
        events: events.map(e => ({
          id: e.id,
          event_type: e.event_type,
          severity: e.severity,
          tenant_id: e.tenant_id,
          timestamp: e.timestamp
        }))
      });
    } catch (error) {
      console.error("Failed to flush security events:", error);
      // Re-queue events if failed
      this.eventQueue.unshift(...events);
    }
  }

  private startBatchProcessor(): void {
    // Process events every 5 seconds
    this.batchTimer = setInterval(async () => {
      await this.flushEvents();
    }, 5000);
  }

  async shutdown(): Promise<void> {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    await this.flushEvents();
  }
}

export const auditService = new AuditService();
