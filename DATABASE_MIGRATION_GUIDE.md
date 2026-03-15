# Advancia PayLedger - Database Migration Guide

## Overview

This guide covers database schema migrations, data migrations, and rollback procedures for Advancia PayLedger.

---

## Migration Strategy

### Approach
- **Zero-downtime migrations**: Use feature flags for backward compatibility
- **Reversible migrations**: All migrations must be reversible
- **Tested migrations**: Run migrations in staging first
- **Documented changes**: Document all schema changes

### Tools
- **Prisma Migrate**: Schema version control
- **Custom SQL scripts**: Complex data transformations
- **Backup & restore**: Data safety

---

## Initial Schema Setup

### 1. Create Initial Schema

```bash
# Generate initial migration
npx prisma migrate dev --name initial_schema

# This creates:
# - Users table with authentication
# - Patients, Providers, Staff tables
# - Invoices, Payments, Claims tables
# - Audit logs table
```

### 2. Apply RLS Policies

```bash
# Run RLS migration
npx prisma migrate deploy

# Verify RLS enabled
psql $DATABASE_URL -c "SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE rowsecurity = true;"
```

### 3. Seed Initial Data

```bash
# Seed test data
npx prisma db seed

# Verify data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

---

## Running Migrations

### Development Environment

```bash
# Create new migration
npx prisma migrate dev --name add_new_feature

# This will:
# 1. Create migration file
# 2. Apply to development database
# 3. Generate Prisma Client

# Review generated SQL
cat prisma/migrations/<timestamp>_add_new_feature/migration.sql
```

### Staging Environment

```bash
# Apply pending migrations
npx prisma migrate deploy

# Verify migration
npx prisma db execute --stdin < verify.sql

# Test application
npm run test:integration
```

### Production Environment

```bash
# Backup database first
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Apply migrations
npx prisma migrate deploy

# Verify migration
npx prisma db execute --stdin < verify.sql

# Monitor application
kubectl logs -f deployment/backend -n advancia
```

---

## Common Migrations

### 1. Add New Column

```sql
-- migration.sql
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);

-- Make it required with default
ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT NOW();

-- Add constraint
ALTER TABLE users ADD CONSTRAINT phone_unique UNIQUE(phone_number);
```

### 2. Add New Table

```sql
-- migration.sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

### 3. Rename Column

```sql
-- migration.sql
ALTER TABLE users RENAME COLUMN name TO full_name;
```

### 4. Change Column Type

```sql
-- migration.sql
-- Create new column
ALTER TABLE invoices ADD COLUMN amount_new DECIMAL(12, 2);

-- Copy data
UPDATE invoices SET amount_new = CAST(amount AS DECIMAL(12, 2));

-- Drop old column
ALTER TABLE invoices DROP COLUMN amount;

-- Rename new column
ALTER TABLE invoices RENAME COLUMN amount_new TO amount;
```

### 5. Add Foreign Key

```sql
-- migration.sql
ALTER TABLE invoices 
ADD CONSTRAINT fk_invoices_patient 
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
```

### 6. Create Index

```sql
-- migration.sql
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_invoices_patient_provider ON invoices(patient_id, provider_id);
```

---

## Data Migrations

### 1. Backfill Data

```sql
-- migration.sql
-- Add column
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE';

-- Backfill existing data
UPDATE users SET status = 'ACTIVE' WHERE created_at < NOW() - INTERVAL '30 days';
UPDATE users SET status = 'INACTIVE' WHERE last_login_at IS NULL;

-- Make column required
ALTER TABLE users ALTER COLUMN status SET NOT NULL;
```

### 2. Transform Data

```sql
-- migration.sql
-- Split full_name into first_name and last_name
ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN last_name VARCHAR(100);

-- Parse existing data
UPDATE users SET 
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = SPLIT_PART(full_name, ' ', 2);

-- Drop old column
ALTER TABLE users DROP COLUMN full_name;
```

### 3. Aggregate Data

```sql
-- migration.sql
-- Create summary table
CREATE TABLE invoice_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  month DATE NOT NULL,
  total_invoiced DECIMAL(12, 2),
  total_paid DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Populate summary
INSERT INTO invoice_summaries (patient_id, month, total_invoiced, total_paid)
SELECT 
  patient_id,
  DATE_TRUNC('month', created_at)::DATE,
  SUM(total_amount),
  SUM(amount_paid)
FROM invoices
GROUP BY patient_id, DATE_TRUNC('month', created_at);
```

---

## Rollback Procedures

### Rollback Last Migration

```bash
# Rollback one migration
npx prisma migrate resolve --rolled-back <migration-name>

# This will:
# 1. Mark migration as rolled back
# 2. Revert schema changes
# 3. Restore previous state
```

### Rollback to Specific Migration

```bash
# Rollback to specific point
npx prisma migrate resolve --rolled-back <migration-name>

# Verify rollback
npx prisma migrate status
```

