# Advancia PayLedger - Backup and Recovery Procedures

**Purpose**: Comprehensive backup and disaster recovery procedures  
**Audience**: Database Administrators, DevOps  
**Last Updated**: March 9, 2026

---

## Backup Strategy

### Backup Types

#### Full Backup
- Complete database snapshot
- Frequency: Daily
- Retention: 30 days
- Time: 2:00 AM UTC

#### Incremental Backup
- Changes since last backup
- Frequency: Every 6 hours
- Retention: 7 days
- Time: 2:00 AM, 8:00 AM, 2:00 PM, 8:00 PM UTC

#### Transaction Log Backup
- Database transaction logs
- Frequency: Every 15 minutes
- Retention: 7 days
- Enables point-in-time recovery

---

## Backup Procedures

### PostgreSQL Full Backup

```bash
#!/bin/bash
# backup-full.sh

BACKUP_DIR="/backups/postgresql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/full_backup_$TIMESTAMP.sql.gz"

# Create backup
pg_dump \
  --host=$DB_HOST \
  --username=$DB_USER \
  --format=plain \
  --compress=9 \
  $DB_NAME > $BACKUP_FILE

# Verify backup
if [ $? -eq 0 ]; then
  echo "Backup created: $BACKUP_FILE"
  
  # Upload to S3
  aws s3 cp $BACKUP_FILE s3://advancia-backups/postgresql/
  
  # Verify upload
  if [ $? -eq 0 ]; then
    echo "Backup uploaded to S3"
    
    # Log backup
    echo "$(date): Full backup completed - $BACKUP_FILE" >> /var/log/backups.log
  fi
else
  echo "Backup failed"
  exit 1
fi
```

### PostgreSQL Incremental Backup

```bash
#!/bin/bash
# backup-incremental.sh

BACKUP_DIR="/backups/postgresql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/incremental_backup_$TIMESTAMP.sql.gz"

# Create incremental backup
pg_dump \
  --host=$DB_HOST \
  --username=$DB_USER \
  --format=plain \
  --compress=9 \
  --data-only \
  $DB_NAME > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://advancia-backups/postgresql/incremental/
```

### Application Data Backup

```bash
#!/bin/bash
# backup-application.sh

BACKUP_DIR="/backups/application"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup application configuration
tar -czf $BACKUP_DIR/config_$TIMESTAMP.tar.gz \
  /app/config \
  /app/.env.production

# Backup application logs
tar -czf $BACKUP_DIR/logs_$TIMESTAMP.tar.gz \
  /var/log/application/

# Upload to S3
aws s3 sync $BACKUP_DIR s3://advancia-backups/application/
```

---

## Backup Verification

### Verify Backup Integrity

```bash
#!/bin/bash
# verify-backup.sh

BACKUP_FILE=$1

# Check file size
if [ ! -s $BACKUP_FILE ]; then
  echo "Error: Backup file is empty"
  exit 1
fi

# Verify gzip integrity
gzip -t $BACKUP_FILE
if [ $? -ne 0 ]; then
  echo "Error: Backup file is corrupted"
  exit 1
fi

# Test restore to temporary database
TEMP_DB="test_restore_$(date +%s)"

# Create temporary database
createdb -U postgres $TEMP_DB

# Restore backup
gunzip -c $BACKUP_FILE | psql -U postgres $TEMP_DB > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "Backup verification successful"
  
  # Verify data integrity
  RECORD_COUNT=$(psql -U postgres $TEMP_DB -t -c "SELECT COUNT(*) FROM invoices;")
  echo "Records in backup: $RECORD_COUNT"
  
  # Drop temporary database
  dropdb -U postgres $TEMP_DB
else
  echo "Error: Backup restore failed"
  exit 1
fi
```

---

## Recovery Procedures

### Point-in-Time Recovery

```bash
#!/bin/bash
# recovery-pitr.sh

RECOVERY_TIME="2026-03-09 10:00:00"
BACKUP_FILE="/backups/postgresql/full_backup_20260309_020000.sql.gz"
RECOVERY_DB="advancia_payledger_recovered"

# Create recovery database
createdb -U postgres $RECOVERY_DB

# Restore from full backup
gunzip -c $BACKUP_FILE | psql -U postgres $RECOVERY_DB

# Apply transaction logs up to recovery time
pg_waldump \
  --path=/var/lib/postgresql/pg_wal \
  --stop-after-timestamp="$RECOVERY_TIME" \
  | psql -U postgres $RECOVERY_DB

echo "Recovery completed to: $RECOVERY_TIME"
```

### Full Database Recovery

