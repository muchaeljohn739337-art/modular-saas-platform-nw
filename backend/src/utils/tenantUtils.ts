import { Tenant, SubscriptionPlan, TenantStatus } from '@prisma/client';

export interface TenantSettings {
  maxUsers: number;
  maxStorage: number;
  apiRateLimit: number;
  features: {
    basic_analytics: boolean;
    export_data: boolean;
    custom_branding: boolean;
    api_access: boolean;
    priority_support: boolean;
    advanced_analytics?: boolean;
    custom_integrations?: boolean;
  };
  suspensionReason?: string;
}

export class TenantUtils {
  static getTenantDomain(tenant: Tenant): string {
    return `${tenant.domain}.advanciapayledger.com`;
  }

  static getTenantUrl(tenant: Tenant, protocol: string = 'https'): string {
    return `${protocol}://${this.getTenantDomain(tenant)}`;
  }

  static isTenantActive(tenant: Tenant): boolean {
    return tenant.status === TenantStatus.ACTIVE;
  }

  static isTenantSuspended(tenant: Tenant): boolean {
    return tenant.status === TenantStatus.SUSPENDED;
  }

  static isTenantDeleted(tenant: Tenant): boolean {
    return tenant.status === TenantStatus.DELETED;
  }

  static getPlanLimits(plan: SubscriptionPlan): TenantSettings {
    const baseSettings: TenantSettings = {
      maxUsers: 10,
      maxStorage: 1024 * 1024 * 1024, // 1GB
      apiRateLimit: 1000, // per hour
      features: {
        basic_analytics: true,
        export_data: false,
        custom_branding: false,
        api_access: false,
        priority_support: false
      }
    };

    switch (plan) {
      case SubscriptionPlan.STARTER:
        return {
          ...baseSettings,
          maxUsers: 5,
          maxStorage: 512 * 1024 * 1024, // 512MB
          apiRateLimit: 500
        };

      case SubscriptionPlan.PROFESSIONAL:
        return {
          ...baseSettings,
          maxUsers: 50,
          maxStorage: 10 * 1024 * 1024 * 1024, // 10GB
          apiRateLimit: 5000,
          features: {
            ...baseSettings.features,
            export_data: true,
            custom_branding: true,
            api_access: true
          }
        };

      case SubscriptionPlan.ENTERPRISE:
        return {
          ...baseSettings,
          maxUsers: -1, // Unlimited
          maxStorage: 100 * 1024 * 1024 * 1024, // 100GB
          apiRateLimit: 10000,
          features: {
            ...baseSettings.features,
            export_data: true,
            custom_branding: true,
            api_access: true,
            priority_support: true,
            advanced_analytics: true,
            custom_integrations: true
          }
        };

      default:
        return baseSettings;
    }
  }

  static canUpgradePlan(currentPlan: SubscriptionPlan, targetPlan: SubscriptionPlan): boolean {
    const planHierarchy = {
      [SubscriptionPlan.STARTER]: 0,
      [SubscriptionPlan.PROFESSIONAL]: 1,
      [SubscriptionPlan.ENTERPRISE]: 2
    };

    return planHierarchy[targetPlan] > planHierarchy[currentPlan];
  }

  static getPlanPrice(plan: SubscriptionPlan): number {
    const prices = {
      [SubscriptionPlan.STARTER]: 29,
      [SubscriptionPlan.PROFESSIONAL]: 99,
      [SubscriptionPlan.ENTERPRISE]: 299
    };

    return prices[plan] || 0;
  }

  static getPlanFeatures(plan: SubscriptionPlan): string[] {
    const features = {
      [SubscriptionPlan.STARTER]: [
        'Basic Analytics',
        '5 Users',
        '512MB Storage',
        '500 API Calls/hour',
        'Email Support'
      ],
      [SubscriptionPlan.PROFESSIONAL]: [
        'Advanced Analytics',
        '50 Users',
        '10GB Storage',
        '5,000 API Calls/hour',
        'Data Export',
        'Custom Branding',
        'API Access',
        'Priority Support'
      ],
      [SubscriptionPlan.ENTERPRISE]: [
        'Advanced Analytics',
        'Unlimited Users',
        '100GB Storage',
        '10,000 API Calls/hour',
        'Data Export',
        'Custom Branding',
        'API Access',
        'Priority Support',
        'Custom Integrations',
        'Dedicated Account Manager',
        'SLA Guarantee'
      ]
    };

    return features[plan] || [];
  }

  static formatStorageSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  static calculateStorageUsagePercentage(used: number, total: number): number {
    if (total === 0) return 0;
    return Math.min((used / total) * 100, 100);
  }

  static calculateUserUsagePercentage(current: number, max: number): number {
    if (max === -1) return 0; // Unlimited
    if (max === 0) return 100;
    return Math.min((current / max) * 100, 100);
  }

  static getTenantHealthStatus(tenant: Tenant): 'healthy' | 'warning' | 'critical' {
    if (!this.isTenantActive(tenant)) {
      return 'critical';
    }

    if (this.isTenantSuspended(tenant)) {
      return 'warning';
    }

    return 'healthy';
  }

  static generateTenantSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  static validateTenantDomain(domain: string): boolean {
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?$/;
    return domainRegex.test(domain) && domain.length <= 63;
  }

  static isFeatureEnabled(settings: TenantSettings, feature: keyof TenantSettings['features']): boolean {
    return settings.features[feature] || false;
  }

  static getTenantSubscriptionStatus(tenant: Tenant): string {
    if (!tenant.subscription) {
      return 'NO_SUBSCRIPTION';
    }

    const now = new Date();
    const endDate = new Date(tenant.subscription.currentPeriodEnd);

    if (now > endDate) {
      return 'EXPIRED';
    }

    if (tenant.subscription.status === 'CANCELLED') {
      return 'CANCELLED';
    }

    if (tenant.subscription.status === 'PAST_DUE') {
      return 'PAST_DUE';
    }

    return 'ACTIVE';
  }

  static getDaysUntilSubscriptionEnd(tenant: Tenant): number {
    if (!tenant.subscription) {
      return 0;
    }

    const now = new Date();
    const endDate = new Date(tenant.subscription.currentPeriodEnd);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  static shouldSendSubscriptionReminder(tenant: Tenant): boolean {
    const daysUntilEnd = this.getDaysUntilSubscriptionEnd(tenant);
    return daysUntilEnd <= 7 && daysUntilEnd > 0;
  }

  static getTenantMetricsSummary(tenant: Tenant, metrics: any): any {
    const settings = tenant.settings as TenantSettings;
    
    return {
      users: {
        current: metrics.totalUsers,
        max: settings.maxUsers,
        percentage: this.calculateUserUsagePercentage(metrics.totalUsers, settings.maxUsers),
        unlimited: settings.maxUsers === -1
      },
      storage: {
        current: metrics.storageUsed,
        max: settings.maxStorage,
        percentage: this.calculateStorageUsagePercentage(metrics.storageUsed, settings.maxStorage),
        formatted: {
          current: this.formatStorageSize(metrics.storageUsed),
          max: this.formatStorageSize(settings.maxStorage)
        }
      },
      apiCalls: {
        current: metrics.apiCalls,
        max: settings.apiRateLimit,
        percentage: this.calculateUserUsagePercentage(metrics.apiCalls, settings.apiRateLimit)
      },
      subscription: {
        status: this.getTenantSubscriptionStatus(tenant),
        plan: tenant.plan,
        daysUntilEnd: this.getDaysUntilSubscriptionEnd(tenant),
        shouldRemind: this.shouldSendSubscriptionReminder(tenant)
      }
    };
  }
}
