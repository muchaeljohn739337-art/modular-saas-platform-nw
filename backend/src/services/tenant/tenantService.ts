import { PrismaClient, Tenant, TenantStatus, SubscriptionPlan } from '@prisma/client';
import { Redis } from 'ioredis';
import { EventBus } from '../eventBus/eventBus';
import { logger } from '../../utils/logger';

export interface CreateTenantData {
  name: string;
  domain: string;
  plan: SubscriptionPlan;
  ownerId: string;
  settings?: Record<string, any>;
}

export interface UpdateTenantData {
  name?: string;
  domain?: string;
  settings?: Record<string, any>;
  status?: TenantStatus;
}

export interface TenantMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalRevenue: number;
  storageUsed: number;
  apiCalls: number;
}

export class TenantService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private eventBus: EventBus
  ) {}

  async createTenant(data: CreateTenantData): Promise<Tenant> {
    // Check if domain is already taken
    const existingTenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          { domain: data.domain },
          { name: data.name }
        ]
      }
    });

    if (existingTenant) {
      throw new Error('Tenant name or domain already exists');
    }

    // Create tenant with default settings
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        domain: data.domain,
        plan: data.plan,
        ownerId: data.ownerId,
        status: TenantStatus.ACTIVE,
        settings: {
          ...this.getDefaultSettings(data.plan),
          ...data.settings
        },
        subscription: {
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          plan: data.plan
        }
      },
      include: {
        subscription: true,
        owner: true
      }
    });

    // Initialize tenant in Redis
    await this.initializeTenantInRedis(tenant);

    // Emit tenant created event
    await this.eventBus.emit('tenant.created', {
      tenantId: tenant.id,
      name: tenant.name,
      domain: tenant.domain,
      plan: tenant.plan,
      ownerId: tenant.ownerId
    }, {
      tenantId: tenant.id,
      userId: tenant.ownerId
    });

    logger.info(`Tenant created: ${tenant.name}`, { tenantId: tenant.id });

    return tenant;
  }

  async getTenantById(tenantId: string): Promise<Tenant | null> {
    // Try cache first
    const cached = await this.redis.get(`tenant:${tenantId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: true,
        owner: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (tenant) {
      // Cache for 5 minutes
      await this.redis.setex(`tenant:${tenantId}`, 300, JSON.stringify(tenant));
    }

    return tenant;
  }

  async getTenantByDomain(domain: string): Promise<Tenant | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { domain },
      include: {
        subscription: true,
        owner: true
      }
    });

    return tenant;
  }

  async updateTenant(tenantId: string, data: UpdateTenantData): Promise<Tenant> {
    const existingTenant = await this.getTenantById(tenantId);
    if (!existingTenant) {
      throw new Error('Tenant not found');
    }

    // Check domain uniqueness if updating
    if (data.domain && data.domain !== existingTenant.domain) {
      const domainExists = await this.prisma.tenant.findFirst({
        where: { domain: data.domain }
      });

      if (domainExists) {
        throw new Error('Domain already exists');
      }
    }

    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        subscription: true,
        owner: true
      }
    });

    // Update cache
    await this.redis.setex(`tenant:${tenantId}`, 300, JSON.stringify(tenant));

    // Emit tenant updated event
    await this.eventBus.emit('tenant.updated', {
      tenantId: tenant.id,
      changes: data
    }, {
      tenantId: tenant.id
    });

    logger.info(`Tenant updated: ${tenant.name}`, { tenantId: tenant.id });

    return tenant;
  }

  async deleteTenant(tenantId: string): Promise<void> {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Soft delete
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: TenantStatus.DELETED,
        deletedAt: new Date()
      }
    });

    // Remove from cache
    await this.redis.del(`tenant:${tenantId}`);

    // Emit tenant deleted event
    await this.eventBus.emit('tenant.deleted', {
      tenantId: tenant.id,
      name: tenant.name
    }, {
      tenantId: tenant.id
    });

    logger.info(`Tenant deleted: ${tenant.name}`, { tenantId: tenant.id });
  }

  async getTenantMetrics(tenantId: string): Promise<TenantMetrics> {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Get metrics from database
    const [
      totalUsers,
      activeUsers,
      totalTransactions,
      totalRevenue,
      storageUsed,
      apiCalls
    ] = await Promise.all([
      this.prisma.user.count({
        where: { tenantId, status: 'ACTIVE' }
      }),
      this.prisma.user.count({
        where: { 
          tenantId,
          status: 'ACTIVE',
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        }
      }),
      this.prisma.transaction.count({
        where: { tenantId }
      }),
      this.prisma.transaction.aggregate({
        where: { tenantId },
        _sum: { amount: true }
      }),
      this.getStorageUsed(tenantId),
      this.getApiCalls(tenantId)
    ]);

    return {
      totalUsers,
      activeUsers,
      totalTransactions,
      totalRevenue: totalRevenue._sum.amount || 0,
      storageUsed,
      apiCalls
    };
  }

  async listTenants(filters: {
    status?: TenantStatus;
    plan?: SubscriptionPlan;
    page?: number;
    limit?: number;
  } = {}): Promise<{ tenants: Tenant[]; total: number }> {
    const { status, plan, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(plan && { plan }),
      deletedAt: null // Exclude deleted tenants
    };

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: {
          subscription: true,
          owner: true,
          _count: {
            select: {
              users: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      this.prisma.tenant.count({ where })
    ]);

    return { tenants, total };
  }

  async upgradeTenantPlan(tenantId: string, newPlan: SubscriptionPlan): Promise<Tenant> {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Update subscription
    const updatedTenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan: newPlan,
        subscription: {
          update: {
            plan: newPlan,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        },
        settings: {
          ...tenant.settings,
          ...this.getDefaultSettings(newPlan)
        }
      },
      include: {
        subscription: true,
        owner: true
      }
    });

    // Update cache
    await this.redis.setex(`tenant:${tenantId}`, 300, JSON.stringify(updatedTenant));

    // Emit plan upgraded event
    await this.eventBus.emit('tenant.plan_upgraded', {
      tenantId: tenant.id,
      oldPlan: tenant.plan,
      newPlan
    }, {
      tenantId: tenant.id
    });

    logger.info(`Tenant plan upgraded: ${tenant.name}`, { 
      tenantId: tenant.id, 
      oldPlan: tenant.plan, 
      newPlan 
    });

    return updatedTenant;
  }

  async suspendTenant(tenantId: string, reason?: string): Promise<Tenant> {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const updatedTenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: TenantStatus.SUSPENDED,
        settings: {
          ...tenant.settings,
          suspensionReason: reason
        }
      },
      include: {
        subscription: true,
        owner: true
      }
    });

    // Update cache
    await this.redis.setex(`tenant:${tenantId}`, 300, JSON.stringify(updatedTenant));

    // Emit tenant suspended event
    await this.eventBus.emit('tenant.suspended', {
      tenantId: tenant.id,
      reason
    }, {
      tenantId: tenant.id
    });

    logger.info(`Tenant suspended: ${tenant.name}`, { 
      tenantId: tenant.id, 
      reason 
    });

    return updatedTenant;
  }

  async reactivateTenant(tenantId: string): Promise<Tenant> {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const updatedTenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: TenantStatus.ACTIVE,
        settings: {
          ...tenant.settings,
          suspensionReason: null
        }
      },
      include: {
        subscription: true,
        owner: true
      }
    });

    // Update cache
    await this.redis.setex(`tenant:${tenantId}`, 300, JSON.stringify(updatedTenant));

    // Emit tenant reactivated event
    await this.eventBus.emit('tenant.reactivated', {
      tenantId: tenant.id
    }, {
      tenantId: tenant.id
    });

    logger.info(`Tenant reactivated: ${tenant.name}`, { tenantId: tenant.id });

    return updatedTenant;
  }

  private getDefaultSettings(plan: SubscriptionPlan): Record<string, any> {
    const baseSettings = {
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

  private async initializeTenantInRedis(tenant: Tenant): Promise<void> {
    // Initialize tenant-specific data structures
    const keys = [
      `tenant:${tenant.id}:metrics`,
      `tenant:${tenant.id}:api_calls`,
      `tenant:${tenant.id}:storage`,
      `tenant:${tenant.id}:sessions`
    ];

    await Promise.all(
      keys.map(key => this.redis.set(key, '0'))
    );
  }

  private async getStorageUsed(tenantId: string): Promise<number> {
    // This would integrate with your storage service
    // For now, return a mock value
    const storage = await this.redis.get(`tenant:${tenantId}:storage`);
    return parseInt(storage || '0');
  }

  private async getApiCalls(tenantId: string): Promise<number> {
    // This would integrate with your API monitoring service
    // For now, return a mock value
    const apiCalls = await this.redis.get(`tenant:${tenantId}:api_calls`);
    return parseInt(apiCalls || '0');
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error('Tenant service health check failed:', error);
      return false;
    }
  }
}
