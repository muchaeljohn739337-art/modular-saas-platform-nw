# Advancia PayLedger - Database Schema Documentation

**Purpose**: Complete database schema reference and relationships  
**Audience**: Backend Engineers, Database Administrators  
**Last Updated**: March 9, 2026

---

## Schema Overview

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified TIMESTAMP,
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'PATIENT',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_created_at (created_at)
);
```

**Columns**:
- `id`: Unique user identifier (CUID)
- `email`: User email address (unique)
- `email_verified`: Email verification timestamp
- `name`: User full name
- `role`: User role (PATIENT, PROVIDER, STAFF, ADMIN)
- `is_active`: Account active status
- `last_login_at`: Last login timestamp
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

**Relationships**:
- One-to-One: Patient, Provider, Staff
- One-to-Many: Sessions, Audit Logs, Accounts

#### Patients Table
```sql
CREATE TABLE patients (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  date_of_birth DATE,
  phone_number VARCHAR(20),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(10),
  insurance_provider VARCHAR(100),
  insurance_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_insurance_id (insurance_id)
);
```

**Columns**:
- `id`: Patient identifier
- `user_id`: Reference to users table
- `date_of_birth`: Patient DOB
- `phone_number`: Contact phone
- `address`: Street address
- `city`: City
- `state`: State/Province
- `zip_code`: Postal code
- `insurance_provider`: Insurance company name
- `insurance_id`: Insurance policy ID

**Relationships**:
- One-to-One: Users
- One-to-Many: Invoices, Accounts, Claims

#### Providers Table
```sql
CREATE TABLE providers (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  npi_number VARCHAR(10) UNIQUE,
  specialty VARCHAR(100),
  practice_name VARCHAR(255),
  phone_number VARCHAR(20),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_npi_number (npi_number)
);
```

**Columns**:
- `id`: Provider identifier
- `user_id`: Reference to users table
- `npi_number`: National Provider Identifier
- `specialty`: Medical specialty
- `practice_name`: Practice/clinic name
- `phone_number`: Contact phone
- `address`: Office address
- `city`: City
- `state`: State/Province
- `zip_code`: Postal code

**Relationships**:
- One-to-One: Users
- One-to-Many: Invoices, Services

#### Invoices Table
```sql
CREATE TABLE invoices (
  id VARCHAR(36) PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  patient_id VARCHAR(36) NOT NULL,
  provider_id VARCHAR(36) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'DRAFT',
  due_date TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  paid_at TIMESTAMP,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (provider_id) REFERENCES providers(id),
  INDEX idx_patient_id (patient_id),
  INDEX idx_provider_id (provider_id),
  INDEX idx_status (status),
  INDEX idx_due_date (due_date),
  INDEX idx_created_at (created_at)
);
```

**Columns**:
- `id`: Invoice identifier
- `invoice_number`: Unique invoice number
- `patient_id`: Reference to patients
- `provider_id`: Reference to providers
- `total_amount`: Total invoice amount
- `status`: Invoice status (DRAFT, SENT, VIEWED, PAID, OVERDUE, CANCELLED)
- `due_date`: Payment due date
- `sent_at`: Date sent to patient
- `paid_at`: Date marked as paid
- `description`: Invoice description
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

**Relationships**:
- Many-to-One: Patients, Providers
- One-to-Many: Invoice Items, Payments, Claims

#### Payments Table
```sql
CREATE TABLE payments (
  id VARCHAR(36) PRIMARY KEY,
  invoice_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  processor_id VARCHAR(100),
  processor_response JSONB,
  failure_reason VARCHAR(255),
  failure_code VARCHAR(50),
  idempotency_key VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_idempotency_key (idempotency_key)
);
```

**Columns**:
- `id`: Payment identifier
- `invoice_id`: Reference to invoices
- `amount`: Payment amount
- `method`: Payment method (CREDIT_CARD, ACH_TRANSFER, WIRE, CHECK)
- `status`: Payment status (PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED)
- `processor_id`: External processor transaction ID
- `processor_response`: Full processor response (JSON)
- `failure_reason`: Human-readable failure reason
- `failure_code`: Processor failure code
- `idempotency_key`: Idempotency key for duplicate prevention
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

**Relationships**:
- Many-to-One: Invoices
- One-to-Many: Refunds

#### Accounts Table
```sql
CREATE TABLE accounts (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  account_number VARCHAR(50) UNIQUE NOT NULL,
  account_type VARCHAR(50),
  balance DECIMAL(12, 2) DEFAULT 0,
  credit_limit DECIMAL(12, 2),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  INDEX idx_patient_id (patient_id),
  INDEX idx_status (status)
);
```

**Columns**:
- `id`: Account identifier
- `patient_id`: Reference to patients
- `account_number`: Unique account number
- `account_type`: Account type (PAYMENT_PLAN, CREDIT_ACCOUNT)
- `balance`: Current account balance
- `credit_limit`: Maximum credit limit
- `status`: Account status (ACTIVE, SUSPENDED, CLOSED)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

**Relationships**:
- Many-to-One: Patients
- One-to-Many: Transactions

#### Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(36),
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_resource_type (resource_type),
  INDEX idx_created_at (created_at)
);
```

**Columns**:
- `id`: Log entry identifier
- `user_id`: Reference to users
- `action`: Action performed (CREATE, UPDATE, DELETE, VIEW)
- `resource_type`: Type of resource affected
- `resource_id`: ID of affected resource
- `changes`: JSON object with before/after values
- `ip_address`: Client IP address
- `user_agent`: Client user agent
- `created_at`: Timestamp of action

