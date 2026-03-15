# Advancia PayLedger - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Clone Repository
```bash
git clone https://github.com/muchaeljohn739337-art/modular-saas-platform-nw.git
cd modular-saas-platform-nw
```

### 2. Setup Environment
```bash
# Copy environment template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

**Required Variables**:
```env
DATABASE_URL=postgresql://user:password@host:5432/advancia_payledger
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
STRIPE_SECRET_KEY=sk_test_...
```

### 3. Install Dependencies
```bash
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

### 4. Start Development Services
```bash
# Start Docker containers (PostgreSQL, Redis)
docker-compose -f docker-compose.dev.yml up -d

# Run database migrations
npm run prisma:migrate

# Seed test data
npm run prisma:seed
```

### 5. Start Development Servers
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Services (optional)
cd services/auth-service && npm run dev
```

### 6. Access Applications
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api

---

## 📋 Key Commands

### Development
```bash
# Run all tests
npm run test

# Run specific service tests
npm run test:backend
npm run test:frontend

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

### Database
```bash
# Create new migration
npm run prisma:migrate -- --name feature_name

# View database UI
npm run prisma:studio

# Seed data
npm run prisma:seed

# Reset database (dev only)
npm run prisma:reset
```

### Docker
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# Stop all services
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Rebuild images
docker-compose -f docker-compose.dev.yml build
```

### Build & Deploy
```bash
# Build all
npm run build

# Build frontend
npm run build:frontend

# Build backend
npm run build:backend

# Deploy to Vercel
vercel --prod

# Deploy to Kubernetes
kubectl apply -f infra/k8s/base/
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Generate strong JWT secrets
- [ ] Configure HTTPS/TLS certificates
- [ ] Enable database encryption
- [ ] Set up backup procedures
- [ ] Configure firewall rules
- [ ] Enable audit logging
- [ ] Run security scan: `npm audit`
- [ ] Review RLS policies
- [ ] Configure rate limiting

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Vercel)                    │
│                    Next.js 15.1.2 App                    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   API Gateway (Kubernetes)               │
│                   Backend API (Port 3001)                │
└─────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
    ┌────────┐          ┌────────┐         ┌────────┐
    │  Auth  │          │Billing │         │Payment │
    │Service │          │Service │         │Service │
    │(3002)  │          │(3003)  │         │(3004)  │
    └────────┘          └────────┘         └────────┘
        ↓                   ↓                   ↓
    ┌────────┐          ┌────────┐         ┌────────┐
    │Metering│          │ Tenant │         │ Web3   │
    │Service │          │Service │         │Service │
    │(3005)  │          │(3006)  │         │(3007)  │
    └────────┘          └────────┘         └────────┘
                            ↓
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │PostgreSQL│      │  Redis   │      │ Sentry   │
    │(Neon)    │      │  Cache   │      │Monitoring│
    └──────────┘      └──────────┘      └──────────┘
```

---

## 🧪 Testing

### Run All Tests
```bash
npm run test
```

### Run Specific Tests
```bash
# Payment service tests
npm run test -- services/payment-service

# Auth service tests
npm run test -- services/auth-service

# Billing service tests
npm run test -- services/billing-service
```

### Test Coverage
```bash
npm run test:coverage
```

**Target Coverage**: >75% for critical services

---

## 📈 Monitoring

### Local Monitoring
```bash
# View metrics
curl http://localhost:3001/metrics

# Check health
curl http://localhost:3001/health

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend
```

### Production Monitoring
- **Grafana**: https://grafana.advancia.com
- **Sentry**: https://sentry.advancia.com
- **Prometheus**: https://prometheus.advancia.com
- **Kibana**: https://kibana.advancia.com

---

## 🐛 Troubleshooting

### Services Won't Start
```bash
# Check Docker
docker ps

# Check logs
docker-compose -f docker-compose.dev.yml logs

# Restart services
docker-compose -f docker-compose.dev.yml restart
```

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check migrations
npm run prisma:migrate -- --dry-run

# Reset (dev only)
npm run prisma:reset
```

### Port Already in Use
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm run dev
```

### Memory Issues
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# Check memory usage
docker stats
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **API_SPECIFICATION.md** | Complete API reference |
| **PRODUCTION_DEPLOYMENT.md** | Deployment guide |
| **MONITORING_SETUP.md** | Monitoring configuration |
| **DATABASE_MIGRATION_GUIDE.md** | Migration procedures |
| **PROJECT_IMPROVEMENTS.md** | Improvements summary |
| **DEPLOYMENT_CHECKLIST.md** | Pre-deployment checklist |
| **COMPLETE_PROJECT_SUMMARY.md** | Executive summary |

---

## 🔗 Useful Links

- **GitHub**: https://github.com/muchaeljohn739337-art/modular-saas-platform-nw
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Express Docs**: https://expressjs.com
- **Kubernetes Docs**: https://kubernetes.io/docs

---

## 💡 Tips & Tricks

### Speed Up Development
```bash
# Use npm ci instead of npm install
npm ci

# Cache dependencies
npm ci --prefer-offline

# Parallel builds
npm run build -- --parallel
```

### Debug Issues
```bash
# Enable debug logging
DEBUG=* npm run dev

# Use Node debugger
node --inspect-brk dist/index.js

# Check TypeScript errors
npm run type-check
```

### Database Optimization
```bash
# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM invoices;

# Check indexes
\d+ invoices

# Vacuum database
VACUUM ANALYZE;
```

---

## 🚀 Next Steps

1. **Review Documentation**
   - Read API_SPECIFICATION.md
   - Review PRODUCTION_DEPLOYMENT.md

2. **Run Tests**
   - Execute: `npm run test`
   - Check coverage: `npm run test:coverage`

3. **Local Development**
   - Start services: `docker-compose up`
   - Run dev servers: `npm run dev`
   - Access: http://localhost:3000

4. **Deploy to Staging**
   - Follow PRODUCTION_DEPLOYMENT.md
   - Run smoke tests
   - Verify monitoring

5. **Deploy to Production**
   - Complete deployment checklist
   - Monitor closely
   - Gather feedback

---

## 📞 Support

- **Issues**: https://github.com/muchaeljohn739337-art/modular-saas-platform-nw/issues
- **Discussions**: https://github.com/muchaeljohn739337-art/modular-saas-platform-nw/discussions
- **Email**: support@advancia.com

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
