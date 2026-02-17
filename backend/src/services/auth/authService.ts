import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, User, UserRole } from '@prisma/client';
import { Redis } from 'ioredis';
import { EventBus } from '../eventBus/eventBus';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: Omit<User, 'password'>;
  tokens: AuthTokens;
}

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private eventBus: EventBus
  ) {}

  async register(data: RegisterData): Promise<AuthResult> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || UserRole.USER,
        status: 'ACTIVE'
      }
    });

    const tokens = await this.generateTokens(user);

    // Store refresh token in Redis
    await this.redis.setex(
      `refresh_token:${user.id}`,
      7 * 24 * 60 * 60, // 7 days
      tokens.refreshToken
    );

    // Emit user registered event
    await this.eventBus.emit('user.registered', {
      userId: user.id,
      email: user.email,
      role: user.role,
      timestamp: new Date()
    });

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens
    };
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: credentials.email }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Account is not active');
    }

    const tokens = await this.generateTokens(user);

    // Store refresh token in Redis
    await this.redis.setex(
      `refresh_token:${user.id}`,
      7 * 24 * 60 * 60, // 7 days
      tokens.refreshToken
    );

    // Emit user logged in event
    await this.eventBus.emit('user.logged_in', {
      userId: user.id,
      email: user.email,
      timestamp: new Date()
    });

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      
      const storedToken = await this.redis.get(`refresh_token:${decoded.userId}`);
      
      if (!storedToken || storedToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new Error('User not found or inactive');
      }

      const tokens = await this.generateTokens(user);

      // Update refresh token in Redis
      await this.redis.setex(
        `refresh_token:${user.id}`,
        7 * 24 * 60 * 60, // 7 days
        tokens.refreshToken
      );

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.redis.del(`refresh_token:${userId}`);

    // Emit user logged out event
    await this.eventBus.emit('user.logged_out', {
      userId,
      timestamp: new Date()
    });
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isOldPasswordValid) {
      throw new Error('Invalid old password');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    // Invalidate all refresh tokens for this user
    await this.redis.del(`refresh_token:${userId}`);

    // Emit password changed event
    await this.eventBus.emit('user.password_changed', {
      userId,
      timestamp: new Date()
    });
  }

  async resetPassword(email: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      process.env.JWT_RESET_SECRET!,
      { expiresIn: '1h' }
    );

    // Store reset token in Redis
    await this.redis.setex(
      `reset_token:${user.id}`,
      60 * 60, // 1 hour
      resetToken
    );

    // Emit password reset requested event
    await this.eventBus.emit('user.password_reset_requested', {
      userId: user.id,
      email: user.email,
      timestamp: new Date()
    });

    return resetToken;
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET!) as any;
      
      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid reset token');
      }

      const storedToken = await this.redis.get(`reset_token:${decoded.userId}`);
      
      if (!storedToken || storedToken !== token) {
        throw new Error('Invalid or expired reset token');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await this.prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword }
      });

      // Clean up reset token
      await this.redis.del(`reset_token:${decoded.userId}`);

      // Invalidate all refresh tokens for this user
      await this.redis.del(`refresh_token:${decoded.userId}`);

      // Emit password reset completed event
      await this.eventBus.emit('user.password_reset_completed', {
        userId: decoded.userId,
        timestamp: new Date()
      });
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      refreshToken
    };
  }

  async validateAccessToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  async getUserById(userId: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return null;
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() }
    });
  }
}
