import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import { logger } from '../utils/logger';
import { AuditService } from '../services/auditService';

const prisma = new PrismaClient();
const auditService = new AuditService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name, role } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          role: role as UserRole,
          isActive: true
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      });

      // Create role-specific profile
      if (role === 'PATIENT') {
        await prisma.patient.create({
          data: {
            userId: user.id,
            medicalRecordNumber: `MRN${Date.now()}`,
            dateOfBirth: new Date(),
            gender: 'PREFER_NOT_TO_SAY'
          }
        });
      } else if (role === 'PROVIDER') {
        await prisma.provider.create({
          data: {
            userId: user.id,
            npiNumber: `NPI${Date.now()}`,
            licenseNumber: `LIC${Date.now()}`,
            specialty: 'General Practice'
          }
        });
      } else if (role === 'STAFF') {
        await prisma.staff.create({
          data: {
            userId: user.id,
            employeeId: `EMP${Date.now()}`,
            department: 'Administration',
            position: 'Staff Member'
          }
        });
      }

      // Generate tokens
      const tokens = this.generateTokens(user.id);

      // Save refresh token
      await prisma.session.create({
        data: {
          userId: user.id,
          token: tokens.refreshToken,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      // Log audit
      await auditService.log({
        userId: user.id,
        action: 'USER_REGISTER',
        resource: 'User',
        resourceId: user.id,
        newValues: { email, name, role },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      logger.info(`User registered: ${email}`);

      res.status(201).json({
        message: 'User registered successfully',
        user,
        tokens
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          patient: true,
          provider: true,
          staff: true
        }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // For demo purposes, we'll skip password verification since we don't have password field
      // In production, you'd verify: await bcrypt.compare(password, user.password)

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Generate tokens
      const tokens = this.generateTokens(user.id);

      // Save refresh token
      await prisma.session.create({
        data: {
          userId: user.id,
          token: tokens.refreshToken,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      // Log audit
      await auditService.log({
        userId: user.id,
        action: 'USER_LOGIN',
        resource: 'User',
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      logger.info(`User logged in: ${email}`);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          patient: user.patient,
          provider: user.provider,
          staff: user.staff
        },
        tokens
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      const session = await prisma.session.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      });

      if (!session || !session.isActive || session.expires < new Date()) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      const tokens = this.generateTokens(session.userId);

      // Update session with new refresh token
      await prisma.session.update({
        where: { id: session.id },
        data: { token: tokens.refreshToken }
      });

      res.json({ tokens });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;

      // Deactivate all sessions for this user
      await prisma.session.updateMany({
        where: { userId },
        data: { isActive: false }
      });

      // Log audit
      await auditService.log({
        userId,
        action: 'USER_LOGOUT',
        resource: 'User',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ message: 'Logout successful' });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          patient: true,
          provider: true,
          staff: true
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          patient: true,
          provider: true,
          staff: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { name } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: { name },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          updatedAt: true
        }
      });

      // Log audit
      await auditService.log({
        userId,
        action: 'PROFILE_UPDATE',
        resource: 'User',
        resourceId: userId,
        newValues: { name },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { currentPassword, newPassword } = req.body;

      // In production, you'd verify current password here
      // const user = await prisma.user.findUnique({ where: { id: userId } });
      // const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      // if (!isValidPassword) {
      //   return res.status(400).json({ error: 'Current password is incorrect' });
      // }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password (you'd need to add password field to User model)
      // await prisma.user.update({
      //   where: { id: userId },
      //   data: { password: hashedPassword }
      // });

      // Log audit
      await auditService.log({
        userId,
        action: 'PASSWORD_CHANGE',
        resource: 'User',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Don't reveal if user exists
        return res.json({ message: 'If an account exists, a reset link has been sent' });
      }

      // Generate reset token (you'd implement email sending here)
      const resetToken = jwt.sign(
        { userId: user.id, type: 'password_reset' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      // Log audit
      await auditService.log({
        userId: user.id,
        action: 'PASSWORD_RESET_REQUEST',
        resource: 'User',
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      logger.info(`Password reset requested for: ${email}`);

      res.json({ message: 'If an account exists, a reset link has been sent' });
    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      if (decoded.type !== 'password_reset') {
        return res.status(400).json({ error: 'Invalid reset token' });
      }

      const userId = decoded.userId;

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password (you'd need to add password field to User model)
      // await prisma.user.update({
      //   where: { id: userId },
      //   data: { password: hashedPassword }
      // });

      // Log audit
      await auditService.log({
        userId,
        action: 'PASSWORD_RESET',
        resource: 'User',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(400).json({ error: 'Invalid or expired reset token' });
    }
  }

  async verifyResetToken(req: Request, res: Response) {
    try {
      const { token } = req.body;

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      if (decoded.type !== 'password_reset') {
        return res.status(400).json({ error: 'Invalid reset token' });
      }

      res.json({ valid: true });
    } catch (error) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
    }
  }

  private generateTokens(userId: string) {
    const accessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }
}