### Manual Rollback

```bash
# If automatic rollback fails, use backup
pg_restore -d advancia_payledger backup-20260309-120000.sql

# Verify data integrity
npm run db:verify

# Restart services
kubectl rollout restart deployment/backend -n advancia
```

---

## Migration Checklist

### Before Migration

- [ ] Backup database
- [ ] Review migration SQL
- [ ] Test in staging
- [ ] Verify rollback procedure
- [ ] Notify team
- [ ] Schedule maintenance window
- [ ] Prepare rollback plan

### During Migration

- [ ] Monitor application logs
- [ ] Check error rates
- [ ] Verify data integrity
- [ ] Monitor performance
- [ ] Be ready to rollback

### After Migration

- [ ] Verify all data migrated
- [ ] Run tests
- [ ] Monitor for issues
- [ ] Document any issues
- [ ] Update documentation

---

## Performance Considerations

### Large Table Migrations

For tables with millions of rows:

```sql
-- Disable triggers temporarily
ALTER TABLE invoices DISABLE TRIGGER ALL;

-- Perform migration
UPDATE invoices SET status = 'ACTIVE' WHERE status IS NULL;

-- Re-enable triggers
ALTER TABLE invoices ENABLE TRIGGER ALL;

-- Rebuild indexes
REINDEX TABLE invoices;
```

### Index Management

```sql
-- Drop index before large update
DROP INDEX idx_invoices_status;

-- Perform migration
UPDATE invoices SET status = 'ACTIVE';

-- Recreate index
CREATE INDEX idx_invoices_status ON invoices(status);

-- Analyze table
ANALYZE invoices;
```

---

## Monitoring Migrations

### Check Migration Status

```bash
# View all migrations
npx prisma migrate status

# Expected output:
# Database schema is up to date
# 
# Following migrations have been applied:
# 20260309_initial_schema
# 20260309_add_rls_policies
```

### Monitor Migration Progress

```bash
# For long-running migrations
psql $DATABASE_URL -c "SELECT * FROM pg_stat_progress_create_index;"

# Check table size
psql $DATABASE_URL -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables ORDER BY pg_total_relation_size DESC;"
```

### Verify Data Integrity

```bash
# Run verification script
npm run db:verify

# Check for orphaned records
psql $DATABASE_URL -c "SELECT * FROM invoices WHERE patient_id NOT IN (SELECT id FROM patients);"

# Verify constraints
psql $DATABASE_URL -c "SELECT constraint_name, table_name FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';"
```

---

## Emergency Procedures

### Database Corruption

```bash
# 1. Stop application
kubectl scale deployment/backend --replicas=0 -n advancia

# 2. Restore from backup
pg_restore -d advancia_payledger backup.sql

# 3. Verify integrity
npm run db:verify

# 4. Restart application
kubectl scale deployment/backend --replicas=3 -n advancia
```

### Migration Stuck

```bash
# 1. Check active queries
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# 2. Kill blocking query
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE query LIKE '%migration%';

# 3. Rollback migration
npx prisma migrate resolve --rolled-back <migration-name>

# 4. Investigate and retry
```

### Data Loss

```bash
# 1. Immediately stop application
kubectl scale deployment/backend --replicas=0 -n advancia

# 2. Restore from backup
pg_restore -d advancia_payledger backup.sql

# 3. Verify restoration
npm run db:verify

# 4. Notify stakeholders

# 5. Investigate root cause
```

---

## Best Practices

1. **Always backup before migrations**
   ```bash
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
   ```

2. **Test migrations in staging first**
   ```bash
   # Run in staging environment
   npx prisma migrate deploy
   npm run test:integration
   ```

3. **Use feature flags for breaking changes**
   ```javascript
   if (featureFlags.newSchema) {
     // Use new column
   } else {
     // Use old column
   }
   ```

4. **Keep migrations small and focused**
   - One change per migration
   - Easier to debug
   - Easier to rollback

5. **Document migration purpose**
   ```sql
   -- Migration: Add phone_number to users
   -- Purpose: Support SMS notifications
   -- Rollback: DROP COLUMN phone_number
   ```

6. **Monitor performance impact**
   ```bash
   # Before migration
   npm run test:performance
   
   # After migration
   npm run test:performance
   
   # Compare results
   ```

---

## Useful Commands

```bash
# View migration history
npx prisma migrate status

# Create migration without applying
npx prisma migrate dev --create-only --name feature_name

# Apply pending migrations
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Resolve migration issues
npx prisma migrate resolve --rolled-back migration_name

# Generate Prisma Client
npx prisma generate

# Validate schema
npx prisma validate
```

---

## Support

For migration issues:
- Check Prisma documentation: https://www.prisma.io/docs/concepts/components/prisma-migrate
- Review migration files: `prisma/migrations/`
- Check database logs: `kubectl logs -f deployment/backend -n advancia`
- Contact database admin: [Contact info]

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
