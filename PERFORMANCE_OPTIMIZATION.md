# Advancia PayLedger - Performance Optimization Guide

**Purpose**: Optimize system performance and reduce latency  
**Audience**: DevOps, Backend Engineers, Database Administrators  
**Last Updated**: March 9, 2026

---

## Performance Targets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| API Response Time (p50) | <100ms | TBD | 🔄 |
| API Response Time (p95) | <500ms | TBD | 🔄 |
| API Response Time (p99) | <1s | TBD | 🔄 |
| Database Query Time | <50ms | TBD | 🔄 |
| Cache Hit Rate | >80% | TBD | 🔄 |
| Throughput | 10,000 req/s | TBD | 🔄 |
| Uptime | 99.9% | TBD | 🔄 |

---

## Frontend Optimization

### 1. Code Splitting

```javascript
// pages/invoices.tsx
import dynamic from 'next/dynamic';

const InvoiceList = dynamic(() => import('@/components/InvoiceList'), {
  loading: () => <div>Loading...</div>,
  ssr: true
});

export default function InvoicesPage() {
  return <InvoiceList />;
}
```

### 2. Image Optimization

```javascript
// components/PatientCard.tsx
import Image from 'next/image';

export default function PatientCard({ patient }) {
  return (
    <Image
      src={patient.avatar}
      alt={patient.name}
      width={100}
      height={100}
      priority={false}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}
```

### 3. Bundle Analysis

```bash
# Analyze bundle size
npm run build

# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Configure next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({})

# Run analysis
ANALYZE=true npm run build
```

### 4. Caching Strategy

```javascript
// next.config.js
module.exports = {
  headers: async () => {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600'
          }
        ]
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}
```

### 5. Compression

```javascript
// next.config.js
module.exports = {
  compress: true,
  swcMinify: true,
}
```

---

## Backend Optimization

### 1. Database Query Optimization

#### Add Indexes
```sql
-- Invoice queries
CREATE INDEX idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX idx_invoices_patient_status ON invoices(patient_id, status);

-- Payment queries
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- User queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

#### Use Query Optimization
```typescript
// services/invoiceService.ts
async function getInvoices(patientId: string, limit: number = 10) {
  // Use select to fetch only needed fields
  const invoices = await prisma.invoice.findMany({
    where: { patientId },
    select: {
      id: true,
      invoiceNumber: true,
      totalAmount: true,
      status: true,
      dueDate: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  return invoices;
}
```

#### Batch Operations
```typescript
// Avoid N+1 queries
async function getInvoicesWithItems(patientId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { patientId },
    include: {
      items: {
        select: {
          id: true,
          description: true,
          quantity: true,
          unitPrice: true
        }
      }
    }
  });

  return invoices;
}
```

### 2. Caching Strategy

#### Redis Caching
```typescript
// middleware/cache.ts
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });

