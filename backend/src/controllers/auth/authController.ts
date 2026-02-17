import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/auth/authService';
import { ApiResponse } from '../../utils/apiResponse';
import { logger } from '../../utils/logger';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      if (!email || !password || !firstName || !lastName) {
        ApiResponse.badRequest(res, 'Missing required fields');
        return;
      }

      const result = await this.authService.register({
        email,
        password,
        firstName,
        lastName,
        role
      });

      ApiResponse.success(res, result, 'User registered successfully');
    } catch (error) {
      logger.error('Registration error:', error);
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        ApiResponse.badRequest(res, 'Email and password are required');
        return;
      }

      const result = await this.authService.login({ email, password });

      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      ApiResponse.success(res, {
        user: result.user,
        accessToken: result.tokens.accessToken
      }, 'Login successful');
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        ApiResponse.unauthorized(res, 'Refresh token required');
        return;
      }

      const tokens = await this.authService.refreshToken(refreshToken);

      // Update refresh token in cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      ApiResponse.success(res, {
        accessToken: tokens.accessToken
      }, 'Token refreshed successfully');
    } catch (error) {
      logger.error('Token refresh error:', error);
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        ApiResponse.unauthorized(res, 'User not authenticated');
        return;
      }

      await this.authService.logout(userId);

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      ApiResponse.success(res, null, 'Logout successful');
    } catch (error) {
      logger.error('Logout error:', error);
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { oldPassword, newPassword } = req.body;

      if (!userId || !oldPassword || !newPassword) {
        ApiResponse.badRequest(res, 'User ID, old password, and new password are required');
        return;
      }

      await this.authService.changePassword(userId, oldPassword, newPassword);

      ApiResponse.success(res, null, 'Password changed successfully');
    } catch (error) {
      logger.error('Password change error:', error);
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        ApiResponse.badRequest(res, 'Email is required');
        return;
      }

      const resetToken = await this.authService.resetPassword(email);

      // In a real application, you would send this token via email
      // For now, we'll return it (remove this in production)
      ApiResponse.success(res, { 
        message: 'Password reset token sent to email',
        // resetToken // Remove this in production
      }, 'Password reset email sent');
    } catch (error) {
      logger.error('Forgot password error:', error);
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        ApiResponse.badRequest(res, 'Reset token and new password are required');
        return;
      }

      await this.authService.confirmPasswordReset(token, newPassword);

      ApiResponse.success(res, null, 'Password reset successfully');
    } catch (error) {
      logger.error('Password reset error:', error);
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        ApiResponse.unauthorized(res, 'User not authenticated');
        return;
      }

      const user = await this.authService.getUserById(userId);

      if (!user) {
        ApiResponse.notFound(res, 'User not found');
        return;
      }

      ApiResponse.success(res, { user }, 'Profile retrieved successfully');
    } catch (error) {
      logger.error('Get profile error:', error);
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { firstName, lastName } = req.body;

      if (!userId) {
        ApiResponse.unauthorized(res, 'User not authenticated');
        return;
      }

      const user = await this.authService.getUserById(userId);

      if (!user) {
        ApiResponse.notFound(res, 'User not found');
        return;
      }

      // Update user profile (this would need to be implemented in AuthService)
      // For now, just return the current user
      ApiResponse.success(res, { user }, 'Profile updated successfully');
    } catch (error) {
      logger.error('Update profile error:', error);
      next(error);
    }
  };
}
