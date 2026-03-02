# Production Execution Guide - End-to-End Launch

**Status**: READY FOR EXECUTION  
**Timeline**: 4-5 hours total  
**Date**: March 2, 2026

---

## 🚀 Quick Start

This guide provides exact step-by-step instructions for launching Advancia PayLedger to production. Each section includes:
- Exact values to copy-paste
- Where to click in each dashboard
- Verification commands
- Estimated time

**Follow sections in order. Complete each section before moving to the next.**

---

## PHASE 1: MANUAL CONFIGURATION (2-3 hours)

### SECTION 1: Cloudflare Pages - Add Healthcare Domain (30 min)

**What you're doing**: Adding advancia-healthcare.com to Cloudflare Pages so it serves your healthcare app.

**Step 1: Open Cloudflare Dashboard**
1. Go to: https://dash.cloudflare.com
2. Log in with your Cloudflare account
3. Select domain: `advanciapayledger.com`

**Step 2: Add Healthcare Domain**
1. Click **"Workers & Pages"** in left sidebar
2. Click **"Pages"**
3. Click **"Create a project"** (or select existing project)
4. Click **"Custom domains"** tab
5. Click **"Add custom domain"**
6. Enter: `advancia-healthcare.com`
7. Click **"Continue"**
8. Verify DNS records (Cloudflare will show them)
9. Click **"Activate domain"**

**Step 3: Add WWW Subdomain (Optional)**
1. Click **"Add custom domain"** again
2. Enter: `www.advancia-healthcare.com`
3. Click **"Continue"**
4. Click **"Activate domain"**

**Step 4: Verify Configuration**
```bash
# Test healthcare domain
curl -I https://advancia-healthcare.com

# Should return 200 status
```

**Status**: ✅ COMPLETE when both domains load your healthcare app

---

### SECTION 2: Hostinger - 301 Redirects (30 min)

**What you're doing**: Redirecting old domain (advanciapayroll.com) to new domain (advanciapayledger.com).

**Step 1: Access Hostinger**
1. Go to: https://hpanel.hostinger.com
2. Log in with your Hostinger account
3. Select domain: `advanciapayroll.com`

**Step 2: Create First Redirect**
1. Go to **"DNS/Nameservers"**
2. Find **"Redirects"** section
3. Click **"Add Redirect"**
4. **From**: `advanciapayroll.com`
5. **To**: `https://advanciapayledger.com`
6. **Type**: 301 Permanent Redirect
7. Click **"Save"**

**Step 3: Create Second Redirect**
1. Click **"Add Redirect"** again
2. **From**: `www.advanciapayroll.com`
3. **To**: `https://advanciapayledger.com`
4. **Type**: 301 Permanent Redirect
5. Click **"Save"**

**Step 4: Verify Redirects**
```bash
# Test redirect
curl -L -I https://advanciapayroll.com

# Should show final URL: https://advanciapayledger.com
```

**Status**: ✅ COMPLETE when both old domains redirect to main domain

---

### SECTION 3: Supabase - Authentication Configuration (30 min)

**What you're doing**: Setting up authentication URLs so users can log in from your apps.

**Step 1: Open Supabase Dashboard**
1. Go to: https://app.supabase.com
2. Log in with your Supabase account
3. Select project: `advancia-payledger`

**Step 2: Set Site URL**
1. Go to **"Authentication"** → **"URL Configuration"**
2. **Site URL**: `https://advanciapayledger.com`
3. Click **"Save"**

**Step 3: Add Redirect URLs**
1. In **"Redirect URLs"** section, add each URL below (one at a time):

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

2. After adding each URL, click **"Save"**

**Step 4: Verify Configuration**
```bash
# Test Supabase connection
curl https://jwabwrcykdtpwdhwhmqq.supabase.co/rest/v1/

# Should return 200 status
```

**Status**: ✅ COMPLETE when all 8 redirect URLs are saved

---

### SECTION 4: Google Cloud - OAuth Configuration (30 min)

**What you're doing**: Setting up Google OAuth so users can log in with Google.

**Step 1: Open Google Cloud Console**
1. Go to: https://console.cloud.google.com
2. Log in with your Google account
3. Select your project

**Step 2: Configure JavaScript Origins**
1. Go to **"APIs & Services"** → **"Credentials"**
2. Find your **OAuth 2.0 Client ID**
3. Click to edit it
4. Under **"Authorized JavaScript origins"**, add each URL:

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

5. Click **"Save"**

**Step 3: Configure Redirect URIs**
1. Under **"Authorized redirect URIs"**, add each URL:

```
https://jwabwrcykdtpwdhwhmqq.supabase.co/auth/v1/callback
https://advanciapayledger.com/auth/callback
https://advancia-healthcare.com/auth/callback
http://localhost:5173/auth/callback
http://localhost:5174/auth/callback
http://localhost:3000/auth/callback
```

