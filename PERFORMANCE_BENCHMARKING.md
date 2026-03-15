# Advancia PayLedger - Performance Benchmarking Guide

**Purpose**: Establish and measure performance baselines  
**Audience**: Performance Engineers, DevOps, Backend Engineers  
**Last Updated**: March 9, 2026

---

## Performance Baselines

### API Performance Targets

| Metric | Target | P50 | P95 | P99 |
|--------|--------|-----|-----|-----|
| **GET /api/invoices** | <200ms | <100ms | <500ms | <1s |
| **POST /api/invoices** | <300ms | <150ms | <700ms | <2s |
| **POST /api/payments/process** | <500ms | <250ms | <1s | <3s |
| **GET /api/patients** | <200ms | <100ms | <500ms | <1s |
| **GET /health** | <50ms | <20ms | <50ms | <100ms |

### Database Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **Query Latency** | <50ms | Average query time |
| **Connection Pool** | <10ms | Connection acquisition time |
| **Slow Query Threshold** | >1s | Queries exceeding this logged |
| **Lock Wait Time** | <100ms | Maximum acceptable lock wait |

### System Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **CPU Usage** | <70% | Average during normal load |
| **Memory Usage** | <80% | Average during normal load |
| **Disk I/O** | <80% | Average during normal load |
| **Network Bandwidth** | <80% | Average during normal load |

---

## Benchmarking Tools

### 1. Apache Bench (ab)

**Installation**:
```bash
# macOS
brew install httpd

# Ubuntu
sudo apt-get install apache2-utils

# Windows
# Download from Apache website
```

**Usage**:
```bash
# Simple benchmark
ab -n 1000 -c 100 http://localhost:3001/api/invoices

# With custom headers
ab -n 1000 -c 100 -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/invoices

# Output to file
ab -n 1000 -c 100 http://localhost:3001/api/invoices > results.txt
```

### 2. wrk (Modern Load Testing)

**Installation**:
```bash
# macOS
brew install wrk

# Ubuntu
git clone https://github.com/wg/wrk.git
cd wrk
make
sudo cp wrk /usr/local/bin
```

**Usage**:
```bash
# Basic load test
wrk -t12 -c400 -d30s http://localhost:3001/api/invoices

# With custom script
wrk -t12 -c400 -d30s -s script.lua http://localhost:3001/api/invoices
```

**Script Example**:
```lua
-- script.lua
request = function()
   wrk.method = "GET"
   wrk.path = "/api/invoices"
   wrk.headers["Authorization"] = "Bearer " .. token
   return wrk.format(nil)
end

response = function(status, headers, body)
   if status ~= 200 then
      print("Status: " .. status)
   end
end
```

### 3. k6 (Comprehensive Load Testing)

**Installation**:
```bash
# macOS
brew install k6

# Ubuntu
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Usage**:
```bash
# Run test
k6 run load-test.js

# Run with specific VUs and duration
k6 run --vus 100 --duration 30s load-test.js

# Run with custom environment
k6 run -e ENV=production load-test.js
```

**Test Script**:
```javascript
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

### 4. JMeter (Enterprise Load Testing)

**Installation**:
```bash
# Download from https://jmeter.apache.org/download_jmeter.cgi
# Extract and run
./bin/jmeter.sh
```

**Usage**:
- Create test plan with HTTP requests
- Configure thread groups for concurrent users
- Add listeners for results
- Run and analyze results

### 5. Locust (Python-based)

**Installation**:
```bash
pip install locust
```

**Usage**:
```bash
locust -f locustfile.py --host=http://localhost:3001
```

**Test File**:
```python
from locust import HttpUser, task, between

class APIUser(HttpUser):
    wait_time = between(1, 3)
    
    @task
    def get_invoices(self):
        self.client.get("/api/invoices")
    
    @task
    def create_invoice(self):
        self.client.post("/api/invoices", json={
            "patientId": "pat-123",
            "providerId": "prov-456",
            "amount": 500.00,
            "dueDate": "2026-04-09T00:00:00Z"
        })
```

---

## Benchmarking Procedures

### Pre-Benchmark Checklist

- [ ] System in known state
- [ ] No other load on system
- [ ] Monitoring tools running
- [ ] Baseline metrics recorded
- [ ] Test environment matches production
- [ ] Database populated with realistic data
- [ ] Cache warmed up
- [ ] All services healthy

### Benchmark Execution

#### 1. Baseline Benchmark

```bash
# Establish baseline with minimal load
wrk -t4 -c10 -d60s http://localhost:3001/api/invoices

# Record results
# - Requests/sec
# - Latency (avg, p95, p99)
# - Error rate
```

#### 2. Ramp-up Benchmark

```bash
# Gradually increase load
# 10 concurrent users
wrk -t4 -c10 -d60s http://localhost:3001/api/invoices

# 50 concurrent users
wrk -t8 -c50 -d60s http://localhost:3001/api/invoices

# 100 concurrent users
wrk -t12 -c100 -d60s http://localhost:3001/api/invoices

# 200 concurrent users
wrk -t16 -c200 -d60s http://localhost:3001/api/invoices
```

#### 3. Stress Benchmark

```bash
# Push system to limits
wrk -t16 -c400 -d120s http://localhost:3001/api/invoices

# Monitor for:
# - Error rate increase
# - Latency degradation
# - Resource exhaustion
# - Service failures
```

#### 4. Sustained Load Benchmark

```bash
# Run at expected production load for extended period
wrk -t12 -c100 -d3600s http://localhost:3001/api/invoices

# Monitor for:
# - Memory leaks
# - Connection pool issues
# - Cache degradation
# - Performance degradation over time
```

