import request from 'supertest';
import app from '../src/server';

describe('Billing Service', () => {
  describe('POST /api/invoices', () => {
    it('should create a new invoice', async () => {
      const invoiceData = {
        patientId: 'pat-123',
        providerId: 'prov-456',
        amount: 500.00,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            description: 'Office Visit',
            quantity: 1,
            unitPrice: 150.00,
          },
          {
            description: 'Lab Work',
            quantity: 1,
            unitPrice: 350.00,
          },
        ],
      };

      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', 'Bearer test-token')
        .send(invoiceData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('invoiceNumber');
      expect(response.body.data.status).toBe('DRAFT');
    });

    it('should reject invoice without required fields', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', 'Bearer test-token')
        .send({ amount: 500.00 });

      expect(response.status).toBe(400);
    });

    it('should reject invoice with invalid amount', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', 'Bearer test-token')
        .send({
          patientId: 'pat-123',
          providerId: 'prov-456',
          amount: -100.00,
          dueDate: new Date().toISOString(),
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/invoices/:invoiceId', () => {
    it('should retrieve invoice details', async () => {
      const response = await request(app)
        .get('/api/invoices/inv-123')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should return 404 for non-existent invoice', async () => {
      const response = await request(app)
        .get('/api/invoices/non-existent')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/invoices/:invoiceId', () => {
    it('should update invoice status', async () => {
      const response = await request(app)
        .put('/api/invoices/inv-123')
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'SENT' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('SENT');
    });

    it('should reject invalid status transition', async () => {
      const response = await request(app)
        .put('/api/invoices/inv-123')
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'INVALID_STATUS' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/invoices/:invoiceId/send', () => {
    it('should send invoice to patient', async () => {
      const response = await request(app)
        .post('/api/invoices/inv-123/send')
        .set('Authorization', 'Bearer test-token')
        .send({ method: 'EMAIL' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject send for non-draft invoice', async () => {
      const response = await request(app)
        .post('/api/invoices/inv-sent/send')
        .set('Authorization', 'Bearer test-token')
        .send({ method: 'EMAIL' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/invoices', () => {
    it('should retrieve invoices list with pagination', async () => {
      const response = await request(app)
        .get('/api/invoices?page=1&limit=10')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
    });

    it('should filter invoices by status', async () => {
      const response = await request(app)
        .get('/api/invoices?status=PAID')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter invoices by date range', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const response = await request(app)
        .get(`/api/invoices?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/invoices/:invoiceId/cancel', () => {
    it('should cancel invoice', async () => {
      const response = await request(app)
        .post('/api/invoices/inv-123/cancel')
        .set('Authorization', 'Bearer test-token')
        .send({ reason: 'Service not provided' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CANCELLED');
    });

    it('should reject cancel for paid invoice', async () => {
      const response = await request(app)
        .post('/api/invoices/inv-paid/cancel')
        .set('Authorization', 'Bearer test-token')
        .send({ reason: 'Service not provided' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/invoices/analytics/summary', () => {
    it('should retrieve billing analytics', async () => {
      const response = await request(app)
        .get('/api/invoices/analytics/summary')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalInvoiced');
      expect(response.body.data).toHaveProperty('totalPaid');
      expect(response.body.data).toHaveProperty('totalOutstanding');
    });
  });
});
