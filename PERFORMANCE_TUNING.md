# Advancia PayLedger - Performance Tuning Guide

**Purpose**: Optimize system performance and reduce latency  
**Audience**: Backend Engineers, DevOps, Performance Engineers  
**Last Updated**: March 9, 2026

---

## Performance Baseline

### Current Targets
- API Response Time (p95): <500ms
- API Response Time (p99): <1s
- Database Query Time: <50ms
- Cache Hit Rate: >80%
- Error Rate: <0.5%
- Throughput: 10,000+ req/sec

---

## Database Tuning

### Connection Pool Optimization

```typescript
// Prisma configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=100&pool_timeout=0'
    }
  }
});
```

### Query Optimization

#### Identify Slow Queries
```sql
-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 100;
SELECT pg_reload_conf();

-- Find slow queries
SELECT query, calls, mean_time, max_time 
FROM pg_stat_statements 
WHERE mean_time > 100
ORDER BY mean_time DESC LIMIT 10;
```

#### Optimize Query Plans
```sql
-- Analyze query execution
EXPLAIN ANALYZE 
SELECT * FROM invoices 
WHERE patient_id = 'pat-123' 
AND status = 'PENDING'
ORDER BY created_at DESC;

-- Add indexes if needed
CREATE INDEX idx_invoices_patient_status ON invoices(patient_id, status);

-- Verify index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

#### Use Pagination
```typescript
// Always paginate large result sets
async function getInvoices(patientId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where: { patientId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.invoice.count({ where: { patientId } })
  ]);

  return {
    data: invoices,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}
```

### Index Maintenance

```bash
# Reindex tables
REINDEX DATABASE advancia_payledger;

# Analyze tables
ANALYZE;

# Vacuum tables
VACUUM ANALYZE;

# Monitor index bloat
SELECT schemaname, tablename, indexname, 
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## Caching Strategy

### Redis Configuration

```typescript
// Aggressive caching
const cacheConfig = {
  invoices: { ttl: 3600, pattern: 'invoices:*' },
  patients: { ttl: 86400, pattern: 'patients:*' },
  providers: { ttl: 86400, pattern: 'providers:*' },
  payments: { ttl: 300, pattern: 'payments:*' },
  sessions: { ttl: 3600, pattern: 'sessions:*' }
};

// Cache-aside pattern
async function getInvoice(invoiceId: string) {
  const cacheKey = `invoice:${invoiceId}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId }
  });

  // Cache result
  if (invoice) {
    await redis.setex(cacheKey, 3600, JSON.stringify(invoice));
  }

  return invoice;
}
```

### Cache Invalidation

```typescript
// Invalidate cache on updates
async function updateInvoice(invoiceId: string, data: any) {
  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data
  });

  // Invalidate cache
  await redis.del(`invoice:${invoiceId}`);
  await redis.del(`invoices:${invoice.patientId}`);

  return invoice;
}
```

### Cache Warming

```typescript
// Warm cache on startup
async function warmCache() {
  const invoices = await prisma.invoice.findMany({
    where: { status: 'PENDING' },
    take: 1000
  });

  for (const invoice of invoices) {
    await redis.setex(
      `invoice:${invoice.id}`,
      3600,
      JSON.stringify(invoice)
    );
  }

  console.log(`Warmed cache with ${invoices.length} invoices`);
}
```

---

## Application Tuning

### Request Optimization

#### Compression
```typescript
// Enable gzip compression
import compression from 'compression';

app.use(compression({
  level: 6,
  threshold: 1024
}));
```

#### Caching Headers
```typescript
// Set cache headers
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'private, max-age=300');
  } else if (req.path.startsWith('/static/')) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});
```

#### Connection Pooling
```typescript
// Use HTTP keep-alive
const agent = new http.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
  freeSocketTimeout: 30000
});
```

### Code Optimization

#### Async Operations
```typescript
// Use Promise.all for parallel operations
async function getInvoiceDetails(invoiceId: string) {
  const [invoice, items, payments] = await Promise.all([
    prisma.invoice.findUnique({ where: { id: invoiceId } }),
    prisma.invoiceItem.findMany({ where: { invoiceId } }),
    prisma.payment.findMany({ where: { invoiceId } })
  ]);

  return { invoice, items, payments };
}
```

#### Batch Operations
```typescript
// Batch database operations
async function createInvoices(invoices: any[]) {
  return prisma.invoice.createMany({
    data: invoices,
    skipDuplicates: true
  });
}
```

#### Lazy Loading
```typescript
// Load related data only when needed
const invoice = await prisma.invoice.findUnique({
  where: { id: invoiceId },
  include: {
    items: {
      select: {
        id: true,
        description: true,
        amount: true
      }
    }
  }
});
```

---

## Infrastructure Tuning

### Kubernetes Optimization

#### Resource Limits
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
```

#### Horizontal Pod Autoscaling
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

### Network Optimization

#### CDN Configuration
```typescript
// Serve static assets from CDN
const staticAssetUrl = process.env.CDN_URL || '/static';

// In HTML
<script src="${staticAssetUrl}/app.js"></script>
<link rel="stylesheet" href="${staticAssetUrl}/app.css">
```

#### DNS Optimization
```bash
# Use Route53 with health checks
aws route53 create-health-check \
  --health-check-config \
    IPAddress=10.0.0.1,Port=443,Type=HTTPS,FullyQualifiedDomainName=api.example.com
```

---

## Monitoring Performance

### Key Metrics

```typescript
// Prometheus metrics
http_request_duration_seconds
http_requests_total
http_requests_in_flight
database_query_duration_seconds
cache_hits_total
cache_misses_total
process_cpu_seconds_total
process_resident_memory_bytes
```

### Alerting Rules

```yaml
groups:
  - name: performance
    rules:
      - alert: HighLatency
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 0.5
        for: 5m
        annotations:
          severity: high
          summary: "P95 latency > 500ms"

      - alert: LowCacheHitRate
        expr: cache_hit_rate < 0.8
        for: 10m
        annotations:
          severity: medium
          summary: "Cache hit rate < 80%"

      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 1024 / 1024 > 1500
        for: 5m
        annotations:
          severity: high
          summary: "Memory usage > 1500MB"
```

---

## Performance Testing

### Load Test Scenarios

```bash
# Baseline test
k6 run --vus 100 --duration 1h load-test.js

# Peak load test
k6 run --vus 500 --duration 30m load-test-peak.js

# Stress test
k6 run --vus 1000 --duration 15m load-test-stress.js
```

### Profiling

```bash
# Node.js profiling
node --prof app.js
node --prof-process isolate-*.log > profile.txt

# CPU profiling
clinic doctor -- node app.js

# Memory profiling
node --inspect app.js
# Open chrome://inspect
```

---

## Performance Checklist

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
- [ ] Async operations used

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