**Relationships**:
- Many-to-One: Users

---

## Data Types

### Financial Amounts
```sql
-- Use DECIMAL for financial amounts, never FLOAT
DECIMAL(10, 2)  -- Up to 99,999,999.99
DECIMAL(12, 2)  -- Up to 9,999,999,999.99
```

### Identifiers
```sql
-- Use CUID for primary keys
VARCHAR(36) PRIMARY KEY

-- Use VARCHAR for external IDs
VARCHAR(100) UNIQUE
```

### Timestamps
```sql
-- Use TIMESTAMP for all timestamps
TIMESTAMP DEFAULT CURRENT_TIMESTAMP
TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

### JSON Data
```sql
-- Use JSONB for structured data
JSONB  -- Supports indexing and queries
```

---

## Indexes

### Performance Indexes
```sql
-- Foreign keys
CREATE INDEX idx_patient_id ON invoices(patient_id);
CREATE INDEX idx_provider_id ON invoices(provider_id);

-- Status queries
CREATE INDEX idx_status ON invoices(status);
CREATE INDEX idx_payment_status ON payments(status);

-- Date range queries
CREATE INDEX idx_created_at ON invoices(created_at);
CREATE INDEX idx_due_date ON invoices(due_date);

-- Composite indexes
CREATE INDEX idx_patient_status ON invoices(patient_id, status);
CREATE INDEX idx_invoice_status ON payments(invoice_id, status);
```

### Full-Text Search
```sql
-- For searching invoices
CREATE FULLTEXT INDEX ft_invoice_description ON invoices(description);

-- For searching user names
CREATE FULLTEXT INDEX ft_user_name ON users(name);
```

---

## Constraints

### Unique Constraints
```sql
-- Email must be unique
ALTER TABLE users ADD CONSTRAINT uq_email UNIQUE (email);

-- Invoice number must be unique
ALTER TABLE invoices ADD CONSTRAINT uq_invoice_number UNIQUE (invoice_number);

-- Account number must be unique
ALTER TABLE accounts ADD CONSTRAINT uq_account_number UNIQUE (account_number);
```

### Check Constraints
```sql
-- Amount must be positive
ALTER TABLE invoices ADD CONSTRAINT chk_amount CHECK (total_amount > 0);
ALTER TABLE payments ADD CONSTRAINT chk_payment_amount CHECK (amount > 0);

-- Status must be valid
ALTER TABLE invoices ADD CONSTRAINT chk_status CHECK (
  status IN ('DRAFT', 'SENT', 'VIEWED', 'PAID', 'OVERDUE', 'CANCELLED')
);
```

### Foreign Key Constraints
```sql
-- Enforce referential integrity
ALTER TABLE invoices ADD CONSTRAINT fk_patient 
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE invoices ADD CONSTRAINT fk_provider 
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE;

ALTER TABLE payments ADD CONSTRAINT fk_invoice 
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
```

---

## Query Examples

### Get Patient Invoices
```sql
SELECT 
  i.id,
  i.invoice_number,
  i.total_amount,
  i.status,
  i.due_date,
  COUNT(p.id) as payment_count,
  SUM(p.amount) as paid_amount
FROM invoices i
LEFT JOIN payments p ON i.id = p.invoice_id AND p.status = 'COMPLETED'
WHERE i.patient_id = 'pat-123'
GROUP BY i.id
ORDER BY i.created_at DESC;
```

### Get Overdue Invoices
```sql
SELECT 
  i.id,
  i.invoice_number,
  i.total_amount,
  i.due_date,
  DATEDIFF(NOW(), i.due_date) as days_overdue
FROM invoices i
WHERE i.status != 'PAID'
  AND i.due_date < NOW()
ORDER BY i.due_date ASC;
```

### Get Payment Statistics
```sql
SELECT 
  DATE(p.created_at) as payment_date,
  COUNT(*) as total_payments,
  SUM(p.amount) as total_amount,
  SUM(CASE WHEN p.status = 'COMPLETED' THEN p.amount ELSE 0 END) as completed_amount,
  SUM(CASE WHEN p.status = 'FAILED' THEN 1 ELSE 0 END) as failed_count
FROM payments p
WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(p.created_at)
ORDER BY payment_date DESC;
```

### Get Provider Revenue
```sql
SELECT 
  pr.id,
  pr.practice_name,
  COUNT(DISTINCT i.id) as invoice_count,
  SUM(i.total_amount) as total_revenue,
  SUM(CASE WHEN i.status = 'PAID' THEN i.total_amount ELSE 0 END) as paid_revenue,
  SUM(CASE WHEN i.status = 'PENDING' THEN i.total_amount ELSE 0 END) as pending_revenue
FROM providers pr
LEFT JOIN invoices i ON pr.id = i.provider_id
WHERE i.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
GROUP BY pr.id
ORDER BY total_revenue DESC;
```

---

## Performance Considerations

### Query Optimization
- Always use indexes for WHERE clauses
- Use EXPLAIN ANALYZE to verify query plans
- Avoid SELECT * - specify needed columns
- Use LIMIT for large result sets
- Batch operations when possible

### Connection Management
- Use connection pooling
- Set appropriate timeout values
- Monitor active connections
- Close unused connections

### Data Maintenance
- Regular VACUUM ANALYZE
- Monitor table sizes
- Archive old data
- Rebuild indexes periodically

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
