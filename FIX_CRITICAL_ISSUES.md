# Fix All Critical Issues - Step by Step

**Status**: READY TO EXECUTE  
**Total Time**: ~2 hours  
**Complexity**: Medium

---

## Issue 1: Cloudflare Domain Routing (30 minutes)

### Problem
Custom domain `api.advanciapayledger.com` not configured to route to Cloudflare Workers.

### Solution

#### Step 1: Configure Main API Worker
1. Open Cloudflare Dashboard: https://dash.cloudflare.com
2. Select domain: `advanciapayledger.com`
3. Go to: **Workers & Pages → Routes**
4. Click **Create route**
5. Enter:
   - **Route**: `api.advanciapayledger.com/*`
   - **Worker**: `advancia-payledger-api`
   - **Zone**: `advanciapayledger.com`
6. Click **Save**

#### Step 2: Configure Healthcare AI Worker
1. Click **Create route** again
2. Enter:
   - **Route**: `ai.advanciapayledger.com/*`
   - **Worker**: `advancia-healthcare-ai`
   - **Zone**: `advanciapayledger.com`
3. Click **Save**

#### Step 3: Verify Configuration
```bash
# Test Main API
curl https://api.advanciapayledger.com/health

# Expected response:
# {"status":"ok","timestamp":"2026-03-02T...","service":"advancia-payledger-api"}

# Test Healthcare AI
curl https://ai.advanciapayledger.com/health

# Expected response:
# {"status":"ok","timestamp":"2026-03-02T...","service":"advancia-healthcare-ai"}
```

**Status**: ✅ COMPLETE when both endpoints return 200 status

---

## Issue 2: Frontend Not Deployed to Production (1 hour)

### Problem
Frontend only exists locally, not accessible from production URL.

### Solution

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Authenticate with Vercel
```bash
vercel login
# Follow prompts to authenticate
```

#### Step 3: Build Frontend
```bash
cd frontend
npm install
npm run build
```

#### Step 4: Deploy to Vercel
```bash
vercel --prod
```

**Expected Output:**
```
✓ Production deployment complete
✓ https://advancia-payledger.vercel.app
```

#### Step 5: Configure Environment Variables in Vercel
1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select project: `advancia-payledger`
3. Go to **Settings → Environment Variables**
4. Add these variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com
   NEXT_PUBLIC_AI_URL=https://ai.advanciapayledger.com
   NEXT_PUBLIC_ENVIRONMENT=production
   NEXT_PUBLIC_SUPABASE_URL=https://jwabwrcykdtpwdhwhmqq.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. Click **Save**

#### Step 6: Verify Deployment
```bash
# Test frontend loads
curl https://advancia-payledger.vercel.app

# Should return HTML content
```

**Status**: ✅ COMPLETE when frontend loads at production URL

---

## Issue 3: Production Environment Variables (30 minutes)

### Problem
Production secrets not properly configured for backend services.

### Solution

#### Step 1: Create Backend Environment File
Create file: `backend/.env.production`

```env
# Node Environment
NODE_ENV=production
PORT=3001

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://postgres.jwabwrcykdtpwdhwhmqq:YOUR_ACTUAL_PASSWORD@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
DATABASE_DIRECT_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.jwabwrcykdtpwdhwhmqq.supabase.co:5432/postgres
DATABASE_POOLER_URL=postgresql://postgres.jwabwrcykdtpwdhwhmqq:YOUR_ACTUAL_PASSWORD@aws-1-eu-central-1.pooler.supabase.com:6543/postgres

# Redis
REDIS_URL=redis://:YOUR_ACTUAL_PASSWORD@redis-host:6379
REDIS_PASSWORD=YOUR_ACTUAL_PASSWORD

# JWT Secrets (generate new ones)
JWT_SECRET=YOUR_NEW_JWT_SECRET_MIN_32_CHARS_LONG_CHANGE_THIS
JWT_REFRESH_SECRET=YOUR_NEW_REFRESH_SECRET_MIN_32_CHARS_CHANGE_THIS
JWT_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=YOUR_64_HEX_CHARACTER_ENCRYPTION_KEY_HERE

# Stripe
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_STRIPE_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_STRIPE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET

# Email Service
SENDGRID_API_KEY=YOUR_ACTUAL_SENDGRID_KEY
SENDGRID_FROM_EMAIL=noreply@advanciapayledger.com

# AWS
AWS_ACCESS_KEY_ID=YOUR_ACTUAL_AWS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_ACTUAL_AWS_SECRET
AWS_REGION=us-east-1
AWS_S3_BUCKET=advancia-payledger-prod

# Supabase
SUPABASE_URL=https://jwabwrcykdtpwdhwhmqq.supabase.co
SUPABASE_ANON_KEY=YOUR_ACTUAL_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_ACTUAL_SERVICE_ROLE_KEY

# Sentry
SENTRY_DSN=YOUR_ACTUAL_SENTRY_DSN
SENTRY_ENVIRONMENT=production

# Frontend URL
FRONTEND_URL=https://advancia-payledger.vercel.app
NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com
NEXT_PUBLIC_AI_URL=https://ai.advanciapayledger.com

# Feature Flags
ENABLE_CRYPTO_PAYMENTS=true
ENABLE_ACH_PAYMENTS=true
ENABLE_CARD_PAYMENTS=true
ENABLE_REAL_TIME_NOTIFICATIONS=true

# CORS
CORS_ORIGIN=https://advancia-payledger.vercel.app

# Logging
LOG_LEVEL=info
```

