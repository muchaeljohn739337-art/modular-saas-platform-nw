# Advancia PayLedger - Incident Response Playbooks

**Purpose**: Step-by-step procedures for responding to incidents  
**Audience**: On-Call Engineers, DevOps, Incident Commanders  
**Last Updated**: March 9, 2026

---

## Incident Classification

### Severity Levels

#### Critical (P1)
- Complete service outage
- Data loss or corruption
- Security breach
- Payment processing failure
- **Response Time**: Immediate (5 min)
- **Escalation**: Immediate to CTO

#### High (P2)
- Partial service degradation
- High error rate (>5%)
- Performance degradation (>50%)
- Database issues
- **Response Time**: 15 minutes
- **Escalation**: 30 minutes if unresolved

#### Medium (P3)
- Minor feature issues
- Moderate performance impact
- Non-critical service down
- **Response Time**: 1 hour
- **Escalation**: 4 hours if unresolved

#### Low (P4)
- Cosmetic issues
- Minor bugs
- Documentation issues
- **Response Time**: Next business day
- **Escalation**: None

---

## Playbook 1: Service Outage

### Symptoms
- Service unreachable
- All requests failing
- Health checks failing
- Monitoring alerts firing

### Response Steps

**Step 1: Declare Incident (2 min)**
```
1. Page on-call engineer
2. Create incident in PagerDuty
3. Create Slack channel #incident-[service]
4. Post initial status update
5. Start incident timer
```

**Step 2: Assess Impact (5 min)**
```bash
# Check service status
kubectl get pods -n advancia | grep backend

# Check logs
kubectl logs -f deployment/backend -n advancia

# Check metrics
curl http://localhost:3001/metrics

# Determine customer impact
# - How many users affected?
# - Which features unavailable?
# - Revenue impact?
```

**Step 3: Investigate Root Cause (10 min)**
```bash
# Check recent deployments
kubectl rollout history deployment/backend -n advancia

# Check resource usage
kubectl top pods -n advancia
kubectl top nodes -n advancia

# Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_stat_activity;"

# Check dependencies
# - Redis connectivity
# - Database connectivity
# - External services
```

**Step 4: Implement Fix (15 min)**
```bash
# Option 1: Restart service
kubectl rollout restart deployment/backend -n advancia

# Option 2: Scale down and up
kubectl scale deployment/backend --replicas=0 -n advancia
kubectl scale deployment/backend --replicas=3 -n advancia

# Option 3: Rollback deployment
kubectl rollout undo deployment/backend -n advancia

# Option 4: Emergency fix
# Deploy hotfix if needed
```

**Step 5: Verify Recovery (5 min)**
```bash
# Health checks
curl http://localhost:3001/health

# Check metrics
curl http://localhost:3001/metrics

# Test critical flows
# - User login
# - Invoice creation
# - Payment processing

# Verify no errors
kubectl logs deployment/backend -n advancia | grep ERROR
```

**Step 6: Communicate (Ongoing)**
```
- Update status page
- Notify customers
- Post in incident channel
- Provide ETA for full recovery
```

**Step 7: Post-Incident (After recovery)**
```
- Write incident report
- Identify root cause
- Create action items
- Schedule follow-up meeting
- Update runbooks if needed
```

---

## Playbook 2: High Error Rate

### Symptoms
- Error rate >5%
- 500 errors in logs
- Sentry alerts firing
- User complaints

### Response Steps

**Step 1: Acknowledge (2 min)**
```
1. Page on-call engineer
2. Create incident
3. Create Slack channel
4. Post status update
```

**Step 2: Identify Error Pattern (5 min)**
```bash
# Check error logs
kubectl logs -f deployment/backend -n advancia | grep ERROR

# Check Sentry
# Review error details and stack traces

# Check metrics
curl http://localhost:3001/metrics | grep http_requests_total

# Identify affected endpoints
# - Which endpoints failing?
# - What error codes?
# - When did it start?
```

**Step 3: Investigate Cause (10 min)**
```bash
# Check recent changes
git log --oneline -10

# Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_stat_activity;"

# Check resource usage
kubectl top pods -n advancia

# Check dependencies
# - Redis
# - External APIs
# - Payment processor
```

**Step 4: Mitigate (10 min)**
```bash
# Option 1: Rollback deployment
kubectl rollout undo deployment/backend -n advancia

# Option 2: Scale up
kubectl scale deployment/backend --replicas=5 -n advancia

# Option 3: Disable problematic feature
# Use feature flags to disable

# Option 4: Apply hotfix
# Deploy emergency fix
```

**Step 5: Verify (5 min)**
```bash
# Check error rate
curl http://localhost:3001/metrics | grep http_requests_total

# Monitor for 5 minutes
# Ensure error rate < 0.5%
```

**Step 6: Root Cause Analysis**
```
- Identify what changed
- Determine why it failed
- Create action items
- Update monitoring
```

---

## Playbook 3: Database Issues

### Symptoms
- Connection pool exhausted
- Slow queries
- Replication lag
- Query timeouts

### Response Steps

**Step 1: Assess Database Health (5 min)**
```bash
# Check connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check connections
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_stat_activity;"

# Check slow queries
psql $DATABASE_URL -c "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check replication lag
psql $DATABASE_URL -c "SELECT slot_name, restart_lsn FROM pg_replication_slots;"
```

**Step 2: Identify Issue (5 min)**
```
- Connection pool exhausted?
- Slow query?
- Replication lag?
- Disk space?
- Memory?
```

**Step 3: Mitigate (10 min)**

**If connection pool exhausted:**
```bash
# Kill idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE state = 'idle' AND query_start < NOW() - INTERVAL '10 minutes';

# Increase pool size
# Edit deployment and restart
```

