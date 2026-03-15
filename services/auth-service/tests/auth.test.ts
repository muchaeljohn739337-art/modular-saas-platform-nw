import request from 'supertest';
import app from '../src/server';

describe('Auth Service', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePassword123!',
        name: 'Test User',
      };

      await request(app).post('/api/auth/register').send(userData);
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(409);
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePassword123!',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
    });

    it('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePassword123!',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'valid-refresh-token',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject logout without token', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/mfa/setup', () => {
    it('should setup MFA for user', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/setup')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('secret');
      expect(response.body.data).toHaveProperty('qrCode');
    });
  });

  describe('POST /api/auth/mfa/verify', () => {
    it('should verify MFA code', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/verify')
        .set('Authorization', 'Bearer valid-token')
        .send({
          code: '123456',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid MFA code', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/verify')
        .set('Authorization', 'Bearer valid-token')
        .send({
          code: '000000',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/password/reset', () => {
    it('should initiate password reset', async () => {
      const response = await request(app)
        .post('/api/auth/password/reset')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject reset for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/password/reset')
        .send({
          email: 'nonexistent@example.com',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/auth/password/confirm-reset', () => {
    it('should confirm password reset with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/password/confirm-reset')
        .send({
          token: 'valid-reset-token',
          newPassword: 'NewSecurePassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject reset with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/password/confirm-reset')
        .send({
          token: 'invalid-token',
          newPassword: 'NewSecurePassword123!',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/verify', () => {
    it('should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('userId');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});
