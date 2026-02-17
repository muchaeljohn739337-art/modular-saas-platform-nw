import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../utils/apiResponse';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }));
    
    ApiResponse.validationError(res, 'Validation failed', errorMessages);
    return;
  }
  
  next();
};

// Custom validation functions
export const validateTenantAccess = (req: Request, res: Response, next: NextFunction): void => {
  const tenantId = req.headers['x-tenant-id'] as string;
  
  if (!tenantId) {
    ApiResponse.badRequest(res, 'Tenant ID is required');
    return;
  }
  
  // You would typically verify that the user has access to this tenant
  // For now, we'll just attach it to the request
  req.tenantId = tenantId;
  
  next();
};

export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  if (page < 1) {
    ApiResponse.badRequest(res, 'Page must be greater than 0');
    return;
  }
  
  if (limit < 1 || limit > 100) {
    ApiResponse.badRequest(res, 'Limit must be between 1 and 100');
    return;
  }
  
  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit
  };
  
  next();
};

export const validateDateRange = (req: Request, res: Response, next: NextFunction): void => {
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  
  if (startDate && isNaN(Date.parse(startDate))) {
    ApiResponse.badRequest(res, 'Invalid startDate format');
    return;
  }
  
  if (endDate && isNaN(Date.parse(endDate))) {
    ApiResponse.badRequest(res, 'Invalid endDate format');
    return;
  }
  
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    ApiResponse.badRequest(res, 'startDate must be before endDate');
    return;
  }
  
  req.dateRange = {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined
  };
  
  next();
};

// Extend Request interface to include custom properties
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      pagination?: {
        page: number;
        limit: number;
        offset: number;
      };
      dateRange?: {
        startDate?: Date;
        endDate?: Date;
      };
    }
  }
}
