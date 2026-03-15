# Advancia PayLedger - Service Integration Guide

**Purpose**: Guide for integrating microservices and third-party systems  
**Audience**: Backend Engineers, Integration Specialists  
**Last Updated**: March 9, 2026

---

## Service Communication Patterns

### Synchronous Communication (REST APIs)

#### Service-to-Service Calls

```typescript
// backend/src/services/invoiceService.ts
import axios from 'axios';

const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3004';

async function processInvoicePayment(invoiceId: string, amount: number) {
  try {
    const response = await axios.post(
      `${paymentServiceUrl}/api/payments/process`,
      {
        invoiceId,
        amount,
        method: 'ACH_TRANSFER'
      },
      {
        headers: {
          'Authorization': `Bearer ${getServiceToken()}`,
          'Content-Type': 'application/json',
          'X-Request-ID': generateRequestId(),
          'X-Idempotency-Key': `${invoiceId}-${Date.now()}`
        },
        timeout: 30000
      }
    );

    return response.data;
  } catch (error) {
    logger.error('Payment service error', { invoiceId, error });
    throw new PaymentServiceError('Failed to process payment');
  }
}
```

#### Circuit Breaker Pattern

```typescript
// middleware/circuitBreaker.ts
import CircuitBreaker from 'opossum';

const breaker = new CircuitBreaker(
  async (url: string, options: any) => {
    return axios.get(url, options);
  },
  {
    timeout: 30000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    name: 'PaymentServiceBreaker'
  }
);

breaker.fallback(() => {
  logger.warn('Circuit breaker open, using fallback');
  return { status: 'unavailable' };
});

export default breaker;
```

### Asynchronous Communication (Message Queues)

#### Event Publishing

```typescript
// services/eventPublisher.ts
import { Queue } from 'bull';
import Redis from 'redis';

const redis = Redis.createClient({ url: process.env.REDIS_URL });
const paymentQueue = new Queue('payments', { redis });

async function publishPaymentProcessed(paymentId: string, amount: number) {
  await paymentQueue.add(
    { paymentId, amount },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: true
    }
  );

  logger.info('Payment event published', { paymentId });
}
```

#### Event Consumption

```typescript
// services/eventConsumer.ts
paymentQueue.process(async (job) => {
  const { paymentId, amount } = job.data;

  try {
    // Process payment
    await processPayment(paymentId, amount);
    
    // Publish success event
    await publishEvent('payment.completed', { paymentId, amount });
  } catch (error) {
    logger.error('Payment processing failed', { paymentId, error });
    throw error; // Retry
  }
});
```

---

## Third-Party Integrations

### Stripe Payment Integration

```typescript
// services/stripeService.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

async function createPaymentIntent(amount: number, currency: string = 'usd') {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        invoiceId: invoiceId,
        patientId: patientId
      }
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Stripe error', { error });
    throw new StripeError('Failed to create payment intent');
  }
}

async function confirmPayment(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  if (paymentIntent.status === 'succeeded') {
    return { success: true, paymentIntentId };
  }
  
  return { success: false, status: paymentIntent.status };
}
```

### Plaid Bank Integration

```typescript
// services/plaidService.ts
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const configuration = new Configuration({
  basePath: PlaidEnvironments.Production,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET
    }
  }
});

const plaidClient = new PlaidApi(configuration);

async function createLinkToken(userId: string) {
  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: 'Advancia PayLedger',
    language: 'en',
    products: ['auth', 'transactions'],
    country_codes: ['US']
  });

  return response.data.link_token;
}

async function exchangePublicToken(publicToken: string) {
  const response = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken
  });

  return response.data.access_token;
}
```

### SendGrid Email Integration

