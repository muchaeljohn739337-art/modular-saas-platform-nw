import { config } from "../config/config";
import { WAFRule, SecurityEvent } from "../models";

export class WAFService {
  private customRules: Map<string, WAFRule> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    const defaultRules: WAFRule[] = [
      {
        id: "sql_injection",
        tenant_id: undefined,
        name: "SQL Injection Detection",
        pattern: /union\s+select|drop\s+table|insert\s+into|delete\s+from|update\s+set/i,
        action: "block",
        severity: "critical",
        description: "Detects common SQL injection patterns",
        is_active: true,
        match_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: "xss_detection",
        tenant_id: undefined,
        name: "XSS Attack Detection",
        pattern: /<script[^>]*>.*?<\/script>|javascript:|on\w+\s*=/gi,
        action: "block",
        severity: "high",
        description: "Detects cross-site scripting patterns",
        is_active: true,
        match_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: "path_traversal",
        tenant_id: undefined,
        name: "Path Traversal Detection",
        pattern: /\.\.[\/\\]/g,
        action: "block",
        severity: "high",
        description: "Detects directory traversal attempts",
        is_active: true,
        match_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: "code_injection",
        tenant_id: undefined,
        name: "Code Injection Detection",
        pattern: /eval\s*\(|exec\s*\(|system\s*\(/gi,
        action: "block",
        severity: "critical",
        description: "Detects code execution attempts",
        is_active: true,
        match_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    defaultRules.forEach(rule => {
      this.customRules.set(rule.id, rule);
    });
  }

  async checkRequestForAttacks(
    body: any,
    query: any,
    path: string,
    headers: any = {},
    ip: string = ""
  ): Promise<{ blocked: boolean; reason?: string; rule?: WAFRule; severity?: string }> {
    if (!config.waf.enabled) {
      return { blocked: false };
    }

    // Check payload size
    const payload = JSON.stringify({ body, query });
    if (payload.length > config.waf.maxPayloadSize) {
      return {
        blocked: true,
        reason: "Payload too large",
        severity: "medium"
      };
    }

    // Check against all active rules
    for (const [ruleId, rule] of this.customRules) {
      if (!rule.is_active) continue;

      const testPayload = `${path} ${JSON.stringify(body)} ${JSON.stringify(query)} ${JSON.stringify(headers)}`;
      
      if (rule.pattern.test(testPayload)) {
        // Update match count
        rule.match_count++;
        rule.last_matched = new Date();

        const event: SecurityEvent = {
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tenant_id: "global", // Would be determined from context
          event_type: "blocked_request",
          severity: rule.severity,
          ip_address: ip,
          details: {
            rule_id: rule.id,
            rule_name: rule.name,
            pattern_matched: rule.pattern.toString(),
            payload: testPayload.substring(0, 500) // Limit payload size in logs
          },
          timestamp: new Date(),
          created_at: new Date()
        };

        // TODO: Log security event
        console.log("WAF Blocked Request:", event);

        if (rule.action === "block") {
          return {
            blocked: true,
            reason: `Blocked by WAF rule: ${rule.name}`,
            rule,
            severity: rule.severity
          };
        } else if (rule.action === "alert") {
          // TODO: Send alert
          console.log("WAF Alert:", event);
        }
      }
    }

    return { blocked: false };
  }

  async addCustomRule(rule: WAFRule): Promise<void> {
    this.customRules.set(rule.id, rule);
  }

  async updateRule(ruleId: string, updates: Partial<WAFRule>): Promise<boolean> {
    const rule = this.customRules.get(ruleId);
    if (!rule) return false;

    Object.assign(rule, updates, { updated_at: new Date() });
    return true;
  }

  async deleteRule(ruleId: string): Promise<boolean> {
    return this.customRules.delete(ruleId);
  }

  async getRules(tenantId?: string): Promise<WAFRule[]> {
    const rules = Array.from(this.customRules.values());
    
    if (tenantId) {
      return rules.filter(rule => rule.tenant_id === tenantId || rule.tenant_id === undefined);
    }
    
    return rules;
  }

  async getRule(ruleId: string): Promise<WAFRule | null> {
    return this.customRules.get(ruleId) || null;
  }

  async getRuleStatistics(): Promise<any> {
    const rules = Array.from(this.customRules.values());
    
    return {
      total_rules: rules.length,
      active_rules: rules.filter(r => r.is_active).length,
      total_matches: rules.reduce((sum, r) => sum + r.match_count, 0),
      top_triggered_rules: rules
        .sort((a, b) => b.match_count - a.match_count)
        .slice(0, 10)
        .map(r => ({
          id: r.id,
          name: r.name,
          match_count: r.match_count,
          severity: r.severity,
          last_matched: r.last_matched
        }))
    };
  }

  async enableRule(ruleId: string): Promise<boolean> {
    const rule = this.customRules.get(ruleId);
    if (!rule) return false;

    rule.is_active = true;
    rule.updated_at = new Date();
    return true;
  }

  async disableRule(ruleId: string): Promise<boolean> {
    const rule = this.customRules.get(ruleId);
    if (!rule) return false;

    rule.is_active = false;
    rule.updated_at = new Date();
    return true;
  }
}

export const wafService = new WAFService();
