# Phase 1 Execution Tracker

**Status**: In Progress  
**Date Started**: March 2, 2026 6:04 PM UTC-05:00  
**Estimated Completion**: 2-3 hours

---

## Section 1: Cloudflare Pages - Healthcare Domain (30 min)

**Status**: ⏳ PENDING

**Dashboard**: https://dash.cloudflare.com

**Steps**:
1. [ ] Log in to Cloudflare
2. [ ] Select domain: `advanciapayledger.com`
3. [ ] Click "Workers & Pages" → "Pages"
4. [ ] Click "Custom domains"
5. [ ] Add domain: `advancia-healthcare.com`
6. [ ] Verify DNS records
7. [ ] Activate domain
8. [ ] (Optional) Add `www.advancia-healthcare.com`

**Verification**:
```bash
curl -I https://advancia-healthcare.com
# Expected: 200 status
```

**Notes**:
- DNS may take 5-10 minutes to propagate
- Check status at: https://www.whatsmydns.net/?q=advancia-healthcare.com

**Completed**: ❌ Not started

---

## Section 2: Hostinger - 301 Redirects (30 min)

**Status**: ⏳ PENDING

**Dashboard**: https://hpanel.hostinger.com

**Steps**:
1. [ ] Log in to Hostinger
2. [ ] Select domain: `advanciapayroll.com`
3. [ ] Go to "DNS/Nameservers" → "Redirects"
4. [ ] Add Redirect 1:
   - From: `advanciapayroll.com`
   - To: `https://advanciapayledger.com`
   - Type: 301 Permanent
5. [ ] Add Redirect 2:
   - From: `www.advanciapayroll.com`
   - To: `https://advanciapayledger.com`
   - Type: 301 Permanent

**Verification**:
```bash
curl -L -I https://advanciapayroll.com
# Expected: Final URL = https://advanciapayledger.com
```

**Completed**: ❌ Not started

---

## Section 3: Supabase - Authentication URLs (30 min)

**Status**: ⏳ PENDING

**Dashboard**: https://app.supabase.com | **Project**: advancia-payledger

**Steps**:
1. [ ] Log in to Supabase
2. [ ] Select project: `advancia-payledger`
3. [ ] Go to "Authentication" → "URL Configuration"
4. [ ] Set Site URL: `https://advanciapayledger.com`
5. [ ] Add Redirect URLs (8 total):
   - [ ] `https://advanciapayledger.com/auth/callback`
   - [ ] `https://advanciapayledger.com/auth/confirm`
   - [ ] `https://advancia-healthcare.com/auth/callback`
   - [ ] `https://advancia-healthcare.com/auth/confirm`
   - [ ] `https://api.advanciapayledger.com/auth/callback`
   - [ ] `http://localhost:5173/auth/callback`
   - [ ] `http://localhost:5174/auth/callback`
   - [ ] `http://localhost:3000/auth/callback`

**Verification**:
```bash
curl https://jwabwrcykdtpwdhwhmqq.supabase.co/rest/v1/
# Expected: 200 status
```

**Completed**: ❌ Not started

---

## Section 4: Google Cloud - OAuth Configuration (30 min)

**Status**: ⏳ PENDING

**Dashboard**: https://console.cloud.google.com

**Steps**:
1. [ ] Log in to Google Cloud Console
2. [ ] Go to "APIs & Services" → "Credentials"
3. [ ] Find and edit OAuth 2.0 Client ID
4. [ ] Add JavaScript Origins (8 total):
   - [ ] `https://advanciapayledger.com`
   - [ ] `https://www.advanciapayledger.com`
   - [ ] `https://advancia-healthcare.com`
   - [ ] `https://www.advancia-healthcare.com`
   - [ ] `https://api.advanciapayledger.com`
   - [ ] `http://localhost:5173`
   - [ ] `http://localhost:5174`
   - [ ] `http://localhost:3000`
5. [ ] Add Redirect URIs (6 total):
   - [ ] `https://jwabwrcykdtpwdhwhmqq.supabase.co/auth/v1/callback`
   - [ ] `https://advanciapayledger.com/auth/callback`
   - [ ] `https://advancia-healthcare.com/auth/callback`
   - [ ] `http://localhost:5173/auth/callback`
   - [ ] `http://localhost:5174/auth/callback`
   - [ ] `http://localhost:3000/auth/callback`
6. [ ] Copy Client ID
7. [ ] Copy Client Secret

**Completed**: ❌ Not started

---

