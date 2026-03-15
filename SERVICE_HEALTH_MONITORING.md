# Advancia PayLedger - Service Health Monitoring Dashboard

**Purpose**: Monitor health and performance of all services  
**Audience**: DevOps, SRE, Engineering Team  
**Last Updated**: March 9, 2026

---

## Dashboard Architecture

### Real-Time Metrics

#### Service Health Status
```
┌─────────────────────────────────────────────────────┐
│ Service Health Overview                             │
├─────────────────────────────────────────────────────┤
│ Backend API          ✅ Healthy    Uptime: 99.98%   │
│ Auth Service         ✅ Healthy    Uptime: 99.99%   │
│ Billing Service      ✅ Healthy    Uptime: 99.97%   │
│ Payment Service      ⚠️  Degraded  Uptime: 98.50%   │
│ Metering Service     ✅ Healthy    Uptime: 99.99%   │
│ Tenant Service       ✅ Healthy    Uptime: 99.98%   │
│ Web3 Event Service   ✅ Healthy    Uptime: 99.96%   │
└─────────────────────────────────────────────────────┘
```

#### Key Metrics Display
```
┌─────────────────────────────────────────────────────┐
│ Key Metrics (Last 24 Hours)                         │
├─────────────────────────────────────────────────────┤
│ Total Requests:     2,450,000                       │
│ Error Rate:         0.15%                           │
│ P95 Latency:        245ms                           │
│ P99 Latency:        890ms                           │
│ Database Queries:   15,200,000                      │
│ Cache Hit Rate:     87.3%                           │
│ Active Users:       12,450                          │
└─────────────────────────────────────────────────────┘
```

---

## Grafana Dashboard Specifications

### Dashboard 1: System Overview

**Panels**:
1. **Service Status** (Status Panel)
   - Shows health of all services
   - Color-coded (green/yellow/red)
   - Click-through to service details

2. **Request Rate** (Graph)
   - Requests per second over time
   - Broken down by service
   - Target: 1,000-5,000 RPS

3. **Error Rate** (Graph)
   - Error percentage over time
   - Broken down by status code
   - Target: <0.5%

4. **Latency Distribution** (Heatmap)
   - P50, P95, P99 latencies
   - Helps identify performance issues
   - Target: P95 < 500ms

5. **Database Performance** (Graph)
   - Query count and duration
   - Connection pool usage
   - Slow query count

6. **Cache Performance** (Gauge)
   - Cache hit rate
   - Cache miss rate
   - Target: >80% hit rate

### Dashboard 2: Service Details

**Panels per Service**:
1. **Service Health**
   - Uptime percentage
   - Response time
   - Error rate
   - Request count

2. **Resource Usage**
   - CPU percentage
   - Memory usage
   - Disk I/O
   - Network bandwidth

3. **Dependency Health**
   - Database connection status
   - Redis connection status
   - External service status

4. **Error Breakdown**
   - Errors by type
   - Errors by endpoint
   - Error trends

### Dashboard 3: Payment Processing

**Panels**:
1. **Transaction Volume** (Graph)
   - Transactions per minute
   - Broken down by payment method
   - Trend analysis

2. **Success Rate** (Gauge)
   - Percentage of successful payments
   - Target: >99.5%

3. **Processing Time** (Graph)
   - Average processing time
   - P95 and P99 latencies
   - Target: <5 seconds

4. **Failed Transactions** (Table)
   - Recent failures
   - Failure reasons
   - Affected users

5. **Revenue Metrics** (Stat)
   - Total processed
   - Average transaction
   - Trend

### Dashboard 4: Database Health

**Panels**:
1. **Connection Pool** (Gauge)
   - Active connections
   - Available connections
   - Connection wait time

2. **Query Performance** (Graph)
   - Query count
   - Average duration
   - Slow query count

3. **Replication Lag** (Gauge)
   - Master-replica lag
   - Target: <100ms

4. **Backup Status** (Stat)
   - Last backup time
   - Backup size
   - Backup success rate

5. **Storage Usage** (Gauge)
   - Database size
   - Growth rate
   - Projected capacity

---

## Alert Rules

### Critical Alerts

```yaml
groups:
  - name: critical
    rules:
      - alert: ServiceDown
        expr: up{job=~"backend|payment-service"} == 0
        for: 1m
        annotations:
          severity: critical
          summary: "{{ $labels.job }} is down"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          severity: critical
          summary: "Error rate > 5%"

      - alert: DatabaseDown
        expr: pg_up == 0
        for: 1m
        annotations:
          severity: critical
          summary: "Database is down"

      - alert: PaymentProcessingFailure
        expr: rate(payment_failures_total[5m]) > 0.1
        for: 2m
        annotations:
          severity: critical
          summary: "Payment failure rate > 10%"
```

### High Priority Alerts

