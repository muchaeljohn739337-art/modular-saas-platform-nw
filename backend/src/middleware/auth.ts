import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth/authService';
import { ApiResponse } from '../utils/apiResponse';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      ApiResponse.unauthorized(res, 'Access token required');
      return;
    }

    // For now, we'll use a simple JWT verification without AuthService
    // In a real implementation, you would inject AuthService
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
    
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    ApiResponse.unauthorized(res, 'Invalid or expired token');
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponse.unauthorized(res, 'Authentication required');
      return;
    }

    if (!roles.includes(req.user.role)) {
      ApiResponse.forbidden(res, 'Insufficient permissions');
      return;
    }

    next();
  };
};

export const requireOwnership = (resourceIdParam: string = 'id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.unauthorized(res, 'Authentication required');
        return;
      }

      const resourceId = req.params[resourceIdParam];
      const userId = req.user.userId;

      // This is a simplified ownership check
      // In a real implementation, you would check if the user owns the resource
      // based on the resource type and business logic
      
      // For now, we'll allow all authenticated users to proceed
      // You should implement proper ownership checking based on your business rules
      
      next();
    } catch (error) {
      ApiResponse.internalError(res, 'Ownership verification failed');
    }
  };
};

// Middleware to check if user is Super Admin
export const requireSuperAdmin = requireRole(['SUPER_ADMIN']);

// Middleware to check if user is Admin or higher
export const requireAdmin = requireRole(['SUPER_ADMIN', 'ADMIN']);

// Middleware to check if user is Owner or higher
export const requireOwner = requireRole(['SUPER_ADMIN', 'ADMIN', 'OWNER']);

// Middleware to check if user is Developer or higher
export const requireDeveloper = requireRole(['SUPER_ADMIN', 'ADMIN', 'OWNER', 'DEVELOPER']);

// Middleware to check if user is Auditor or higher
export const requireAuditor = requireRole(['SUPER_ADMIN', 'ADMIN', 'OWNER', 'DEVELOPER', 'AUDITOR']);

// Middleware to check if user is Support or higher
export const requireSupport = requireRole(['SUPER_ADMIN', 'ADMIN', 'OWNER', 'DEVELOPER', 'AUDITOR', 'SUPPORT']);
