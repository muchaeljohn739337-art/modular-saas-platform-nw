# Production Deployment - Quick Reference Guide

**Status**: Ready for execution  
**Timeline**: 4-5 hours  
**Date**: March 2, 2026

---

## PHASE 1: MANUAL CONFIGURATION (2-3 hours)

### SECTION 1: Cloudflare Pages - Healthcare Domain
**Time**: 30 min | **Dashboard**: https://dash.cloudflare.com

**Domains to add**:
```
advancia-healthcare.com
www.advancia-healthcare.com (optional)
```

**Verification**:
```bash
curl -I https://advancia-healthcare.com
# Expected: 200 status
```

---

### SECTION 2: Hostinger - 301 Redirects
**Time**: 30 min | **Dashboard**: https://hpanel.hostinger.com

**Redirect 1**:
- From: `advanciapayroll.com`
- To: `https://advanciapayledger.com`
- Type: 301 Permanent

**Redirect 2**:
- From: `www.advanciapayroll.com`
- To: `https://advanciapayledger.com`
- Type: 301 Permanent

**Verification**:
```bash
curl -L -I https://advanciapayroll.com
# Expected: Final URL = https://advanciapayledger.com
```

---

### SECTION 3: Supabase - Authentication URLs
**Time**: 30 min | **Dashboard**: https://app.supabase.com | **Project**: advancia-payledger

**Site URL**:
```
https://advanciapayledger.com
```

**Redirect URLs** (add all 8):
```
https://advanciapayledger.com/auth/callback
https://advanciapayledger.com/auth/confirm
https://advancia-healthcare.com/auth/callback
https://advancia-healthcare.com/auth/confirm
https://api.advanciapayledger.com/auth/callback
http://localhost:5173/auth/callback
http://localhost:5174/auth/callback
http://localhost:3000/auth/callback
```

**Verification**:
```bash
curl https://jwabwrcykdtpwdhwhmqq.supabase.co/rest/v1/
# Expected: 200 status
```

---

### SECTION 4: Google Cloud - OAuth Configuration
**Time**: 30 min | **Dashboard**: https://console.cloud.google.com

**Authorized JavaScript Origins** (add all 8):
```
https://advanciapayledger.com
https://www.advanciapayledger.com
https://advancia-healthcare.com
https://www.advancia-healthcare.com
https://api.advanciapayledger.com
http://localhost:5173
http://localhost:5174
http://localhost:3000
```

**Authorized Redirect URIs** (add all 6):
```
https://jwabwrcykdtpwdhwhmqq.supabase.co/auth/v1/callback
https://advanciapayledger.com/auth/callback
https://advancia-healthcare.com/auth/callback
http://localhost:5173/auth/callback
http://localhost:5174/auth/callback
http://localhost:3000/auth/callback
```

**After saving**:
- Copy Client ID
- Copy Client Secret

---

### SECTION 5: Cloudflare Email Routing - Support Email
**Time**: 30 min | **Dashboard**: https://dash.cloudflare.com

**For domain**: `advanciapayledger.com`

**Email Address**:
- Address: `support`
- Destination: `your-support-email@example.com` (your actual email)

**Optional - For domain**: `advancia-healthcare.com`
- Address: `support`
- Destination: `your-support-email@example.com`

**Verification**:
```bash
# Send test email to: support@advanciapayledger.com
# Check your inbox for arrival
```

---

### SECTION 6: VPS Configuration - Production .env
**Time**: 30 min | **Access**: SSH to VPS

**Command**:
```bash
ssh root@YOUR_VPS_IP
cd /home/advancia/app
nano .env
```

**Copy-paste entire .env** (replace YOUR_* placeholders with actual values):