```yaml
  - name: high
    rules:
      - alert: HighLatency
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
        for: 5m
        annotations:
          severity: high
          summary: "P95 latency > 1s"

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.85
        for: 5m
        annotations:
          severity: high
          summary: "Memory usage > 85%"

      - alert: DatabaseConnectionPoolExhausted
        expr: pg_stat_activity_count >= 95
        for: 1m
        annotations:
          severity: high
          summary: "Database connection pool nearly exhausted"
```

### Medium Priority Alerts

```yaml
  - name: medium
    rules:
      - alert: SlowQueries
        expr: rate(pg_slow_queries_total[5m]) > 0.1
        for: 10m
        annotations:
          severity: medium
          summary: "Slow query rate > 0.1/sec"

      - alert: LowCacheHitRate
        expr: redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total) < 0.7
        for: 10m
        annotations:
          severity: medium
          summary: "Cache hit rate < 70%"
```

---

## Health Check Endpoints

### Service Health Checks

```typescript
// GET /health
{
  "status": "healthy",
  "timestamp": "2026-03-09T10:00:00Z",
  "uptime": 86400,
  "version": "2.0.0",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 15,
      "lastCheck": "2026-03-09T10:00:00Z"
    },
    "redis": {
      "status": "healthy",
      "responseTime": 5,
      "lastCheck": "2026-03-09T10:00:00Z"
    },
    "payment_service": {
      "status": "healthy",
      "responseTime": 45,
      "lastCheck": "2026-03-09T10:00:00Z"
    }
  }
}
```

### Detailed Health Check

```typescript
// GET /health/detailed
{
  "service": "backend",
  "status": "healthy",
  "metrics": {
    "requests_per_second": 1250,
    "error_rate": 0.12,
    "p95_latency": 245,
    "p99_latency": 890,
    "database_connections": 45,
    "cache_hit_rate": 87.3,
    "memory_usage_mb": 512,
    "cpu_usage_percent": 35
  },
  "dependencies": {
    "database": "healthy",
    "redis": "healthy",
    "payment_service": "healthy",
    "auth_service": "healthy"
  }
}
```

---

## Custom Metrics

### Application Metrics

```typescript
// Prometheus metrics
http_requests_total{method="GET", status="200", endpoint="/api/invoices"}
http_request_duration_seconds{method="GET", endpoint="/api/invoices"}
payment_processing_duration_seconds{method="process"}
payment_success_total{method="process"}
payment_failures_total{method="process", reason="declined"}
database_query_duration_seconds{query="select_invoices"}
cache_hits_total{key="invoices"}
cache_misses_total{key="invoices"}
```

### Business Metrics

```typescript
// Custom business metrics
revenue_total{currency="USD"}
transactions_total{status="completed", method="credit_card"}
invoices_created_total
invoices_paid_total
average_payment_processing_time_seconds
payment_success_rate
customer_count_active
```

---

## Notification Configuration

### Slack Integration

```yaml
receivers:
  - name: 'slack-critical'
    slack_configs:
      - api_url: $SLACK_WEBHOOK_URL
        channel: '#alerts-critical'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ .CommonAnnotations.summary }}'
        color: 'danger'
        send_resolved: true

  - name: 'slack-high'
    slack_configs:
      - api_url: $SLACK_WEBHOOK_URL
        channel: '#alerts-high'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ .CommonAnnotations.summary }}'
        color: 'warning'
```

### PagerDuty Integration

```yaml
receivers:
  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: $PAGERDUTY_SERVICE_KEY
        description: '{{ .GroupLabels.alertname }}'
        details:
          firing: '{{ template "pagerduty.default.instances" .Alerts.Firing }}'
```

---

## Dashboard Access

### Role-Based Access

| Role | Access |
|------|--------|
| **Admin** | All dashboards, edit alerts |
| **DevOps** | All dashboards, edit alerts |
| **SRE** | All dashboards, view-only alerts |
| **Engineering** | Service-specific dashboards |
| **Management** | Executive dashboard only |

### Dashboard URLs

- **System Overview**: https://grafana.advancia.com/d/system-overview
- **Service Details**: https://grafana.advancia.com/d/service-details
- **Payment Processing**: https://grafana.advancia.com/d/payment-processing
- **Database Health**: https://grafana.advancia.com/d/database-health
- **Executive Summary**: https://grafana.advancia.com/d/executive-summary

---

## SLO Targets

### Availability SLOs

| Service | Target | Current |
|---------|--------|---------|
| Backend API | 99.9% | 99.98% |
| Payment Service | 99.95% | 99.97% |
| Database | 99.99% | 99.99% |
| Overall Platform | 99.9% | 99.96% |

### Performance SLOs

| Metric | Target | Current |
|--------|--------|---------|
| P95 Latency | <500ms | 245ms |
| P99 Latency | <1s | 890ms |
| Error Rate | <0.5% | 0.15% |
| Cache Hit Rate | >80% | 87.3% |

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
