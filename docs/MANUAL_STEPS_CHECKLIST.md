# Manual Setup Checklist - Quick Reference

**Status**: PRODUCTION CONFIGURATION  
**Last Updated**: March 2, 2026  
**Purpose**: Track progress and verify all manual configuration steps

---

## 📋 Quick Navigation

**For detailed copy-paste values and complete instructions**: See **[MANUAL_STEPS_DETAILS.md](./MANUAL_STEPS_DETAILS.md)**

---

## ✅ Configuration Checklist

### 1. Cloudflare Pages - Domain Configuration

- [ ] Add `advancia-healthcare.com` to Cloudflare Pages
- [ ] Add `www.advancia-healthcare.com` (optional)
- [ ] Verify DNS records are active
- [ ] Test: `curl https://advancia-healthcare.com` returns 200
- [ ] Test: `curl https://www.advancia-healthcare.com` returns 200

**Status**: ⏳ PENDING  
**Details**: [MANUAL_STEPS_DETAILS.md - Section 1](./MANUAL_STEPS_DETAILS.md#1-cloudflare-pages---domain-configuration)

---

### 2. Hostinger - 301 Redirects

- [ ] Log in to Hostinger
- [ ] Create redirect: `advanciapayroll.com` → `https://advanciapayledger.com`
- [ ] Create redirect: `www.advanciapayroll.com` → `https://advanciapayledger.com`
- [ ] Verify both redirects are active
- [ ] Test: `curl -L -I https://advanciapayroll.com` shows final URL

**Redirect Table**:

| From | To | Type |
|------|-----|------|
| advanciapayroll.com | https://advanciapayledger.com | 301 |
| www.advanciapayroll.com | https://advanciapayledger.com | 301 |

**Status**: ⏳ PENDING  
**Details**: [MANUAL_STEPS_DETAILS.md - Section 2](./MANUAL_STEPS_DETAILS.md#2-hostinger---301-redirects-configuration)

---

### 3. Supabase - Authentication Configuration

- [ ] Set Site URL: `https://advanciapayledger.com`
- [ ] Add redirect URL: `https://advanciapayledger.com/auth/callback`
- [ ] Add redirect URL: `https://advanciapayledger.com/auth/confirm`
- [ ] Add redirect URL: `https://advancia-healthcare.com/auth/callback`
- [ ] Add redirect URL: `https://advancia-healthcare.com/auth/confirm`
- [ ] Add redirect URL: `https://api.advanciapayledger.com/auth/callback`
- [ ] Add redirect URL: `http://localhost:5173/auth/callback`
- [ ] Add redirect URL: `http://localhost:5174/auth/callback`
- [ ] Add redirect URL: `http://localhost:3000/auth/callback`
- [ ] Verify all URLs are saved
- [ ] Test: `curl https://jwabwrcykdtpwdhwhmqq.supabase.co/rest/v1/` returns 200

**Status**: ⏳ PENDING  
**Details**: [MANUAL_STEPS_DETAILS.md - Section 3](./MANUAL_STEPS_DETAILS.md#3-supabase---authentication-configuration)

---

### 4. Google Cloud Console - OAuth Configuration

- [ ] Add authorized JavaScript origin: `https://advanciapayledger.com`
- [ ] Add authorized JavaScript origin: `https://www.advanciapayledger.com`
- [ ] Add authorized JavaScript origin: `https://advancia-healthcare.com`
- [ ] Add authorized JavaScript origin: `https://www.advancia-healthcare.com`
- [ ] Add authorized JavaScript origin: `https://api.advanciapayledger.com`
- [ ] Add authorized JavaScript origin: `http://localhost:5173`
- [ ] Add authorized JavaScript origin: `http://localhost:5174`
- [ ] Add authorized JavaScript origin: `http://localhost:3000`
- [ ] Add authorized redirect URI: `https://jwabwrcykdtpwdhwhmqq.supabase.co/auth/v1/callback`
- [ ] Add authorized redirect URI: `https://advanciapayledger.com/auth/callback`
- [ ] Add authorized redirect URI: `https://advancia-healthcare.com/auth/callback`
- [ ] Add authorized redirect URI: `http://localhost:5173/auth/callback`
- [ ] Add authorized redirect URI: `http://localhost:5174/auth/callback`
- [ ] Add authorized redirect URI: `http://localhost:3000/auth/callback`
- [ ] Copy Client ID (for frontend)
- [ ] Copy Client Secret (for backend)
- [ ] Save all changes

**Status**: ⏳ PENDING  
**Details**: [MANUAL_STEPS_DETAILS.md - Section 4](./MANUAL_STEPS_DETAILS.md#4-google-cloud-console---oauth-configuration)

---

### 5. Cloudflare Email Routing - Support Email

- [ ] Enable Email Routing for `advanciapayledger.com`
- [ ] Create email address: `support@advanciapayledger.com`
- [ ] Set destination email: `your-support-email@example.com`
- [ ] Enable Email Routing for `advancia-healthcare.com` (optional)
- [ ] Create email address: `support@advancia-healthcare.com`
- [ ] Set destination email: `your-support-email@example.com`
- [ ] Send test email to `support@advanciapayledger.com`
- [ ] Verify email arrives at destination
- [ ] Test both domains if configured

**Status**: ⏳ PENDING  
**Details**: [MANUAL_STEPS_DETAILS.md - Section 5](./MANUAL_STEPS_DETAILS.md#5-cloudflare-email-routing---support-email)

---

### 6. VPS Configuration - Production .env

- [ ] SSH into VPS: `ssh root@YOUR_VPS_IP`
- [ ] Navigate to app directory: `cd /home/advancia/app`
- [ ] Create .env file: `nano .env`
- [ ] Add FRONTEND_URL: `https://advanciapayledger.com`
- [ ] Add HEALTHCARE_URL: `https://advancia-healthcare.com`
- [ ] Add CORS_ORIGINS: (all domains)
- [ ] Add DATABASE_URL: (from Supabase)
- [ ] Add SUPABASE_URL: (from Supabase)
- [ ] Add SUPABASE_ANON_KEY: (from Supabase)
- [ ] Add SUPABASE_SERVICE_ROLE_KEY: (from Supabase)
- [ ] Add JWT_SECRET: (generate new)
- [ ] Add JWT_REFRESH_SECRET: (generate new)
- [ ] Add STRIPE_SECRET_KEY: (from Stripe)
- [ ] Add STRIPE_PUBLISHABLE_KEY: (from Stripe)
- [ ] Add STRIPE_WEBHOOK_SECRET: (from Stripe)
- [ ] Add RESEND_API_KEY: (from Resend)
- [ ] Add TWILIO_ACCOUNT_SID: (from Twilio)
- [ ] Add TWILIO_AUTH_TOKEN: (from Twilio)
- [ ] Add TWILIO_PHONE_NUMBER: (from Twilio)
- [ ] Add UPSTASH_REDIS_URL: (from Upstash)
- [ ] Add SENTRY_DSN: (from Sentry)
- [ ] Add TRUST_PROXY: `1`
- [ ] Save file: `Ctrl+X, Y, Enter`
- [ ] Restart API: `pm2 restart advancia-api`
- [ ] Verify restart: `pm2 logs advancia-api`

**Status**: ⏳ PENDING  
**Details**: [MANUAL_STEPS_DETAILS.md - Section 6](./MANUAL_STEPS_DETAILS.md#6-vps-configuration---production-env)

---

### 7. Cloudflare Security Configuration

- [ ] Set SSL/TLS to: **Full (strict)**
- [ ] Enable Bot Fight Mode: **ON**
- [ ] Configure Rate Limiting: 100 req/10s
- [ ] Create API rate limit: 1000 req/min for `/api/*`
- [ ] Verify all security settings are active

**Security Settings Table**:

| Setting | Value | Status |
|---------|-------|--------|
| SSL/TLS | Full (strict) | ⏳ PENDING |
| Bot Fight Mode | On | ⏳ PENDING |
| Rate Limiting | 100 req/10s | ⏳ PENDING |
| DDoS Protection | Advanced | ⏳ PENDING |

**Status**: ⏳ PENDING  
**Details**: [MANUAL_STEPS_DETAILS.md - Section 7](./MANUAL_STEPS_DETAILS.md#7-cloudflare-security-configuration)

---

### 8. DMARC Configuration (Optional)

- [ ] Create DNS TXT record: `_dmarc`
- [ ] Add content: `v=DMARC1; p=quarantine; rua=mailto:dmarc@advanciapayledger.com; ruf=mailto:dmarc@advanciapayledger.com; fo=1`
- [ ] Create email address: `dmarc@advanciapayledger.com`
- [ ] Set destination email
- [ ] Verify DMARC record: `dig _dmarc.advanciapayledger.com TXT`
- [ ] Monitor DMARC reports

**Status**: ⏳ OPTIONAL  
**Details**: [MANUAL_STEPS_DETAILS.md - Section 8](./MANUAL_STEPS_DETAILS.md#8-dmarc-configuration-optional)

---

## 🔍 Verification Commands

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

---

## 📊 Production URLs Quick Reference

| Service | URL | Purpose |
|---------|-----|---------|
| **PayLedger App** | https://advanciapayledger.com | Main application |
| **Healthcare App** | https://advancia-healthcare.com | Healthcare module |
| **API Health** | https://api.advanciapayledger.com/health | Health check |
| **API Docs** | https://api.advanciapayledger.com/docs | API documentation |
| **Stripe Webhook** | https://api.advanciapayledger.com/webhooks/stripe | Payment webhooks |
| **Old Domain 1** | https://advanciapayroll.com | Redirects to main |
| **Old Domain 2** | https://www.advanciapayroll.com | Redirects to main |

---

## 🖥️ VPS Summary

| Item | Value |
|------|-------|
| **Provider** | Hostinger |
| **IP Address** | YOUR_VPS_IP |
| **App Directory** | `/home/advancia/app` |
| **PM2 Process** | `advancia-api` |
| **Port** | 3001 |
| **Node Version** | 18+ |
| **SSL** | Cloudflare (Full strict) |

---

## 🧪 Testing Checklist

### Login Tests
- [ ] Login on `advanciapayledger.com` works
- [ ] Login on `advancia-healthcare.com` works
- [ ] OAuth (Google) login works
- [ ] Session persists across pages

### Redirect Tests
- [ ] `advanciapayroll.com` redirects to main domain
- [ ] `www.advanciapayroll.com` redirects to main domain
- [ ] Redirect is 301 (permanent)

### API Tests
- [ ] Health endpoint returns 200
- [ ] API docs accessible
- [ ] Stripe webhook receives events
- [ ] Email notifications send
- [ ] SMS notifications send

### Security Tests
- [ ] SSL certificate is valid
- [ ] HTTPS enforced on all domains
- [ ] CORS headers correct
- [ ] Rate limiting working
- [ ] Bot protection active

### Email Tests
- [ ] Support email routing works
- [ ] DMARC record published (if configured)
- [ ] Email deliverability good

---

## 📝 Configuration Value Sources

| Value | Source | Location |
|-------|--------|----------|
| SUPABASE_URL | Supabase | Settings → API |
| SUPABASE_ANON_KEY | Supabase | Settings → API |
| SUPABASE_SERVICE_ROLE_KEY | Supabase | Settings → API |
| DATABASE_URL | Supabase | Settings → Database |
| STRIPE_SECRET_KEY | Stripe | Developers → API Keys |
| STRIPE_WEBHOOK_SECRET | Stripe | Developers → Webhooks |
| RESEND_API_KEY | Resend | API Keys |
| TWILIO_ACCOUNT_SID | Twilio | Account Info |
| UPSTASH_REDIS_URL | Upstash | Redis Database → Connection |
| SENTRY_DSN | Sentry | Settings → Projects → Client Keys |

---

## ⚠️ Important Notes

1. **Secrets**: Never commit .env files to git
2. **Restart**: Always restart API after .env changes
3. **Propagation**: DNS changes may take 5-15 minutes
4. **SSL**: Ensure origin server has valid SSL certificate
5. **Backups**: Backup .env file before making changes
6. **Monitoring**: Monitor logs after each configuration change

---

## 🎯 Next Steps

1. **Start with Section 1**: Cloudflare Pages configuration
2. **Follow in order**: Each section builds on previous
3. **Use MANUAL_STEPS_DETAILS.md**: For exact copy-paste values
4. **Run verification commands**: After each section
5. **Test thoroughly**: Before considering complete

---

## ✨ Completion Status

**Overall Progress**: 0/8 sections complete

| Section | Status | Progress |
|---------|--------|----------|
| 1. Cloudflare Pages | ⏳ PENDING | 0% |
| 2. Hostinger Redirects | ⏳ PENDING | 0% |
| 3. Supabase Auth | ⏳ PENDING | 0% |
| 4. Google Cloud OAuth | ⏳ PENDING | 0% |
| 5. Email Routing | ⏳ PENDING | 0% |
| 6. VPS .env | ⏳ PENDING | 0% |
| 7. Security Config | ⏳ PENDING | 0% |
| 8. DMARC (Optional) | ⏳ OPTIONAL | 0% |

---

**Status**: Ready to begin configuration  
**Next Action**: Open [MANUAL_STEPS_DETAILS.md](./MANUAL_STEPS_DETAILS.md) and start with Section 1
