# Advancia PayLedger - Vendor and Third-Party Integration Guide

**Purpose**: Manage integrations with external vendors and services  
**Audience**: Backend Engineers, Integration Partners  
**Last Updated**: March 9, 2026

---

## Integrated Vendors

### Payment Processing

#### Stripe
- **Purpose**: Credit card and ACH payments
- **Status**: Active
- **Integration Type**: REST API
- **Authentication**: API keys (live and test)

```typescript
// Initialize Stripe
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Process payment
async function processStripePayment(paymentData: any) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(paymentData.amount * 100),
    currency: 'usd',
    payment_method: paymentData.paymentMethodId,
    confirm: true,
    idempotency_key: paymentData.idempotencyKey
  });

  return paymentIntent;
}
```

#### Square
- **Purpose**: Alternative payment processing
- **Status**: Standby
- **Integration Type**: REST API
- **Authentication**: API keys

### Email Services

#### SendGrid
- **Purpose**: Transactional email
- **Status**: Active
- **Integration Type**: REST API
- **Authentication**: API key

```typescript
// Send email via SendGrid
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendInvoiceEmail(to: string, invoiceId: string) {
  const msg = {
    to,
    from: 'invoices@advanciapayledger.com',
    subject: `Invoice ${invoiceId}`,
    html: `<h1>Your Invoice</h1>...`,
    templateId: process.env.SENDGRID_INVOICE_TEMPLATE_ID,
    dynamicTemplateData: {
      invoiceId,
      invoiceUrl: `https://app.advanciapayledger.com/invoices/${invoiceId}`
    }
  };

  return sgMail.send(msg);
}
```

### SMS Services

#### Twilio
- **Purpose**: SMS notifications
- **Status**: Active
- **Integration Type**: REST API
- **Authentication**: Account SID and Auth Token

```typescript
// Send SMS via Twilio
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendPaymentReminder(phoneNumber: string, invoiceId: string) {
  const message = await client.messages.create({
    body: `Reminder: Invoice ${invoiceId} is due. Pay now: https://pay.advanciapayledger.com/${invoiceId}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber
  });

  return message;
}
```

### Banking Services

#### Plaid
- **Purpose**: Bank account verification
- **Status**: Active
- **Integration Type**: REST API
- **Authentication**: Client ID and Secret

```typescript
// Verify bank account via Plaid
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const configuration = new Configuration({
  basePath: PlaidEnvironments.production,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET
    }
  }
});

const plaidClient = new PlaidApi(configuration);

async function verifyBankAccount(publicToken: string) {
  const exchangeResponse = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken
  });

  return exchangeResponse.data;
}
```

### Analytics

#### Segment
- **Purpose**: Event tracking and analytics
- **Status**: Active
- **Integration Type**: JavaScript SDK
- **Authentication**: Write key

```typescript
// Track events via Segment
import Analytics from 'analytics-node';

const analytics = new Analytics(process.env.SEGMENT_WRITE_KEY);

async function trackPaymentEvent(userId: string, paymentData: any) {
  analytics.track({
    userId,
    event: 'Payment Processed',
    properties: {
      paymentId: paymentData.id,
      amount: paymentData.amount,
      method: paymentData.method,
      status: paymentData.status
    }
  });
}
```

---

## Integration Patterns

### Webhook Integration

```typescript
// Handle vendor webhooks
app.post('/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }

  res.json({ received: true });
});
```

### Retry Logic

```typescript
// Retry failed vendor calls
async function callVendorWithRetry(
  fn: () => Promise<any>,
  maxRetries: number = 3,
  backoffMultiplier: number = 2
) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(backoffMultiplier, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}
```

### Error Handling

```typescript
// Handle vendor-specific errors
async function processPaymentWithErrorHandling(paymentData: any) {
  try {
    return await processStripePayment(paymentData);
  } catch (error) {
    if (error.type === 'StripeCardError') {
      // Card was declined
      throw new PaymentError('Card declined', 'CARD_DECLINED');
    } else if (error.type === 'StripeRateLimitError') {
      // Rate limit exceeded
      throw new PaymentError('Rate limited', 'RATE_LIMITED');
    } else if (error.type === 'StripeAuthenticationError') {
      // Authentication failed
      throw new PaymentError('Auth failed', 'AUTH_FAILED');
    } else {
      // Generic error
      throw new PaymentError('Payment failed', 'PAYMENT_FAILED');
    }
  }
}
```

---

## Vendor Management

### API Key Management

```typescript
// Store vendor credentials securely
interface VendorCredentials {
  vendor: string;
  apiKey: string;
  apiSecret?: string;
  environment: 'test' | 'production';
  expiresAt?: Date;
  status: 'active' | 'inactive' | 'revoked';
}

// Retrieve credentials from secure storage
async function getVendorCredentials(vendor: string) {
  const credentials = await prisma.vendorCredential.findFirst({
    where: {
      vendor,
      status: 'active',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'test'
    }
  });

  if (!credentials) {
    throw new Error(`No credentials found for vendor: ${vendor}`);
  }

  return credentials;
}
```

### Vendor Health Monitoring

```typescript
// Monitor vendor API health
async function checkVendorHealth(vendor: string) {
  const healthChecks = {
    stripe: async () => {
      const account = await stripe.account.retrieve();
      return { status: 'healthy', vendor: 'stripe' };
    },
    sendgrid: async () => {
      const response = await fetch('https://api.sendgrid.com/v3/mail/validate', {
        headers: { 'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}` }
      });
      return { status: response.ok ? 'healthy' : 'unhealthy', vendor: 'sendgrid' };
    }
  };

  return healthChecks[vendor]?.();
}
```

### Vendor Failover

```typescript
// Failover to alternative vendor
async function processPaymentWithFailover(paymentData: any) {
  const vendors = ['stripe', 'square'];
  
  for (const vendor of vendors) {
    try {
      if (vendor === 'stripe') {
        return await processStripePayment(paymentData);
      } else if (vendor === 'square') {
        return await processSquarePayment(paymentData);
      }
    } catch (error) {
      console.error(`Payment failed with ${vendor}:`, error);
      
      if (vendor === vendors[vendors.length - 1]) {
        throw new PaymentError('All payment processors failed', 'ALL_FAILED');
      }
    }
  }
}
```

---

## Integration Testing

### Mock Vendor Responses

```typescript
// Mock vendor responses for testing
const mockVendors = {
  stripe: {
    processPayment: async (data: any) => ({
      id: 'pi_test_123',
      status: 'succeeded',
      amount: data.amount
    })
  },
  sendgrid: {
    sendEmail: async (data: any) => ({
      messageId: 'msg_test_123'
    })
  }
};
```

### Integration Tests

```typescript
describe('Vendor Integrations', () => {
  describe('Stripe', () => {
    it('should process payment successfully', async () => {
      const result = await processStripePayment({
        amount: 100,
        paymentMethodId: 'pm_test_123',
        idempotencyKey: 'key_123'
      });

      expect(result.status).toBe('succeeded');
    });

    it('should handle card declined error', async () => {
      await expect(
        processStripePayment({
          amount: 100,
          paymentMethodId: 'pm_test_declined',
          idempotencyKey: 'key_123'
        })
      ).rejects.toThrow('Card declined');
    });
  });
});
```

---

## Vendor Monitoring

### Metrics

```typescript
const vendorApiCalls = new Counter({
  name: 'vendor_api_calls_total',
  help: 'Total vendor API calls',
  labelNames: ['vendor', 'endpoint', 'status']
});

const vendorApiLatency = new Histogram({
  name: 'vendor_api_latency_seconds',
  help: 'Vendor API latency',
  labelNames: ['vendor', 'endpoint']
});

const vendorApiErrors = new Counter({
  name: 'vendor_api_errors_total',
  help: 'Total vendor API errors',
  labelNames: ['vendor', 'error_type']
});
```

### Alerts

```yaml
groups:
  - name: vendor_integrations
    rules:
      - alert: VendorApiDown
        expr: vendor_api_errors_total > 10
        for: 5m
        annotations:
          severity: critical
          summary: "Vendor API errors exceeding threshold"

      - alert: VendorApiLatencyHigh
        expr: vendor_api_latency_seconds > 5
        for: 5m
        annotations:
          severity: high
          summary: "Vendor API latency exceeding 5 seconds"
```

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
