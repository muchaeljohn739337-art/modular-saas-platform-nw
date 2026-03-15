# Advancia PayLedger - Disaster Recovery Plan

**Purpose**: Procedures for recovering from major incidents  
**Audience**: DevOps, Infrastructure Team, Incident Commanders  
**Last Updated**: March 9, 2026

---

## Recovery Objectives

| Objective | Target | Notes |
|-----------|--------|-------|
| **RTO** (Recovery Time Objective) | 1 hour | Maximum acceptable downtime |
| **RPO** (Recovery Point Objective) | 15 minutes | Maximum acceptable data loss |
| **Backup Frequency** | Every 4 hours | Automated backups |
| **Backup Retention** | 30 days | Rolling retention window |
| **Test Frequency** | Monthly | Disaster recovery drills |

---

## Disaster Scenarios

### Scenario 1: Database Failure

**Severity**: Critical  
**Impact**: Complete data loss, service unavailable

#### Detection
```bash
# Database health check fails
curl http://localhost:3001/health | grep database

# Connection errors in logs
kubectl logs -f deployment/backend -n advancia | grep "connection refused"

# Metrics show no database queries
curl http://localhost:3001/metrics | grep pg_
```

#### Recovery Steps

**Step 1: Assess Damage (5 minutes)**
```bash
# Check database status
psql $DATABASE_URL -c "SELECT version();"

# Check backup status
aws s3 ls s3://advancia-backups/ --recursive

# Determine recovery point
# Latest backup timestamp
```

**Step 2: Prepare Recovery (10 minutes)**
```bash
# Stop application to prevent writes
kubectl scale deployment/backend --replicas=0 -n advancia
kubectl scale deployment/payment-service --replicas=0 -n advancia

# Verify all services stopped
kubectl get pods -n advancia | grep -v "0/1"
```

**Step 3: Restore Database (20 minutes)**
```bash
# Download latest backup
aws s3 cp s3://advancia-backups/backup-latest.sql.gz .

# Decompress
gunzip backup-latest.sql.gz

# Restore database
psql $DATABASE_URL < backup-latest.sql

# Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM invoices;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM payments;"
```

**Step 4: Restart Services (10 minutes)**
```bash
# Restart backend
kubectl scale deployment/backend --replicas=3 -n advancia

# Restart payment service
kubectl scale deployment/payment-service --replicas=3 -n advancia

# Verify health
curl http://localhost:3001/health

# Monitor logs
kubectl logs -f deployment/backend -n advancia
```

**Step 5: Verify Data Integrity (10 minutes)**
```bash
# Check data consistency
npm run db:verify

# Check for orphaned records
psql $DATABASE_URL -c "SELECT * FROM invoices WHERE patient_id NOT IN (SELECT id FROM patients);"

# Verify payment reconciliation
psql $DATABASE_URL -c "SELECT COUNT(*) FROM payments WHERE status = 'COMPLETED' AND invoice_id IS NULL;"
```

**Step 6: Notify Stakeholders (5 minutes)**
```
- Update status page
- Notify customers
- Post in incident channel
- Provide ETA for full recovery
```

**Total Recovery Time**: ~60 minutes

---

### Scenario 2: Kubernetes Cluster Failure

**Severity**: Critical  
**Impact**: All services down, complete service outage

#### Detection
```bash
# Cluster health check fails
kubectl cluster-info

# Nodes are not ready
kubectl get nodes

# Pods cannot be scheduled
kubectl get pods -n advancia | grep Pending
```

#### Recovery Steps

**Step 1: Assess Cluster Status (5 minutes)**
```bash
# Check node status
kubectl get nodes

# Check cluster events
kubectl get events -n advancia --sort-by='.lastTimestamp'

# Check resource availability
kubectl describe nodes
```

**Step 2: Attempt Node Recovery (15 minutes)**
```bash
# Restart failed nodes
aws ec2 reboot-instances --instance-ids <instance-id>

# Wait for nodes to come back
kubectl get nodes -w

# If nodes don't recover, proceed to Step 3
```

**Step 3: Provision New Cluster (30 minutes)**
```bash
# Create new EKS cluster
eksctl create cluster \
  --name advancia-payledger-dr \
  --version 1.27 \
  --region us-east-1 \
  --nodegroup-name standard-nodes \
  --node-type t3.xlarge \
  --nodes 3

# Configure kubectl
aws eks update-kubeconfig \
  --region us-east-1 \
  --name advancia-payledger-dr
```

**Step 4: Deploy Services (20 minutes)**
```bash
# Create namespace
kubectl create namespace advancia

# Create secrets
kubectl create secret generic db-credentials \
  --from-literal=DATABASE_URL=$DATABASE_URL \
  -n advancia

# Deploy services
kubectl apply -f infra/k8s/base/ -n advancia

# Wait for deployments
kubectl rollout status deployment/backend -n advancia
```

**Step 5: Update DNS (5 minutes)**
```bash
# Point to new cluster
# Update Route53 or DNS provider
# New cluster ingress IP: <new-ip>

# Verify DNS propagation
nslookup api.advanciapayledger.com
```

**Step 6: Verify Services (10 minutes)**
```bash
# Health checks
curl https://api.advanciapayledger.com/health

# Test API
curl https://api.advanciapayledger.com/api

# Monitor logs
kubectl logs -f deployment/backend -n advancia
```

**Total Recovery Time**: ~85 minutes

---

### Scenario 3: Data Center Outage

**Severity**: Critical  
**Impact**: Complete regional outage, all services down

#### Detection
```bash
# All services unreachable
curl https://api.advanciapayledger.com/health
# Connection timeout

# AWS region is down
aws ec2 describe-instances --region us-east-1
# Error: Unable to connect
```

#### Recovery Steps

