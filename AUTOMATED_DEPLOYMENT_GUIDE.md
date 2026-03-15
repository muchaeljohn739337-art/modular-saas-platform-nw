# Automated Deployment Guide

**Status**: Ready for execution  
**Date**: March 2, 2026  
**Timeline**: 4-5 hours total

---

## Overview

This guide provides three automated scripts to handle the code-based deployment tasks:

1. **setup-vps-env.sh** - Automates VPS environment configuration (Phase 1 Section 6)
2. **verify-deployment.sh** - Automates Phase 2 verification tests
3. **deploy-all.sh** - Complete end-to-end automation

---

## Prerequisites

### Required Tools
- `curl` - For HTTP requests
- `openssl` - For SSL certificate verification
- `sshpass` - For automated SSH (optional, can use SSH keys instead)
- `scp` - For file transfer

### Install on macOS
```bash
brew install curl openssl sshpass
```

### Install on Linux (Ubuntu/Debian)
```bash
sudo apt-get install curl openssl sshpass openssh-client
```

### Install on Windows (PowerShell)
```powershell
choco install curl openssl sshpass
```

---

## Quick Start

### Option 1: Full Automated Deployment (Recommended)

Run everything in one command:

```bash
chmod +x deploy-all.sh
./deploy-all.sh <VPS_IP> <VPS_PASSWORD>
```

**Example**:
```bash
./deploy-all.sh 192.168.1.100 your_vps_password
```

This will:
1. Upload .env to VPS
2. Restart API services
3. Run all verification tests
4. Generate deployment report

---

### Option 2: Step-by-Step Automation

#### Step 1: Set Up VPS Environment

```bash
chmod +x setup-vps-env.sh
./setup-vps-env.sh <VPS_IP> <VPS_PASSWORD>
```

**Example**:
```bash
./setup-vps-env.sh 192.168.1.100 your_vps_password
```

This will:
- Create .env file on VPS
- Verify file creation
- Restart API service
- Check service status

#### Step 2: Run Verification Tests

```bash
chmod +x verify-deployment.sh
./verify-deployment.sh
```

This will:
- Test all frontend domains
- Test API endpoints
- Test redirects
- Verify SSL certificates
- Generate test report

---

## Manual VPS Setup (Alternative)

If you prefer to set up the VPS manually:

```bash
# 1. SSH into VPS
ssh root@YOUR_VPS_IP

# 2. Navigate to app directory
cd /home/advancia/app

# 3. Create .env file
nano .env

# 4. Copy-paste the entire .env configuration from DEPLOYMENT_QUICK_REFERENCE.md

# 5. Save: Ctrl+X, Y, Enter

# 6. Restart API
pm2 restart advancia-api

# 7. Check status
pm2 status
```

---

## Phase 1: Manual Dashboard Configuration

**These steps require you to log into external dashboards and cannot be automated.**

Follow DEPLOYMENT_QUICK_REFERENCE.md for:

1. **Section 1**: Cloudflare Pages - Add healthcare domain (30 min)
2. **Section 2**: Hostinger - Configure 301 redirects (30 min)
3. **Section 3**: Supabase - Set authentication URLs (30 min)
4. **Section 4**: Google Cloud - Configure OAuth (30 min)
5. **Section 5**: Cloudflare Email Routing - Support email (30 min)
6. **Section 6**: VPS Configuration - **USE AUTOMATED SCRIPT** (30 min)
7. **Section 7**: Cloudflare Security - Enable protections (30 min)
8. **Section 8**: DMARC Configuration - Email auth (15 min, optional)

---

## Phase 2: Automated Verification

After completing Phase 1, run:

```bash
./verify-deployment.sh
```

**Expected Output**:
```
Testing PayLedger App... ✓ PASS (Status: 200)
Testing Healthcare App... ✓ PASS (Status: 200)
Testing API Health... ✓ PASS (Status: 200)
Testing Supabase Connection... ✓ PASS (Status: 200)
Testing old domain redirect... ✓ PASS
Checking SSL certificate... ✓ PASS

Passed: 6
Failed: 0

✓ All tests passed! Ready for Phase 3.
```

---

## Phase 3: Go Live

Once Phase 2 verification passes:

1. **Enable Monitoring**
   ```bash
   # SSH into VPS
   ssh root@YOUR_VPS_IP
   
   # Check Sentry is configured
   pm2 logs advancia-api | grep -i sentry
   
   # Check Grafana dashboards are set up
   ```

2. **Begin Customer Onboarding**
   - Create trial accounts
   - Send welcome emails
   - Schedule demos

3. **Monitor Metrics**
   - Track error rates (target: < 1%)
   - Monitor response times (target: < 200ms)
   - Watch uptime (target: > 99.9%)

---

## Troubleshooting

### Script Fails to Connect to VPS

**Problem**: `Permission denied (publickey,password)`

**Solution 1**: Use SSH key instead of password
```bash
# Copy your SSH key to VPS first
ssh-copy-id root@YOUR_VPS_IP

# Then run script without password
./deploy-all.sh YOUR_VPS_IP
```

**Solution 2**: Ensure sshpass is installed
```bash
# macOS
brew install sshpass

# Linux
sudo apt-get install sshpass

# Windows
choco install sshpass
```

### Verification Tests Fail

**Problem**: Tests return 000 status or connection timeout

**Solution**:
1. Check VPS is running
2. Check firewall allows port 443
3. Check DNS records are propagated
4. Wait 5-10 minutes for DNS to update

```bash
# Check DNS propagation
nslookup advanciapayledger.com
dig advanciapayledger.com
```

