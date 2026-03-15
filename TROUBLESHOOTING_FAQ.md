# Advancia PayLedger - Troubleshooting & FAQ

**Purpose**: Common issues and solutions  
**Audience**: All team members  
**Last Updated**: March 9, 2026

---

## Table of Contents

1. [Development Issues](#development-issues)
2. [Database Issues](#database-issues)
3. [API Issues](#api-issues)
4. [Payment Processing Issues](#payment-processing-issues)
5. [Deployment Issues](#deployment-issues)
6. [Performance Issues](#performance-issues)
7. [Security Issues](#security-issues)
8. [Frequently Asked Questions](#frequently-asked-questions)

---

## Development Issues

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3001`

**Solution**:
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm run dev
```

### Module Not Found

**Problem**: `Cannot find module '@/utils/logger'`

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm cache clean --force

# Verify tsconfig paths
cat tsconfig.json | grep paths
```

### TypeScript Compilation Error

**Problem**: `error TS2307: Cannot find module`

**Solution**:
```bash
# Check TypeScript version
npm list typescript

# Regenerate types
npm run type-check

# Clear build cache
rm -rf dist/ .next/

# Rebuild
npm run build
```

### Git Merge Conflicts

**Problem**: Merge conflicts in package.json or schema files

**Solution**:
```bash
# View conflicts
git status

# Resolve conflicts manually
# Then stage and commit
git add .
git commit -m "fix: resolve merge conflicts"

# Or abort merge
git merge --abort
```

### Environment Variables Not Loading

**Problem**: `undefined` values for environment variables

**Solution**:
```bash
# Verify .env.local exists
ls -la .env.local

# Check variables
cat .env.local | grep DATABASE_URL

# Restart dev server
npm run dev

# Verify in code
console.log(process.env.DATABASE_URL)
```

---

## Database Issues

### Cannot Connect to Database

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Check Docker containers
docker-compose ps

# Start Docker services
docker-compose -f docker-compose.dev.yml up -d

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check DATABASE_URL
echo $DATABASE_URL
```

### Migration Failed

**Problem**: `Error: Migration failed`

**Solution**:
```bash
# Check migration status
npm run prisma:migrate -- --status

# View migration files
ls -la prisma/migrations/

# Rollback migration
npm run prisma:migrate -- resolve --rolled-back <migration-name>

# Retry migration
npm run prisma:migrate deploy
```

### Prisma Client Out of Sync

**Problem**: `Error: The Prisma Client was initialized with an incompatible engine version`

**Solution**:
```bash
# Regenerate Prisma Client
npm run prisma:generate

# Clear cache
rm -rf node_modules/.prisma

# Reinstall
npm install
```

### Connection Pool Exhausted

**Problem**: `Error: remaining connection slots are reserved for non-replication superuser connections`

**Solution**:
```bash
# Check connections
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_stat_activity;"

# Kill idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE state = 'idle' AND query_start < NOW() - INTERVAL '10 minutes';

# Increase pool size in .env
DATABASE_URL="...?connection_limit=150"

# Restart application
npm run dev
```

### Slow Queries

**Problem**: Queries taking >1 second

**Solution**:
```bash
# Analyze query plan
EXPLAIN ANALYZE SELECT * FROM invoices WHERE status = 'PAID';

# Create index
CREATE INDEX idx_invoices_status ON invoices(status);

# Verify index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

# Vacuum and analyze
VACUUM ANALYZE invoices;
```

### Data Corruption

**Problem**: Unexpected data or constraint violations

**Solution**:
```bash
# Check data integrity
SELECT * FROM invoices WHERE total_amount < 0;

# Check constraints
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY';

# Restore from backup
pg_restore -d advancia_payledger backup.sql

# Verify restoration
SELECT COUNT(*) FROM users;
```

---

## API Issues

### 401 Unauthorized

**Problem**: `Error: 401 Unauthorized`

**Solution**:
```bash
# Check token
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api

# Generate new token
# Login and get token from response

# Verify token format
# Should be: Authorization: Bearer <jwt-token>

# Check token expiration
# Decode JWT at jwt.io
```

### 403 Forbidden

**Problem**: `Error: 403 Forbidden`

**Solution**:
```bash
# Check user role
SELECT role FROM users WHERE id = '<user-id>';

# Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'invoices';

# Verify permissions
# User must have correct role for resource access
```

### 404 Not Found

**Problem**: `Error: 404 Not Found`

**Solution**:
```bash
# Check endpoint exists
curl http://localhost:3001/api/invoices

# Check resource exists
psql $DATABASE_URL -c "SELECT * FROM invoices WHERE id = '<id>';"

# Check route definition
grep -r "GET /api/invoices" backend/src/

# Verify URL spelling
```

### 500 Internal Server Error

**Problem**: `Error: 500 Internal Server Error`

**Solution**:
```bash
# Check server logs
kubectl logs -f deployment/backend -n advancia

# Check Sentry
# Review error details

# Check database
psql $DATABASE_URL -c "SELECT 1;"

# Restart service
kubectl rollout restart deployment/backend -n advancia
```

### Rate Limit Exceeded

**Problem**: `Error: 429 Too Many Requests`

**Solution**:
```bash
# Check rate limit headers
curl -i http://localhost:3001/api/invoices | grep X-RateLimit

# Wait for rate limit to reset
# Default: 15 minutes

# Increase rate limit in code
// config/rateLimit.ts
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000  // Increase this
});
```

---

## Payment Processing Issues

### Payment Stuck in Pending

**Problem**: Payment status is 'PENDING' for >5 minutes

**Solution**:
```bash
# Check payment status
SELECT * FROM payments WHERE id = '<payment-id>';

# Check payment service logs
kubectl logs -f deployment/payment-service -n advancia

# Check Stripe status
# Login to Stripe dashboard and verify

# Retry payment
curl -X POST http://localhost:3004/api/payments/<payment-id>/retry \
  -H "Authorization: Bearer $TOKEN"
```

### Payment Declined

**Problem**: `Error: Payment declined`

**Solution**:
```bash
# Check payment details
SELECT * FROM payments WHERE id = '<payment-id>';

# Check processor response
SELECT processor_response FROM payments WHERE id = '<payment-id>';

# Common reasons:
# - Insufficient funds
# - Card expired
# - Incorrect CVV
# - Fraud detection

# Contact customer to update payment method
```

### Duplicate Payment

**Problem**: Payment charged twice

**Solution**:
```bash
# Check for duplicates
SELECT invoice_id, COUNT(*) FROM payments 
GROUP BY invoice_id HAVING COUNT(*) > 1;

# Check idempotency key
SELECT * FROM payments WHERE idempotency_key = '<key>';

# Process refund for duplicate
curl -X POST http://localhost:3004/api/payments/<payment-id>/refund \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount": 100.00, "reason": "Duplicate charge"}'
```

### Reconciliation Failed

**Problem**: Payments not reconciled with invoices

**Solution**:
```bash
# Check unreconciled payments
SELECT COUNT(*) FROM payments 
WHERE status = 'COMPLETED' AND invoice_id IS NULL;

# Manually reconcile
UPDATE payments SET invoice_id = '<invoice-id>' 
WHERE id = '<payment-id>';

# Run reconciliation job
npm run reconcile:payments

# Verify
SELECT COUNT(*) FROM payments 
WHERE status = 'COMPLETED' AND invoice_id IS NULL;
```

---

## Deployment Issues

### Deployment Timeout

**Problem**: `Error: Deployment timeout`

**Solution**:
```bash
# Check pod status
kubectl get pods -n advancia

# Check pod events
kubectl describe pod <pod-name> -n advancia

# Check resource availability
kubectl top nodes

# Increase timeout
kubectl set resources deployment/backend \
  --limits=cpu=2000m,memory=4Gi -n advancia

# Retry deployment
kubectl rollout restart deployment/backend -n advancia
```

### Image Pull Failed

**Problem**: `Error: ImagePullBackOff`

**Solution**:
```bash
# Check image exists
aws ecr describe-images --repository-name advancia-payledger

# Check credentials
kubectl get secrets -n advancia

# Verify image name
kubectl describe pod <pod-name> -n advancia | grep Image

# Rebuild and push image
docker build -t advancia-backend:latest ./backend
docker tag advancia-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/advancia-payledger:backend-latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/advancia-payledger:backend-latest
```

### CrashLoopBackOff

**Problem**: Pod keeps crashing

**Solution**:
```bash
# Check logs
kubectl logs <pod-name> -n advancia

# Check previous logs
kubectl logs <pod-name> -n advancia --previous

# Check events
kubectl describe pod <pod-name> -n advancia

# Common causes:
# - Missing environment variables
# - Database connection failed
# - Port already in use
# - Out of memory

# Fix and redeploy
kubectl rollout restart deployment/backend -n advancia
```

---

## Performance Issues

### High CPU Usage

**Problem**: CPU usage >80%

**Solution**:
```bash
# Check CPU usage
kubectl top pods -n advancia

# Identify hot pods
kubectl top pods -n advancia --sort-by=cpu

# Check processes
kubectl exec <pod-name> -n advancia -- top -b -n 1

# Scale up
kubectl scale deployment/backend --replicas=5 -n advancia

# Optimize code
# Profile application
# Identify bottlenecks
# Optimize queries
```

### High Memory Usage

**Problem**: Memory usage >85%

**Solution**:
```bash
# Check memory usage
kubectl top pods -n advancia

# Identify memory leaks
# Check for unbounded caches
# Review event listeners

# Restart pod
kubectl rollout restart deployment/backend -n advancia

# Increase memory limit
kubectl set resources deployment/backend \
  --limits=memory=4Gi -n advancia

# Monitor memory
kubectl top pods -w -n advancia
```

### Slow API Response

**Problem**: API response time >1 second

**Solution**:
```bash
# Check metrics
curl http://localhost:3001/metrics | grep http_request_duration

# Identify slow endpoints
# Check database queries
# Check cache hit rate

# Optimize queries
# Add indexes
# Implement caching
# Use pagination

# Monitor improvement
# Use load testing
```

---

## Security Issues

### Suspicious Activity Detected

**Problem**: Unusual login attempts or API calls

**Solution**:
```bash
# Check logs
kubectl logs -f deployment/backend -n advancia | grep ERROR

# Check Sentry
# Review security alerts

# Block IP if needed
# Update WAF rules
# Notify security team

# Monitor for further activity
```

### Potential Data Breach

**Problem**: Unauthorized data access detected

**Solution**:
```bash
# 1. Isolate affected systems
kubectl scale deployment/backend --replicas=0 -n advancia

# 2. Preserve evidence
# Collect logs
# Take snapshots
# Document timeline

# 3. Investigate
# Check access logs
# Review audit logs
# Identify affected data

# 4. Notify stakeholders
# Customers
# Regulators
# Insurance

# 5. Remediate
# Patch vulnerability
# Reset credentials
# Restore from backup
```

---

## Frequently Asked Questions

### Q: How do I reset the database?

**A**: 
```bash
# Development only!
npm run prisma:reset

# This will:
# 1. Drop database
# 2. Create new database
# 3. Run migrations
# 4. Seed data
```

### Q: How do I view the database?

**A**:
```bash
# Option 1: Prisma Studio
npm run prisma:studio

# Option 2: psql
psql $DATABASE_URL

# Option 3: GUI tools
# DBeaver, pgAdmin, etc.
```

### Q: How do I run tests?

**A**:
```bash
# All tests
npm run test

# Specific test
npm run test -- payment.test.ts

# With coverage
npm run test:coverage

# Watch mode
npm run test -- --watch
```

### Q: How do I deploy?

**A**:
```bash
# Follow PRODUCTION_DEPLOYMENT.md
# 1. Build images
# 2. Push to registry
# 3. Deploy to Kubernetes
# 4. Verify health
# 5. Monitor
```

### Q: How do I debug?

**A**:
```bash
# Check logs
kubectl logs -f deployment/backend -n advancia

# Check metrics
curl http://localhost:3001/metrics

# Use debugger
node --inspect-brk dist/index.js

# Check database
psql $DATABASE_URL
```

### Q: How do I add a new feature?

**A**:
```bash
# 1. Create branch
git checkout -b feature/my-feature

# 2. Implement feature
# Write code
# Write tests
# Update documentation

# 3. Submit PR
git push origin feature/my-feature

# 4. Get review
# Address feedback
# Get approval

# 5. Merge
git merge feature/my-feature
```

### Q: How do I handle secrets?

**A**:
```bash
# Never commit secrets!
# Use .env.local for development
# Use AWS Secrets Manager for production

# Example:
# .env.local (gitignored)
DATABASE_URL=postgresql://...
JWT_SECRET=my-secret

# Code:
const secret = process.env.JWT_SECRET;
```

### Q: How do I scale the application?

**A**:
```bash
# Horizontal scaling
kubectl scale deployment/backend --replicas=5 -n advancia

# Vertical scaling
kubectl set resources deployment/backend \
  --limits=cpu=2000m,memory=4Gi -n advancia

# Auto-scaling
kubectl autoscale deployment/backend \
  --min=3 --max=10 --cpu-percent=70 -n advancia
```

### Q: How do I monitor the application?

**A**:
```bash
# Grafana dashboards
https://grafana.advancia.com

# Sentry errors
https://sentry.advancia.com

# Prometheus metrics
https://prometheus.advancia.com

# Kibana logs
https://kibana.advancia.com
```

### Q: How do I handle incidents?

**A**:
```bash
# 1. Acknowledge alert
# 2. Join incident channel
# 3. Assess impact
# 4. Investigate
# 5. Mitigate
# 6. Communicate
# 7. Post-incident review

# See OPERATIONAL_RUNBOOKS.md for details
```

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
