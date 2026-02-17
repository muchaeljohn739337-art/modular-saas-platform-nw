import { Router } from 'express';
import { TenantController } from '../../controllers/tenant/tenantController';
import { authenticateToken, requireOwner, requireAdmin, requireSuperAdmin } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { body } from 'express-validator';

const router = Router();

// Validation schemas
const createTenantValidation = [
  body('name').notEmpty().withMessage('Tenant name is required'),
  body('domain').isURL().withMessage('Valid domain is required'),
  body('plan').isIn(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']).withMessage('Invalid plan'),
  body('settings').optional().isObject().withMessage('Settings must be an object')
];

const updateTenantValidation = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('domain').optional().isURL().withMessage('Valid domain required'),
  body('settings').optional().isObject().withMessage('Settings must be an object')
];

const upgradePlanValidation = [
  body('plan').isIn(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']).withMessage('Invalid plan')
];

const suspendTenantValidation = [
  body('reason').optional().isString().withMessage('Reason must be a string')
];

export function createTenantRoutes(tenantController: TenantController): Router {
  // Public routes (for domain-based access)
  router.get('/domain/:domain', tenantController.getTenantByDomain);

  // Authenticated user routes (tenant context)
  router.get('/my', authenticateToken, tenantController.getMyTenant);
  router.get('/my/metrics', authenticateToken, tenantController.getMyTenantMetrics);
  router.put('/my', authenticateToken, validateRequest(updateTenantValidation), tenantController.updateMyTenant);

  // Owner routes (for their own tenant)
  router.get('/my/plan', authenticateToken, requireOwner, tenantController.getMyTenant);
  router.post('/my/upgrade', authenticateToken, requireOwner, validateRequest(upgradePlanValidation), tenantController.upgradeTenantPlan);

  // Admin routes (tenant management)
  router.get('/', authenticateToken, requireAdmin, tenantController.listTenants);
  router.post('/', authenticateToken, requireAdmin, validateRequest(createTenantValidation), tenantController.createTenant);
  router.get('/:id', authenticateToken, requireAdmin, tenantController.getTenant);
  router.put('/:id', authenticateToken, requireAdmin, validateRequest(updateTenantValidation), tenantController.updateTenant);
  router.delete('/:id', authenticateToken, requireSuperAdmin, tenantController.deleteTenant);
  router.get('/:id/metrics', authenticateToken, requireAdmin, tenantController.getTenantMetrics);
  router.post('/:id/upgrade', authenticateToken, requireAdmin, validateRequest(upgradePlanValidation), tenantController.upgradeTenantPlan);
  router.post('/:id/suspend', authenticateToken, requireAdmin, validateRequest(suspendTenantValidation), tenantController.suspendTenant);
  router.post('/:id/reactivate', authenticateToken, requireAdmin, tenantController.reactivateTenant);

  return router;
}
