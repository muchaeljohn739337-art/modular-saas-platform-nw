# Advancia PayLedger - API Client SDK Documentation

**Purpose**: Guide for using and integrating the API client SDK  
**Audience**: Frontend Developers, Integration Partners  
**Last Updated**: March 9, 2026

---

## SDK Overview

### Available SDKs

#### JavaScript/TypeScript SDK
```bash
npm install @advancia/payledger-sdk
```

#### Python SDK
```bash
pip install advancia-payledger
```

#### Go SDK
```bash
go get github.com/advancia/payledger-go
```

#### Java SDK
```bash
<dependency>
  <groupId>com.advancia</groupId>
  <artifactId>payledger-sdk</artifactId>
  <version>2.0.0</version>
</dependency>
```

---

## JavaScript/TypeScript SDK

### Installation

```bash
npm install @advancia/payledger-sdk
```

### Basic Setup

```typescript
import { AdvanciaClient } from '@advancia/payledger-sdk';

const client = new AdvanciaClient({
  apiKey: process.env.ADVANCIA_API_KEY,
  baseUrl: 'https://api.advanciapayledger.com',
  timeout: 30000
});
```

### Authentication

```typescript
// Using API Key
const client = new AdvanciaClient({
  apiKey: 'sk_live_xxxxx'
});

// Using OAuth Token
const client = new AdvanciaClient({
  accessToken: 'access_token_xxxxx'
});

// Using JWT Token
const client = new AdvanciaClient({
  jwtToken: 'eyJhbGciOiJIUzI1NiIs...'
});
```

### User Management

```typescript
// Create user
const user = await client.users.create({
  email: 'john@example.com',
  name: 'John Doe',
  role: 'PATIENT'
});

// Get user
const user = await client.users.get('user-123');

// Update user
const updated = await client.users.update('user-123', {
  name: 'Jane Doe'
});

// List users
const users = await client.users.list({
  limit: 10,
  offset: 0,
  role: 'PATIENT'
});

// Delete user
await client.users.delete('user-123');
```

### Invoice Management

```typescript
// Create invoice
const invoice = await client.invoices.create({
  patientId: 'pat-123',
  providerId: 'prov-456',
  amount: 500.00,
  dueDate: '2026-04-09T00:00:00Z',
  description: 'Medical services'
});

// Get invoice
const invoice = await client.invoices.get('inv-789');

// Update invoice
const updated = await client.invoices.update('inv-789', {
  status: 'SENT'
});

// List invoices
const invoices = await client.invoices.list({
  patientId: 'pat-123',
  status: 'PENDING',
  limit: 20
});

// Send invoice
await client.invoices.send('inv-789', {
  method: 'EMAIL',
  recipient: 'patient@example.com'
});

// Cancel invoice
await client.invoices.cancel('inv-789', {
  reason: 'Service not rendered'
});
```

### Payment Processing

```typescript
// Process payment
const payment = await client.payments.process({
  invoiceId: 'inv-789',
  amount: 500.00,
  method: 'CREDIT_CARD',
  cardToken: 'tok_visa'
});

// Get payment status
const payment = await client.payments.get('pay-123');

// Retry payment
const retried = await client.payments.retry('pay-123');

// Process refund
const refund = await client.payments.refund('pay-123', {
  amount: 500.00,
  reason: 'Customer request'
});

// List payments
const payments = await client.payments.list({
  status: 'COMPLETED',
  limit: 50
});
```

### Error Handling

```typescript
try {
  const invoice = await client.invoices.create({
    patientId: 'pat-123',
    providerId: 'prov-456',
    amount: 500.00,
    dueDate: '2026-04-09T00:00:00Z'
  });
} catch (error) {
  if (error instanceof AdvanciaValidationError) {
    console.error('Validation error:', error.message);
    console.error('Details:', error.details);
  } else if (error instanceof AdvanciaAuthError) {
    console.error('Authentication error:', error.message);
  } else if (error instanceof AdvanciaNetworkError) {
    console.error('Network error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Pagination

```typescript
// Get all invoices with pagination
let offset = 0;
const limit = 100;
let hasMore = true;

while (hasMore) {
  const response = await client.invoices.list({
    limit,
    offset
  });

  console.log(`Retrieved ${response.data.length} invoices`);

  if (response.data.length < limit) {
    hasMore = false;
  } else {
    offset += limit;
  }
}
```

### Webhooks

```typescript
// Register webhook
const webhook = await client.webhooks.create({
  url: 'https://example.com/webhooks/payments',
  events: ['payment.completed', 'payment.failed'],
  active: true
});

// List webhooks
const webhooks = await client.webhooks.list();

// Update webhook
await client.webhooks.update('webhook-123', {
  active: false
});

// Delete webhook
await client.webhooks.delete('webhook-123');

// Verify webhook signature
const isValid = client.webhooks.verifySignature(
  payload,
  signature,
  secret
);
```

---

## Python SDK

### Installation

```bash
pip install advancia-payledger
```

### Basic Setup

```python
from advancia import AdvanciaClient

client = AdvanciaClient(
    api_key='sk_live_xxxxx',
    base_url='https://api.advanciapayledger.com'
)
```

### Usage Examples

```python
# Create invoice
invoice = client.invoices.create(
    patient_id='pat-123',
    provider_id='prov-456',
    amount=500.00,
    due_date='2026-04-09T00:00:00Z'
)

# Get invoice
invoice = client.invoices.get('inv-789')

# List invoices
invoices = client.invoices.list(
    patient_id='pat-123',
    status='PENDING',
    limit=20
)

# Process payment
payment = client.payments.process(
    invoice_id='inv-789',
    amount=500.00,
    method='CREDIT_CARD',
    card_token='tok_visa'
)

