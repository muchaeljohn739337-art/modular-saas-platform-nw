# Advancia PayLedger - Data Migration Procedures

**Purpose**: Safe procedures for migrating data between systems  
**Audience**: Database Administrators, DevOps  
**Last Updated**: March 9, 2026

---

## Migration Strategy

### Pre-Migration Checklist

- [ ] Backup source database
- [ ] Backup destination database
- [ ] Verify data integrity in source
- [ ] Create migration plan
- [ ] Test migration in staging
- [ ] Schedule maintenance window
- [ ] Notify stakeholders
- [ ] Prepare rollback plan

---

## Migration Types

### 1. Schema Migration

```sql
-- Add new column
ALTER TABLE invoices ADD COLUMN tax_amount DECIMAL(10, 2) DEFAULT 0;

-- Add index
CREATE INDEX idx_invoices_tax ON invoices(tax_amount);

-- Verify migration
SELECT COUNT(*) FROM invoices WHERE tax_amount IS NULL;
```

### 2. Data Migration

```sql
-- Migrate data from old table to new table
INSERT INTO invoices_new (id, invoice_number, patient_id, provider_id, amount)
SELECT id, invoice_number, patient_id, provider_id, amount
FROM invoices_old
WHERE status != 'DELETED';

-- Verify counts match
SELECT COUNT(*) FROM invoices_old;
SELECT COUNT(*) FROM invoices_new;

-- Swap tables
ALTER TABLE invoices RENAME TO invoices_old;
ALTER TABLE invoices_new RENAME TO invoices;
```

### 3. Cross-Database Migration

```bash
#!/bin/bash
# migrate-database.sh

SOURCE_DB="postgresql://user:pass@source-host/advancia"
DEST_DB="postgresql://user:pass@dest-host/advancia"

# Dump source database
pg_dump $SOURCE_DB > backup.sql

# Restore to destination
psql $DEST_DB < backup.sql

# Verify migration
psql $DEST_DB -c "SELECT COUNT(*) FROM users;"
psql $DEST_DB -c "SELECT COUNT(*) FROM invoices;"
```

---

## Migration Execution

### Step 1: Preparation (1 hour)

```bash
# Create backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Create migration user
CREATE USER migration_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE advancia_payledger TO migration_user;

# Create migration log table
CREATE TABLE migration_log (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255),
  status VARCHAR(50),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT
);
```

### Step 2: Pre-Migration Validation (30 minutes)

```sql
-- Check data integrity
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_invoices FROM invoices;
SELECT COUNT(*) as total_payments FROM payments;

-- Check for orphaned records
SELECT COUNT(*) FROM invoices WHERE patient_id NOT IN (SELECT id FROM patients);
SELECT COUNT(*) FROM payments WHERE invoice_id NOT IN (SELECT id FROM invoices);

-- Check for NULL values in required fields
SELECT COUNT(*) FROM invoices WHERE invoice_number IS NULL;
SELECT COUNT(*) FROM payments WHERE amount IS NULL;
```

### Step 3: Execute Migration (Variable)

```bash
#!/bin/bash
# execute-migration.sh

set -e

MIGRATION_NAME="add_tax_field"
LOG_FILE="migration-${MIGRATION_NAME}.log"

echo "Starting migration: $MIGRATION_NAME" | tee $LOG_FILE

# Start transaction
psql $DATABASE_URL << EOF >> $LOG_FILE 2>&1
BEGIN;

-- Migration SQL
ALTER TABLE invoices ADD COLUMN tax_amount DECIMAL(10, 2) DEFAULT 0;
CREATE INDEX idx_invoices_tax ON invoices(tax_amount);

-- Update migration log
INSERT INTO migration_log (migration_name, status, started_at, completed_at)
VALUES ('$MIGRATION_NAME', 'COMPLETED', NOW(), NOW());

COMMIT;
EOF

if [ $? -eq 0 ]; then
  echo "Migration completed successfully" | tee -a $LOG_FILE
else
  echo "Migration failed" | tee -a $LOG_FILE
  exit 1
fi
```

### Step 4: Post-Migration Validation (30 minutes)

```sql
-- Verify schema changes
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'invoices' AND column_name = 'tax_amount';

-- Verify data integrity
SELECT COUNT(*) FROM invoices WHERE tax_amount IS NOT NULL;

-- Verify indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'invoices';

-- Check for errors
SELECT * FROM migration_log WHERE status = 'FAILED';
```

### Step 5: Application Testing (1 hour)

