# Advancia PayLedger - API Specification

## Base URLs

- **Development**: `http://localhost:3001`
- **Staging**: `https://staging-api.advanciapayledger.com`
- **Production**: `https://api.advanciapayledger.com`

## Authentication

All endpoints (except `/health` and `/api`) require Bearer token authentication:

```
Authorization: Bearer <jwt_token>
```

### Token Format
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "PATIENT|PROVIDER|STAFF|ADMIN|SUPER_ADMIN",
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## Core API Endpoints

### Health & Info

#### GET /health
Health check endpoint for service monitoring.

**Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2026-03-09T04:57:00Z",
  "service": "advancia-payledger-backend",
  "database": "neon-postgresql",
  "environment": "production"
}
```

#### GET /api
API information and available endpoints.

**Response** (200 OK):
```json
{
  "message": "Advancia PayLedger API",
  "version": "2.0.0",
  "database": "Neon PostgreSQL",
  "endpoints": {
    "health": "/health",
    "users": "/api/users",
    "patients": "/api/patients",
    "providers": "/api/providers",
    "invoices": "/api/invoices",
    "payments": "/api/payments"
  }
}
```

---

## User Management

### POST /api/auth/register
Register a new user.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "role": "PATIENT"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "PATIENT",
    "createdAt": "2026-03-09T04:57:00Z"
  }
}
```

**Errors**:
- `400` - Invalid input or weak password
- `409` - Email already exists

### POST /api/auth/login
Authenticate user and get tokens.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600,
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "role": "PATIENT"
    }
  }
}
```

**Errors**:
- `401` - Invalid credentials
- `404` - User not found

### POST /api/auth/refresh
Refresh access token using refresh token.

**Request**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "expiresIn": 3600
  }
}
```

### POST /api/auth/logout
Logout user and invalidate tokens.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Patient Management

### GET /api/patients
List all patients (admin only).

**Query Parameters**:
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 10)
- `search` (string): Search by name or email

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "pat-123",
      "userId": "user-123",
      "medicalRecordNumber": "MRN-001",
      "dateOfBirth": "1990-01-15",
      "gender": "MALE",
      "phoneNumber": "+1234567890",
      "createdAt": "2026-03-09T04:57:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

