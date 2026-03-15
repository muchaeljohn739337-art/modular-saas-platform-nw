# Advancia PayLedger - Monitoring & Alerting Setup

## Overview

Comprehensive monitoring stack for production healthcare payment platform with real-time alerts and compliance tracking.

---

## Monitoring Stack Components

### 1. Prometheus (Metrics Collection)
**Purpose**: Collect and store time-series metrics

**Configuration**:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    environment: production
    service: advancia-payledger

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'

  - job_name: 'auth-service'
    static_configs:
      - targets: ['localhost:3002']

  - job_name: 'billing-service'
    static_configs:
      - targets: ['localhost:3003']

  - job_name: 'payment-service'
    static_configs:
      - targets: ['localhost:3004']

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:5432']
```

**Key Metrics**:
- Request rate and latency
- Error rates
- Database connection pool
- Memory and CPU usage
- Payment processing times

### 2. Grafana (Visualization & Dashboards)
**Purpose**: Visualize metrics and create alerts

**Default Dashboards**:
1. **System Overview**
   - CPU, Memory, Disk usage
   - Network I/O
   - Service availability

2. **API Performance**
   - Request rate (RPS)
   - Response times (p50, p95, p99)
   - Error rates by endpoint
   - Status code distribution

3. **Payment Processing**
   - Transaction volume
   - Success/failure rates
   - Processing times
   - Revenue metrics

4. **Database Health**
   - Connection pool usage
   - Query performance
   - Replication lag
   - Backup status

5. **Security**
   - Failed authentication attempts
   - Rate limit violations
   - Suspicious activity
   - Audit log volume

### 3. Sentry (Error Tracking)
**Purpose**: Track and monitor application errors

**Configuration**:
```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ request: true, serverName: true }),
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),
  ],
});
```

**Monitored Events**:
- Unhandled exceptions
- Payment failures
- Database errors
- Authentication failures
- API errors

### 4. ELK Stack (Log Aggregation)
**Purpose**: Centralized logging and analysis

**Components**:
- **Elasticsearch**: Log storage and indexing
- **Logstash**: Log processing and enrichment
- **Kibana**: Log visualization and analysis

**Log Levels**:
- `ERROR`: Critical issues requiring immediate attention
- `WARN`: Potential issues to investigate
- `INFO`: Important business events
- `DEBUG`: Detailed diagnostic information

---

## Alert Configuration

### Critical Alerts (Page On-Call)

#### 1. Service Down
```yaml
alert: ServiceDown
expr: up{job=~"backend|auth-service|payment-service"} == 0
for: 1m
annotations:
  severity: critical
  summary: "{{ $labels.job }} is down"
  action: "Check service logs and restart if needed"
```

#### 2. Payment Processing Failure
```yaml
alert: PaymentProcessingFailure
expr: rate(payment_failures_total[5m]) > 0.1
for: 2m
annotations:
  severity: critical
  summary: "Payment processing failure rate > 10%"
  action: "Check payment service logs and Stripe integration"
```

#### 3. Database Connection Pool Exhausted
```yaml
alert: DatabasePoolExhausted
expr: pg_stat_activity_count >= 95
for: 1m
annotations:
  severity: critical
  summary: "Database connection pool exhausted"
  action: "Increase pool size or investigate long-running queries"
```

#### 4. High Error Rate
```yaml
alert: HighErrorRate
expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
for: 5m
annotations:
  severity: critical
  summary: "Error rate > 5%"
  action: "Check application logs and Sentry"
```

### High Priority Alerts (Notify within 15 min)

#### 1. High Response Time
```yaml
alert: HighResponseTime
expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
for: 5m
annotations:
  severity: high
  summary: "P95 response time > 1s"
  action: "Check database performance and API logs"
```

#### 2. High Memory Usage
```yaml
alert: HighMemoryUsage
expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.85
for: 5m
annotations:
  severity: high
  summary: "Memory usage > 85%"
  action: "Check for memory leaks or increase container limits"
```

#### 3. Disk Space Low
```yaml
alert: DiskSpaceLow
expr: node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.1
for: 5m
annotations:
  severity: high
  summary: "Disk space < 10%"
  action: "Clean up logs or increase disk size"
```

#### 4. Failed Authentication Spike
```yaml
alert: FailedAuthSpike
expr: rate(auth_failures_total[5m]) > 1
for: 2m
annotations:
  severity: high
  summary: "Failed authentication rate > 1/sec"
  action: "Check for brute force attacks"
```

### Medium Priority Alerts (Daily Digest)

#### 1. Slow Queries
```yaml
alert: SlowQueries
expr: rate(pg_slow_queries_total[5m]) > 0.1
for: 10m
annotations:
  severity: medium
  summary: "Slow query rate > 0.1/sec"
  action: "Review query performance and add indexes"
```

#### 2. Cache Hit Rate Low
```yaml
alert: LowCacheHitRate
expr: redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total) < 0.7
for: 10m
annotations:
  severity: medium
  summary: "Cache hit rate < 70%"
  action: "Review cache strategy and TTL settings"
```

---

## Notification Channels

### 1. PagerDuty (Critical Alerts)
```yaml
receivers:
  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: $PAGERDUTY_SERVICE_KEY
        severity: 'critical'
```

### 2. Slack (All Alerts)
```yaml
receivers:
  - name: 'slack-alerts'
    slack_configs:
      - api_url: $SLACK_WEBHOOK_URL
        channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ .CommonAnnotations.summary }}'
