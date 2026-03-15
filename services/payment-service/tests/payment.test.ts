import request from 'supertest';
import app from '../src/server';

describe('Payment Service', () => {
  describe('POST /api/payments/process', () => {
    it('should process a valid payment', async () => {
      const paymentData = {
        invoiceId: 'inv-123',
        amount: 100.00,
        method: 'CREDIT_CARD',
        cardToken: 'tok_visa',
      };

      const response = await request(app)
        .post('/api/payments/process')
        .set('Authorization', 'Bearer test-token')
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('status');
    });

    it('should reject payment without required fields', async () => {
      const response = await request(app)
        .post('/api/payments/process')
        .set('Authorization', 'Bearer test-token')
        .send({ amount: 100.00 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject unauthorized requests', async () => {
      const response = await request(app)
        .post('/api/payments/process')
        .send({ invoiceId: 'inv-123', amount: 100.00 });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/payments/:paymentId', () => {
    it('should retrieve payment details', async () => {
      const response = await request(app)
        .get('/api/payments/pay-123')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent payment', async () => {
      const response = await request(app)
        .get('/api/payments/non-existent')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/payments/:paymentId/refund', () => {
    it('should process a refund', async () => {
      const response = await request(app)
        .post('/api/payments/pay-123/refund')
        .set('Authorization', 'Bearer test-token')
        .send({ reason: 'Customer request' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject refund without reason', async () => {
      const response = await request(app)
        .post('/api/payments/pay-123/refund')
        .set('Authorization', 'Bearer test-token')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/payments/history', () => {
    it('should retrieve payment history', async () => {
      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/payments/validate', () => {
    it('should validate payment data', async () => {
      const paymentData = {
        amount: 100.00,
        method: 'ACH_TRANSFER',
        accountNumber: '123456789',
        routingNumber: '021000021',
      };

      const response = await request(app)
        .post('/api/payments/validate')
        .set('Authorization', 'Bearer test-token')
        .send(paymentData);

      expect(response.status).toBe(200);
      expect(response.body.valid).toBeDefined();
    });

    it('should reject invalid payment amounts', async () => {
      const response = await request(app)
        .post('/api/payments/validate')
        .set('Authorization', 'Bearer test-token')
        .send({ amount: -100.00, method: 'CREDIT_CARD' });

      expect(response.status).toBe(400);
    });
  });
});
