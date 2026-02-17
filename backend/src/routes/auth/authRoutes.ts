import { Router } from 'express';
import { AuthController } from '../../controllers/auth/authController';
import { authenticateToken } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { body } from 'express-validator';

const router = Router();

// Validation schemas
const registerValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('role').optional().isIn(['USER', 'ADMIN', 'OWNER']).withMessage('Invalid role')
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required')
];

const changePasswordValidation = [
  body('oldPassword').notEmpty().withMessage('Old password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Valid email required')
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
];

const updateProfileValidation = [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty')
];

export function createAuthRoutes(authController: AuthController): Router {
  // Public routes
  router.post('/register', validateRequest(registerValidation), authController.register);
  router.post('/login', validateRequest(loginValidation), authController.login);
  router.post('/refresh-token', authController.refreshToken);
  router.post('/forgot-password', validateRequest(forgotPasswordValidation), authController.forgotPassword);
  router.post('/reset-password', validateRequest(resetPasswordValidation), authController.resetPassword);

  // Protected routes
  router.post('/logout', authenticateToken, authController.logout);
  router.post('/change-password', authenticateToken, validateRequest(changePasswordValidation), authController.changePassword);
  router.get('/profile', authenticateToken, authController.getProfile);
  router.put('/profile', authenticateToken, validateRequest(updateProfileValidation), authController.updateProfile);

  return router;
}
