import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/tenant/tenantService';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export interface TenantRequest extends Request {
  tenantId?: string;
  tenant?: any;
}

export const resolveTenantFromDomain = (tenantService: TenantService) => {
  return async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const host = req.headers.host;
      const subdomain = host?.split('.')[0];

      if (!subdomain || subdomain === 'www' || subdomain === 'api') {
        // No tenant context needed for main domain
        next();
        return;
      }

      const tenant = await tenantService.getTenantByDomain(subdomain);

      if (!tenant) {
        ApiResponse.notFound(res, 'Tenant not found');
        return;
      }

      if (tenant.status !== 'ACTIVE') {
        ApiResponse.forbidden(res, 'Tenant is not active');
        return;
      }

      req.tenantId = tenant.id;
      req.tenant = tenant;

      next();
    } catch (error) {
      logger.error('Tenant resolution error:', error);
      ApiResponse.internalError(res, 'Failed to resolve tenant');
    }
  };
};

export const resolveTenantFromHeader = (tenantService: TenantService) => {
  return async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        // Try to get from subdomain
        return resolveTenantFromDomain(tenantService)(req, res, next);
      }

      const tenant = await tenantService.getTenantById(tenantId);

      if (!tenant) {
        ApiResponse.notFound(res, 'Tenant not found');
        return;
      }

      if (tenant.status !== 'ACTIVE') {
        ApiResponse.forbidden(res, 'Tenant is not active');
        return;
      }

      req.tenantId = tenant.id;
      req.tenant = tenant;

      next();
    } catch (error) {
      logger.error('Tenant resolution error:', error);
      ApiResponse.internalError(res, 'Failed to resolve tenant');
    }
  };
};

export const requireTenant = (req: TenantRequest, res: Response, next: NextFunction): void => {
  if (!req.tenantId) {
    ApiResponse.badRequest(res, 'Tenant context required');
    return;
  }

  next();
};

export const checkTenantLimits = (tenantService: TenantService) => {
  return async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tenantId) {
        ApiResponse.badRequest(res, 'Tenant context required');
        return;
      }

      const tenant = await tenantService.getTenantById(req.tenantId);
      
      if (!tenant) {
        ApiResponse.notFound(res, 'Tenant not found');
        return;
      }

      const settings = tenant.settings || {};
      const now = Date.now();

      // Check API rate limits
      const apiLimitKey = `tenant:${req.tenantId}:api_calls:${Math.floor(now / (60 * 60 * 1000))}`; // Hourly
      const currentApiCalls = await tenantService['redis']?.get(apiLimitKey) || '0';
      
      if (parseInt(currentApiCalls) >= settings.apiRateLimit) {
        ApiResponse.tooManyRequests(res, 'API rate limit exceeded');
        return;
      }

      // Check storage limits (for upload endpoints)
      if (req.method === 'POST' && req.path.includes('/upload')) {
        const storageUsed = await tenantService.getStorageUsed(req.tenantId);
        
        if (storageUsed >= settings.maxStorage) {
          ApiResponse.forbidden(res, 'Storage limit exceeded');
          return;
        }
      }

      // Check user limits (for user creation endpoints)
      if (req.method === 'POST' && req.path.includes('/users')) {
        const metrics = await tenantService.getTenantMetrics(req.tenantId);
        
        if (settings.maxUsers > 0 && metrics.totalUsers >= settings.maxUsers) {
          ApiResponse.forbidden(res, 'User limit exceeded');
          return;
        }
      }

      // Increment API call counter
      await tenantService['redis']?.incr(apiLimitKey);
      await tenantService['redis']?.expire(apiLimitKey, 60 * 60); // 1 hour

      next();
    } catch (error) {
      logger.error('Tenant limits check error:', error);
      next(error);
    }
  };
};

export const checkFeatureAccess = (feature: string) => {
  return (req: TenantRequest, res: Response, next: NextFunction): void => {
    if (!req.tenant) {
      ApiResponse.badRequest(res, 'Tenant context required');
      return;
    }

    const settings = req.tenant.settings || {};
    const features = settings.features || {};

    if (!features[feature]) {
      ApiResponse.forbidden(res, `Feature '${feature}' not available for current plan`);
      return;
    }

    next();
  };
};

// Pre-built feature checkers
export const requireExportFeature = checkFeatureAccess('export_data');
export const requireCustomBrandingFeature = checkFeatureAccess('custom_branding');
export const requireApiAccessFeature = checkFeatureAccess('api_access');
export const requirePrioritySupportFeature = checkFeatureAccess('priority_support');
export const requireAdvancedAnalyticsFeature = checkFeatureAccess('advanced_analytics');
export const requireCustomIntegrationsFeature = checkFeatureAccess('custom_integrations');

// Tenant context middleware for all routes
export const withTenantContext = (tenantService: TenantService) => {
  return [
    resolveTenantFromHeader(tenantService),
    requireTenant
  ];
};

// Optional tenant context (doesn't fail if no tenant)
export const withOptionalTenantContext = (tenantService: TenantService) => {
  return async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      if (tenantId) {
        const tenant = await tenantService.getTenantById(tenantId);
        
        if (tenant && tenant.status === 'ACTIVE') {
          req.tenantId = tenant.id;
          req.tenant = tenant;
        }
      }
    } catch (error) {
      // Log but don't fail - tenant context is optional
      logger.debug('Optional tenant context resolution failed:', error);
    }
    
    next();
  };
};
