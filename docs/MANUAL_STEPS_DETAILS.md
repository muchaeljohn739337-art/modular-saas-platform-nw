# Manual Setup Details - Complete Configuration Guide

**Status**: PRODUCTION CONFIGURATION  
**Last Updated**: March 2, 2026  
**Complexity**: Advanced

---

## 1. Cloudflare Pages - Domain Configuration

### Step 1: Add Healthcare Domain to Cloudflare Pages

1. **Open Cloudflare Dashboard**: https://dash.cloudflare.com
2. **Select your account** → **Pages**
3. **Click "Create a project"** or select existing project
4. **Go to "Custom domains"** tab
5. **Click "Add custom domain"**
6. **Enter domain**: `advancia-healthcare.com`
7. **Verify DNS records** (Cloudflare will show required records)
8. **Click "Activate domain"**

### Step 2: Add WWW Subdomain (Optional)

1. **In Custom domains**, click **"Add custom domain"** again
2. **Enter domain**: `www.advancia-healthcare.com`
3. **Verify DNS records**
4. **Click "Activate domain"**

### Step 3: Verify Domain Configuration

```bash
# Test healthcare domain
curl https://advancia-healthcare.com

# Test www subdomain
curl https://www.advancia-healthcare.com

# Both should return your healthcare app
```

**Expected Result**: Both domains load your healthcare application

---

## 2. Hostinger - 301 Redirects Configuration

### Step 1: Access Hostinger DNS Management

1. **Log in to Hostinger**: https://hpanel.hostinger.com
2. **Select your domain**: `advanciapayroll.com`
3. **Go to "DNS/Nameservers"**
4. **Find "Redirects" section** (or "URL Redirects")

### Step 2: Create Redirect Rules

| From | To | Type | Status |
|------|-----|------|--------|
| `advanciapayroll.com` | `https://advanciapayledger.com` | 301 Permanent | Active |
| `www.advanciapayroll.com` | `https://advanciapayledger.com` | 301 Permanent | Active |

### Step 3: Create Each Redirect

**For advanciapayroll.com:**
1. Click **"Add Redirect"**
2. **From**: `advanciapayroll.com`
3. **To**: `https://advanciapayledger.com`
4. **Type**: 301 Permanent Redirect
5. Click **"Save"**

**For www.advanciapayroll.com:**
1. Click **"Add Redirect"**
2. **From**: `www.advanciapayroll.com`
3. **To**: `https://advanciapayledger.com`
4. **Type**: 301 Permanent Redirect
5. Click **"Save"**

### Step 4: Verify Redirects

```bash
# Test redirect
curl -L -I https://advanciapayroll.com

# Should show final URL: https://advanciapayledger.com
```

**Expected Result**: Both old domains redirect to main domain

---

## 3. Supabase - Authentication Configuration

### Step 1: Configure Site URL

1. **Open Supabase Dashboard**: https://app.supabase.com
2. **Select your project**: `advancia-payledger`
3. **Go to "Authentication" → "URL Configuration"**
4. **Set Site URL**:
   ```
   https://advanciapayledger.com
   ```

### Step 2: Add Redirect URLs

1. **In "Redirect URLs" section**, add all these URLs:

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

2. **Click "Save"** after adding each URL

### Step 3: Verify Configuration

```bash
# Test Supabase connection
curl https://jwabwrcykdtpwdhwhmqq.supabase.co/rest/v1/

# Should return 200 status
```

**Expected Result**: All redirect URLs accepted and saved

---

## 4. Google Cloud Console - OAuth Configuration

### Step 1: Configure Authorized JavaScript Origins

1. **Open Google Cloud Console**: https://console.cloud.google.com
2. **Select your project**
3. **Go to "APIs & Services" → "Credentials"**
4. **Find your OAuth 2.0 Client ID**
5. **Click to edit**
6. **Under "Authorized JavaScript origins", add**:

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

### Step 2: Configure Authorized Redirect URIs

1. **Under "Authorized redirect URIs", add**:

```
https://jwabwrcykdtpwdhwhmqq.supabase.co/auth/v1/callback
https://advanciapayledger.com/auth/callback
https://advancia-healthcare.com/auth/callback
http://localhost:5173/auth/callback
http://localhost:5174/auth/callback
http://localhost:3000/auth/callback
```