### API Service Won't Start

**Problem**: `pm2 restart advancia-api` fails

**Solution**:
```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# Check logs
pm2 logs advancia-api

# Check .env file
cat /home/advancia/app/.env | head -20

# Verify all required variables are set
grep "YOUR_" /home/advancia/app/.env
```

If you see `YOUR_*` placeholders, you need to replace them with actual values.

### SSL Certificate Issues

**Problem**: `curl: (60) SSL certificate problem`

**Solution**:
1. Wait 5-10 minutes for certificate to propagate
2. Check Cloudflare SSL settings
3. Verify domain is pointing to Cloudflare

```bash
# Check certificate details
openssl s_client -connect advanciapayledger.com:443 -showcerts

# Check certificate expiration
echo | openssl s_client -servername advanciapayledger.com -connect advanciapayledger.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## Environment Variables Reference

### Required Variables (Must be replaced)

| Variable | Source | Example |
|----------|--------|---------|
| `YOUR_DATABASE_PASSWORD` | Supabase Dashboard → Settings → Database | `abc123xyz...` |
| `YOUR_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | `eyJhbGc...` |
| `YOUR_JWT_SECRET_MIN_32_CHARS` | Generate: `openssl rand -base64 32` | `abc123xyz...` |
| `YOUR_REFRESH_SECRET_MIN_32_CHARS` | Generate: `openssl rand -base64 32` | `xyz789abc...` |
| `YOUR_ACTUAL_STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys | `sk_live_...` |
| `YOUR_ACTUAL_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys | `pk_live_...` |
| `YOUR_ACTUAL_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks | `whsec_...` |
| `YOUR_RESEND_API_KEY` | Resend Dashboard → API Keys | `re_...` |
| `YOUR_TWILIO_ACCOUNT_SID` | Twilio Console → Account Info | `AC...` |
| `YOUR_TWILIO_AUTH_TOKEN` | Twilio Console → Account Info | `auth_token...` |
| `YOUR_TWILIO_PHONE_NUMBER` | Twilio Console → Phone Numbers | `+1234567890` |
| `YOUR_UPSTASH_PASSWORD` | Upstash Console → Redis → Connection | `password...` |
| `YOUR_UPSTASH_HOST` | Upstash Console → Redis → Connection | `host.upstash.io` |
| `YOUR_UPSTASH_PORT` | Upstash Console → Redis → Connection | `12345` |
| `YOUR_UPSTASH_TOKEN` | Upstash Console → Redis → Connection | `token...` |
| `YOUR_SENTRY_KEY` | Sentry Dashboard → Settings → Projects | `key...` |
| `YOUR_SENTRY_DOMAIN` | Sentry Dashboard → Settings → Projects | `domain.ingest.sentry.io` |
| `YOUR_PROJECT_ID` | Sentry Dashboard → Settings → Projects | `12345` |
| `YOUR_64_HEX_CHARACTER_ENCRYPTION_KEY` | Generate: `openssl rand -hex 32` | `abc123...` |

### How to Replace Variables

**Option 1**: Edit .env on VPS directly
```bash
ssh root@YOUR_VPS_IP
nano /home/advancia/app/.env
# Find and replace YOUR_* values
# Save: Ctrl+X, Y, Enter
pm2 restart advancia-api
```

**Option 2**: Create local .env and upload
```bash
# Edit local .env file
nano .env

# Upload to VPS
scp .env root@YOUR_VPS_IP:/home/advancia/app/.env

# Restart service
ssh root@YOUR_VPS_IP "pm2 restart advancia-api"
```

---

## Deployment Checklist

### Phase 1: Manual Configuration (2-3 hours)
- [ ] Section 1: Cloudflare Pages - Healthcare domain
- [ ] Section 2: Hostinger - 301 redirects
- [ ] Section 3: Supabase - Authentication URLs
- [ ] Section 4: Google Cloud - OAuth configuration
- [ ] Section 5: Email Routing - Support email
- [ ] Section 6: VPS .env - Run `./setup-vps-env.sh`
- [ ] Section 7: Security - Cloudflare settings
- [ ] Section 8: DMARC - Email authentication (optional)

### Phase 2: Verification (1 hour)
- [ ] Run `./verify-deployment.sh`
- [ ] All tests pass
- [ ] Frontend loads
- [ ] API responds
- [ ] Redirects work
- [ ] SSL valid

### Phase 3: Go Live (30 min)
- [ ] Enable Sentry alerts
- [ ] Set up Grafana dashboards
- [ ] Enable CloudFlare analytics
- [ ] Create trial accounts
- [ ] Send welcome emails
- [ ] Monitor metrics for 24 hours

---

## Support

### Common Issues

**Issue**: Script permission denied
```bash
chmod +x *.sh
```

**Issue**: sshpass not found
```bash
# Install sshpass
brew install sshpass  # macOS
sudo apt-get install sshpass  # Linux
choco install sshpass  # Windows
```

**Issue**: SSH key authentication
```bash
# Use SSH key instead of password
ssh-copy-id root@YOUR_VPS_IP
./deploy-all.sh YOUR_VPS_IP  # No password needed
```

---

## Success Criteria

✅ All Phase 1 sections complete  
✅ All Phase 2 verification tests pass  
✅ All endpoints responding (200 status)  
✅ SSL certificates valid  
✅ Email routing working  
✅ No errors in logs  
✅ Payment processing tested  
✅ Monitoring enabled  

---

**Your platform is production-ready. Execute the deployment scripts to go live.**