export async function getCachedInvoices(patientId: string) {
  const cacheKey = `invoices:${patientId}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const invoices = await prisma.invoice.findMany({
    where: { patientId },
    take: 10
  });

  // Cache for 1 hour
  await redis.setEx(cacheKey, 3600, JSON.stringify(invoices));

  return invoices;
}
```

#### Cache Invalidation
```typescript
// services/invoiceService.ts
async function createInvoice(data: InvoiceData) {
  const invoice = await prisma.invoice.create({ data });

  // Invalidate cache
  await redis.del(`invoices:${data.patientId}`);

  return invoice;
}
```

### 3. Connection Pooling

```typescript
// config/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Configure connection pool
// In .env
DATABASE_URL="postgresql://...?schema=public&connection_limit=100&pool_timeout=0"
```

### 4. Request Optimization

#### Compression
```typescript
// server.ts
import compression from 'compression';

app.use(compression());
```

#### Pagination
```typescript
// routes/invoices.ts
app.get('/api/invoices', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
  const skip = (page - 1) * limit;

  const invoices = await prisma.invoice.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  const total = await prisma.invoice.count();

  res.json({
    data: invoices,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});
```

#### Field Selection
```typescript
// Only fetch needed fields
const invoices = await prisma.invoice.findMany({
  select: {
    id: true,
    invoiceNumber: true,
    totalAmount: true,
    status: true
  }
});
```

### 5. Async Processing

```typescript
// services/paymentService.ts
import { Queue } from 'bull';

const paymentQueue = new Queue('payments', process.env.REDIS_URL);

// Queue long-running tasks
async function processPayment(paymentId: string) {
  await paymentQueue.add({ paymentId }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });
}

// Process queue
paymentQueue.process(async (job) => {
  const { paymentId } = job.data;
  // Process payment
});
```

---

## Database Optimization

### 1. Query Analysis

```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();

-- Analyze slow queries
SELECT query, calls, mean_time, max_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;
```

### 2. Vacuum & Analyze

```sql
-- Regular maintenance
VACUUM ANALYZE;

-- Specific table
VACUUM ANALYZE invoices;

-- Monitor autovacuum
SELECT schemaname, tablename, last_vacuum, last_autovacuum 
FROM pg_stat_user_tables;
```

### 3. Index Maintenance

```sql
-- Reindex if needed
REINDEX DATABASE advancia_payledger;

-- Check unused indexes
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
WHERE idx_scan = 0;

-- Drop unused indexes
DROP INDEX idx_unused;
```

### 4. Statistics Update

```sql
-- Update table statistics
ANALYZE invoices;
ANALYZE payments;
ANALYZE users;

-- Check statistics
SELECT schemaname, tablename, last_analyze 
FROM pg_stat_user_tables;
```

---

## Infrastructure Optimization

### 1. Kubernetes Resource Limits

```yaml
# deployment.yaml
spec:
  containers:
  - name: backend
    resources:
      requests:
        cpu: 500m
        memory: 1Gi
      limits:
        cpu: 1000m
        memory: 2Gi
    livenessProbe:
      httpGet:
        path: /health
        port: 3001
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /health
        port: 3001
      initialDelaySeconds: 10
      periodSeconds: 5
```

### 2. Horizontal Pod Autoscaling

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 3. Network Optimization

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  type: ClusterIP
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800
  ports:
  - port: 3001
    targetPort: 3001
    protocol: TCP
```

---

## Monitoring Performance

### 1. Prometheus Metrics

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
```

### 2. Key Metrics to Monitor

```
# Request metrics
http_requests_total
http_request_duration_seconds
http_requests_in_flight

# Database metrics
pg_stat_activity_count
pg_slow_queries_total
pg_query_duration_seconds

# Cache metrics
redis_keyspace_hits_total
redis_keyspace_misses_total
redis_memory_used_bytes

# System metrics
process_cpu_seconds_total
process_resident_memory_bytes
go_goroutines
```

### 3. Grafana Dashboards

Create dashboards for:
- Request latency (p50, p95, p99)
- Error rates by endpoint
- Database query performance
- Cache hit rates
- Resource utilization
- Payment processing metrics

---

## Performance Testing

### 1. Load Testing

```bash
# Using Apache Bench
ab -n 10000 -c 100 http://localhost:3001/api/invoices

# Using wrk
wrk -t12 -c400 -d30s http://localhost:3001/api/invoices

# Using k6
k6 run load-test.js
```

### 2. Load Test Script

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 100,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function() {
  let res = http.get('http://localhost:3001/api/invoices');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

---

## Optimization Checklist

### Frontend
- [ ] Code splitting enabled
- [ ] Images optimized
- [ ] Bundle size analyzed
- [ ] Caching configured
- [ ] Compression enabled
- [ ] Lazy loading implemented

### Backend
- [ ] Database indexes created
- [ ] Queries optimized
- [ ] Caching implemented
- [ ] Connection pooling configured
- [ ] Pagination implemented
- [ ] Async processing enabled

### Database
- [ ] Indexes analyzed
- [ ] Vacuum scheduled
- [ ] Statistics updated
- [ ] Slow queries identified
- [ ] Unused indexes removed

### Infrastructure
- [ ] Resource limits set
- [ ] Auto-scaling configured
- [ ] Monitoring enabled
- [ ] Alerting configured
- [ ] Load testing completed

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