#### Step 2: Verify No Secrets in Git
```bash
# Check git history for exposed secrets
git log --all --full-history -- backend/.env.production

# Should return: "fatal: Path 'backend/.env.production' does not exist"
# This confirms the file is properly gitignored
```

#### Step 3: Verify .gitignore
Check that `.gitignore` contains:
```
.env
.env.local
.env.production
.env.*.local
```

**Status**: ✅ COMPLETE when all secrets are configured and not in git

---

## Issue 4: Database Connectivity Verification (30 minutes)

### Problem
Need to verify Neon PostgreSQL connection and run migrations.

### Solution

#### Step 1: Test Database Connection
```bash
# Set environment variable
export DATABASE_URL="postgresql://postgres.jwabwrcykdtpwdhwhmqq:YOUR_PASSWORD@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"

# Test connection
psql "$DATABASE_URL" -c "SELECT 1;"

# Expected output: 
# 1
# (1 row)
```

#### Step 2: Generate Prisma Client
```bash
cd backend
npx prisma generate

# Expected output:
# ✓ Generated Prisma Client (v5.6.0) to ./node_modules/@prisma/client
```

#### Step 3: Run Database Migrations
```bash
# Apply pending migrations
npx prisma migrate deploy

# Expected output:
# ✓ Already in sync, no schema change or pending migrations detected.
# OR
# ✓ 1 migration applied (if there are pending migrations)
```

#### Step 4: Verify Database Schema
```bash
# Check database schema
npx prisma db push --skip-generate

# Expected output:
# ✓ Database synced with Prisma schema
```

#### Step 5: Test Database Queries
```bash
# Open Prisma Studio
npx prisma studio

# This opens a web interface to view/edit database
# Verify tables are created and accessible
```

#### Step 6: Run Health Check
```bash
cd ..
npm run dev

# In another terminal:
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","timestamp":"2026-03-02T...","service":"advancia-payledger-backend","database":"neon-postgresql"}
```

**Status**: ✅ COMPLETE when all database operations succeed

---

## Summary of All Fixes

| Issue | Status | Time | Action |
|-------|--------|------|--------|
| Cloudflare routing | 🔴 PENDING | 30 min | Configure routes in dashboard |
| Frontend deployment | 🔴 PENDING | 1 hour | Deploy to Vercel |
| Environment variables | 🔴 PENDING | 30 min | Create .env.production files |
| Database connectivity | 🔴 PENDING | 30 min | Run migrations & tests |

---

## Verification Checklist

After completing all fixes, verify:

- [ ] `curl https://api.advanciapayledger.com/health` returns 200
- [ ] `curl https://ai.advanciapayledger.com/health` returns 200
- [ ] `curl https://advancia-payledger.vercel.app` loads frontend
- [ ] Backend environment variables configured
- [ ] Database migrations applied
- [ ] No secrets exposed in git
- [ ] All services responding to health checks

---

## Rollback Procedures

If any issue occurs:

### Cloudflare
- Delete routes from Cloudflare dashboard
- Redeploy workers with `wrangler deploy`

### Frontend
- Run `vercel rollback` to revert to previous version
- Or redeploy with `vercel --prod`

### Database
- Contact Neon support for recovery
- Restore from automated backup

---

## Next Steps After Fixes

1. ✅ All 4 issues fixed
2. ✅ Run smoke tests
3. ✅ Enable monitoring
4. ✅ Begin customer onboarding
5. ✅ Monitor metrics for 24 hours

---

**Total Estimated Time**: 2 hours  
**Difficulty**: Medium  
**Risk Level**: Low

**Start with Issue 1 (Cloudflare routing) and work through sequentially.**
