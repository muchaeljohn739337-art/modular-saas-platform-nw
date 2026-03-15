# Advancia PayLedger - Webhook Management Guide

**Purpose**: Manage webhooks for event notifications  
**Audience**: Backend Engineers, Integration Partners  
**Last Updated**: March 9, 2026

---

## Webhook Overview

### Supported Events

#### Payment Events
- `payment.created` - Payment created
- `payment.processing` - Payment processing started
- `payment.completed` - Payment completed successfully
- `payment.failed` - Payment failed
- `payment.refunded` - Payment refunded
- `payment.disputed` - Payment disputed

#### Invoice Events
- `invoice.created` - Invoice created
- `invoice.sent` - Invoice sent to patient
- `invoice.viewed` - Invoice viewed by patient
- `invoice.paid` - Invoice marked as paid
- `invoice.overdue` - Invoice became overdue
- `invoice.cancelled` - Invoice cancelled

#### User Events
- `user.created` - User created
- `user.updated` - User updated
- `user.deleted` - User deleted
- `user.verified` - User email verified

#### Account Events
- `account.created` - Account created
- `account.updated` - Account updated
- `account.suspended` - Account suspended
- `account.closed` - Account closed

---

## Webhook Registration

### Create Webhook

```typescript
// POST /api/webhooks
const webhook = await client.webhooks.create({
  url: 'https://example.com/webhooks/payments',
  events: [
    'payment.completed',
    'payment.failed',
    'invoice.paid'
  ],
  active: true,
  description: 'Payment notifications'
});

// Response
{
  "id": "webhook-123",
  "url": "https://example.com/webhooks/payments",
  "events": ["payment.completed", "payment.failed", "invoice.paid"],
  "active": true,
  "createdAt": "2026-03-09T10:00:00Z",
  "secret": "whsec_xxxxx"
}
```

### List Webhooks

```typescript
// GET /api/webhooks
const webhooks = await client.webhooks.list({
  limit: 10,
  offset: 0
});

// Response
{
  "data": [
    {
      "id": "webhook-123",
      "url": "https://example.com/webhooks/payments",
      "events": ["payment.completed", "payment.failed"],
      "active": true,
      "createdAt": "2026-03-09T10:00:00Z"
    }
  ],
  "total": 1
}
```

### Update Webhook

```typescript
// PUT /api/webhooks/webhook-123
const updated = await client.webhooks.update('webhook-123', {
  url: 'https://example.com/webhooks/payments-v2',
  events: ['payment.completed', 'payment.failed', 'invoice.paid'],
  active: true
});
```

### Delete Webhook

```typescript
// DELETE /api/webhooks/webhook-123
await client.webhooks.delete('webhook-123');
```

---

## Webhook Payload

### Payment Completed Event

```json
{
  "id": "evt-123",
  "type": "payment.completed",
  "timestamp": "2026-03-09T10:00:00Z",
  "data": {
    "id": "pay-456",
    "invoiceId": "inv-789",
    "amount": 500.00,
    "currency": "USD",
    "method": "CREDIT_CARD",
    "status": "COMPLETED",
    "processingTime": 2.5,
    "createdAt": "2026-03-09T10:00:00Z",
    "completedAt": "2026-03-09T10:00:02Z"
  }
}
```

### Invoice Paid Event

```json
{
  "id": "evt-124",
  "type": "invoice.paid",
  "timestamp": "2026-03-09T10:00:02Z",
  "data": {
    "id": "inv-789",
    "invoiceNumber": "INV-2026-001",
    "patientId": "pat-123",
    "providerId": "prov-456",
    "amount": 500.00,
    "status": "PAID",
    "paidAt": "2026-03-09T10:00:02Z",
    "paymentId": "pay-456"
  }
}
```

### Payment Failed Event

```json
{
  "id": "evt-125",
  "type": "payment.failed",
  "timestamp": "2026-03-09T10:00:05Z",
  "data": {
    "id": "pay-457",
    "invoiceId": "inv-790",
    "amount": 300.00,
    "method": "CREDIT_CARD",
    "status": "FAILED",
    "failureReason": "card_declined",
    "failureCode": "card_declined",
    "createdAt": "2026-03-09T10:00:00Z",
    "failedAt": "2026-03-09T10:00:05Z"
  }
}
```

---

## Webhook Signature Verification

### Signature Header

```
X-Webhook-Signature: sha256=xxxxx
X-Webhook-Timestamp: 1646870400
X-Webhook-ID: evt-123
```

### Verification Process

```typescript
// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}

// Usage
const isValid = verifyWebhookSignature(
  JSON.stringify(req.body),
  req.headers['x-webhook-signature'],
  process.env.WEBHOOK_SECRET
);

if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### Timestamp Validation

```typescript
// Validate timestamp to prevent replay attacks
function validateTimestamp(timestamp: number, maxAge: number = 300): boolean {
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;
  
  return age >= 0 && age <= maxAge;
}

// Usage
const timestamp = parseInt(req.headers['x-webhook-timestamp']);

if (!validateTimestamp(timestamp)) {
  return res.status(401).json({ error: 'Timestamp too old' });
}
```

---

## Webhook Handler Implementation

### Express Handler

```typescript
// routes/webhooks.ts
import express from 'express';
import { verifyWebhookSignature } from '@/utils/webhooks';

const router = express.Router();

