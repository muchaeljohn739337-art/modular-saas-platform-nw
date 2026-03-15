# Advancia PayLedger - API Rate Limiting & Throttling Guide

**Purpose**: Implement and manage API rate limiting  
**Audience**: Backend Engineers, DevOps  
**Last Updated**: March 9, 2026

---

## Rate Limiting Strategy

### Tier-Based Limits

#### Free Tier
- 100 requests/minute
- 1,000 requests/hour
- 10,000 requests/day

#### Professional Tier
- 1,000 requests/minute
- 10,000 requests/hour
- 100,000 requests/day

#### Enterprise Tier
- 10,000 requests/minute
- Unlimited hourly
- Unlimited daily

---

## Implementation

### Express Rate Limiter

```typescript
// middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'redis';

const redis = Redis.createClient({ url: process.env.REDIS_URL });

const limiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate-limit:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use API key if available, otherwise use IP
    return req.headers['x-api-key'] || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

export default limiter;
```

### User-Based Rate Limiting

```typescript
// middleware/userRateLimiter.ts
const userLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'user-rate-limit:'
  }),
  windowMs: 60 * 1000,
  max: async (req) => {
    // Get user tier from database
    const user = await getUser(req.user.id);
    
    switch (user.tier) {
      case 'FREE':
        return 100;
      case 'PROFESSIONAL':
        return 1000;
      case 'ENTERPRISE':
        return 10000;
      default:
        return 100;
    }
  },
  keyGenerator: (req) => {
    return req.user.id;
  }
});

export default userLimiter;
```

### Endpoint-Specific Limits

```typescript
// routes/api.ts
import limiter from '@/middleware/rateLimiter';
import userLimiter from '@/middleware/userRateLimiter';

// Strict limit for payment endpoint
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // Only 10 payment requests per minute
  keyGenerator: (req) => req.user.id
});

router.post('/api/payments/process', 
  authenticate,
  paymentLimiter,
  async (req, res) => {
    // Process payment
  }
);

// Moderate limit for invoice endpoint
const invoiceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  keyGenerator: (req) => req.user.id
});

router.post('/api/invoices',
  authenticate,
  invoiceLimiter,
  async (req, res) => {
    // Create invoice
  }
);

// Relaxed limit for read endpoints
router.get('/api/invoices',
  authenticate,
  limiter,
  async (req, res) => {
    // Get invoices
  }
);
```

---

## Rate Limit Headers

### Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1646870400
Retry-After: 60
```

### Implementation

```typescript
// Add rate limit headers to response
app.use((req, res, next) => {
  if (req.rateLimit) {
    res.set({
      'X-RateLimit-Limit': req.rateLimit.limit,
      'X-RateLimit-Remaining': req.rateLimit.current,
      'X-RateLimit-Reset': req.rateLimit.resetTime
    });
  }
  next();
});
```

---

## Throttling Strategy

### Adaptive Throttling

```typescript
// services/throttlingService.ts
class ThrottlingService {
  async checkSystemLoad(): Promise<number> {
    const metrics = await getSystemMetrics();
    
    // Calculate load percentage
    const cpuLoad = metrics.cpu / 100;
    const memoryLoad = metrics.memory / 100;
    const dbLoad = metrics.dbConnections / 100;
    
    return Math.max(cpuLoad, memoryLoad, dbLoad);
  }

  async getThrottleRate(): Promise<number> {
    const load = await this.checkSystemLoad();
    
    if (load > 0.9) return 0.1; // Allow 10%
    if (load > 0.8) return 0.3; // Allow 30%
    if (load > 0.7) return 0.5; // Allow 50%
    if (load > 0.6) return 0.7; // Allow 70%
    return 1.0; // Allow 100%
  }
}

// Middleware
app.use(async (req, res, next) => {
  const throttleRate = await throttlingService.getThrottleRate();
  
  if (Math.random() > throttleRate) {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      retryAfter: 60
    });
  }
  
  next();
});
```

### Queue-Based Throttling

```typescript
// services/requestQueue.ts
import { Queue } from 'bull';

const requestQueue = new Queue('api-requests', {
  redis: { url: process.env.REDIS_URL }
});

// Process requests with concurrency limit
requestQueue.process(10, async (job) => {
  const { req, res, handler } = job.data;
  return handler(req, res);
});

// Middleware to queue requests
app.use((req, res, next) => {
  requestQueue.add(
    { req, res, handler: next },
    { priority: getPriority(req) }
  );
});

function getPriority(req: Request): number {
  // Higher priority for authenticated users
  if (req.user) return 10;
  // Lower priority for anonymous
  return 1;
}
```

---

## Monitoring Rate Limits

### Metrics

```typescript
// Track rate limit violations
const rateLimitViolations = new Counter({
  name: 'rate_limit_violations_total',
  help: 'Total rate limit violations',
  labelNames: ['endpoint', 'user_tier']
});

app.use((req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode === 429) {
      rateLimitViolations.inc({
        endpoint: req.path,
        user_tier: req.user?.tier || 'anonymous'
      });
    }
  });
  next();
});
```

### Alerts

```yaml
groups:
  - name: rate_limiting
    rules:
      - alert: HighRateLimitViolations
        expr: rate(rate_limit_violations_total[5m]) > 10
        for: 5m
        annotations:
          severity: high
          summary: "High rate of rate limit violations"

      - alert: UserExceedingQuota
        expr: rate_limit_remaining == 0
        for: 1m
        annotations:
          severity: medium
          summary: "User exceeding rate limit quota"
```

---

## Best Practices

### 1. Graceful Degradation
- Return 429 with Retry-After header
- Provide clear error messages
- Include reset time in response

### 2. User Communication
- Document rate limits in API docs
- Provide rate limit status endpoint
- Send warnings before limits hit

### 3. Monitoring
- Track violations by endpoint
- Monitor by user tier
- Alert on anomalies

### 4. Testing
- Test rate limit behavior
- Verify header accuracy
- Test throttling under load

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
