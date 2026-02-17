# Advancia Pay Ledger API Documentation

**Version:** 1.0  
**Base URL:** `https://api.advanciapayledger.com`  
**Environment:** Production

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Core Concepts](#core-concepts)
4. [API Endpoints](#api-endpoints)
   - [Authentication & Users](#authentication--users)
   - [Healthcare Facilities](#healthcare-facilities)
   - [Patients](#patients)
   - [Payments](#payments)
   - [Blockchain Transactions](#blockchain-transactions)
   - [Invoices & Billing](#invoices--billing)
   - [Reports & Analytics](#reports--analytics)
   - [Webhooks](#webhooks)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Webhooks](#webhooks-reference)
8. [SDKs & Libraries](#sdks--libraries)

---

## Overview

Advancia Pay Ledger provides a comprehensive healthcare payment processing platform that seamlessly integrates traditional payment methods with cryptocurrency options. Our API enables healthcare facilities to manage patient billing, process payments across multiple blockchain networks, and maintain HIPAA-compliant records.

### Key Features

- **Multi-Payment Support:** Traditional (credit/debit, ACH) and cryptocurrency (Solana, Ethereum, Polygon, Base)
- **HIPAA Compliant:** All patient data handling meets healthcare privacy standards
- **PCI-DSS Certified:** Secure payment processing infrastructure
- **Real-time Processing:** Instant payment confirmations and balance updates
- **Comprehensive Reporting:** Financial analytics and compliance reports

### Supported Blockchain Networks

- Solana (SOL)
- Ethereum (ETH)
- Polygon (MATIC)
- Base (ETH)

---

## Authentication

All API requests require authentication using JWT (JSON Web Tokens) or API keys.

### Authentication Methods

#### 1. JWT Authentication (User Sessions)

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@facility.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "usr_abc123",
      "email": "user@facility.com",
      "role": "FACILITY_ADMIN",
      "facilityId": "fac_xyz789"
    }
  }
}
```

**Usage:**
```http
GET /api/v1/facilities/fac_xyz789
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 2. API Key Authentication (System Integration)

```http
GET /api/v1/patients
X-API-Key: apk_live_1234567890abcdef
```

**Obtaining API Keys:**
- Navigate to Settings → API Keys in your dashboard
- Generate new key with appropriate permissions
- Store securely (keys are only shown once)

### Token Refresh

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Core Concepts

### Resource IDs

All resources use prefixed IDs for easy identification:

- `usr_` - Users
- `fac_` - Healthcare Facilities
- `pat_` - Patients
- `pmt_` - Payments
- `inv_` - Invoices
- `txn_` - Blockchain Transactions
- `apk_` - API Keys

### Pagination

List endpoints support cursor-based pagination:

```http
GET /api/v1/patients?limit=50&cursor=crs_abc123
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "hasMore": true,
    "nextCursor": "crs_def456",
    "total": 1247
  }
}
```

### Filtering & Sorting

```http
GET /api/v1/payments?status=completed&startDate=2025-01-01&sort=-createdAt
```

**Common Filters:**
- `status` - Filter by status
- `startDate` / `endDate` - Date range
- `search` - Text search
- `sort` - Sort field (prefix `-` for descending)

---

## API Endpoints

### Authentication & Users

#### Login

```http
POST /api/v1/auth/login
```

Creates a new user session and returns authentication tokens.

**Request Body:**
```json
{
  "email": "admin@healthclinic.com",
  "password": "SecurePass123!",
  "mfaCode": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "usr_abc123",
      "email": "admin@healthclinic.com",
      "role": "FACILITY_ADMIN",
      "facilityId": "fac_xyz789",
      "permissions": ["READ", "WRITE", "MANAGE_BILLING"]
    }
  }
}
```

#### Logout

```http
POST /api/v1/auth/logout
Authorization: Bearer {token}
```

Invalidates the current session token.

#### Get Current User

```http
GET /api/v1/users/me
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "admin@healthclinic.com",
    "firstName": "John",
    "lastName": "Smith",
    "role": "FACILITY_ADMIN",
    "facilityId": "fac_xyz789",
    "createdAt": "2024-11-15T10:30:00Z",
    "lastLogin": "2025-01-31T08:45:00Z"
  }
}
```

#### Update User Profile

```http
PATCH /api/v1/users/me
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1-555-0123",
  "preferences": {
    "emailNotifications": true,
    "smsAlerts": false
  }
}
```

#### Change Password

```http
POST /api/v1/auth/change-password
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

---

### Healthcare Facilities

#### List Facilities

```http
GET /api/v1/facilities
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (number) - Results per page (default: 50, max: 100)
- `cursor` (string) - Pagination cursor
- `search` (string) - Search by name or ID
- `status` (string) - Filter by status: `active`, `inactive`, `suspended` 

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "fac_xyz789",
      "name": "Health Plus Clinic",
      "type": "OUTPATIENT_CLINIC",
      "status": "active",
      "address": {
        "street": "123 Medical Blvd",
        "city": "San Francisco",
        "state": "CA",
        "zip": "94102",
        "country": "US"
      },
      "contact": {
        "email": "billing@healthplus.com",
        "phone": "+1-555-0199"
      },
      "settings": {
        "acceptsCrypto": true,
        "supportedNetworks": ["solana", "ethereum", "polygon"],
        "defaultCurrency": "USD"
      },
      "metrics": {
        "totalPatients": 1247,
        "monthlyRevenue": 247000,
        "activeUsers": 12
      },
      "createdAt": "2024-06-01T00:00:00Z"
    }
  ],
  "pagination": {
    "hasMore": false,
    "nextCursor": null,
    "total": 24
  }
}
```

#### Get Facility Details

```http
GET /api/v1/facilities/{facilityId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "fac_xyz789",
    "name": "Health Plus Clinic",
    "type": "OUTPATIENT_CLINIC",
    "status": "active",
    "taxId": "12-3456789",
    "npi": "1234567890",
    "address": {
      "street": "123 Medical Blvd",
      "suite": "Suite 200",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94102",
      "country": "US"
    },
    "bankingInfo": {
      "routingNumber": "1110*****",
      "accountLast4": "****5678",
      "accountType": "CHECKING"
    },
    "cryptoWallets": {
      "solana": "7xK...abc",
      "ethereum": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEa5",
      "polygon": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEa5"
    },
    "compliance": {
      "hipaaCompliant": true,
      "pciDssLevel": "1",
      "lastAudit": "2024-12-15T00:00:00Z"
    }
  }
}
```

#### Create Facility

```http
POST /api/v1/facilities
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New Medical Center",
  "type": "HOSPITAL",
  "taxId": "98-7654321",
  "npi": "0987654321",
  "address": {
    "street": "456 Healthcare Ave",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90001",
    "country": "US"
  },
  "contact": {
    "email": "admin@newmedical.com",
    "phone": "+1-555-0188"
  },
  "settings": {
    "acceptsCrypto": true,
    "supportedNetworks": ["solana"],
    "defaultCurrency": "USD"
  }
}
```

#### Update Facility

```http
PATCH /api/v1/facilities/{facilityId}
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "Updated Clinic Name",
  "settings": {
    "supportedNetworks": ["solana", "ethereum", "polygon", "base"]
  }
}
```

---

### Patients

#### List Patients

```http
GET /api/v1/patients
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (number) - Results per page
- `cursor` (string) - Pagination cursor
- `search` (string) - Search by name, email, or MRN
- `facilityId` (string) - Filter by facility
- `status` (string) - Filter by status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "pat_abc123",
      "facilityId": "fac_xyz789",
      "mrn": "MRN-2025-001234",
      "firstName": "Jane",
      "lastName": "Doe",
      "dateOfBirth": "1985-03-15",
      "email": "jane.doe@email.com",
      "phone": "+1-555-0177",
      "status": "active",
      "balance": 1250.00,
      "insurance": {
        "provider": "Blue Cross Blue Shield",
        "policyNumber": "BCBS123456",
        "groupNumber": "GRP789"
      },
      "createdAt": "2024-08-15T00:00:00Z",
      "lastVisit": "2025-01-28T00:00:00Z"
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "crs_def456",
    "total": 1247
  }
}
```

#### Get Patient Details

```http
GET /api/v1/patients/{patientId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pat_abc123",
    "facilityId": "fac_xyz789",
    "mrn": "MRN-2025-001234",
    "firstName": "Jane",
    "lastName": "Doe",
    "dateOfBirth": "1985-03-15",
    "email": "jane.doe@email.com",
    "phone": "+1-555-0177",
    "address": {
      "street": "789 Patient St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94103",
      "country": "US"
    },
    "emergencyContact": {
      "name": "John Doe",
      "relationship": "Spouse",
      "phone": "+1-555-0166"
    },
    "insurance": {
      "provider": "Blue Cross Blue Shield",
      "policyNumber": "BCBS123456",
      "groupNumber": "GRP789",
      "effectiveDate": "2024-01-01"
    },
    "paymentMethods": [
      {
        "id": "pm_card_001",
        "type": "CREDIT_CARD",
        "last4": "4242",
        "brand": "visa",
        "expiryMonth": 12,
        "expiryYear": 2026,
        "isDefault": true
      },
      {
        "id": "pm_crypto_001",
        "type": "CRYPTO_WALLET",
        "network": "solana",
        "address": "7xK...xyz",
        "isDefault": false
      }
    ],
    "balance": 1250.00,
    "status": "active",
    "createdAt": "2024-08-15T00:00:00Z"
  }
}
```

#### Create Patient

```http
POST /api/v1/patients
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "facilityId": "fac_xyz789",
  "firstName": "Jane",
  "lastName": "Doe",
  "dateOfBirth": "1985-03-15",
  "email": "jane.doe@email.com",
  "phone": "+1-555-0177",
  "address": {
    "street": "789 Patient St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94103"
  },
  "insurance": {
    "provider": "Blue Cross Blue Shield",
    "policyNumber": "BCBS123456",
    "groupNumber": "GRP789"
  }
}
```

#### Update Patient

```http
PATCH /api/v1/patients/{patientId}
Authorization: Bearer {token}
```

#### Get Patient Balance

```http
GET /api/v1/patients/{patientId}/balance
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "patientId": "pat_abc123",
    "currentBalance": 1250.00,
    "totalBilled": 5430.00,
    "totalPaid": 4180.00,
    "insurancePending": 350.00,
    "lastPayment": {
      "amount": 500.00,
      "date": "2025-01-15T00:00:00Z",
      "method": "CREDIT_CARD"
    }
  }
}
```

---

### Payments

#### Process Payment

```http
POST /api/v1/payments
Authorization: Bearer {token}
```

**Request Body (Traditional Payment):**
```json
{
  "patientId": "pat_abc123",
  "amount": 150.00,
  "currency": "USD",
  "method": "CREDIT_CARD",
  "paymentMethodId": "pm_card_001",
  "invoiceId": "inv_xyz123",
  "description": "Office Visit - January 2025",
  "metadata": {
    "visitDate": "2025-01-28",
    "provider": "Dr. Smith"
  }
}
```

**Request Body (Cryptocurrency Payment):**
```json
{
  "patientId": "pat_abc123",
  "amount": 150.00,
  "currency": "USD",
  "method": "CRYPTO",
  "network": "solana",
  "cryptoAmount": 0.845,
  "cryptoCurrency": "SOL",
  "walletAddress": "7xK...xyz",
  "invoiceId": "inv_xyz123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pmt_abc123",
    "patientId": "pat_abc123",
    "facilityId": "fac_xyz789",
    "amount": 150.00,
    "currency": "USD",
    "method": "CRYPTO",
    "status": "processing",
    "network": "solana",
    "cryptoAmount": 0.845,
    "cryptoCurrency": "SOL",
    "transactionHash": null,
    "estimatedConfirmation": "2025-01-31T09:05:00Z",
    "createdAt": "2025-01-31T09:00:00Z",
    "metadata": {
      "visitDate": "2025-01-28",
      "provider": "Dr. Smith"
    }
  }
}
```

#### Get Payment Status

```http
GET /api/v1/payments/{paymentId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pmt_abc123",
    "status": "completed",
    "amount": 150.00,
    "currency": "USD",
    "method": "CRYPTO",
    "network": "solana",
    "transactionHash": "5vN...abc",
    "confirmations": 32,
    "completedAt": "2025-01-31T09:03:25Z",
    "processingFee": 1.50,
    "netAmount": 148.50
  }
}
```

#### List Payments

```http
GET /api/v1/payments
Authorization: Bearer {token}
```

**Query Parameters:**
- `patientId` (string) - Filter by patient
- `facilityId` (string) - Filter by facility
- `status` (string) - Filter by status: `pending`, `processing`, `completed`, `failed`, `refunded` 
- `method` (string) - Filter by method: `CREDIT_CARD`, `DEBIT_CARD`, `ACH`, `CRYPTO` 
- `startDate` (string) - Start date (ISO 8601)
- `endDate` (string) - End date (ISO 8601)
- `limit` (number) - Results per page
- `cursor` (string) - Pagination cursor

#### Refund Payment

```http
POST /api/v1/payments/{paymentId}/refund
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "amount": 150.00,
  "reason": "DUPLICATE_CHARGE",
  "notes": "Patient was billed twice for same visit"
}
```

---

### Blockchain Transactions

#### Get Transaction Details

```http
GET /api/v1/transactions/{transactionId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "txn_abc123",
    "paymentId": "pmt_abc123",
    "network": "solana",
    "hash": "5vN...abc",
    "fromAddress": "7xK...xyz",
    "toAddress": "9mP...def",
    "amount": 0.845,
    "currency": "SOL",
    "usdValue": 150.00,
    "status": "confirmed",
    "confirmations": 32,
    "blockNumber": 245789123,
    "gasUsed": 5000,
    "gasFee": 0.000005,
    "timestamp": "2025-01-31T09:03:25Z"
  }
}
```

#### List Transactions

```http
GET /api/v1/transactions
Authorization: Bearer {token}
```

**Query Parameters:**
- `network` (string) - Filter by blockchain: `solana`, `ethereum`, `polygon`, `base` 
- `status` (string) - Filter by status: `pending`, `confirmed`, `failed` 
- `startDate` / `endDate` (string) - Date range
- `limit` / `cursor` - Pagination

#### Get Network Status

```http
GET /api/v1/blockchain/status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "networks": [
      {
        "name": "solana",
        "status": "operational",
        "blockHeight": 245789456,
        "averageConfirmationTime": 0.4,
        "gasPrice": 0.000005,
        "lastUpdate": "2025-01-31T09:00:00Z"
      },
      {
        "name": "ethereum",
        "status": "operational",
        "blockHeight": 18945612,
        "averageConfirmationTime": 12,
        "gasPrice": 25000000000,
        "lastUpdate": "2025-01-31T09:00:00Z"
      }
    ]
  }
}
```

---

### Invoices & Billing

#### Create Invoice

```http
POST /api/v1/invoices
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "patientId": "pat_abc123",
  "facilityId": "fac_xyz789",
  "dueDate": "2025-02-15",
  "lineItems": [
    {
      "description": "Office Visit - Consultation",
      "code": "99213",
      "quantity": 1,
      "unitPrice": 150.00,
      "total": 150.00
    },
    {
      "description": "Lab Work - Blood Panel",
      "code": "80053",
      "quantity": 1,
      "unitPrice": 85.00,
      "total": 85.00
    }
  ],
  "notes": "Payment due within 30 days"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "inv_xyz123",
    "invoiceNumber": "INV-2025-001234",
    "patientId": "pat_abc123",
    "facilityId": "fac_xyz789",
    "status": "open",
    "subtotal": 235.00,
    "tax": 0.00,
    "total": 235.00,
    "amountDue": 235.00,
    "amountPaid": 0.00,
    "dueDate": "2025-02-15",
    "createdAt": "2025-01-31T09:00:00Z",
    "pdfUrl": "https://api.advanciapayledger.com/invoices/inv_xyz123/pdf"
  }
}
```

#### Get Invoice

```http
GET /api/v1/invoices/{invoiceId}
Authorization: Bearer {token}
```

#### List Invoices

```http
GET /api/v1/invoices
Authorization: Bearer {token}
```

**Query Parameters:**
- `patientId` - Filter by patient
- `facilityId` - Filter by facility
- `status` - Filter by status: `draft`, `open`, `paid`, `void`, `overdue` 
- `startDate` / `endDate` - Date range

#### Update Invoice Status

```http
PATCH /api/v1/invoices/{invoiceId}
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "status": "paid",
  "paidAt": "2025-01-31T09:00:00Z",
  "paymentId": "pmt_abc123"
}
```

#### Void Invoice

```http
POST /api/v1/invoices/{invoiceId}/void
Authorization: Bearer {token}
```

#### Download Invoice PDF

```http
GET /api/v1/invoices/{invoiceId}/pdf
Authorization: Bearer {token}
```

Returns PDF file for download.

---

### Reports & Analytics

#### Financial Summary

```http
GET /api/v1/reports/financial-summary
Authorization: Bearer {token}
```

**Query Parameters:**
- `facilityId` (string) - Filter by facility
- `startDate` (string) - Start date (ISO 8601)
- `endDate` (string) - End date (ISO 8601)
- `groupBy` (string) - Group results: `day`, `week`, `month`, `year` 

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-01-01",
      "end": "2025-01-31"
    },
    "summary": {
      "totalRevenue": 247000.00,
      "totalPayments": 1247,
      "averagePayment": 198.00,
      "cryptoRevenue": 89450.00,
      "cryptoPercentage": 36.2,
      "traditionalRevenue": 157550.00,
      "refunds": 2450.00,
      "netRevenue": 244550.00
    },
    "byMethod": {
      "CREDIT_CARD": 98750.00,
      "DEBIT_CARD": 32800.00,
      "ACH": 26000.00,
      "CRYPTO": 89450.00
    },
    "byNetwork": {
      "solana": 52340.00,
      "ethereum": 25110.00,
      "polygon": 8500.00,
      "base": 3500.00
    },
    "trends": [
      {
        "date": "2025-01-01",
        "revenue": 7840.00,
        "payments": 42
      }
    ]
  }
}
```