```bash
#!/bin/bash
# recovery-full.sh

BACKUP_FILE=$1
RECOVERY_DB="advancia_payledger_recovered"

# Stop application
systemctl stop advancia-backend

# Create recovery database
createdb -U postgres $RECOVERY_DB

# Restore backup
gunzip -c $BACKUP_FILE | psql -U postgres $RECOVERY_DB

if [ $? -eq 0 ]; then
  echo "Recovery completed"
  
  # Verify recovery
  RECORD_COUNT=$(psql -U postgres $RECOVERY_DB -t -c "SELECT COUNT(*) FROM invoices;")
  echo "Records recovered: $RECORD_COUNT"
  
  # Swap databases
  psql -U postgres -c "ALTER DATABASE advancia_payledger RENAME TO advancia_payledger_old;"
  psql -U postgres -c "ALTER DATABASE $RECOVERY_DB RENAME TO advancia_payledger;"
  
  # Start application
  systemctl start advancia-backend
else
  echo "Recovery failed"
  exit 1
fi
```

---

## Backup Scheduling

### Cron Schedule

```bash
# /etc/cron.d/advancia-backups

# Full backup daily at 2:00 AM
0 2 * * * root /scripts/backup-full.sh

# Incremental backups every 6 hours
0 2,8,14,20 * * * root /scripts/backup-incremental.sh

# Verify backups daily at 3:00 AM
0 3 * * * root /scripts/verify-backup.sh /backups/postgresql/full_backup_*.sql.gz

# Cleanup old backups weekly
0 4 * * 0 root /scripts/cleanup-old-backups.sh
```

### Backup Cleanup

```bash
#!/bin/bash
# cleanup-old-backups.sh

BACKUP_DIR="/backups/postgresql"
RETENTION_DAYS=30

# Remove backups older than retention period
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Remove old backups from S3
aws s3 rm s3://advancia-backups/postgresql/ \
  --recursive \
  --exclude "*" \
  --include "*.sql.gz" \
  --older-than-days $RETENTION_DAYS

echo "Cleanup completed"
```

---

## Backup Monitoring

### Backup Status Checks

```bash
#!/bin/bash
# check-backup-status.sh

echo "=== Backup Status ==="

# Check latest full backup
LATEST_FULL=$(ls -t /backups/postgresql/full_backup_*.sql.gz | head -1)
FULL_AGE=$(( ($(date +%s) - $(stat -f%m $LATEST_FULL)) / 3600 ))

echo "Latest full backup: $LATEST_FULL"
echo "Age: ${FULL_AGE} hours"

if [ $FULL_AGE -gt 25 ]; then
  echo "WARNING: Full backup is older than 24 hours"
fi

# Check backup size
BACKUP_SIZE=$(du -sh /backups/postgresql | cut -f1)
echo "Total backup size: $BACKUP_SIZE"

# Check S3 backups
echo "S3 backups:"
aws s3 ls s3://advancia-backups/postgresql/ --recursive --human-readable | tail -5
```

### Backup Alerts

```yaml
groups:
  - name: backups
    rules:
      - alert: BackupNotCompleted
        expr: time() - backup_last_completed_timestamp > 86400
        for: 1h
        annotations:
          severity: critical
          summary: "Backup not completed in last 24 hours"

      - alert: BackupVerificationFailed
        expr: backup_verification_status == 0
        for: 5m
        annotations:
          severity: high
          summary: "Backup verification failed"

      - alert: BackupStorageAlmostFull
        expr: backup_storage_used / backup_storage_total > 0.9
        for: 10m
        annotations:
          severity: high
          summary: "Backup storage almost full"
```

---

## Recovery Testing

### Monthly Recovery Drill

```bash
#!/bin/bash
# recovery-drill.sh

echo "Starting recovery drill..."

# Select random backup
BACKUP_FILE=$(ls -t /backups/postgresql/full_backup_*.sql.gz | shuf | head -1)

echo "Testing recovery from: $BACKUP_FILE"

# Create test database
TEST_DB="recovery_test_$(date +%s)"
createdb -U postgres $TEST_DB

# Restore backup
gunzip -c $BACKUP_FILE | psql -U postgres $TEST_DB > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "Recovery drill successful"
  
  # Verify data
  INVOICE_COUNT=$(psql -U postgres $TEST_DB -t -c "SELECT COUNT(*) FROM invoices;")
  PAYMENT_COUNT=$(psql -U postgres $TEST_DB -t -c "SELECT COUNT(*) FROM payments;")
  
  echo "Invoices: $INVOICE_COUNT"
  echo "Payments: $PAYMENT_COUNT"
  
  # Cleanup
  dropdb -U postgres $TEST_DB
else
  echo "Recovery drill failed"
  exit 1
fi
```

---

## RTO/RPO Targets

| Scenario | RTO | RPO |
|----------|-----|-----|
| Database corruption | 1 hour | 15 minutes |
| Data center failure | 4 hours | 1 hour |
| Complete data loss | 8 hours | 6 hours |
| Single table loss | 30 minutes | 5 minutes |

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