```typescript
// services/emailService.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendInvoiceEmail(recipientEmail: string, invoiceId: string) {
  const invoice = await getInvoice(invoiceId);

  const msg = {
    to: recipientEmail,
    from: 'billing@advanciapayledger.com',
    subject: `Invoice #${invoice.invoiceNumber}`,
    html: `
      <h1>Invoice #${invoice.invoiceNumber}</h1>
      <p>Amount Due: $${invoice.totalAmount}</p>
      <p>Due Date: ${invoice.dueDate}</p>
      <a href="https://app.advanciapayledger.com/invoices/${invoiceId}">View Invoice</a>
    `,
    trackingSettings: {
      clickTracking: { enable: true },
      openTracking: { enable: true }
    }
  };

  await sgMail.send(msg);
  logger.info('Invoice email sent', { recipientEmail, invoiceId });
}
```

### Twilio SMS Integration

```typescript
// services/smsService.ts
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendPaymentReminder(phoneNumber: string, invoiceId: string) {
  const invoice = await getInvoice(invoiceId);

  const message = await client.messages.create({
    body: `Reminder: Invoice #${invoice.invoiceNumber} for $${invoice.totalAmount} is due on ${invoice.dueDate}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber
  });

  logger.info('SMS sent', { phoneNumber, messageId: message.sid });
}
```

---

## Service Discovery

### Kubernetes Service Discovery

```typescript
// config/serviceRegistry.ts
interface ServiceConfig {
  name: string;
  namespace: string;
  port: number;
}

const services: Record<string, ServiceConfig> = {
  auth: {
    name: 'auth-service',
    namespace: 'advancia',
    port: 3002
  },
  billing: {
    name: 'billing-service',
    namespace: 'advancia',
    port: 3003
  },
  payment: {
    name: 'payment-service',
    namespace: 'advancia',
    port: 3004
  },
  metering: {
    name: 'metering-service',
    namespace: 'advancia',
    port: 3005
  }
};

function getServiceUrl(serviceName: string): string {
  const service = services[serviceName];
  if (!service) throw new Error(`Service not found: ${serviceName}`);

  // Kubernetes DNS: service-name.namespace.svc.cluster.local
  return `http://${service.name}.${service.namespace}.svc.cluster.local:${service.port}`;
}

export { getServiceUrl };
```

---

## API Gateway Pattern

```typescript
// middleware/apiGateway.ts
import express from 'express';
import httpProxy from 'express-http-proxy';

const router = express.Router();

// Route to auth service
router.use('/auth', httpProxy(getServiceUrl('auth'), {
  proxyReqPathResolver: (req) => `/api${req.url}`,
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    // Add custom headers
    userRes.setHeader('X-Service', 'auth-service');
    return proxyResData;
  }
}));

// Route to billing service
router.use('/invoices', httpProxy(getServiceUrl('billing'), {
  proxyReqPathResolver: (req) => `/api${req.url}`
}));

// Route to payment service
router.use('/payments', httpProxy(getServiceUrl('payment'), {
  proxyReqPathResolver: (req) => `/api${req.url}`
}));

export default router;
```

---

## Data Synchronization

### Event-Driven Sync

```typescript
// services/syncService.ts
async function syncPaymentStatus(paymentId: string) {
  // Get payment from payment service
  const payment = await getPaymentFromService(paymentId);

  // Update local cache
  await redis.set(`payment:${paymentId}`, JSON.stringify(payment), 'EX', 3600);

  // Update database if needed
  if (payment.status === 'COMPLETED') {
    await updateInvoiceStatus(payment.invoiceId, 'PAID');
  }

  logger.info('Payment status synced', { paymentId, status: payment.status });
}

// Subscribe to payment events
paymentEventBus.on('payment.completed', async (event) => {
  await syncPaymentStatus(event.paymentId);
});
```

### Scheduled Sync

```typescript
// jobs/syncJob.ts
import cron from 'node-cron';

// Sync payment statuses every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  logger.info('Starting payment sync job');

  try {
    const pendingPayments = await getPendingPayments();

    for (const payment of pendingPayments) {
      await syncPaymentStatus(payment.id);
    }

    logger.info('Payment sync completed', { count: pendingPayments.length });
  } catch (error) {
    logger.error('Payment sync failed', { error });
  }
});
```

---

## Webhook Integration

### Receiving Webhooks

```typescript
// routes/webhooks.ts
import express from 'express';
import { verifyWebhookSignature } from '@/middleware/webhookAuth';

const router = express.Router();

router.post('/stripe', verifyWebhookSignature('stripe'), async (req, res) => {
  const event = req.body;

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        logger.info('Unhandled webhook event', { type: event.type });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing error', { error });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
```

### Sending Webhooks

```typescript
// services/webhookService.ts
async function sendWebhook(event: string, data: any) {
  const webhooks = await getWebhooksForEvent(event);

  for (const webhook of webhooks) {
    try {
      await axios.post(webhook.url, {
        event,
        timestamp: new Date().toISOString(),
        data
      }, {
        headers: {
          'X-Webhook-Signature': generateSignature(webhook.secret, data),
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      logger.info('Webhook sent', { webhookId: webhook.id, event });
    } catch (error) {
      logger.error('Webhook delivery failed', { webhookId: webhook.id, error });
      // Retry logic
      await retryWebhook(webhook.id, data);
    }
  }
}
```

---

## Rate Limiting Between Services

```typescript
// middleware/serviceRateLimit.ts
import rateLimit from 'express-rate-limit';

const serviceRateLimiters = {
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    keyGenerator: (req) => req.headers['x-service-id'] || req.ip
  }),
  payment: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    keyGenerator: (req) => req.headers['x-service-id'] || req.ip
  })
};

export default serviceRateLimiters;
```

---

## Error Handling Between Services

```typescript
// utils/serviceErrors.ts
class ServiceError extends Error {
  constructor(
    public serviceName: string,
    public statusCode: number,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

async function callService(serviceName: string, url: string, options: any) {
  try {
    return await axios(url, options);
  } catch (error) {
    if (error.response) {
      throw new ServiceError(
        serviceName,
        error.response.status,
        `${serviceName} returned ${error.response.status}`,
        error
      );
    } else if (error.code === 'ECONNREFUSED') {
      throw new ServiceError(
        serviceName,
        503,
        `${serviceName} is unavailable`,
        error
      );
    } else {
      throw new ServiceError(
        serviceName,
        500,
        `Error calling ${serviceName}`,
        error
      );
    }
  }
}
```

---

## Testing Service Integration

```typescript
// tests/integration/paymentService.test.ts
import nock from 'nock';

describe('Payment Service Integration', () => {
  beforeEach(() => {
    nock('http://payment-service:3004')
      .post('/api/payments/process')
      .reply(200, { id: 'pay-123', status: 'COMPLETED' });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should process payment successfully', async () => {
    const result = await processInvoicePayment('inv-123', 100);

    expect(result.id).toBe('pay-123');
    expect(result.status).toBe('COMPLETED');
  });

  it('should handle payment service errors', async () => {
    nock('http://payment-service:3004')
      .post('/api/payments/process')
      .reply(500, { error: 'Internal server error' });

    await expect(processInvoicePayment('inv-123', 100))
      .rejects.toThrow('Payment service error');
  });
});
```

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