#### Patient Analytics

```http
GET /api/v1/reports/patient-analytics
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPatients": 1247,
    "activePatients": 892,
    "newPatients": 47,
    "averageBalance": 156.78,
    "paymentMethods": {
      "creditCard": 678,
      "cryptoWallet": 289,
      "ach": 156,
      "multiple": 124
    }
  }
}
```

#### Compliance Report

```http
GET /api/v1/reports/compliance
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hipaa": {
      "compliant": true,
      "lastAudit": "2024-12-15",
      "encryptedRecords": 1247,
      "accessLogs": 45892
    },
    "pciDss": {
      "level": "1",
      "lastAudit": "2024-11-20",
      "encryptedTransactions": 100.0
    }
  }
}
```

---

### Webhooks

#### Create Webhook

```http
POST /api/v1/webhooks
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "url": "https://yourapp.com/webhooks/advancia",
  "events": [
    "payment.completed",
    "payment.failed",
    "invoice.created",
    "transaction.confirmed"
  ],
  "secret": "whsec_your_secret_key"
}
```

#### List Webhooks

```http
GET /api/v1/webhooks
Authorization: Bearer {token}
```

#### Delete Webhook

```http
DELETE /api/v1/webhooks/{webhookId}
Authorization: Bearer {token}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_FAILED",
    "message": "Insufficient funds in wallet",
    "details": {
      "required": 150.00,
      "available": 89.50
    },
    "requestId": "req_abc123"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `PAYMENT_FAILED` | 402 | Payment processing error |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `NETWORK_ERROR` | 503 | Blockchain network unavailable |

---

## Rate Limiting

API requests are rate limited to ensure fair usage:

- **Standard Tier:** 1,000 requests per hour
- **Professional Tier:** 5,000 requests per hour
- **Enterprise Tier:** Custom limits

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1706716800
```

