# Advancia PayLedger - Multi-Tenancy Implementation Guide

**Purpose**: Implement and manage multi-tenant architecture  
**Audience**: Backend Engineers, Architects  
**Last Updated**: March 9, 2026

---

## Multi-Tenancy Strategy

### Tenant Isolation Levels

#### Database Level
- Separate database per tenant
- Complete data isolation
- Higher operational complexity

#### Schema Level
- Shared database, separate schemas
- Good balance of isolation and efficiency
- Recommended approach

#### Row Level
- Shared database and schema
- Row-level filtering
- Highest efficiency, requires careful implementation

---

## Implementation (Schema-Level)

### Tenant Context

```typescript
// middleware/tenantContext.ts
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      tenantId: string;
      tenant: Tenant;
    }
  }
}

export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Get tenant from header or subdomain
  const tenantId = req.headers['x-tenant-id'] as string ||
                   extractTenantFromSubdomain(req.hostname);

  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID required' });
  }

  // Load tenant configuration
  const tenant = await loadTenant(tenantId);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  req.tenantId = tenantId;
  req.tenant = tenant;

  next();
}

function extractTenantFromSubdomain(hostname: string): string | null {
  const parts = hostname.split('.');
  if (parts.length > 2) {
    return parts[0];
  }
  return null;
}
```

### Prisma Multi-Tenancy

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          // Add tenant filter to all queries
          if (operation === 'findUnique' || operation === 'findFirst') {
            args.where = {
              ...args.where,
              tenantId: getCurrentTenantId()
            };
          }

          if (operation === 'findMany') {
            args.where = {
              ...args.where,
              tenantId: getCurrentTenantId()
            };
          }

          if (operation === 'create') {
            args.data = {
              ...args.data,
              tenantId: getCurrentTenantId()
            };
          }

          if (operation === 'update') {
            args.where = {
              ...args.where,
              tenantId: getCurrentTenantId()
            };
          }

          if (operation === 'delete') {
            args.where = {
              ...args.where,
              tenantId: getCurrentTenantId()
            };
          }

          return query(args);
        }
      }
    }
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### Tenant-Aware Queries

```typescript
// services/invoiceService.ts
async function getInvoices(tenantId: string, patientId: string) {
  return prisma.invoice.findMany({
    where: {
      tenantId,
      patientId
    },
    include: {
      items: true,
      payments: true
    }
  });
}

async function createInvoice(tenantId: string, data: any) {
  return prisma.invoice.create({
    data: {
      ...data,
      tenantId
    }
  });
}
```

---

## Tenant Configuration

### Tenant Schema

```sql
CREATE TABLE tenants (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  plan VARCHAR(50) DEFAULT 'PROFESSIONAL',
  max_users INT DEFAULT 10,
  max_invoices INT DEFAULT 1000,
  features JSONB,
  settings JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE tenant_members (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uq_tenant_user (tenant_id, user_id)
);
```

### Tenant Features

```typescript
// services/tenantService.ts
interface TenantFeatures {
  advancedReporting: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  webhooks: boolean;
  sso: boolean;
  multiCurrency: boolean;
  paymentPlans: boolean;
}

async function getTenantFeatures(tenantId: string): Promise<TenantFeatures> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  const featureMap: Record<string, TenantFeatures> = {
    FREE: {
      advancedReporting: false,
      customBranding: false,
      apiAccess: false,
      webhooks: false,
      sso: false,
      multiCurrency: false,
      paymentPlans: false
    },
    PROFESSIONAL: {
      advancedReporting: true,
      customBranding: false,
      apiAccess: true,
      webhooks: true,
      sso: false,
      multiCurrency: false,
      paymentPlans: true
    },
    ENTERPRISE: {
      advancedReporting: true,
      customBranding: true,
      apiAccess: true,
      webhooks: true,
      sso: true,
      multiCurrency: true,
      paymentPlans: true
    }
  };

  return featureMap[tenant.plan] || featureMap.FREE;
}
```

---

## Tenant Isolation

### Row-Level Security

```sql
-- Enable RLS for all tenant tables
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation
CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.current_tenant_id')::text);

-- Set tenant context
SET app.current_tenant_id = 'tenant-123';
```

### Application-Level Isolation

```typescript
// middleware/tenantIsolation.ts
export async function verifyTenantAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const tenantId = req.tenantId;
  const userId = req.user.id;

  // Verify user belongs to tenant
  const membership = await prisma.tenantMember.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId
      }
    }
  });

  if (!membership) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Verify tenant is active
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (tenant.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'Tenant inactive' });
  }

  next();
}
```

---

## Tenant Onboarding

### Create Tenant

```typescript
// services/tenantService.ts
async function createTenant(data: {
  name: string;
  slug: string;
  plan: string;
  ownerUserId: string;
}) {
  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: data.name,
      slug: data.slug,
      plan: data.plan
    }
  });

  // Add owner as member
  await prisma.tenantMember.create({
    data: {
      tenantId: tenant.id,
      userId: data.ownerUserId,
      role: 'OWNER'
    }
  });

  // Initialize tenant settings
  await initializeTenantSettings(tenant.id);

  return tenant;
}

async function initializeTenantSettings(tenantId: string) {
  // Create default settings
  const settings = {
    timezone: 'UTC',
    currency: 'USD',
    language: 'en',
    dateFormat: 'YYYY-MM-DD'
  };

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { settings }
  });
}
```

---

## Tenant Billing

### Usage Tracking

```typescript
// services/usageService.ts
async function trackUsage(tenantId: string, metric: string, value: number) {
  await prisma.tenantUsage.create({
    data: {
      tenantId,
      metric,
      value,
      timestamp: new Date()
    }
  });
}

async function getTenantUsage(tenantId: string, month: Date) {
  return prisma.tenantUsage.groupBy({
    by: ['metric'],
    where: {
      tenantId,
      timestamp: {
        gte: new Date(month.getFullYear(), month.getMonth(), 1),
        lt: new Date(month.getFullYear(), month.getMonth() + 1, 1)
      }
    },
    _sum: {
      value: true
    }
  });
}
```

### Billing Calculation

```typescript
// services/billingService.ts
async function calculateTenantBill(tenantId: string, month: Date) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  const usage = await getTenantUsage(tenantId, month);

  const basePrices: Record<string, number> = {
    FREE: 0,
    PROFESSIONAL: 99,
    ENTERPRISE: 499
  };

  let total = basePrices[tenant.plan];

  // Add overage charges
  const invoiceCount = usage.find(u => u.metric === 'invoices')?._sum.value || 0;
  if (invoiceCount > 1000) {
    total += (invoiceCount - 1000) * 0.10; // $0.10 per invoice over 1000
  }

  return total;
}
```

---

## Monitoring Multi-Tenancy

### Metrics

```typescript
// Track tenant-specific metrics
const tenantRequestCount = new Counter({
  name: 'tenant_requests_total',
  help: 'Total requests per tenant',
  labelNames: ['tenant_id', 'endpoint']
});

const tenantDataSize = new Gauge({
  name: 'tenant_data_size_bytes',
  help: 'Data size per tenant',
  labelNames: ['tenant_id']
});
```

### Alerts

```yaml
groups:
  - name: multi_tenancy
    rules:
      - alert: TenantQuotaExceeded
        expr: tenant_usage > tenant_quota
        for: 5m
        annotations:
          severity: high
          summary: "Tenant {{ $labels.tenant_id }} exceeded quota"

      - alert: TenantInactive
        expr: tenant_status == 'INACTIVE'
        for: 1m
        annotations:
          severity: medium
          summary: "Tenant {{ $labels.tenant_id }} is inactive"
```

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
