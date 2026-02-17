import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../../services/tenant/tenantService';
import { ApiResponse } from '../../utils/apiResponse';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

export class TenantController {
  constructor(private tenantService: TenantService) {}

  createTenant = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, domain, plan, settings } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        ApiResponse.unauthorized(res, 'Authentication required');
        return;
      }

      if (!name || !domain || !plan) {
        ApiResponse.badRequest(res, 'Name, domain, and plan are required');
        return;
      }

      const tenant = await this.tenantService.createTenant({
        name,
        domain,
        plan,
        ownerId: userId,
        settings
      });

      ApiResponse.created(res, tenant, 'Tenant created successfully');
    } catch (error) {
      logger.error('Create tenant error:', error);
      next(error);
    }
  };

  getTenant = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = id || req.tenantId;

      if (!tenantId) {
        ApiResponse.badRequest(res, 'Tenant ID is required');
        return;
      }

      const tenant = await this.tenantService.getTenantById(tenantId);

      if (!tenant) {
        ApiResponse.notFound(res, 'Tenant not found');
        return;
      }

      ApiResponse.success(res, tenant, 'Tenant retrieved successfully');
    } catch (error) {
      logger.error('Get tenant error:', error);
      next(error);
    }
  };

  getTenantByDomain = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { domain } = req.params;

      if (!domain) {
        ApiResponse.badRequest(res, 'Domain is required');
        return;
      }

      const tenant = await this.tenantService.getTenantByDomain(domain);

      if (!tenant) {
        ApiResponse.notFound(res, 'Tenant not found');
        return;
      }

      ApiResponse.success(res, tenant, 'Tenant retrieved successfully');
    } catch (error) {
      logger.error('Get tenant by domain error:', error);
      next(error);
    }
  };

  updateTenant = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, domain, settings } = req.body;
      const tenantId = id || req.tenantId;

      if (!tenantId) {
        ApiResponse.badRequest(res, 'Tenant ID is required');
        return;
      }

      const tenant = await this.tenantService.updateTenant(tenantId, {
        name,
        domain,
        settings
      });

      ApiResponse.success(res, tenant, 'Tenant updated successfully');
    } catch (error) {
      logger.error('Update tenant error:', error);
      next(error);
    }
  };

  deleteTenant = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = id || req.tenantId;

      if (!tenantId) {
        ApiResponse.badRequest(res, 'Tenant ID is required');
        return;
      }

      await this.tenantService.deleteTenant(tenantId);

      ApiResponse.success(res, null, 'Tenant deleted successfully');
    } catch (error) {
      logger.error('Delete tenant error:', error);
      next(error);
    }
  };

  getTenantMetrics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = id || req.tenantId;

      if (!tenantId) {
        ApiResponse.badRequest(res, 'Tenant ID is required');
        return;
      }

      const metrics = await this.tenantService.getTenantMetrics(tenantId);

      ApiResponse.success(res, metrics, 'Tenant metrics retrieved successfully');
    } catch (error) {
      logger.error('Get tenant metrics error:', error);
      next(error);
    }
  };

  listTenants = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, plan, page = 1, limit = 20 } = req.query;

      const filters = {
        status: status as any,
        plan: plan as any,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const result = await this.tenantService.listTenants(filters);

      ApiResponse.withPagination(res, result.tenants, filters.page, filters.limit, result.total, 'Tenants retrieved successfully');
    } catch (error) {
      logger.error('List tenants error:', error);
      next(error);
    }
  };

  upgradeTenantPlan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { plan } = req.body;
      const tenantId = id || req.tenantId;

      if (!tenantId) {
        ApiResponse.badRequest(res, 'Tenant ID is required');
        return;
      }

      if (!plan) {
        ApiResponse.badRequest(res, 'Plan is required');
        return;
      }

      const tenant = await this.tenantService.upgradeTenantPlan(tenantId, plan);

      ApiResponse.success(res, tenant, 'Tenant plan upgraded successfully');
    } catch (error) {
      logger.error('Upgrade tenant plan error:', error);
      next(error);
    }
  };

  suspendTenant = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const tenantId = id || req.tenantId;

      if (!tenantId) {
        ApiResponse.badRequest(res, 'Tenant ID is required');
        return;
      }

      const tenant = await this.tenantService.suspendTenant(tenantId, reason);

      ApiResponse.success(res, tenant, 'Tenant suspended successfully');
    } catch (error) {
      logger.error('Suspend tenant error:', error);
      next(error);
    }
  };

  reactivateTenant = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = id || req.tenantId;

      if (!tenantId) {
        ApiResponse.badRequest(res, 'Tenant ID is required');
        return;
      }

      const tenant = await this.tenantService.reactivateTenant(tenantId);

      ApiResponse.success(res, tenant, 'Tenant reactivated successfully');
    } catch (error) {
      logger.error('Reactivate tenant error:', error);
      next(error);
    }
  };

  getMyTenant = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        ApiResponse.badRequest(res, 'Tenant context required');
        return;
      }

      const tenant = await this.tenantService.getTenantById(tenantId);

      if (!tenant) {
        ApiResponse.notFound(res, 'Tenant not found');
        return;
      }

      ApiResponse.success(res, tenant, 'Tenant retrieved successfully');
    } catch (error) {
      logger.error('Get my tenant error:', error);
      next(error);
    }
  };

  getMyTenantMetrics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        ApiResponse.badRequest(res, 'Tenant context required');
        return;
      }

      const metrics = await this.tenantService.getTenantMetrics(tenantId);

      ApiResponse.success(res, metrics, 'Tenant metrics retrieved successfully');
    } catch (error) {
      logger.error('Get my tenant metrics error:', error);
      next(error);
    }
  };

  updateMyTenant = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId;
      const { name, domain, settings } = req.body;

      if (!tenantId) {
        ApiResponse.badRequest(res, 'Tenant context required');
        return;
      }

      const tenant = await this.tenantService.updateTenant(tenantId, {
        name,
        domain,
        settings
      });

      ApiResponse.success(res, tenant, 'Tenant updated successfully');
    } catch (error) {
      logger.error('Update my tenant error:', error);
      next(error);
    }
  };
}
