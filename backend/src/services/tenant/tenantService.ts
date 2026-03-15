import { PrismaClient, Tenant, TenantPlan, TenantStatus } from "@prisma/client";
import { Redis } from "ioredis";
import { EventBus } from "../eventBus/eventBus";
import logger from "../../utils/logger";

export interface CreateTenantData {
  name: string;
  domain: string;
  plan: TenantPlan;
  ownerId: string;
  settings?: any;
}

export interface UpdateTenantData {
  name?: string;
  domain?: string;
  settings?: any;
}

export interface TenantFilters {
  status?: TenantStatus;
  plan?: TenantPlan;
  page: number;
  limit: number;
}

export interface TenantMetrics {
  totalUsers: number;
  activeUsers: number;
  totalInvoices: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

export class TenantService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private eventBus: EventBus,
  ) {}

  async createTenant(data: CreateTenantData): Promise<Tenant> {
    const existingTenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [{ name: data.name }, { domain: data.domain }],
      },
    });

    if (existingTenant) {
      throw new Error("Tenant with this name or domain already exists");
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        domain: data.domain,
        plan: data.plan,
        status: "ACTIVE",
        settings: data.settings || {},
      },
    });

    // Create owner as tenant member
    await this.prisma.tenantMember.create({
      data: {
        tenantId: tenant.id,
        userId: data.ownerId,
        role: "OWNER",
      },
    });

    // Cache tenant data
    await this.redis.setex(`tenant:${tenant.id}`, 3600, JSON.stringify(tenant));

    // Emit tenant created event
    await this.eventBus.emit("tenant.created", {
      tenantId: tenant.id,
      name: tenant.name,
      domain: tenant.domain,
      plan: tenant.plan,
      ownerId: data.ownerId,
      timestamp: new Date(),
    });

    logger.info(`Tenant created: ${tenant.name} (${tenant.id})`);
    return tenant;
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    // Try cache first
    const cached = await this.redis.get(`tenant:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (tenant) {
      await this.redis.setex(`tenant:${id}`, 3600, JSON.stringify(tenant));
    }

    return tenant;
  }

  async getTenantByDomain(domain: string): Promise<Tenant | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { domain },
    });

    return tenant;
  }

  async updateTenant(id: string, data: UpdateTenantData): Promise<Tenant> {
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data,
    });

    // Update cache
    await this.redis.setex(`tenant:${id}`, 3600, JSON.stringify(tenant));

    // Emit tenant updated event
    await this.eventBus.emit("tenant.updated", {
      tenantId: tenant.id,
      changes: data,
      timestamp: new Date(),
    });

    logger.info(`Tenant updated: ${tenant.name} (${tenant.id})`);
    return tenant;
  }

  async deleteTenant(id: string): Promise<void> {
    await this.prisma.tenant.delete({
      where: { id },
    });

    // Remove from cache
    await this.redis.del(`tenant:${id}`);

    // Emit tenant deleted event
    await this.eventBus.emit("tenant.deleted", {
      tenantId: id,
      timestamp: new Date(),
    });

    logger.info(`Tenant deleted: ${id}`);
  }

  async listTenants(
    filters: TenantFilters,
  ): Promise<{ tenants: Tenant[]; total: number }> {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.plan) {
      where.plan = filters.plan;
    }

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return { tenants, total };
  }

  async upgradeTenantPlan(id: string, plan: TenantPlan): Promise<Tenant> {
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: { plan },
    });

    // Update cache
    await this.redis.setex(`tenant:${id}`, 3600, JSON.stringify(tenant));

    // Emit plan upgraded event
    await this.eventBus.emit("tenant.plan_upgraded", {
      tenantId: tenant.id,
      oldPlan: tenant.plan,
      newPlan: plan,
      timestamp: new Date(),
    });

    logger.info(
      `Tenant plan upgraded: ${tenant.name} (${tenant.id}) to ${plan}`,
    );
    return tenant;
  }

  async suspendTenant(id: string, reason?: string): Promise<Tenant> {
    const currentTenant = await this.getTenantById(id);
    if (!currentTenant) {
      throw new Error("Tenant not found");
    }

    const currentSettings = (currentTenant.settings || {}) as any;
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        status: "SUSPENDED",
        settings: {
          ...currentSettings,
          suspensionReason: reason,
          suspendedAt: new Date(),
        },
      },
    });

    // Emit tenant suspended event
    await this.eventBus.emit("tenant.suspended", {
      tenantId: tenant.id,
      name: tenant.name,
      reason,
      timestamp: new Date(),
    });

    logger.warn(
      `Tenant suspended: ${tenant.name} (${tenant.id}) - Reason: ${reason}`,
    );
    return tenant;
  }

  async reactivateTenant(id: string): Promise<Tenant> {
    const currentTenant = await this.getTenantById(id);
    if (!currentTenant) {
      throw new Error("Tenant not found");
    }

    const currentSettings = (currentTenant.settings || {}) as any;
    const { suspensionReason, suspendedAt, ...otherSettings } = currentSettings;

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        status: "ACTIVE",
        settings: otherSettings,
      },
    });

    // Update cache
    await this.redis.setex(`tenant:${id}`, 3600, JSON.stringify(tenant));

    // Emit tenant reactivated event
    await this.eventBus.emit("tenant.reactivated", {
      tenantId: tenant.id,
      timestamp: new Date(),
    });

    logger.info(`Tenant reactivated: ${tenant.name} (${tenant.id})`);
    return tenant;
  }

  async getTenantMetrics(id: string): Promise<TenantMetrics> {
    // This is a simplified implementation
    // In a real application, you would aggregate data from various tables
    const tenant = await this.getTenantById(id);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Get user count for this tenant (simplified - you'd need proper tenant-user relationships)
    const totalUsers = await this.prisma.user.count();
    const activeUsers = await this.prisma.user.count({
      where: { isActive: true },
    });

    // Get invoice metrics (simplified - you'd filter by tenant)
    const invoices = await this.prisma.invoice.findMany({
      take: 100, // Limit for demo purposes
    });

    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalAmount),
      0,
    );

    // Mock monthly growth (would calculate from historical data)
    const monthlyGrowth = Math.random() * 20 - 5; // -5% to 15%

    return {
      totalUsers,
      activeUsers,
      totalInvoices,
      totalRevenue,
      monthlyGrowth,
    };
  }

  async getStorageUsed(tenantId: string): Promise<number> {
    // Mock implementation - in real app, calculate actual storage usage
    const cached = await this.redis.get(`storage:${tenantId}`);
    if (cached) {
      return parseInt(cached);
    }

    const usage = Math.floor(Math.random() * 1000000000); // Random bytes
    await this.redis.setex(`storage:${tenantId}`, 300, usage.toString());
    return usage;
  }
}