```

### 3. Email (High Priority)
```yaml
receivers:
  - name: 'email-high'
    email_configs:
      - to: 'oncall@advancia.com'
        from: 'alerts@advancia.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: $EMAIL_USERNAME
        auth_password: $EMAIL_PASSWORD
```

---

## Key Metrics to Monitor

### Application Metrics
- **Request Rate**: Requests per second
- **Response Time**: P50, P95, P99 latencies
- **Error Rate**: 4xx and 5xx errors
- **Throughput**: Successful requests per second
- **Apdex Score**: Application Performance Index

### Payment Metrics
- **Transaction Volume**: Transactions per minute
- **Success Rate**: Percentage of successful payments
- **Processing Time**: Average payment processing time
- **Failed Transactions**: Count and reasons
- **Refund Rate**: Percentage of refunded payments
- **Revenue**: Total processed amount

### Database Metrics
- **Connection Pool Usage**: Active connections
- **Query Performance**: Slow query count
- **Replication Lag**: Master-replica lag
- **Backup Status**: Last successful backup
- **Disk Usage**: Storage utilization
- **Lock Contention**: Table locks

### Infrastructure Metrics
- **CPU Usage**: Percentage utilization
- **Memory Usage**: RAM utilization
- **Disk I/O**: Read/write operations
- **Network I/O**: Bandwidth usage
- **Container Health**: Restart count
- **Uptime**: Service availability

### Security Metrics
- **Failed Auth Attempts**: Count per minute
- **Rate Limit Violations**: Blocked requests
- **Suspicious Activity**: Anomaly detection
- **Audit Log Volume**: Events per minute
- **SSL Certificate Expiry**: Days until expiration

---

## Dashboards Setup

### 1. Executive Dashboard
**Audience**: Management, Product

**Widgets**:
- Service uptime (%)
- Transaction volume (24h)
- Revenue processed (24h)
- Error rate (%)
- Customer satisfaction (NPS)

### 2. Operations Dashboard
**Audience**: DevOps, SRE

**Widgets**:
- Service health status
- Resource utilization
- Error rates by service
- Database performance
- Alert history

### 3. Payment Dashboard
**Audience**: Finance, Operations

**Widgets**:
- Transaction volume
- Success/failure rates
- Processing times
- Revenue metrics
- Top payment methods

### 4. Security Dashboard
**Audience**: Security, Compliance

**Widgets**:
- Failed auth attempts
- Rate limit violations
- Suspicious activity
- Audit log events
- Security alerts

---

## Health Check Procedures

### Daily (Automated)
- Service availability check
- Database connectivity
- Cache functionality
- Payment gateway connectivity
- Backup completion

### Weekly (Manual)
- Review error logs
- Analyze performance trends
- Check security alerts
- Verify backup integrity
- Update runbooks

### Monthly (Comprehensive)
- Capacity planning review
- Performance optimization
- Security audit
- Disaster recovery test
- Compliance review

---

## Incident Response

### Severity Levels

| Level | Response Time | Escalation | Impact |
|-------|---------------|-----------|--------|
| **Critical** | 5 min | Immediate | Service down, data loss |
| **High** | 15 min | 30 min | Degraded performance |
| **Medium** | 1 hour | 4 hours | Minor issues |
| **Low** | 4 hours | 1 day | Non-urgent fixes |

### Incident Checklist

1. **Acknowledge Alert** (within 5 min)
   - Confirm alert in PagerDuty
   - Join incident Slack channel
   - Start incident timeline

2. **Assess Impact** (within 10 min)
   - Check affected services
   - Estimate customer impact
   - Determine severity level

3. **Investigate** (ongoing)
   - Check logs in Kibana
   - Review metrics in Grafana
   - Check Sentry for errors
   - Review recent deployments

4. **Mitigate** (as soon as possible)
   - Apply temporary fix if available
   - Scale resources if needed
   - Communicate status to customers

5. **Resolve** (permanent fix)
   - Deploy permanent fix
   - Verify resolution
   - Monitor for regression

6. **Post-Incident** (within 24 hours)
   - Write incident report
   - Identify root cause
   - Create action items
   - Schedule follow-up

---

## Compliance Monitoring

### HIPAA Requirements
- ✅ Audit logging enabled
- ✅ Access control monitoring
- ✅ Data encryption verification
- ✅ Backup verification
- ✅ Incident detection

### PCI-DSS Requirements
- ✅ Payment data monitoring
- ✅ Access logging
- ✅ Vulnerability scanning
- ✅ Firewall monitoring
- ✅ Intrusion detection

---

## Runbooks

### Service Restart
```bash
# Stop service
docker-compose down <service-name>

# Verify stopped
docker-compose ps

# Start service
docker-compose up -d <service-name>

# Verify health
curl http://localhost:<port>/health
```

### Database Recovery
```bash
# Check database status
psql -U postgres -d advancia_payledger -c "SELECT version();"

# Restore from backup
psql -U postgres -d advancia_payledger < backup.sql

# Verify data integrity
npm run db:verify
```

### Payment Service Failover
```bash
# Check payment service status
curl http://localhost:3004/health

# Restart payment service
docker-compose restart payment-service

# Verify Stripe connectivity
npm run test:stripe-connection

# Check pending transactions
npm run check:pending-payments
```

---

## Tools & Access

| Tool | URL | Access |
|------|-----|--------|
| Grafana | https://grafana.advancia.com | SSO |
| Prometheus | https://prometheus.advancia.com | VPN |
| Kibana | https://kibana.advancia.com | SSO |
| Sentry | https://sentry.advancia.com | SSO |
| PagerDuty | https://advancia.pagerduty.com | SSO |

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
