# Advancia PayLedger - Deployment Checklist

## Pre-Deployment Verification

### 1. Security Verification
- [ ] Verify no hardcoded credentials in any config files
- [ ] Confirm `.env.local` is in `.gitignore`
- [ ] Review RLS policies in migration file
- [ ] Audit all API endpoints for authorization
- [ ] Verify HTTPS/TLS certificates
- [ ] Check JWT secret rotation schedule

### 2. Database Setup
- [ ] Create PostgreSQL database (Neon)
- [ ] Run Prisma migrations: `npm run prisma:migrate`
- [ ] Apply RLS policies: `npm run prisma:migrate`
- [ ] Seed test data: `npm run prisma:seed`
- [ ] Verify indexes created
- [ ] Test RLS policies with sample queries

### 3. Environment Configuration
- [ ] Create `.env.local` from `.env.example`
- [ ] Set `DATABASE_URL` for Neon PostgreSQL
- [ ] Set `REDIS_URL` for Redis instance
- [ ] Configure `JWT_SECRET` (strong, random)
- [ ] Set `STRIPE_SECRET_KEY` for payments
- [ ] Configure `SENTRY_DSN` for error tracking
- [ ] Set `FRONTEND_URL` correctly

### 4. Dependency Installation
- [ ] Install root dependencies: `npm install`
- [ ] Install backend dependencies: `cd backend && npm install`
- [ ] Install frontend dependencies: `cd frontend && npm install`
- [ ] Install service dependencies: `cd services/* && npm install`
- [ ] Verify no security vulnerabilities: `npm audit`

### 5. Build Verification
- [ ] Build backend: `npm run build:backend`
- [ ] Build frontend: `npm run build:frontend`
- [ ] Build services: `cd services/* && npm run build`
- [ ] Verify TypeScript compilation: `npm run lint`

### 6. Testing
- [ ] Run unit tests: `npm run test`
- [ ] Run integration tests: `npm run test:integration`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Verify test coverage > 75%
- [ ] Test payment processing flow
- [ ] Test authentication flow
- [ ] Test invoice creation and management

### 7. Docker & Containerization
- [ ] Build Docker images: `docker-compose build`
- [ ] Verify image sizes
- [ ] Test container startup
- [ ] Verify health check endpoints
- [ ] Test service-to-service communication
- [ ] Verify volume mounts

### 8. Local Development
- [ ] Start services: `docker-compose -f docker-compose.dev.yml up`
- [ ] Verify all services running
- [ ] Test API endpoints: `http://localhost:3001/health`
- [ ] Test frontend: `http://localhost:3000`
- [ ] Verify database connectivity
- [ ] Verify Redis connectivity
- [ ] Test authentication flow

### 9. API Verification
- [ ] Test health check: `GET /health`
- [ ] Test API info: `GET /api`
- [ ] Test user endpoints: `GET /api/users`
- [ ] Test patient endpoints: `GET /api/patients`
- [ ] Test invoice endpoints: `GET /api/invoices`
- [ ] Test payment endpoints: `GET /api/payments`
- [ ] Verify error handling
- [ ] Verify rate limiting

### 10. Frontend Verification
- [ ] Verify Next.js build: `npm run build`
- [ ] Test dashboard loading
- [ ] Test authentication pages
- [ ] Test responsive design
- [ ] Verify API integration
- [ ] Test error boundaries
- [ ] Verify security headers

### 11. Monitoring & Logging
- [ ] Configure Sentry integration
- [ ] Set up Grafana dashboards
- [ ] Configure Prometheus metrics
- [ ] Set up ELK stack
- [ ] Configure alerting rules
- [ ] Test error notifications
- [ ] Verify audit logging

### 12. Staging Deployment
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Verify all endpoints
- [ ] Load test with 100 concurrent users
- [ ] Test payment processing
- [ ] Verify database performance
- [ ] Check log aggregation

### 13. Production Deployment
- [ ] Create production database backup
- [ ] Deploy to production
- [ ] Verify all services running
- [ ] Monitor error rates
- [ ] Monitor response times
- [ ] Verify payment processing
- [ ] Monitor database performance
- [ ] Check user reports

### 14. Post-Deployment
- [ ] Monitor error rates for 24 hours
- [ ] Review performance metrics
- [ ] Check user feedback
- [ ] Verify backup procedures
- [ ] Document deployment details
- [ ] Create runbook for incident response
- [ ] Schedule post-deployment review

## Service Startup Order

1. **Redis** - Cache and session store
2. **PostgreSQL** - Primary database
3. **Backend API** - Core API service
4. **Auth Service** - Authentication
5. **Billing Service** - Invoicing
6. **Payment Service** - Payment processing
7. **Metering Service** - Usage tracking
8. **Tenant Service** - Multi-tenant management
9. **Web3 Event Service** - Blockchain events
10. **Frontend** - Next.js dashboard

## Health Check Endpoints

```bash
# Backend
curl http://localhost:3001/health

# Auth Service
curl http://localhost:3002/health

# Billing Service
curl http://localhost:3003/health

# Payment Service
curl http://localhost:3004/health

# Metering Service
curl http://localhost:3005/health

# Tenant Service
curl http://localhost:3006/health

# Web3 Event Service
curl http://localhost:3007/health

# Frontend
curl http://localhost:3000
```

## Rollback Procedure

If deployment fails:

1. **Stop all services**: `docker-compose down`
2. **Restore database backup**: `psql < backup.sql`
3. **Revert code**: `git revert <commit-hash>`
4. **Rebuild and restart**: `docker-compose up`
5. **Verify services**: Check all health endpoints
6. **Notify stakeholders**: Document issue and resolution

## Emergency Contacts

- **On-Call Engineer**: [Contact info]
- **Database Admin**: [Contact info]
- **Security Team**: [Contact info]
- **DevOps Lead**: [Contact info]

## Sign-Off

- [ ] QA Lead: _________________ Date: _______
- [ ] DevOps Lead: _________________ Date: _______
- [ ] Security Lead: _________________ Date: _______
- [ ] Product Manager: _________________ Date: _______

---

**Last Updated**: March 9, 2026  
**Status**: Ready for Deployment
