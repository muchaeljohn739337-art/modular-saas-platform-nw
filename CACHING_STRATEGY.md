# Advancia PayLedger - Caching Strategy Documentation

**Purpose**: Implement comprehensive caching strategy  
**Audience**: Backend Engineers, DevOps  
**Last Updated**: March 9, 2026

---

## Caching Layers

### Layer 1: Browser Cache
- Static assets (CSS, JS, images)
- TTL: 1 year for versioned assets
- Control: Cache-Control headers

### Layer 2: CDN Cache
- Static content distribution
- TTL: 1 hour for dynamic content
- Control: Cache-Control headers

### Layer 3: Application Cache (Redis)
- Session data
- User data
- Invoice data
- TTL: 1 hour

### Layer 4: Database Cache
- Query result caching
- TTL: 5-30 minutes
- Control: Application logic

---

## Redis Caching

### Cache Keys Strategy

```typescript
// Consistent key naming
const cacheKeys = {
  user: (id: string) => `user:${id}`,
  invoice: (id: string) => `invoice:${id}`,
  invoices: (patientId: string) => `invoices:${patientId}`,
  session: (sessionId: string) => `session:${sessionId}`,
  payment: (id: string) => `payment:${id}`,
  userInvoices: (userId: string, status: string) => 
    `user:${userId}:invoices:${status}`
};
```

### Cache-Aside Pattern

```typescript
// services/invoiceService.ts
async function getInvoice(invoiceId: string): Promise<Invoice> {
  const cacheKey = cacheKeys.invoice(invoiceId);

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true, payments: true }
  });

  if (!invoice) {
    return null;
  }

  // Cache result
  await redis.setex(cacheKey, 3600, JSON.stringify(invoice));

  return invoice;
}
```

### Write-Through Caching

```typescript
// Update both cache and database
async function updateInvoice(
  invoiceId: string,
  data: Partial<Invoice>
): Promise<Invoice> {
  // Update database
  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data
  });

  // Update cache
  const cacheKey = cacheKeys.invoice(invoiceId);
  await redis.setex(cacheKey, 3600, JSON.stringify(invoice));

  // Invalidate related caches
  await invalidateRelatedCaches(invoice);

  return invoice;
}
```

### Cache Invalidation

```typescript
// Invalidate cache on updates
async function invalidateRelatedCaches(invoice: Invoice) {
  const keysToDelete = [
    cacheKeys.invoice(invoice.id),
    cacheKeys.invoices(invoice.patientId),
    cacheKeys.userInvoices(invoice.patientId, invoice.status)
  ];

  await redis.del(...keysToDelete);
}

// Bulk invalidation
async function invalidateUserCaches(userId: string) {
  const pattern = `user:${userId}:*`;
  const keys = await redis.keys(pattern);
  
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

---

## Cache Configuration

### TTL Strategy

```typescript
const cacheTTL = {
  // User data - long lived
  user: 86400,           // 24 hours
  userProfile: 86400,    // 24 hours
  
  // Invoice data - medium lived
  invoice: 3600,         // 1 hour
  invoices: 1800,        // 30 minutes
  
  // Payment data - short lived
  payment: 300,          // 5 minutes
  payments: 300,         // 5 minutes
  
  // Session data - short lived
  session: 3600,         // 1 hour
  
  // Static data - long lived
  provider: 86400,       // 24 hours
  patient: 86400         // 24 hours
};
```

### Cache Warming

```typescript
// Warm cache on startup
async function warmCache() {
  console.log('Warming cache...');

  // Cache active invoices
  const activeInvoices = await prisma.invoice.findMany({
    where: { status: 'PENDING' },
    take: 1000
  });

  for (const invoice of activeInvoices) {
    const key = cacheKeys.invoice(invoice.id);
    await redis.setex(key, cacheTTL.invoice, JSON.stringify(invoice));
  }

  // Cache active sessions
  const activeSessions = await prisma.session.findMany({
    where: { expiresAt: { gt: new Date() } }
  });

  for (const session of activeSessions) {
    const key = cacheKeys.session(session.id);
    await redis.setex(key, cacheTTL.session, JSON.stringify(session));
  }

  console.log('Cache warming completed');
}
```

---

## HTTP Caching

### Cache Headers

```typescript
// middleware/cacheHeaders.ts
export function setCacheHeaders(req: Request, res: Response, next: NextFunction) {
  // Static assets - long cache
  if (req.path.match(/\.(js|css|png|jpg|gif|ico|woff|woff2)$/)) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // API responses - no cache by default
  else if (req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  }
  // HTML - short cache
  else {
    res.set('Cache-Control', 'public, max-age=3600, must-revalidate');
  }

  next();
}
```

### ETag Support

```typescript
// Add ETag for cache validation
app.get('/api/v2/invoices/:id', async (req, res) => {
  const invoice = await getInvoice(req.params.id);
  
  const etag = crypto
    .createHash('md5')
    .update(JSON.stringify(invoice))
    .digest('hex');

  res.set('ETag', `"${etag}"`);

  // Return 304 if not modified
  if (req.headers['if-none-match'] === `"${etag}"`) {
    return res.status(304).send();
  }

  res.json(invoice);
});
```

---

## Cache Monitoring

### Metrics

```typescript
// Track cache performance
const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['key_pattern']
});

const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total cache misses',
  labelNames: ['key_pattern']
});

const cacheSize = new Gauge({
  name: 'cache_size_bytes',
  help: 'Cache size in bytes'
});

// Track hit rate
async function trackCacheAccess(key: string, hit: boolean) {
  if (hit) {
    cacheHits.inc({ key_pattern: getKeyPattern(key) });
  } else {
    cacheMisses.inc({ key_pattern: getKeyPattern(key) });
  }
}
```

### Alerts

```yaml
groups:
  - name: caching
    rules:
      - alert: LowCacheHitRate
        expr: cache_hit_rate < 0.7
        for: 10m
        annotations:
          severity: medium
          summary: "Cache hit rate below 70%"

      - alert: HighCacheSize
        expr: cache_size_bytes > 1073741824
        for: 5m
        annotations:
          severity: high
          summary: "Cache size exceeding 1GB"

      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.9
        for: 5m
        annotations:
          severity: high
          summary: "Redis memory usage above 90%"
```

---

## Cache Eviction

### Eviction Policies

```
maxmemory-policy options:
- noeviction: Return error when memory limit reached
- allkeys-lru: Evict least recently used keys
- allkeys-lfu: Evict least frequently used keys
- volatile-lru: Evict LRU among keys with TTL
- volatile-lfu: Evict LFU among keys with TTL
- volatile-ttl: Evict keys with shortest TTL
- volatile-random: Evict random key with TTL
- allkeys-random: Evict random key
```

### Configuration

```
# Redis configuration
maxmemory 2gb
maxmemory-policy allkeys-lru
```

---

## Best Practices

### 1. Cache Invalidation
- Use consistent key naming
- Invalidate related caches
- Implement cache versioning
- Monitor cache effectiveness

### 2. Cache Consistency
- Use write-through for critical data
- Implement cache-aside for read-heavy
- Set appropriate TTLs
- Handle cache misses gracefully

### 3. Performance
- Batch cache operations
- Use pipelining for multiple operations
- Monitor cache hit rates
- Optimize key patterns

### 4. Security
- Don't cache sensitive data
- Use encryption for cached data
- Implement access control
- Monitor cache access

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