```bash
# Test critical flows
curl -X GET http://localhost:3001/api/invoices
curl -X POST http://localhost:3001/api/invoices \
  -H "Content-Type: application/json" \
  -d '{"patientId":"pat-123","providerId":"prov-456","amount":500}'

# Check logs for errors
kubectl logs -f deployment/backend -n advancia | grep ERROR

# Monitor metrics
curl http://localhost:3001/metrics | grep http_requests
```

### Step 6: Rollback Plan (If needed)

```bash
#!/bin/bash
# rollback-migration.sh

echo "Rolling back migration..."

# Restore from backup
psql $DATABASE_URL < backup-$(date +%Y%m%d-%H%M%S).sql

# Verify rollback
psql $DATABASE_URL -c "SELECT COUNT(*) FROM invoices;"

# Notify team
echo "Rollback completed"
```

---

## Large Data Migrations

### Batch Processing

```typescript
// services/migrationService.ts
async function migrateInvoices(batchSize: number = 1000) {
  let offset = 0;
  let totalMigrated = 0;

  while (true) {
    const invoices = await getInvoicesForMigration(offset, batchSize);
    
    if (invoices.length === 0) break;

    // Process batch
    for (const invoice of invoices) {
      await migrateInvoice(invoice);
    }

    totalMigrated += invoices.length;
    offset += batchSize;

    console.log(`Migrated ${totalMigrated} invoices`);

    // Pause between batches
    await sleep(1000);
  }

  return totalMigrated;
}
```

### Parallel Migration

```typescript
// Migrate data in parallel
async function parallelMigration(
  sourceQuery: string,
  targetTable: string,
  concurrency: number = 5
) {
  const data = await fetchSourceData(sourceQuery);
  
  // Process in parallel batches
  for (let i = 0; i < data.length; i += concurrency) {
    const batch = data.slice(i, i + concurrency);
    
    await Promise.all(
      batch.map(row => insertTargetData(targetTable, row))
    );
  }
}
```

---

## Verification

### Data Integrity Checks

```sql
-- Compare record counts
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'payments', COUNT(*) FROM payments;

-- Check for duplicates
SELECT id, COUNT(*) FROM invoices GROUP BY id HAVING COUNT(*) > 1;

-- Verify relationships
SELECT COUNT(*) FROM invoices i
LEFT JOIN patients p ON i.patient_id = p.id
WHERE p.id IS NULL;
```

### Performance Checks

```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM invoices WHERE patient_id = 'pat-123';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('invoices'));
```

---

## Migration Monitoring

### Progress Tracking

```typescript
// Track migration progress
async function trackMigrationProgress(
  migrationId: string,
  total: number,
  processed: number
) {
  const progress = (processed / total) * 100;
  
  await redis.set(
    `migration:${migrationId}:progress`,
    JSON.stringify({
      total,
      processed,
      progress,
      timestamp: new Date()
    })
  );
}

// Get migration status
async function getMigrationStatus(migrationId: string) {
  return redis.get(`migration:${migrationId}:progress`);
}
```

### Error Handling

```typescript
// Log migration errors
async function logMigrationError(
  migrationId: string,
  error: Error,
  context: any
) {
  await prisma.migrationError.create({
    data: {
      migrationId,
      errorMessage: error.message,
      errorStack: error.stack,
      context: JSON.stringify(context),
      timestamp: new Date()
    }
  });
}
```

---

## Rollback Procedures

### Automated Rollback

```bash
#!/bin/bash
# auto-rollback.sh

MIGRATION_ID=$1
BACKUP_FILE="backup-${MIGRATION_ID}.sql"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "Rolling back migration: $MIGRATION_ID"

# Restore database
psql $DATABASE_URL < $BACKUP_FILE

# Verify rollback
psql $DATABASE_URL -c "SELECT COUNT(*) FROM invoices;"

echo "Rollback completed"
```

### Manual Rollback

```sql
-- Manual rollback steps
BEGIN;

-- Revert schema changes
ALTER TABLE invoices DROP COLUMN tax_amount;
DROP INDEX idx_invoices_tax;

-- Verify revert
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'invoices' AND column_name = 'tax_amount';

COMMIT;
```

---

## Migration Checklist

- [ ] Backup created and verified
- [ ] Migration tested in staging
- [ ] Data integrity verified
- [ ] Rollback plan documented
- [ ] Stakeholders notified
- [ ] Maintenance window scheduled
- [ ] Migration executed
- [ ] Post-migration validation passed
- [ ] Application testing completed
- [ ] Monitoring verified
- [ ] Documentation updated

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