When rate limited, you'll receive:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please retry after 2025-01-31T10:00:00Z",
    "retryAfter": 3600
  }
}
```

---

## Webhooks Reference

### Webhook Events

| Event | Description |
|-------|-------------|
| `payment.created` | Payment initiated |
| `payment.processing` | Payment processing started |
| `payment.completed` | Payment successfully completed |
| `payment.failed` | Payment failed |
| `payment.refunded` | Payment refunded |
| `invoice.created` | New invoice created |
| `invoice.paid` | Invoice marked as paid |
| `invoice.overdue` | Invoice past due date |
| `transaction.confirmed` | Blockchain transaction confirmed |
| `transaction.failed` | Blockchain transaction failed |
| `patient.created` | New patient registered |
| `patient.updated` | Patient information updated |

### Webhook Payload Example

```json
{
  "id": "evt_abc123",
  "type": "payment.completed",
  "createdAt": "2025-01-31T09:03:25Z",
  "data": {
    "id": "pmt_abc123",
    "patientId": "pat_abc123",
    "amount": 150.00,
    "currency": "USD",
    "method": "CRYPTO",
    "status": "completed",
    "transactionHash": "5vN...abc"
  }
}
```

### Webhook Verification

Verify webhook signatures using the secret key:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === hmac;
}
```

---

## SDKs & Libraries

### Official SDKs

- **Node.js:** `npm install @advancia/node-sdk` 
- **Python:** `pip install advancia-python` 
- **PHP:** `composer require advancia/php-sdk` 

### Quick Start Example (Node.js)

```javascript
const Advancia = require('@advancia/node-sdk');

const advancia = new Advancia({
  apiKey: 'apk_live_your_api_key'
});

// Process a payment
const payment = await advancia.payments.create({
  patientId: 'pat_abc123',
  amount: 150.00,
  currency: 'USD',
  method: 'CRYPTO',
  network: 'solana'
});

console.log(payment.status); // 'processing'
```

---

## Support

**Technical Support:** api-support@advanciapayledger.com  
**Documentation:** https://docs.advanciapayledger.com  
**Status Page:** https://status.advanciapayledger.com  
**Developer Portal:** https://developers.advanciapayledger.com

---

**Last Updated:** January 31, 2025  
**API Version:** 1.0