### Monitoring During Benchmark

```bash
# Terminal 1: Run benchmark
wrk -t12 -c100 -d60s http://localhost:3001/api/invoices

# Terminal 2: Monitor CPU
top -p $(pgrep -f "node")

# Terminal 3: Monitor memory
watch -n 1 'ps aux | grep node'

# Terminal 4: Monitor network
iftop -i eth0

# Terminal 5: Monitor database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_stat_activity;"

# Terminal 6: Monitor Redis
redis-cli INFO stats
```

---

## Results Analysis

### Metrics to Collect

```
Requests/sec: [value]
Latency (avg): [value]
Latency (p50): [value]
Latency (p95): [value]
Latency (p99): [value]
Error rate: [value]
Connection time: [value]
Processing time: [value]
Wait time: [value]
```

### Analysis Template

```
Benchmark: [Name]
Date: [Date]
Duration: [Duration]
Concurrent Users: [Number]

Results:
- Requests/sec: [value] (Target: [target])
- Latency (avg): [value]ms (Target: <200ms)
- Latency (p95): [value]ms (Target: <500ms)
- Latency (p99): [value]ms (Target: <1000ms)
- Error rate: [value]% (Target: <0.1%)

System Metrics:
- CPU: [value]% (Target: <70%)
- Memory: [value]% (Target: <80%)
- Disk I/O: [value]% (Target: <80%)

Analysis:
[Summary of results and findings]

Recommendations:
1. [Recommendation 1]
2. [Recommendation 2]
```

---

## Regression Testing

### Automated Benchmark

```bash
#!/bin/bash
# benchmark.sh

# Run benchmark
wrk -t12 -c100 -d60s http://localhost:3001/api/invoices > results.json

# Compare with baseline
python3 compare.py results.json baseline.json

# Alert if regression detected
if [ $? -ne 0 ]; then
  echo "Performance regression detected!"
  exit 1
fi
```

### Continuous Benchmarking

```yaml
# .github/workflows/benchmark.yml
name: Performance Benchmark

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Start services
        run: docker-compose -f docker-compose.dev.yml up -d
      
      - name: Run benchmark
        run: |
          npm run build
          npm run benchmark > results.json
      
      - name: Compare with baseline
        run: python3 scripts/compare.py results.json baseline.json
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: benchmark-results
          path: results.json
```

---

## Database Benchmarking

### Query Performance

```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 100;
SELECT pg_reload_conf();

-- Analyze slow queries
SELECT query, calls, mean_time, max_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

-- Benchmark specific query
EXPLAIN ANALYZE 
SELECT * FROM invoices 
WHERE patient_id = 'pat-123' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Index Performance

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Benchmark with and without index
-- Create index
CREATE INDEX idx_invoices_patient_status ON invoices(patient_id, status);

-- Run query and measure time
EXPLAIN ANALYZE 
SELECT * FROM invoices 
WHERE patient_id = 'pat-123' AND status = 'PAID';

-- Drop index and measure again
DROP INDEX idx_invoices_patient_status;

EXPLAIN ANALYZE 
SELECT * FROM invoices 
WHERE patient_id = 'pat-123' AND status = 'PAID';
```

### Connection Pool Performance

```sql
-- Monitor connections
SELECT count(*) FROM pg_stat_activity;

-- Check connection wait time
SELECT 
  datname,
  usename,
  state,
  query_start,
  wait_event
FROM pg_stat_activity
WHERE state = 'active';

-- Benchmark with different pool sizes
-- Test with pool_size=50
-- Test with pool_size=100
-- Test with pool_size=150
```

---

## Caching Performance

### Cache Hit Rate

```bash
# Monitor Redis stats
redis-cli INFO stats

# Key metrics:
# - keyspace_hits: Number of successful lookups
# - keyspace_misses: Number of failed lookups
# - hit_rate = hits / (hits + misses)

# Target: >80% hit rate
```

### Cache Benchmark

```javascript
// Benchmark with and without cache

// Without cache
console.time('without-cache');
for (let i = 0; i < 1000; i++) {
  await getInvoicesFromDatabase('pat-123');
}
console.timeEnd('without-cache');

// With cache
console.time('with-cache');
for (let i = 0; i < 1000; i++) {
  await getInvoicesWithCache('pat-123');
}
console.timeEnd('with-cache');
```

---

## Reporting

### Benchmark Report Template

```
# Performance Benchmark Report

**Date**: [Date]
**Environment**: [Production/Staging/Development]
**Benchmark Type**: [Load/Stress/Sustained]

## Executive Summary
[Brief summary of findings]

## Methodology
- Tool: [Tool name]
- Duration: [Duration]
- Concurrent Users: [Number]
- Test Data: [Description]

## Results

### API Performance
| Endpoint | Requests/sec | Latency (avg) | Latency (p95) | Error Rate |
|----------|--------------|---------------|---------------|------------|
| GET /api/invoices | [value] | [value]ms | [value]ms | [value]% |
| POST /api/invoices | [value] | [value]ms | [value]ms | [value]% |

### System Performance
- CPU: [value]%
- Memory: [value]%
- Disk I/O: [value]%

## Analysis
[Detailed analysis of results]

## Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

## Conclusion
[Summary and next steps]
```

---

## Benchmarking Schedule

### Weekly
- [ ] API endpoint benchmarking
- [ ] Database query performance
- [ ] Cache hit rate monitoring

### Monthly
- [ ] Full system benchmark
- [ ] Stress testing
- [ ] Regression testing
- [ ] Report generation

### Quarterly
- [ ] Comprehensive performance audit
- [ ] Capacity planning
- [ ] Optimization recommendations
- [ ] Baseline updates

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