**If slow queries:**
```bash
# Kill long-running query
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes';

# Create index if needed
CREATE INDEX idx_name ON table(column);

# Analyze table
ANALYZE table_name;
```

**If replication lag:**
```bash
# Check replication status
SELECT * FROM pg_stat_replication;

# Increase max_wal_senders if needed
# Restart replica if needed
```

**Step 4: Verify Recovery**
```bash
# Check connections
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_stat_activity;"

# Check query performance
psql $DATABASE_URL -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5;"

# Monitor application
# Ensure no errors
```

---

## Playbook 4: Payment Processing Failure

### Symptoms
- Payment failures increasing
- Stripe API errors
- Payment timeouts
- Reconciliation issues

### Response Steps

**Step 1: Assess Impact (5 min)**
```bash
# Check payment failure rate
psql $DATABASE_URL -c "SELECT COUNT(*) FROM payments WHERE status = 'FAILED' AND created_at > NOW() - INTERVAL '1 hour';"

# Check Stripe status
# Visit https://status.stripe.com

# Check logs
kubectl logs -f deployment/payment-service -n advancia | grep ERROR
```

**Step 2: Identify Issue (5 min)**
```
- Stripe API down?
- Network connectivity?
- Configuration issue?
- Code bug?
- Rate limiting?
```

**Step 3: Mitigate (10 min)**

**If Stripe down:**
```
- Wait for Stripe to recover
- Queue payments for retry
- Notify customers
```

**If network issue:**
```bash
# Check connectivity
curl -I https://api.stripe.com

# Check DNS
nslookup api.stripe.com

# Restart network services if needed
```

**If configuration issue:**
```bash
# Verify API keys
echo $STRIPE_SECRET_KEY

# Check environment variables
kubectl get secret stripe-keys -n advancia -o yaml

# Update if needed
kubectl set env deployment/payment-service STRIPE_SECRET_KEY=new_key -n advancia
```

**If code bug:**
```bash
# Check recent changes
git log --oneline -5

# Rollback if needed
kubectl rollout undo deployment/payment-service -n advancia

# Deploy fix
```

**Step 4: Retry Failed Payments**
```bash
# Identify failed payments
psql $DATABASE_URL -c "SELECT id, invoice_id FROM payments WHERE status = 'FAILED' AND created_at > NOW() - INTERVAL '1 hour';"

# Retry payments
# Use payment service retry endpoint
```

**Step 5: Verify Recovery**
```bash
# Check success rate
psql $DATABASE_URL -c "SELECT COUNT(*) FROM payments WHERE status = 'COMPLETED' AND created_at > NOW() - INTERVAL '1 hour';"

# Monitor for 15 minutes
# Ensure success rate > 99%
```

---

## Playbook 5: Security Incident

### Symptoms
- Suspicious login attempts
- Unauthorized access detected
- Data breach suspected
- Malware detected

### Response Steps

**Step 1: Declare Security Incident (Immediate)**
```
1. Page security lead immediately
2. Page CTO immediately
3. Create incident in PagerDuty
4. Create private Slack channel
5. Do NOT post to public channels
```

**Step 2: Contain (5 min)**
```bash
# Isolate affected systems
kubectl scale deployment/backend --replicas=0 -n advancia

# Preserve evidence
# - Collect logs
# - Take snapshots
# - Document timeline

# Revoke compromised credentials
# - Reset passwords
# - Revoke API keys
# - Revoke tokens
```

**Step 3: Investigate (30 min)**
```bash
# Review access logs
# - Who accessed what?
# - When?
# - From where?

# Check for data exfiltration
# - Review network logs
# - Check S3 access logs
# - Check database audit logs

# Identify affected data
# - Which records accessed?
# - How many users affected?
# - What data exposed?
```

**Step 4: Notify (1 hour)**
```
1. Notify affected users
2. Notify regulators (HIPAA, GDPR)
3. Notify insurance
4. Notify legal team
5. Prepare public statement
```

**Step 5: Remediate (Ongoing)**
```bash
# Patch vulnerability
# - Deploy security fix
# - Update configurations
# - Apply WAF rules

# Restore systems
# - Restore from backup if needed
# - Verify integrity
# - Monitor closely
```

**Step 6: Post-Incident**
```
- Complete incident report
- Conduct security audit
- Implement preventive measures
- Update security policies
- Conduct team training
```

---

## Escalation Matrix

| Severity | Time | Escalate To | Action |
|----------|------|-------------|--------|
| P1 | 5 min | CTO | Page immediately |
| P1 | 15 min | CEO | Page immediately |
| P2 | 30 min | DevOps Lead | Page |
| P2 | 1 hour | CTO | Page |
| P3 | 1 hour | DevOps Lead | Email |
| P3 | 4 hours | CTO | Email |
| P4 | 24 hours | Team Lead | Ticket |

---

## Communication Template

### Initial Status
```
🚨 INCIDENT: [Service Name]
Severity: [P1/P2/P3/P4]
Status: INVESTIGATING
Start Time: [Time]
Affected: [Services/Features]
Impact: [Number of users/transactions]

Updates will be posted every 15 minutes.
```

### Update Status
```
⏱️ UPDATE: [Time since start]
Status: [INVESTIGATING/MITIGATING/RECOVERING]
Progress: [What we've done]
ETA: [Estimated time to resolution]
Next Update: [Time]
```

### Resolution Status
```
✅ RESOLVED: [Time]
Duration: [Total time]
Root Cause: [Brief description]
Resolution: [What we did]
Post-Incident Review: [Scheduled for date/time]
```

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