2. Click **"Save"**

**Step 4: Copy Credentials**
1. Copy **Client ID** (you'll need this for frontend)
2. Copy **Client Secret** (you'll need this for backend)

**Status**: ✅ COMPLETE when all origins and URIs are saved

---

### SECTION 5: Cloudflare Email Routing - Support Email (30 min)

**What you're doing**: Setting up email routing so support@advanciapayledger.com works.

**Step 1: Enable Email Routing**
1. Go to: https://dash.cloudflare.com
2. Select domain: `advanciapayledger.com`
3. Go to **"Email Routing"**
4. Click **"Enable Email Routing"**

**Step 2: Create Support Email Address**
1. Click **"Create address"**
2. **Email address**: `support`
3. **Destination email**: `your-support-email@example.com` (your actual email)
4. Click **"Create"**

**Step 3: Add Healthcare Domain Email (Optional)**
1. Switch to domain: `advancia-healthcare.com`
2. Enable Email Routing
3. Click **"Create address"**
4. **Email address**: `support`
5. **Destination email**: `your-support-email@example.com`
6. Click **"Create"**

**Step 4: Verify Email Routing**
1. Send test email to: `support@advanciapayledger.com`
2. Check your inbox for the email
3. Verify it arrives at your destination email

**Status**: ✅ COMPLETE when test email arrives

---

### SECTION 6: VPS Configuration - Production .env (30 min)

**What you're doing**: Setting up environment variables on your VPS so the API runs with production secrets.

**Step 1: SSH into VPS**
```bash
# Connect to your Hostinger VPS
ssh root@YOUR_VPS_IP

# Or use Hostinger's web terminal
```

**Step 2: Navigate to App Directory**
```bash
cd /home/advancia/app
```

**Step 3: Create .env File**
```bash
nano .env
```

**Step 4: Add Production Configuration**

Copy and paste the entire configuration below:

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
# Get from: Supabase Dashboard → Settings → Database → Connection string
DATABASE_URL=postgresql://postgres.jwabwrcykdtpwdhwhmqq:YOUR_DATABASE_PASSWORD@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
DATABASE_DIRECT_URL=postgresql://postgres:YOUR_DATABASE_PASSWORD@db.jwabwrcykdtpwdhwhmqq.supabase.co:5432/postgres

# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================
# Get from: Supabase Dashboard → Settings → API
SUPABASE_URL=https://jwabwrcykdtpwdhwhmqq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3YWJ3cmN5a2R0cHdkaHdobXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTI3NTQsImV4cCI6MjA4NTEyODc1NH0.wk7Ok5i8O4eigd7iYhb-LwR48-B9QpKuRPi5GZfGWwk
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# ============================================================================
# AUTHENTICATION
# ============================================================================
# Generate new secrets: openssl rand -base64 32
JWT_SECRET=YOUR_JWT_SECRET_MIN_32_CHARS
JWT_REFRESH_SECRET=YOUR_REFRESH_SECRET_MIN_32_CHARS
JWT_EXPIRES_IN=7d

# ============================================================================
# STRIPE CONFIGURATION
# ============================================================================
# Get from: Stripe Dashboard → Developers → API Keys
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET

# ============================================================================
# EMAIL SERVICE (Resend)
# ============================================================================
# Get from: Resend Dashboard → API Keys
RESEND_API_KEY=YOUR_RESEND_API_KEY
RESEND_FROM_EMAIL=noreply@advanciapayledger.com

# ============================================================================
# SMS SERVICE (Twilio)
# ============================================================================
# Get from: Twilio Console → Account Info
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=+1YOUR_TWILIO_PHONE_NUMBER

# ============================================================================
# CACHING (Upstash Redis)
# ============================================================================
# Get from: Upstash Console → Redis Database → Connection
UPSTASH_REDIS_URL=redis://default:YOUR_UPSTASH_PASSWORD@YOUR_UPSTASH_HOST:YOUR_UPSTASH_PORT
UPSTASH_REDIS_TOKEN=YOUR_UPSTASH_TOKEN

# ============================================================================
# ERROR TRACKING (Sentry)
# ============================================================================
# Get from: Sentry Dashboard → Settings → Projects → Client Keys (DSN)
SENTRY_DSN=https://YOUR_SENTRY_KEY@YOUR_SENTRY_DOMAIN.ingest.sentry.io/YOUR_PROJECT_ID
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# ============================================================================
# SECURITY
# ============================================================================
# Set to 1 if behind reverse proxy (Cloudflare, Nginx, etc.)
TRUST_PROXY=1

# Encryption key (generate: openssl rand -hex 32)
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

**Step 5: Save File**
```bash
# Press Ctrl+X, then Y, then Enter to save
```

**Step 6: Restart API Service**
```bash
# Using PM2
pm2 restart advancia-api

# Or restart all services
pm2 restart all

# Verify restart
pm2 logs advancia-api
```

**Status**: ✅ COMPLETE when API restarts successfully with new environment variables

---

### SECTION 7: Cloudflare Security Configuration (30 min)

**What you're doing**: Enabling security features to protect your platform.

**Step 1: Configure SSL/TLS**
1. Go to: https://dash.cloudflare.com
2. Select domain: `advanciapayledger.com`
3. Go to **"SSL/TLS"**
4. Set encryption mode to: **Full (strict)**
5. Save

**Step 2: Enable Bot Fight Mode**
1. Go to **"Security"** → **"Bot Management"**
2. Enable **"Bot Fight Mode"**: **ON**
3. Save settings

**Step 3: Configure Rate Limiting**
1. Go to **"Security"** → **"Rate limiting"**
2. Click **"Create rate limiting rule"**
3. **Threshold**: 100 requests per 10 seconds
4. **Action**: Challenge (CAPTCHA)
5. **Apply to**: All requests
6. Click **"Save"**

7. Create API-specific rule:
8. **Path**: `/api/*`
9. **Threshold**: 1000 requests per minute
10. **Action**: Block
11. Click **"Save"**

**Status**: ✅ COMPLETE when all security settings are enabled

---

### SECTION 8: DMARC Configuration (Optional - 15 min)

**What you're doing**: Setting up email authentication to improve deliverability.

**Step 1: Create DMARC Record**
1. Go to: https://dash.cloudflare.com
2. Select domain: `advanciapayledger.com`
3. Go to **"DNS"**
4. Click **"Add record"**
5. **Type**: TXT
6. **Name**: `_dmarc`
7. **Content**: 
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@advanciapayledger.com; ruf=mailto:dmarc@advanciapayledger.com; fo=1
```
8. **TTL**: Auto
9. Click **"Save"**

**Step 2: Create DMARC Monitoring Email**
1. Go to **"Email Routing"**
2. Click **"Create address"**
3. **Email address**: `dmarc`
4. **Destination email**: `your-email@example.com`
5. Click **"Create"**

**Status**: ✅ COMPLETE when DMARC record is published

---

## PHASE 1 COMPLETION CHECKLIST

- [ ] Section 1: Cloudflare Pages - Healthcare domain added
- [ ] Section 2: Hostinger - 301 redirects configured
- [ ] Section 3: Supabase - Authentication URLs set
- [ ] Section 4: Google Cloud - OAuth configured
- [ ] Section 5: Email Routing - Support email working
- [ ] Section 6: VPS .env - Production environment configured
- [ ] Section 7: Security - Cloudflare security enabled
- [ ] Section 8: DMARC - Email authentication (optional)

**Phase 1 Status**: Ready for Phase 2 when all 8 sections complete

---

## PHASE 2: VERIFICATION & TESTING (1 hour)

### Verification Commands

Run these commands to verify all configurations:

```bash
# Test frontend domains
curl -I https://advanciapayledger.com
curl -I https://advancia-healthcare.com

# Test API health
curl https://api.advanciapayledger.com/health

# Test Supabase connection
curl https://jwabwrcykdtpwdhwhmqq.supabase.co/rest/v1/

# Check SSL certificate
openssl s_client -connect advanciapayledger.com:443

# Check PM2 services
pm2 list
pm2 status

# View API logs
pm2 logs advancia-api
```

### Testing Checklist

- [ ] Frontend loads at https://advanciapayledger.com
- [ ] Healthcare app loads at https://advancia-healthcare.com
- [ ] API health endpoint returns 200
- [ ] Old domain redirects work
- [ ] Email routing working
- [ ] SSL certificates valid
- [ ] No CORS errors
- [ ] Payment processing tested

**Phase 2 Status**: Ready for Phase 3 when all tests pass

---

## PHASE 3: GO LIVE & CUSTOMER ONBOARDING (30 minutes)

### Final Checks

1. ✅ All endpoints responding
2. ✅ SSL certificates valid
3. ✅ Email routing working
4. ✅ Payment processing tested
5. ✅ Monitoring enabled

### Go Live Steps

1. **Enable Monitoring**
   - Configure Sentry alerts
   - Set up Grafana dashboards
   - Enable CloudFlare analytics

2. **Begin Customer Onboarding**
   - Create trial accounts
   - Send welcome emails
   - Schedule demos

3. **Monitor Metrics**
   - Track error rates (target: < 1%)
   - Monitor response times (target: < 200ms)
   - Watch uptime (target: > 99.9%)

**Phase 3 Status**: LIVE when all checks pass

---

## 🎉 PRODUCTION LAUNCH COMPLETE

**Timeline**: 4-5 hours total  
**Status**: ✅ READY FOR EXECUTION

**Next**: Follow sections 1-8 in order, then run verification commands, then go live.

---

**Your Advancia PayLedger platform is production-ready. Execute this guide end-to-end for full launch.**