router.post('/webhooks/payments', async (req, res) => {
  try {
    // Verify signature
    const signature = req.headers['x-webhook-signature'];
    const payload = JSON.stringify(req.body);
    
    if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Verify timestamp
    const timestamp = parseInt(req.headers['x-webhook-timestamp']);
    if (!validateTimestamp(timestamp)) {
      return res.status(401).json({ error: 'Timestamp too old' });
    }

    const event = req.body;

    // Handle different event types
    switch (event.type) {
      case 'payment.completed':
        await handlePaymentCompleted(event.data);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event.data);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }

    // Acknowledge receipt
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handlePaymentCompleted(data: any) {
  console.log('Payment completed:', data.id);
  // Update invoice status
  await updateInvoiceStatus(data.invoiceId, 'PAID');
  // Send confirmation email
  await sendPaymentConfirmationEmail(data);
  // Update analytics
  await recordPaymentMetric(data);
}

async function handlePaymentFailed(data: any) {
  console.log('Payment failed:', data.id);
  // Send failure notification
  await sendPaymentFailureEmail(data);
  // Log failure
  await logPaymentFailure(data);
}

async function handleInvoicePaid(data: any) {
  console.log('Invoice paid:', data.id);
  // Update records
  await markInvoiceAsPaid(data.id);
  // Send receipt
  await sendPaymentReceipt(data);
}

export default router;
```

---

## Webhook Retry Logic

### Automatic Retries

```typescript
// Webhook delivery with retries
async function deliverWebhook(
  webhook: Webhook,
  event: Event,
  retryCount: number = 0
): Promise<void> {
  const maxRetries = 5;
  const backoffMultiplier = 2;
  const initialDelay = 1000; // 1 second

  try {
    const response = await axios.post(webhook.url, event, {
      headers: {
        'X-Webhook-Signature': generateSignature(webhook.secret, event),
        'X-Webhook-Timestamp': Math.floor(Date.now() / 1000),
        'X-Webhook-ID': event.id,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.status >= 200 && response.status < 300) {
      console.log('Webhook delivered successfully:', webhook.id);
      return;
    }

    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    if (retryCount < maxRetries) {
      const delay = initialDelay * Math.pow(backoffMultiplier, retryCount);
      console.log(`Retrying webhook in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);

      setTimeout(() => {
        deliverWebhook(webhook, event, retryCount + 1);
      }, delay);
    } else {
      console.error('Webhook delivery failed after max retries:', webhook.id);
      await logWebhookFailure(webhook.id, event.id, error);
    }
  }
}
```

### Retry Status Tracking

```typescript
// Track webhook delivery attempts
interface WebhookDelivery {
  webhookId: string;
  eventId: string;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  lastAttempt: Date;
  nextRetry?: Date;
  error?: string;
}

async function trackWebhookDelivery(delivery: WebhookDelivery) {
  await prisma.webhookDelivery.upsert({
    where: {
      webhookId_eventId: {
        webhookId: delivery.webhookId,
        eventId: delivery.eventId
      }
    },
    update: delivery,
    create: delivery
  });
}
```

---

## Webhook Testing

### Test Webhook

```typescript
// POST /api/webhooks/webhook-123/test
const testResult = await client.webhooks.test('webhook-123');

// Response
{
  "success": true,
  "statusCode": 200,
  "responseTime": 245,
  "message": "Webhook test successful"
}
```

### Manual Testing with curl

```bash
# Send test webhook
curl -X POST https://example.com/webhooks/payments \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=xxxxx" \
  -H "X-Webhook-Timestamp: $(date +%s)" \
  -d '{
    "id": "evt-test-123",
    "type": "payment.completed",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "data": {
      "id": "pay-test-456",
      "invoiceId": "inv-test-789",
      "amount": 500.00,
      "status": "COMPLETED"
    }
  }'
```

---

## Webhook Monitoring

### Delivery Metrics

```typescript
// Monitor webhook deliveries
async function getWebhookMetrics(webhookId: string, period: string = '24h') {
  const deliveries = await prisma.webhookDelivery.findMany({
    where: {
      webhookId,
      lastAttempt: {
        gte: getPeriodStart(period)
      }
    }
  });

  const total = deliveries.length;
  const successful = deliveries.filter(d => d.status === 'delivered').length;
  const failed = deliveries.filter(d => d.status === 'failed').length;
  const pending = deliveries.filter(d => d.status === 'pending').length;

  return {
    total,
    successful,
    failed,
    pending,
    successRate: (successful / total) * 100
  };
}
```

### Alert Rules

```yaml
# Webhook delivery alerts
groups:
  - name: webhooks
    rules:
      - alert: WebhookDeliveryFailureRate
        expr: webhook_delivery_failures / webhook_delivery_total > 0.05
        for: 10m
        annotations:
          severity: high
          summary: "Webhook delivery failure rate > 5%"

      - alert: WebhookQueueBacklog
        expr: webhook_queue_size > 10000
        for: 5m
        annotations:
          severity: high
          summary: "Webhook queue backlog > 10,000"
```

---

## Best Practices

### 1. Idempotency
- Use event ID to prevent duplicate processing
- Store processed event IDs
- Handle retries gracefully

### 2. Timeout Handling
- Set appropriate timeouts
- Implement exponential backoff
- Log all failures

### 3. Security
- Verify signatures
- Validate timestamps
- Use HTTPS only
- Rotate secrets regularly

### 4. Monitoring
- Track delivery metrics
- Alert on failures
- Monitor queue size
- Log all events

### 5. Testing
- Test webhook handlers
- Verify signature validation
- Test retry logic
- Load test webhook delivery

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