## Section 5: Cloudflare Email Routing - Support Email (30 min)

**Status**: ⏳ PENDING

**Dashboard**: https://dash.cloudflare.com

**Steps**:
1. [ ] Log in to Cloudflare
2. [ ] Select domain: `advanciapayledger.com`
3. [ ] Go to "Email Routing"
4. [ ] Click "Enable Email Routing"
5. [ ] Create address:
   - Address: `support`
   - Destination: `your-support-email@example.com`
6. [ ] (Optional) Repeat for `advancia-healthcare.com`

**Verification**:
```bash
# Send test email to: support@advanciapayledger.com
# Check your inbox for arrival
```

**Completed**: ❌ Not started

---

## Section 6: VPS Configuration - Production .env (30 min)

**Status**: ⏳ PENDING - AUTOMATED

**Command**:
```bash
chmod +x setup-vps-env.sh
./setup-vps-env.sh <VPS_IP> <VPS_PASSWORD>
```

**Example**:
```bash
./setup-vps-env.sh 192.168.1.100 your_password
```

**What it does**:
- Uploads .env to VPS
- Verifies file creation
- Restarts API service
- Checks service status

**Important**: After running script, SSH into VPS and replace placeholder values:
```bash
ssh root@YOUR_VPS_IP
nano /home/advancia/app/.env
# Replace all YOUR_* values with actual credentials
# Save: Ctrl+X, Y, Enter
pm2 restart advancia-api
```

**Completed**: ❌ Not started

---

## Section 7: Cloudflare Security Configuration (30 min)

**Status**: ⏳ PENDING

**Dashboard**: https://dash.cloudflare.com

**Steps**:
1. [ ] Log in to Cloudflare
2. [ ] Select domain: `advanciapayledger.com`
3. [ ] Go to "SSL/TLS"
4. [ ] Set encryption mode: **Full (strict)**
5. [ ] Go to "Security" → "Bot Management"
6. [ ] Enable "Bot Fight Mode"
7. [ ] Go to "Security" → "Rate limiting"
8. [ ] Create Rule 1:
   - Threshold: 100 requests per 10 seconds
   - Action: Challenge
9. [ ] Create Rule 2:
   - Path: `/api/*`
   - Threshold: 1000 requests per minute
   - Action: Block

**Completed**: ❌ Not started

---

## Section 8: DMARC Configuration (15 min - OPTIONAL)

**Status**: ⏳ PENDING (OPTIONAL)

**Dashboard**: https://dash.cloudflare.com

**Steps**:
1. [ ] Log in to Cloudflare
2. [ ] Select domain: `advanciapayledger.com`
3. [ ] Go to "DNS"
4. [ ] Add TXT record:
   - Name: `_dmarc`
   - Content: `v=DMARC1; p=quarantine; rua=mailto:dmarc@advanciapayledger.com; ruf=mailto:dmarc@advanciapayledger.com; fo=1`
5. [ ] Create email address:
   - Address: `dmarc`
   - Destination: `your-email@example.com`

**Completed**: ❌ Not started

---

## Phase 1 Summary

| Section | Time | Status | Completed |
|---------|------|--------|-----------|
| 1. Cloudflare Pages | 30 min | ⏳ Pending | ❌ |
| 2. Hostinger Redirects | 30 min | ⏳ Pending | ❌ |
| 3. Supabase Auth URLs | 30 min | ⏳ Pending | ❌ |
| 4. Google Cloud OAuth | 30 min | ⏳ Pending | ❌ |
| 5. Email Routing | 30 min | ⏳ Pending | ❌ |
| 6. VPS .env (Automated) | 30 min | ⏳ Pending | ❌ |
| 7. Security Config | 30 min | ⏳ Pending | ❌ |
| 8. DMARC (Optional) | 15 min | ⏳ Pending | ❌ |
| **Total** | **2-3 hours** | **Ready** | **0/8** |

---

## Next Steps

1. **Start with Section 1**: Open https://dash.cloudflare.com
2. **Follow the checklist** for each section in order
3. **Update this tracker** as you complete each section
4. **After all sections**: Run Phase 2 verification

---

## Important Notes

- **DNS Propagation**: May take 5-30 minutes globally
- **SSL Certificates**: Issued automatically by Cloudflare (5-10 min)
- **Placeholder Values**: Must be replaced in Section 6 .env file
- **Email Routing**: Test with actual email to verify working

---

**Begin Section 1 now: https://dash.cloudflare.com**

