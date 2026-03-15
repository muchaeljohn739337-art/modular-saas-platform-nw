# Advancia PayLedger - Load Testing Guide

**Purpose**: Comprehensive load testing procedures and scenarios  
**Audience**: QA Engineers, Performance Engineers  
**Last Updated**: March 9, 2026

---

## Load Testing Strategy

### Test Phases

#### Phase 1: Baseline Testing
- Establish performance baseline
- Identify bottlenecks
- Document current performance
- Duration: 1 hour

#### Phase 2: Ramp-up Testing
- Gradually increase load
- Monitor system behavior
- Identify breaking points
- Duration: 2 hours

#### Phase 3: Stress Testing
- Push system to limits
- Identify failure modes
- Test recovery procedures
- Duration: 1 hour

#### Phase 4: Sustained Load Testing
- Run at expected production load
- Monitor for memory leaks
- Verify stability
- Duration: 4 hours

---

## Test Scenarios

### Scenario 1: Normal Operations

```yaml
# load-test-normal.yaml
execution:
  - concurrency: 100
    rampUp: 5m
    duration: 1h
    holdLoad: 30m

requests:
  - name: GetInvoices
    weight: 30
    url: /api/invoices
    method: GET
    
  - name: CreateInvoice
    weight: 20
    url: /api/invoices
    method: POST
    body:
      patientId: ${patientId}
      providerId: ${providerId}
      amount: ${amount}
      dueDate: ${dueDate}
    
  - name: ProcessPayment
    weight: 30
    url: /api/payments/process
    method: POST
    body:
      invoiceId: ${invoiceId}
      amount: ${amount}
      method: CREDIT_CARD
    
  - name: GetPaymentStatus
    weight: 20
    url: /api/payments/${paymentId}
    method: GET

thresholds:
  http_req_duration: ['p(95)<500', 'p(99)<1000']
  http_req_failed: ['rate<0.1']
```

### Scenario 2: Peak Load

```yaml
# load-test-peak.yaml
execution:
  - concurrency: 500
    rampUp: 10m
    duration: 30m
    holdLoad: 20m

requests:
  - name: GetInvoices
    weight: 40
    url: /api/invoices
    method: GET
    
  - name: CreateInvoice
    weight: 30
    url: /api/invoices
    method: POST
    
  - name: ProcessPayment
    weight: 20
    url: /api/payments/process
    method: POST
    
  - name: GetPaymentStatus
    weight: 10
    url: /api/payments/${paymentId}
    method: GET

thresholds:
  http_req_duration: ['p(95)<1000', 'p(99)<2000']
  http_req_failed: ['rate<0.5']
```

### Scenario 3: Stress Testing

```yaml
# load-test-stress.yaml
execution:
  - concurrency: 1000
    rampUp: 5m
    duration: 15m
    holdLoad: 10m
  - concurrency: 2000
    duration: 10m
  - concurrency: 5000
    duration: 5m

requests:
  - name: GetInvoices
    weight: 50
    url: /api/invoices
    method: GET
    
  - name: ProcessPayment
    weight: 50
    url: /api/payments/process
    method: POST

thresholds:
  http_req_duration: ['p(95)<2000', 'p(99)<5000']
  http_req_failed: ['rate<1']
```

### Scenario 4: Payment Processing Spike

```yaml
# load-test-payment-spike.yaml
execution:
  - concurrency: 100
    duration: 5m
  - concurrency: 500
    duration: 5m
  - concurrency: 1000
    duration: 5m
  - concurrency: 100
    duration: 5m

requests:
  - name: ProcessPayment
    weight: 100
    url: /api/payments/process
    method: POST
    body:
      invoiceId: ${invoiceId}
      amount: ${amount}
      method: CREDIT_CARD
      idempotencyKey: ${idempotencyKey}

thresholds:
  http_req_duration: ['p(95)<1000']
  http_req_failed: ['rate<0.1']
  payment_success_rate: ['value>0.995']
```

---

## k6 Load Test Script

