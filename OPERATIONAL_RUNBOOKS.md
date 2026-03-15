# Advancia PayLedger - Operational Runbooks

**Purpose**: Step-by-step procedures for common operational tasks  
**Audience**: DevOps, SRE, On-Call Engineers  
**Last Updated**: March 9, 2026

---

## Table of Contents

1. [Service Management](#service-management)
2. [Database Operations](#database-operations)
3. [Payment Processing](#payment-processing)
4. [Incident Response](#incident-response)
5. [Backup & Recovery](#backup--recovery)
6. [Scaling & Performance](#scaling--performance)

---

## Service Management

### Restart a Service

#### Kubernetes Service Restart
```bash
# Restart backend service
kubectl rollout restart deployment/backend -n advancia

# Verify restart
kubectl rollout status deployment/backend -n advancia

# Check pod status
kubectl get pods -n advancia | grep backend
```

#### Docker Service Restart
```bash
# Stop service
docker-compose -f docker-compose.dev.yml stop backend

# Start service
docker-compose -f docker-compose.dev.yml start backend

# Verify health
curl http://localhost:3001/health
```

### Check Service Health

```bash
# Check all services
kubectl get pods -n advancia

# Check specific service
kubectl describe pod <pod-name> -n advancia

# View logs
kubectl logs -f deployment/backend -n advancia

# Check resource usage
kubectl top pods -n advancia
```

### Scale Service

```bash
# Scale backend to 5 replicas
kubectl scale deployment/backend --replicas=5 -n advancia

# Verify scaling
kubectl get deployment/backend -n advancia

# Check pod distribution
kubectl get pods -o wide -n advancia
```

### Update Service Image

```bash
# Update image
kubectl set image deployment/backend \
  backend=<account-id>.dkr.ecr.us-east-1.amazonaws.com/advancia-payledger:backend-latest \
  -n advancia

# Verify update
kubectl rollout status deployment/backend -n advancia

# Rollback if needed
kubectl rollout undo deployment/backend -n advancia
```

---

## Database Operations

### Database Health Check

```bash
# Connect to database
psql $DATABASE_URL

# Check database status
SELECT version();

# Check connections
SELECT count(*) FROM pg_stat_activity;

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
ORDER BY pg_total_relation_size DESC;

# Check slow queries
SELECT query, calls, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;
```

### Backup Database

```bash
# Create backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup
ls -lh backup-*.sql

# Compress backup
gzip backup-*.sql

# Upload to S3
aws s3 cp backup-*.sql.gz s3://advancia-backups/
```

### Restore Database

```bash
# Stop application
kubectl scale deployment/backend --replicas=0 -n advancia

# Restore from backup
psql $DATABASE_URL < backup-20260309-120000.sql

# Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# Restart application
kubectl scale deployment/backend --replicas=3 -n advancia
```

### Run Database Migration

```bash
# Backup first
pg_dump $DATABASE_URL > backup-pre-migration.sql

# Run migration
npm run prisma:migrate

# Verify migration
npm run prisma:migrate -- --status

# Rollback if needed
npm run prisma:migrate -- resolve --rolled-back <migration-name>
```

### Optimize Database

```bash
# Analyze tables
ANALYZE;

# Reindex tables
REINDEX DATABASE advancia_payledger;

# Vacuum database
VACUUM ANALYZE;

# Check index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

---

## Payment Processing

### Check Payment Status

```bash
# Connect to database
psql $DATABASE_URL

# Check recent payments
SELECT id, payment_number, amount, status, created_at 
FROM payments 
ORDER BY created_at DESC LIMIT 10;

# Check failed payments
SELECT id, payment_number, amount, status, processor_response 
FROM payments 
WHERE status = 'FAILED' 
ORDER BY created_at DESC;

# Check pending payments
SELECT id, payment_number, amount, status 
FROM payments 
WHERE status = 'PENDING' 
ORDER BY created_at ASC;
```

### Retry Failed Payment

```bash
# Check payment details
SELECT * FROM payments WHERE id = 'pay-123';

# Retry payment
curl -X POST http://localhost:3004/api/payments/pay-123/retry \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Verify retry
SELECT * FROM payments WHERE id = 'pay-123';
```

### Process Refund

```bash
# Check payment
SELECT * FROM payments WHERE id = 'pay-123';

# Process refund
curl -X POST http://localhost:3004/api/payments/pay-123/refund \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100.00, "reason": "Customer request"}'

# Verify refund
SELECT * FROM payments WHERE id = 'pay-123';
```

### Reconcile Payments

```bash
# Check unreconciled payments
SELECT COUNT(*) FROM payments WHERE status = 'COMPLETED' AND invoice_id IS NULL;

# Reconcile payments
npm run reconcile:payments

# Verify reconciliation
SELECT COUNT(*) FROM payments WHERE status = 'COMPLETED' AND invoice_id IS NULL;
```

---

## Incident Response

### Service Down

#### Step 1: Acknowledge
```bash
# Acknowledge in PagerDuty
# Join incident Slack channel
# Start incident timeline
```

#### Step 2: Assess Impact
```bash
# Check service status
kubectl get pods -n advancia | grep backend

# Check logs
kubectl logs -f deployment/backend -n advancia

# Check metrics
curl http://localhost:3001/metrics

# Estimate customer impact
# Determine severity level
```

#### Step 3: Investigate
```bash
# Check recent deployments
kubectl rollout history deployment/backend -n advancia

# Check resource usage
kubectl top pods -n advancia

# Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_stat_activity;"

# Check Sentry
# Review error logs in Kibana
```

#### Step 4: Mitigate
```bash
# Option 1: Restart service
kubectl rollout restart deployment/backend -n advancia

# Option 2: Scale down and up
kubectl scale deployment/backend --replicas=0 -n advancia
kubectl scale deployment/backend --replicas=3 -n advancia

# Option 3: Rollback deployment
kubectl rollout undo deployment/backend -n advancia

# Verify recovery
curl http://localhost:3001/health
```

#### Step 5: Communicate
- Update status page
- Notify customers
- Post in incident channel
- Provide ETA for resolution

#### Step 6: Post-Incident
- Write incident report
- Identify root cause
- Create action items
- Schedule follow-up

### High Error Rate

```bash
# Check error rate
curl http://localhost:3001/metrics | grep http_requests_total

# Check logs
kubectl logs -f deployment/backend -n advancia | grep ERROR

# Check Sentry
# Review recent errors

# Identify pattern
# Check recent deployments
# Check database performance

# Mitigate
# Rollback if needed
# Scale resources
# Apply temporary fix
```

### Database Connection Pool Exhausted

```bash
# Check connections
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_stat_activity;"

# Check long-running queries
psql $DATABASE_URL -c "SELECT pid, usename, query, query_start FROM pg_stat_activity WHERE state = 'active';"

# Kill long-running query
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = <pid>;

# Increase pool size
# Edit backend deployment
kubectl set env deployment/backend DB_POOL_SIZE=150 -n advancia

# Verify
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_stat_activity;"
```

### High Memory Usage

```bash
# Check memory usage
kubectl top pods -n advancia

# Check memory limits
kubectl get pods -o json -n advancia | jq '.items[].spec.containers[].resources'

# Check for memory leaks
# Review application logs
# Check for large queries

# Mitigate
# Restart service
kubectl rollout restart deployment/backend -n advancia

# Increase memory limit
kubectl set resources deployment/backend --limits=memory=2Gi -n advancia

# Verify
kubectl top pods -n advancia
```

---

## Backup & Recovery

### Daily Backup Procedure

```bash
# Run at 2 AM UTC
0 2 * * * /scripts/backup-database.sh

# Backup script contents:
#!/bin/bash
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.sql"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp "$BACKUP_FILE.gz" s3://advancia-backups/

# Keep local backups for 7 days
find $BACKUP_DIR -name "backup-*.sql.gz" -mtime +7 -delete

# Verify
echo "Backup completed: $BACKUP_FILE.gz"
```

### Weekly Backup Verification

```bash
# List backups
aws s3 ls s3://advancia-backups/

# Download latest backup
aws s3 cp s3://advancia-backups/backup-latest.sql.gz .

# Decompress
gunzip backup-latest.sql.gz

# Test restore to staging database
psql staging_db < backup-latest.sql

# Verify data
psql staging_db -c "SELECT COUNT(*) FROM users;"

# Clean up
rm backup-latest.sql
```

### Disaster Recovery

```bash
# 1. Assess damage
# Check database integrity
psql $DATABASE_URL -c "SELECT * FROM pg_stat_database WHERE datname = 'advancia_payledger';"

# 2. Stop application
kubectl scale deployment/backend --replicas=0 -n advancia

# 3. Restore from backup
aws s3 cp s3://advancia-backups/backup-latest.sql.gz .
gunzip backup-latest.sql.gz
psql $DATABASE_URL < backup-latest.sql

# 4. Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM invoices;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM payments;"

# 5. Restart application
kubectl scale deployment/backend --replicas=3 -n advancia

# 6. Monitor
kubectl logs -f deployment/backend -n advancia

# 7. Notify stakeholders
```

---

## Scaling & Performance

### Horizontal Scaling

```bash
# Monitor current load
kubectl top pods -n advancia

# Check current replicas
kubectl get deployment/backend -n advancia

# Scale up
kubectl scale deployment/backend --replicas=5 -n advancia

# Monitor scaling
kubectl get pods -w -n advancia

# Verify health
curl http://localhost:3001/health
```

### Vertical Scaling

```bash
# Check current resources
kubectl get pods -o json -n advancia | jq '.items[].spec.containers[].resources'

# Update resource limits
kubectl set resources deployment/backend \
  --requests=cpu=500m,memory=1Gi \
  --limits=cpu=1000m,memory=2Gi \
  -n advancia

# Verify update
kubectl get deployment/backend -o json -n advancia | jq '.spec.template.spec.containers[].resources'
```

### Database Query Optimization

```bash
# Identify slow queries
psql $DATABASE_URL -c "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Analyze query plan
EXPLAIN ANALYZE SELECT * FROM invoices WHERE status = 'PAID';

# Create index if needed
CREATE INDEX idx_invoices_status ON invoices(status);

# Verify index usage
SELECT schemaname, tablename, indexname, idx_scan FROM pg_stat_user_indexes ORDER BY idx_scan DESC;
```

### Cache Optimization

```bash
# Check Redis memory
redis-cli INFO memory

# Check cache hit rate
redis-cli INFO stats | grep hits

# Clear cache if needed
redis-cli FLUSHDB

# Monitor cache performance
redis-cli MONITOR
```

---

## Emergency Contacts

- **On-Call Engineer**: [PagerDuty]
- **DevOps Lead**: [Contact]
- **Database Admin**: [Contact]
- **Security Lead**: [Contact]

---

## Useful Commands Reference

```bash
# Kubernetes
kubectl get pods -n advancia
kubectl logs -f deployment/backend -n advancia
kubectl describe pod <pod-name> -n advancia
kubectl exec -it <pod-name> -n advancia -- bash

# Database
psql $DATABASE_URL
pg_dump $DATABASE_URL > backup.sql
pg_restore -d advancia_payledger backup.sql

# Docker
docker-compose ps
docker-compose logs -f
docker-compose restart backend

# Git
git log --oneline -10
git diff HEAD~1
git revert <commit>
```

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