```env
# ============================================================================
# FRONTEND CONFIGURATION
# ============================================================================
FRONTEND_URL=https://advanciapayledger.com
HEALTHCARE_URL=https://advancia-healthcare.com
NODE_ENV=production
PORT=3001

# ============================================================================
# CORS CONFIGURATION
# ============================================================================
CORS_ORIGINS=https://advanciapayledger.com,https://www.advanciapayledger.com,https://advancia-healthcare.com,https://www.advancia-healthcare.com,https://api.advanciapayledger.com

# ============================================================================
# DATABASE CONFIGURATION (Supabase PostgreSQL)
# ============================================================================
DATABASE_URL=postgresql://postgres.jwabwrcykdtpwdhwhmqq:YOUR_DATABASE_PASSWORD@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
DATABASE_DIRECT_URL=postgresql://postgres:YOUR_DATABASE_PASSWORD@db.jwabwrcykdtpwdhwhmqq.supabase.co:5432/postgres

# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================
SUPABASE_URL=https://jwabwrcykdtpwdhwhmqq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3YWJ3cmN5a2R0cHdkaHdobXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTI3NTQsImV4cCI6MjA4NTEyODc1NH0.wk7Ok5i8O4eigd7iYhb-LwR48-B9QpKuRPi5GZfGWwk
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# ============================================================================
# AUTHENTICATION
# ============================================================================
JWT_SECRET=YOUR_JWT_SECRET_MIN_32_CHARS
JWT_REFRESH_SECRET=YOUR_REFRESH_SECRET_MIN_32_CHARS
JWT_EXPIRES_IN=7d

# ============================================================================
# STRIPE CONFIGURATION
# ============================================================================
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET

# ============================================================================
# EMAIL SERVICE (Resend)
# ============================================================================
RESEND_API_KEY=YOUR_RESEND_API_KEY
RESEND_FROM_EMAIL=noreply@advanciapayledger.com

# ============================================================================
# SMS SERVICE (Twilio)
# ============================================================================
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=+1YOUR_TWILIO_PHONE_NUMBER

# ============================================================================
# CACHING (Upstash Redis)
# ============================================================================
UPSTASH_REDIS_URL=redis://default:YOUR_UPSTASH_PASSWORD@YOUR_UPSTASH_HOST:YOUR_UPSTASH_PORT
UPSTASH_REDIS_TOKEN=YOUR_UPSTASH_TOKEN

# ============================================================================
# ERROR TRACKING (Sentry)
# ============================================================================
SENTRY_DSN=https://YOUR_SENTRY_KEY@YOUR_SENTRY_DOMAIN.ingest.sentry.io/YOUR_PROJECT_ID
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# ============================================================================
# SECURITY
# ============================================================================
TRUST_PROXY=1
ENCRYPTION_KEY=YOUR_64_HEX_CHARACTER_ENCRYPTION_KEY

# ============================================================================
# LOGGING
# ============================================================================
LOG_LEVEL=info

# ============================================================================
# FEATURE FLAGS
# ============================================================================
ENABLE_STRIPE_PAYMENTS=true
ENABLE_ACH_PAYMENTS=true
ENABLE_CRYPTO_PAYMENTS=false
ENABLE_REAL_TIME_NOTIFICATIONS=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=true
```

**Save**: Ctrl+X, Y, Enter

**Restart API**:
```bash
pm2 restart advancia-api
pm2 logs advancia-api
```

---

### SECTION 7: Cloudflare Security Configuration
**Time**: 30 min | **Dashboard**: https://dash.cloudflare.com

**Step 1: SSL/TLS**
- Go to: SSL/TLS
- Set encryption mode: **Full (strict)**

**Step 2: Bot Management**
- Go to: Security → Bot Management
- Enable: **Bot Fight Mode**

**Step 3: Rate Limiting**
- Go to: Security → Rate limiting
- Rule 1:
  - Threshold: 100 requests per 10 seconds
  - Action: Challenge
- Rule 2:
  - Path: `/api/*`
  - Threshold: 1000 requests per minute
  - Action: Block

---

### SECTION 8: DMARC Configuration (Optional)
**Time**: 15 min | **Dashboard**: https://dash.cloudflare.com

**DNS Record**:
- Type: TXT
- Name: `_dmarc`
- Content:
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@advanciapayledger.com; ruf=mailto:dmarc@advanciapayledger.com; fo=1
```

**Email Address**:
- Address: `dmarc`
- Destination: `your-email@example.com`

---

## PHASE 2: VERIFICATION & TESTING (1 hour)

**Run these commands**:

```bash
# Test frontend domains
curl -I https://advanciapayledger.com
curl -I https://advancia-healthcare.com

# Test API health
curl https://api.advanciapayledger.com/health

# Test Supabase
curl https://jwabwrcykdtpwdhwhmqq.supabase.co/rest/v1/

# Check SSL
openssl s_client -connect advanciapayledger.com:443

# Check PM2
pm2 list
pm2 status

# View logs
pm2 logs advancia-api
```

**Verify**:
- [ ] Frontend loads at https://advanciapayledger.com
- [ ] Healthcare app loads at https://advancia-healthcare.com
- [ ] API health endpoint returns 200
- [ ] Old domain redirects work
- [ ] Email routing working
- [ ] SSL certificates valid
- [ ] No CORS errors
- [ ] Payment processing tested

---

## PHASE 3: GO LIVE (30 minutes)

**Final Checks**:
- [ ] All endpoints responding
- [ ] SSL certificates valid
- [ ] Email routing working
- [ ] Payment processing tested
- [ ] Monitoring enabled

**Go Live Steps**:
1. Enable Sentry alerts
2. Set up Grafana dashboards
3. Enable CloudFlare analytics
4. Create trial accounts
5. Send welcome emails
6. Schedule demos
7. Monitor metrics for 24 hours

---

## 📊 Progress Tracking

| Phase | Sections | Time | Status |
|-------|----------|------|--------|
| Phase 1 | 8 sections | 2-3 hours | ⏳ Ready |
| Phase 2 | Verification | 1 hour | ⏳ Ready |
| Phase 3 | Go Live | 30 min | ⏳ Ready |
| **Total** | **All** | **4-5 hours** | **READY** |

---

**Start with Section 1 - Cloudflare Pages**