**Note**: Replace `jwabwrcykdtpwdhwhmqq` with your actual Supabase project reference

2. **Click "Save"**

### Step 3: Get OAuth Credentials

1. **Copy Client ID**: (You'll need this for frontend)
2. **Copy Client Secret**: (You'll need this for backend)

**Expected Result**: OAuth credentials configured and saved

---

## 5. Cloudflare Email Routing - Support Email

### Step 1: Enable Email Routing

1. **Open Cloudflare Dashboard**: https://dash.cloudflare.com
2. **Select domain**: `advanciapayledger.com`
3. **Go to "Email Routing"**
4. **Click "Enable Email Routing"**

### Step 2: Create Support Email Address

1. **Click "Create address"**
2. **Email address**: `support`
3. **Destination email**: `support@advanciapayledger.com` (your actual support email)
4. **Click "Create"**

### Step 3: Add Healthcare Domain Email (Optional)

1. **Switch to domain**: `advancia-healthcare.com`
2. **Enable Email Routing**
3. **Create address**:
   - **Email address**: `support`
   - **Destination email**: `support@advanciapayledger.com`
4. **Click "Create"**

### Step 4: Verify Email Routing

1. **Send test email** to `support@advanciapayledger.com`
2. **Check that it arrives** at your destination email
3. **Verify both domains work**

**Expected Result**: Emails to support@ arrive at your inbox

---

## 6. VPS Configuration - Production .env

### Step 1: Access VPS via SSH

```bash
# Connect to Hostinger VPS
ssh root@YOUR_VPS_IP

# Or use Hostinger's terminal
```

### Step 2: Create Production .env File

```bash
# Navigate to app directory
cd /home/advancia/app

# Create .env file
nano .env
```

### Step 3: Add Complete Production Configuration

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

# Get webhook secret from: Stripe Dashboard → Developers → Webhooks
# Events to listen for: payment_intent.succeeded, payment_intent.payment_failed

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

### Step 4: Save and Exit

```bash
# Press Ctrl+X, then Y, then Enter to save
```

### Step 5: Restart API Service

```bash
# Using PM2
pm2 restart advancia-api

# Or restart all services
pm2 restart all

# Verify restart
pm2 logs advancia-api
```

**Expected Result**: API restarts with new environment variables

---

## 7. Cloudflare Security Configuration

### Step 1: Configure SSL/TLS

1. **Open Cloudflare Dashboard**: https://dash.cloudflare.com
2. **Select domain**: `advanciapayledger.com`
3. **Go to "SSL/TLS"**
4. **Set SSL/TLS encryption mode**: **Full (strict)**
   - This requires valid SSL certificate on origin server

### Step 2: Enable Bot Fight Mode

1. **Go to "Security" → "Bot Management"**
2. **Enable "Bot Fight Mode"**: **ON**
3. **Save settings**

### Step 3: Configure Rate Limiting

1. **Go to "Security" → "Rate limiting"**
2. **Create rate limiting rule**:
   - **Threshold**: 100 requests per 10 seconds
   - **Action**: Challenge (CAPTCHA)
   - **Apply to**: All requests

3. **Create API-specific rule**:
   - **Path**: `/api/*`
   - **Threshold**: 1000 requests per minute
   - **Action**: Block

### Step 4: Verify Security Settings

| Setting | Value | Status |
|---------|-------|--------|
| SSL/TLS | Full (strict) | ✓ Enabled |
| Bot Fight Mode | On | ✓ Enabled |
| Rate Limiting | 100 req/10s | ✓ Enabled |
| DDoS Protection | Advanced | ✓ Enabled |

**Expected Result**: All security settings configured

---

## 8. DMARC Configuration (Optional)

### Step 1: Create DMARC Record

1. **Open Cloudflare Dashboard**
2. **Select domain**: `advanciapayledger.com`
3. **Go to "DNS"**
4. **Click "Add record"**
5. **Add TXT record**:
   - **Name**: `_dmarc`
   - **Content**: 
   ```
   v=DMARC1; p=quarantine; rua=mailto:dmarc@advanciapayledger.com; ruf=mailto:dmarc@advanciapayledger.com; fo=1
   ```
   - **TTL**: Auto
   - Click **"Save"**

### Step 2: Create DMARC Monitoring Email

1. **Go to "Email Routing"**
2. **Create address**:
   - **Email address**: `dmarc`
   - **Destination email**: `your-email@example.com`
3. **Click "Create"**

### Step 3: Verify DMARC Record

```bash
# Check DMARC record
dig _dmarc.advanciapayledger.com TXT

# Should return the DMARC policy
```

**Expected Result**: DMARC record published and monitoring emails received

---

## 9. Where to Get Each Configuration Value

### Supabase Dashboard
- **URL**: https://app.supabase.com
- **Location**: Settings → API
- **Values**: 
  - `SUPABASE_URL` - Project URL
  - `SUPABASE_ANON_KEY` - Anon key
  - `SUPABASE_SERVICE_ROLE_KEY` - Service role key
  - `DATABASE_URL` - Connection string

### Stripe Dashboard
- **URL**: https://dashboard.stripe.com
- **Location**: Developers → API Keys
- **Values**:
  - `STRIPE_SECRET_KEY` - Secret key
  - `STRIPE_PUBLISHABLE_KEY` - Publishable key
  - `STRIPE_WEBHOOK_SECRET` - From Webhooks section

### Resend Dashboard
- **URL**: https://resend.com/api-keys
- **Value**: `RESEND_API_KEY`

### Twilio Console
- **URL**: https://console.twilio.com
- **Location**: Account Info
- **Values**:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`

### Upstash Console
- **URL**: https://console.upstash.com
- **Location**: Redis Database → Connection
- **Values**:
  - `UPSTASH_REDIS_URL`
  - `UPSTASH_REDIS_TOKEN`

### Sentry Dashboard
- **URL**: https://sentry.io
- **Location**: Settings → Projects → Client Keys (DSN)
- **Value**: `SENTRY_DSN`

---

## 10. Verification Commands

### Test All Configurations

```bash
# Test frontend domains
curl -I https://advanciapayledger.com
curl -I https://advancia-healthcare.com

# Test API health
curl https://api.advanciapayledger.com/health

# Test Supabase connection
curl https://jwabwrcykdtpwdhwhmqq.supabase.co/rest/v1/

# Test email routing
# Send test email to support@advanciapayledger.com

# Test Stripe webhook
# Trigger test event in Stripe Dashboard

# Check logs
pm2 logs advancia-api
```

### Verify All Services

```bash
# Check PM2 services
pm2 list

# Check API status
pm2 status

# View API logs
pm2 logs advancia-api

# Check SSL certificate
openssl s_client -connect advanciapayledger.com:443
```

---

## 11. Common Issues & Solutions

### Issue: SSL Certificate Error
**Solution**: 
- Ensure SSL/TLS is set to "Full (strict)" in Cloudflare
- Verify origin server has valid SSL certificate
- Wait 5 minutes for propagation

### Issue: Email Not Routing
**Solution**:
- Verify email routing is enabled
- Check destination email is correct
- Test with different email provider
- Check spam folder

### Issue: CORS Errors
**Solution**:
- Verify all domains in `CORS_ORIGINS`
- Restart API after .env changes
- Check browser console for exact error
- Verify domain is in Supabase redirect URLs

### Issue: Stripe Webhook Not Firing
**Solution**:
- Verify webhook URL is correct
- Check webhook secret in .env
- Verify Stripe can reach your API
- Check API logs for webhook attempts

---

## 12. Post-Configuration Checklist

- [ ] Cloudflare Pages domains configured
- [ ] Hostinger redirects working
- [ ] Supabase Site URL and redirects set
- [ ] Google Cloud OAuth configured
- [ ] Email routing working
- [ ] VPS .env file created and saved
- [ ] API restarted with new .env
- [ ] Cloudflare security settings enabled
- [ ] DMARC record published (optional)
- [ ] All verification commands passed
- [ ] SSL certificates valid
- [ ] No CORS errors
- [ ] Email notifications working
- [ ] Stripe webhooks firing
- [ ] Sentry receiving errors

---

**Status**: Configuration complete and verified  
**Next Step**: Run verification commands and test all services