**Step 1: Declare Disaster (5 minutes)**
- Activate disaster recovery team
- Notify all stakeholders
- Begin incident command

**Step 2: Assess Backup Status (10 minutes)**
```bash
# Check backup in secondary region
aws s3 ls s3://advancia-backups-dr/ --region us-west-2

# Verify backup integrity
# Download and verify backup
```

**Step 3: Provision Infrastructure in Secondary Region (45 minutes)**
```bash
# Create RDS database in us-west-2
aws rds create-db-instance \
  --db-instance-identifier advancia-payledger-dr \
  --db-instance-class db.t3.large \
  --engine postgres \
  --region us-west-2

# Create ElastiCache in us-west-2
aws elasticache create-replication-group \
  --replication-group-description "Advancia DR" \
  --engine redis \
  --region us-west-2

# Create EKS cluster in us-west-2
eksctl create cluster \
  --name advancia-payledger-dr \
  --region us-west-2
```

**Step 4: Restore Data (20 minutes)**
```bash
# Restore database from backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier advancia-payledger-dr \
  --db-snapshot-identifier advancia-snapshot-latest \
  --region us-west-2

# Wait for restoration
aws rds describe-db-instances \
  --db-instance-identifier advancia-payledger-dr \
  --region us-west-2
```

**Step 5: Deploy Services (20 minutes)**
```bash
# Deploy to secondary region
kubectl apply -f infra/k8s/base/ -n advancia

# Verify deployments
kubectl get pods -n advancia
```

**Step 6: Update DNS (5 minutes)**
```bash
# Update global DNS to point to secondary region
# Use Route53 failover routing

# Verify DNS propagation
nslookup api.advanciapayledger.com
```

**Total Recovery Time**: ~105 minutes

---

## Backup Procedures

### Automated Backup Schedule

```bash
# Every 4 hours
0 */4 * * * /scripts/backup-database.sh

# Daily full backup at 2 AM
0 2 * * * /scripts/backup-full.sh

# Weekly backup to secondary region
0 3 * * 0 /scripts/backup-secondary.sh
```

### Backup Script

```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.sql"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp "$BACKUP_FILE.gz" s3://advancia-backups/

# Upload to secondary region
aws s3 cp "$BACKUP_FILE.gz" s3://advancia-backups-dr/ --region us-west-2

# Keep local backups for 7 days
find $BACKUP_DIR -name "backup-*.sql.gz" -mtime +7 -delete

# Verify backup
if [ -f "$BACKUP_FILE.gz" ]; then
  echo "Backup successful: $BACKUP_FILE.gz"
  # Send success notification
else
  echo "Backup failed!"
  # Send failure alert
fi
```

### Backup Verification

```bash
# Weekly verification
0 4 * * 0 /scripts/verify-backup.sh

#!/bin/bash
# verify-backup.sh

# Download latest backup
aws s3 cp s3://advancia-backups/backup-latest.sql.gz /tmp/

# Decompress
gunzip /tmp/backup-latest.sql.gz

# Restore to test database
createdb test_restore
psql test_restore < /tmp/backup-latest.sql

# Verify data
psql test_restore -c "SELECT COUNT(*) FROM users;"
psql test_restore -c "SELECT COUNT(*) FROM invoices;"

# Clean up
dropdb test_restore
rm /tmp/backup-latest.sql
```

---

## Disaster Recovery Drills

### Monthly Drill Schedule

**First Monday of each month at 2 AM UTC**

```bash
# 1. Simulate database failure
# 2. Restore from backup to test environment
# 3. Verify data integrity
# 4. Document recovery time
# 5. Identify improvements
```

### Drill Checklist

- [ ] Backup exists and is accessible
- [ ] Backup can be restored
- [ ] Data integrity verified
- [ ] Recovery time documented
- [ ] Team trained on procedures
- [ ] Issues identified and tracked
- [ ] Improvements implemented

---

## Communication Plan

### Incident Notification

**Immediately upon detection**:
- Activate incident commander
- Page on-call team
- Create incident channel

**Every 15 minutes**:
- Update status page
- Notify stakeholders
- Provide ETA

**Upon recovery**:
- Confirm all systems operational
- Notify all stakeholders
- Begin post-incident review

### Escalation Path

1. **On-Call Engineer** (5 min)
2. **DevOps Lead** (10 min)
3. **CTO** (15 min)
4. **CEO** (30 min)

---

## Post-Incident Review

### Checklist

- [ ] Timeline documented
- [ ] Root cause identified
- [ ] Impact assessed
- [ ] Lessons learned captured
- [ ] Action items created
- [ ] Preventive measures identified
- [ ] Team debriefing completed

### Action Item Tracking

```
Issue: Database backup failed
Severity: High
Owner: Database Admin
Due Date: 1 week
Status: In Progress
```

---

## Disaster Recovery Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Incident Commander | [Name] | [Phone] | [Email] |
| DevOps Lead | [Name] | [Phone] | [Email] |
| Database Admin | [Name] | [Phone] | [Email] |
| CTO | [Name] | [Phone] | [Email] |
| CEO | [Name] | [Phone] | [Email] |

---

## Testing Checklist

### Pre-Disaster
- [ ] Backups automated and tested
- [ ] Recovery procedures documented
- [ ] Team trained on procedures
- [ ] Contact list updated
- [ ] Communication plan established
- [ ] Monitoring configured
- [ ] Alerts configured

### During Disaster
- [ ] Incident declared
- [ ] Team activated
- [ ] Communication started
- [ ] Recovery initiated
- [ ] Progress tracked
- [ ] Status updates provided

### Post-Disaster
- [ ] Services restored
- [ ] Data verified
- [ ] Stakeholders notified
- [ ] Post-incident review scheduled
- [ ] Lessons learned documented
- [ ] Improvements planned

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