```javascript
// load-test.js
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

export let options = {
  vus: 100,
  duration: '1h',
  rampUp: '5m',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
    payment_success_rate: ['value>0.995']
  }
};

// Custom metrics
let paymentSuccessRate = new Rate('payment_success_rate');
let invoiceCreationTime = new Trend('invoice_creation_time');
let paymentProcessingTime = new Trend('payment_processing_time');
let failedPayments = new Counter('failed_payments');

export default function() {
  const baseUrl = 'http://localhost:3001/api';
  const token = __ENV.AUTH_TOKEN;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Test 1: Get invoices
  group('Get Invoices', () => {
    let res = http.get(`${baseUrl}/invoices?limit=10`, { headers });
    
    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
      'has data': (r) => JSON.parse(r.body).data.length > 0
    });
  });

  sleep(1);

  // Test 2: Create invoice
  group('Create Invoice', () => {
    let payload = JSON.stringify({
      patientId: `pat-${Math.random()}`,
      providerId: `prov-${Math.random()}`,
      amount: 500.00,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    let res = http.post(`${baseUrl}/invoices`, payload, { headers });
    
    invoiceCreationTime.add(res.timings.duration);

    check(res, {
      'status is 201': (r) => r.status === 201,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
      'has invoice id': (r) => JSON.parse(r.body).id
    });
  });

  sleep(1);

  // Test 3: Process payment
  group('Process Payment', () => {
    let payload = JSON.stringify({
      invoiceId: `inv-${Math.random()}`,
      amount: 500.00,
      method: 'CREDIT_CARD',
      cardToken: 'tok_visa',
      idempotencyKey: `key-${Date.now()}`
    });

    let res = http.post(`${baseUrl}/payments/process`, payload, { headers });
    
    paymentProcessingTime.add(res.timings.duration);

    let success = res.status === 200;
    paymentSuccessRate.add(success);

    if (!success) {
      failedPayments.add(1);
    }

    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
      'has payment id': (r) => JSON.parse(r.body).id
    });
  });

  sleep(2);
}
```

---

## Execution Commands

### Run Baseline Test
```bash
k6 run --vus 100 --duration 1h load-test.js
```

### Run Peak Load Test
```bash
k6 run --vus 500 --duration 30m load-test-peak.yaml
```

### Run Stress Test
```bash
k6 run --vus 1000 --ramp-up 5m --duration 15m load-test-stress.yaml
```

### Run with Custom Environment
```bash
AUTH_TOKEN=your_token k6 run load-test.js
```

### Run with Output to File
```bash
k6 run --out csv=results.csv load-test.js
```

---

## Monitoring During Load Test

### Terminal 1: Run Load Test
```bash
k6 run load-test.js
```

### Terminal 2: Monitor System
```bash
# CPU and Memory
watch -n 1 'top -b -n 1 | head -20'

# Network
iftop -i eth0

# Disk I/O
iostat -x 1
```

### Terminal 3: Monitor Database
```bash
# Connection count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_stat_activity;"

# Query performance
psql $DATABASE_URL -c "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Slow queries
psql $DATABASE_URL -c "SELECT query FROM pg_stat_statements WHERE mean_time > 1000 ORDER BY mean_time DESC;"
```

### Terminal 4: Monitor Application
```bash
# Logs
kubectl logs -f deployment/backend -n advancia

# Metrics
curl http://localhost:3001/metrics | grep http_request_duration
```

---

## Results Analysis

### Key Metrics to Analyze

```
Requests/sec: [value]
Latency (p50): [value]ms
Latency (p95): [value]ms
Latency (p99): [value]ms
Error rate: [value]%
Success rate: [value]%
Throughput: [value] requests/sec
```

### Analysis Template

```
Load Test Results
Date: [Date]
Scenario: [Scenario Name]
Duration: [Duration]
Concurrent Users: [Number]

Results:
- Requests/sec: [value] (Target: [target])
- Latency (p95): [value]ms (Target: <500ms)
- Latency (p99): [value]ms (Target: <1000ms)
- Error rate: [value]% (Target: <0.1%)
- Success rate: [value]% (Target: >99.9%)

System Metrics:
- CPU: [value]% (Peak: [peak]%)
- Memory: [value]% (Peak: [peak]%)
- Disk I/O: [value]% (Peak: [peak]%)

Bottlenecks Identified:
1. [Bottleneck 1]
2. [Bottleneck 2]

Recommendations:
1. [Recommendation 1]
2. [Recommendation 2]

Conclusion:
[Summary of test results and findings]
```

---

## Regression Testing

### Automated Load Testing

```bash
#!/bin/bash
# run-load-tests.sh

echo "Running baseline test..."
k6 run --vus 100 --duration 1h load-test.js > baseline.json

echo "Comparing with previous results..."
python3 compare_results.py baseline.json previous.json

if [ $? -ne 0 ]; then
  echo "Performance regression detected!"
  exit 1
fi

echo "All tests passed!"
```

### CI/CD Integration

```yaml
# .github/workflows/load-test.yml
name: Load Testing

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Start services
        run: docker-compose -f docker-compose.dev.yml up -d
      
      - name: Run load test
        run: k6 run load-test.js > results.json
      
      - name: Compare results
        run: python3 compare_results.py results.json baseline.json
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: results.json
```

---

## Troubleshooting

### High Error Rate
- Check application logs
- Verify database connectivity
- Check resource availability
- Reduce concurrent users

### High Latency
- Check database query performance
- Monitor CPU and memory
- Check network latency
- Optimize slow endpoints

### Memory Leaks
- Monitor memory over time
- Check for unbounded caches
- Review event listeners
- Restart services if needed

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