### GET /api/patients/:patientId
Get patient details.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "pat-123",
    "userId": "user-123",
    "medicalRecordNumber": "MRN-001",
    "dateOfBirth": "1990-01-15",
    "gender": "MALE",
    "phoneNumber": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001"
    },
    "insuranceInfo": {
      "provider": "Blue Cross",
      "policyNumber": "BC123456"
    }
  }
}
```

### PUT /api/patients/:patientId
Update patient information.

**Request**:
```json
{
  "phoneNumber": "+1987654321",
  "address": {
    "street": "456 Oak Ave",
    "city": "Boston",
    "state": "MA",
    "zip": "02101"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "pat-123",
    "updatedAt": "2026-03-09T04:57:00Z"
  }
}
```

---

## Invoice Management

### POST /api/invoices
Create a new invoice.

**Request**:
```json
{
  "patientId": "pat-123",
  "providerId": "prov-456",
  "amount": 500.00,
  "dueDate": "2026-04-09T00:00:00Z",
  "items": [
    {
      "description": "Office Visit",
      "quantity": 1,
      "unitPrice": 150.00
    },
    {
      "description": "Lab Work",
      "quantity": 1,
      "unitPrice": 350.00
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "inv-123",
    "invoiceNumber": "INV-2026-001",
    "patientId": "pat-123",
    "providerId": "prov-456",
    "totalAmount": 500.00,
    "status": "DRAFT",
    "dueDate": "2026-04-09T00:00:00Z",
    "createdAt": "2026-03-09T04:57:00Z"
  }
}
```

### GET /api/invoices
List invoices with filtering.

**Query Parameters**:
- `page` (int): Page number
- `limit` (int): Items per page
- `status` (string): Filter by status (DRAFT, SENT, PAID, OVERDUE, etc.)
- `patientId` (string): Filter by patient
- `providerId` (string): Filter by provider
- `startDate` (ISO 8601): Filter by date range
- `endDate` (ISO 8601): Filter by date range

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "inv-123",
      "invoiceNumber": "INV-2026-001",
      "patientId": "pat-123",
      "providerId": "prov-456",
      "totalAmount": 500.00,
      "amountPaid": 250.00,
      "balance": 250.00,
      "status": "PARTIALLY_PAID",
      "dueDate": "2026-04-09T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

### GET /api/invoices/:invoiceId
Get invoice details.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "inv-123",
    "invoiceNumber": "INV-2026-001",
    "patientId": "pat-123",
    "providerId": "prov-456",
    "totalAmount": 500.00,
    "amountPaid": 250.00,
    "balance": 250.00,
    "status": "PARTIALLY_PAID",
    "items": [
      {
        "id": "item-1",
        "description": "Office Visit",
        "quantity": 1,
        "unitPrice": 150.00,
        "totalAmount": 150.00
      }
    ],
    "payments": [
      {
        "id": "pay-1",
        "amount": 250.00,
        "method": "CREDIT_CARD",
        "processedAt": "2026-03-08T10:00:00Z"
      }
    ]
  }
}
```

### PUT /api/invoices/:invoiceId
Update invoice.

**Request**:
```json
{
  "status": "SENT",
  "dueDate": "2026-04-15T00:00:00Z"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "inv-123",
    "status": "SENT",
    "updatedAt": "2026-03-09T04:57:00Z"
  }
}
```

### POST /api/invoices/:invoiceId/send
Send invoice to patient.

**Request**:
```json
{
  "method": "EMAIL",
  "message": "Please review and pay by the due date"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "inv-123",
    "status": "SENT",
    "sentAt": "2026-03-09T04:57:00Z",
    "sentVia": "EMAIL"
  }
}
```

---

## Payment Processing

### POST /api/payments/process
Process a payment.

**Request**:
```json
{
  "invoiceId": "inv-123",
  "amount": 250.00,
  "method": "CREDIT_CARD",
  "cardToken": "tok_visa",
  "idempotencyKey": "unique-key-123"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "pay-123",
    "paymentNumber": "PAY-2026-001",
    "invoiceId": "inv-123",
    "amount": 250.00,
    "method": "CREDIT_CARD",
    "status": "COMPLETED",
    "transactionId": "txn_123456",
    "processedAt": "2026-03-09T04:57:00Z"
  }
}
```

**Errors**:
- `400` - Invalid payment data
- `402` - Payment declined
- `409` - Duplicate payment (same idempotencyKey)

### GET /api/payments/:paymentId
Get payment details.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "pay-123",
    "paymentNumber": "PAY-2026-001",
    "invoiceId": "inv-123",
    "amount": 250.00,
    "method": "CREDIT_CARD",
    "status": "COMPLETED",
    "transactionId": "txn_123456",
    "processorResponse": {
      "status": "succeeded",
      "receipt_url": "https://..."
    },
    "processedAt": "2026-03-09T04:57:00Z"
  }
}
```

### POST /api/payments/:paymentId/refund
Process a refund.

**Request**:
```json
{
  "amount": 250.00,
  "reason": "Customer request"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "refund-123",
    "paymentId": "pay-123",
    "amount": 250.00,
    "status": "COMPLETED",
    "reason": "Customer request",
    "processedAt": "2026-03-09T04:57:00Z"
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "error details"
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_INPUT` | 400 | Invalid request parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (duplicate, etc.) |
| `VALIDATION_ERROR` | 422 | Validation failed |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## Rate Limiting

All endpoints are rate limited:

- **Public endpoints**: 100 requests per minute
- **Authenticated endpoints**: 1000 requests per minute
- **Payment endpoints**: 10 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1234567890
```

---

## Pagination

List endpoints support pagination:

**Query Parameters**:
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 10, max: 100)
- `sort` (string): Sort field (default: createdAt)
- `order` (string): Sort order (asc|desc, default: desc)

**Response**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

---

## Filtering

List endpoints support filtering:

```
GET /api/invoices?status=PAID&patientId=pat-123&startDate=2026-01-01&endDate=2026-03-09
```

---

## Webhooks

Services can register webhooks for event notifications:

### POST /api/webhooks
Register a webhook.

**Request**:
```json
{
  "url": "https://example.com/webhook",
  "events": ["invoice.created", "payment.completed"],
  "secret": "webhook-secret"
}
```

### Webhook Payload

```json
{
  "id": "event-123",
  "type": "invoice.created",
  "timestamp": "2026-03-09T04:57:00Z",
  "data": {
    "id": "inv-123",
    "invoiceNumber": "INV-2026-001",
    "amount": 500.00
  }
}
```

---

## API Versioning

Current API version: **v2.0.0**

Version header:
```
X-API-Version: 2.0.0
```

---

## Support

For API support:
- **Documentation**: https://docs.advanciapayledger.com
- **Issues**: https://github.com/muchaeljohn739337-art/modular-saas-platform-nw/issues
- **Email**: api-support@advancia.com
