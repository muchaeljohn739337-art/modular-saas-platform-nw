# Advancia PayLedger - API Versioning Strategy

**Purpose**: Manage API versions and backward compatibility  
**Audience**: Backend Engineers, API Consumers  
**Last Updated**: March 9, 2026

---

## Versioning Strategy

### Semantic Versioning

```
MAJOR.MINOR.PATCH
v2.1.3

- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes
```

### API Versioning Approach

#### URL-Based Versioning
```
GET /api/v1/invoices
GET /api/v2/invoices
```

#### Header-Based Versioning
```
GET /api/invoices
Accept: application/vnd.advancia.v2+json
```

#### Query Parameter Versioning
```
GET /api/invoices?version=2
```

**Recommended**: URL-based versioning for clarity

---

## Version Management

### Current API Versions

#### v1 (Legacy - Deprecated)
- Status: Deprecated
- Sunset Date: December 31, 2026
- Support: Critical fixes only

#### v2 (Current)
- Status: Active
- Release Date: March 9, 2026
- Support: Full

#### v3 (Beta)
- Status: Beta
- Release Date: June 9, 2026
- Support: Limited

---

## API v2 Endpoints

### User Management

```typescript
// GET /api/v2/users
// List users with pagination
GET /api/v2/users?limit=10&offset=0

// GET /api/v2/users/:id
// Get user by ID
GET /api/v2/users/user-123

// POST /api/v2/users
// Create new user
POST /api/v2/users
{
  "email": "john@example.com",
  "name": "John Doe",
  "role": "PATIENT"
}

// PUT /api/v2/users/:id
// Update user
PUT /api/v2/users/user-123
{
  "name": "Jane Doe"
}

// DELETE /api/v2/users/:id
// Delete user
DELETE /api/v2/users/user-123
```

### Invoice Management

```typescript
// GET /api/v2/invoices
// List invoices
GET /api/v2/invoices?status=PENDING&limit=20

// GET /api/v2/invoices/:id
// Get invoice details
GET /api/v2/invoices/inv-123

// POST /api/v2/invoices
// Create invoice
POST /api/v2/invoices
{
  "patientId": "pat-123",
  "providerId": "prov-456",
  "amount": 500.00,
  "dueDate": "2026-04-09T00:00:00Z"
}

// PUT /api/v2/invoices/:id
// Update invoice
PUT /api/v2/invoices/inv-123
{
  "status": "SENT"
}

// POST /api/v2/invoices/:id/send
// Send invoice
POST /api/v2/invoices/inv-123/send
{
  "method": "EMAIL",
  "recipient": "patient@example.com"
}
```

### Payment Processing

```typescript
// POST /api/v2/payments/process
// Process payment
POST /api/v2/payments/process
{
  "invoiceId": "inv-123",
  "amount": 500.00,
  "method": "CREDIT_CARD",
  "cardToken": "tok_visa"
}

// GET /api/v2/payments/:id
// Get payment status
GET /api/v2/payments/pay-123

// POST /api/v2/payments/:id/refund
// Refund payment
POST /api/v2/payments/pay-123/refund
{
  "amount": 500.00,
  "reason": "Customer request"
}

// GET /api/v2/payments
// List payments
GET /api/v2/payments?status=COMPLETED&limit=50
```

---

## Breaking Changes Management

### v1 to v2 Migration

#### Removed Endpoints
```
DELETE /api/v1/invoices/:id/archive (Use DELETE instead)
GET /api/v1/invoices/:id/history (Use audit logs instead)
```

#### Changed Response Format
```
// v1 Response
{
  "success": true,
  "data": { "id": "inv-123" }
}

// v2 Response
{
  "id": "inv-123",
  "status": "PENDING"
}
```

#### Changed Field Names
```
// v1
{ "invoice_number": "INV-001" }

// v2
{ "invoiceNumber": "INV-001" }
```

### Migration Guide

```typescript
// Support both v1 and v2 during transition
app.get('/api/v1/invoices/:id', async (req, res) => {
  const invoice = await getInvoice(req.params.id);
  
  // Transform to v1 format
  res.json({
    success: true,
    data: invoice
  });
});

app.get('/api/v2/invoices/:id', async (req, res) => {
  const invoice = await getInvoice(req.params.id);
  
  // Return v2 format
  res.json(invoice);
});
```

---

## Deprecation Process

### Phase 1: Announcement (3 months before)
```
- Announce deprecation in API docs
- Send email to API consumers
- Update SDK documentation
- Create migration guide
```

### Phase 2: Deprecation (6 months)
```
- Add deprecation headers to responses
- Log deprecation warnings
- Provide migration support
- Monitor usage
```

### Phase 3: Sunset (12 months)
```
- Remove deprecated version
- Redirect to new version
- Archive documentation
- Notify remaining users
```

### Deprecation Headers

```
Deprecation: true
Sunset: Sun, 31 Dec 2026 23:59:59 GMT
Link: <https://docs.advancia.com/migration-v1-to-v2>; rel="deprecation"
```

---

## Version Detection

### Middleware

```typescript
// middleware/apiVersion.ts
export function detectApiVersion(req: Request, res: Response, next: NextFunction) {
  // Extract version from URL
  const match = req.path.match(/^\/api\/(v\d+)\//);
  const version = match ? match[1] : 'v2'; // Default to v2

  req.apiVersion = version;

  // Add version header to response
  res.set('API-Version', version);

  next();
}

// Usage
app.use(detectApiVersion);
```

### Version-Specific Handlers

```typescript
// routes/invoices.ts
router.get('/api/v1/invoices/:id', handleV1GetInvoice);
router.get('/api/v2/invoices/:id', handleV2GetInvoice);

async function handleV1GetInvoice(req: Request, res: Response) {
  const invoice = await getInvoice(req.params.id);
  res.json({
    success: true,
    data: invoice
  });
}

async function handleV2GetInvoice(req: Request, res: Response) {
  const invoice = await getInvoice(req.params.id);
  res.json(invoice);
}
```

---

## Testing Versions

### Version-Specific Tests

```typescript
describe('API Versioning', () => {
  describe('v1 API', () => {
    it('should return v1 format', async () => {
      const res = await request(app)
        .get('/api/v1/invoices/inv-123');

      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('data');
    });
  });

  describe('v2 API', () => {
    it('should return v2 format', async () => {
      const res = await request(app)
        .get('/api/v2/invoices/inv-123');

      expect(res.body).toHaveProperty('id');
      expect(res.body).not.toHaveProperty('success');
    });
  });
});
```

---

## Documentation

### API Documentation Structure

```
docs/
├── v1/
│   ├── overview.md
│   ├── authentication.md
│   ├── endpoints.md
│   └── deprecation.md
├── v2/
│   ├── overview.md
│   ├── authentication.md
│   ├── endpoints.md
│   └── migration-guide.md
└── v3/
    ├── overview.md
    ├── beta-features.md
    └── feedback.md
```

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