# Handle errors
try:
    invoice = client.invoices.create(...)
except AdvanciaValidationError as e:
    print(f'Validation error: {e.message}')
except AdvanciaAuthError as e:
    print(f'Auth error: {e.message}')
```

---

## Go SDK

### Installation

```bash
go get github.com/advancia/payledger-go
```

### Basic Setup

```go
package main

import (
    "github.com/advancia/payledger-go"
)

func main() {
    client := payledger.NewClient(
        payledger.WithAPIKey("sk_live_xxxxx"),
        payledger.WithBaseURL("https://api.advanciapayledger.com"),
    )
}
```

### Usage Examples

```go
// Create invoice
invoice, err := client.Invoices.Create(ctx, &payledger.CreateInvoiceRequest{
    PatientID:  "pat-123",
    ProviderID: "prov-456",
    Amount:     500.00,
    DueDate:    "2026-04-09T00:00:00Z",
})
if err != nil {
    log.Fatal(err)
}

// Get invoice
invoice, err := client.Invoices.Get(ctx, "inv-789")

// List invoices
invoices, err := client.Invoices.List(ctx, &payledger.ListInvoicesRequest{
    PatientID: "pat-123",
    Status:    "PENDING",
    Limit:     20,
})

// Process payment
payment, err := client.Payments.Process(ctx, &payledger.ProcessPaymentRequest{
    InvoiceID: "inv-789",
    Amount:    500.00,
    Method:    "CREDIT_CARD",
    CardToken: "tok_visa",
})
```

---

## Java SDK

### Installation

```xml
<dependency>
  <groupId>com.advancia</groupId>
  <artifactId>payledger-sdk</artifactId>
  <version>2.0.0</version>
</dependency>
```

### Basic Setup

```java
import com.advancia.payledger.AdvanciaClient;

AdvanciaClient client = new AdvanciaClient.Builder()
    .apiKey("sk_live_xxxxx")
    .baseUrl("https://api.advanciapayledger.com")
    .build();
```

### Usage Examples

```java
// Create invoice
Invoice invoice = client.invoices().create(
    CreateInvoiceRequest.builder()
        .patientId("pat-123")
        .providerId("prov-456")
        .amount(500.00)
        .dueDate("2026-04-09T00:00:00Z")
        .build()
);

// Get invoice
Invoice invoice = client.invoices().get("inv-789");

// List invoices
InvoiceList invoices = client.invoices().list(
    ListInvoicesRequest.builder()
        .patientId("pat-123")
        .status("PENDING")
        .limit(20)
        .build()
);

// Process payment
Payment payment = client.payments().process(
    ProcessPaymentRequest.builder()
        .invoiceId("inv-789")
        .amount(500.00)
        .method("CREDIT_CARD")
        .cardToken("tok_visa")
        .build()
);
```

---

## Rate Limiting

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1646870400
```

### Handling Rate Limits

```typescript
try {
  const invoice = await client.invoices.create({...});
} catch (error) {
  if (error.status === 429) {
    const retryAfter = error.headers['retry-after'];
    console.log(`Rate limited. Retry after ${retryAfter} seconds`);
    
    // Implement exponential backoff
    await new Promise(resolve => 
      setTimeout(resolve, retryAfter * 1000)
    );
    
    // Retry request
    const invoice = await client.invoices.create({...});
  }
}
```

---

## Idempotency

### Using Idempotency Keys

```typescript
const payment = await client.payments.process(
  {
    invoiceId: 'inv-789',
    amount: 500.00,
    method: 'CREDIT_CARD'
  },
  {
    idempotencyKey: 'unique-key-12345'
  }
);

// Same request with same key returns cached result
const samePayment = await client.payments.process(
  {
    invoiceId: 'inv-789',
    amount: 500.00,
    method: 'CREDIT_CARD'
  },
  {
    idempotencyKey: 'unique-key-12345'
  }
);

// Returns same payment, no duplicate charge
```

---

## Testing

### Mock Client

```typescript
import { MockAdvanciaClient } from '@advancia/payledger-sdk/testing';

const mockClient = new MockAdvanciaClient();

mockClient.invoices.mockCreate({
  id: 'inv-123',
  status: 'PENDING',
  amount: 500.00
});

const invoice = await mockClient.invoices.create({...});
expect(invoice.id).toBe('inv-123');
```

### Integration Testing

```typescript
import { AdvanciaClient } from '@advancia/payledger-sdk';

describe('Invoice API', () => {
  let client: AdvanciaClient;

  beforeEach(() => {
    client = new AdvanciaClient({
      apiKey: process.env.TEST_API_KEY
    });
  });

  it('should create invoice', async () => {
    const invoice = await client.invoices.create({
      patientId: 'pat-123',
      providerId: 'prov-456',
      amount: 500.00,
      dueDate: '2026-04-09T00:00:00Z'
    });

    expect(invoice.id).toBeDefined();
    expect(invoice.status).toBe('DRAFT');
  });

  it('should list invoices', async () => {
    const invoices = await client.invoices.list({
      limit: 10
    });

    expect(Array.isArray(invoices.data)).toBe(true);
  });
});
```

---

## Best Practices

### 1. Error Handling
- Always wrap API calls in try-catch
- Handle specific error types
- Implement retry logic for transient errors
- Log errors with context

### 2. Performance
- Use pagination for large datasets
- Implement caching where appropriate
- Batch operations when possible
- Use connection pooling

### 3. Security
- Store API keys in environment variables
- Use HTTPS for all requests
- Validate webhook signatures
- Implement rate limiting

### 4. Monitoring
- Log all API calls
- Track error rates
- Monitor latency
- Alert on failures

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
