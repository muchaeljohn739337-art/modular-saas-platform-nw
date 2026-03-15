# Phase 1 Quick Start - Execute Now

**Status**: Ready for immediate execution  
**Time**: 2-3 hours  
**Sections**: 8 (7 manual + 1 automated)

---

## Section 1: Cloudflare Pages (30 min) - START NOW

**Dashboard**: https://dash.cloudflare.com

**Quick Steps**:
1. Log in
2. Select: `advanciapayledger.com`
3. Click: Workers & Pages → Pages → Custom domains
4. Add domain: `advancia-healthcare.com`
5. Verify DNS → Activate
6. Test: `curl -I https://advancia-healthcare.com` (should be 200)

**When done**: Reply with "Section 1 complete"

---

## Section 2: Hostinger Redirects (30 min)

**Dashboard**: https://hpanel.hostinger.com

**Quick Steps**:
1. Log in
2. Select: `advanciapayroll.com`
3. DNS/Nameservers → Redirects
4. Add: `advanciapayroll.com` → `https://advanciapayledger.com` (301)
5. Add: `www.advanciapayroll.com` → `https://advanciapayledger.com` (301)
6. Test: `curl -L -I https://advanciapayroll.com`

**When done**: Reply with "Section 2 complete"

---

## Section 3: Supabase Auth URLs (30 min)

**Dashboard**: https://app.supabase.com | Project: `advancia-payledger`

**Quick Steps**:
1. Log in
2. Authentication → URL Configuration
3. Site URL: `https://advanciapayledger.com`
4. Add 8 Redirect URLs:
   - `https://advanciapayledger.com/auth/callback`
   - `https://advanciapayledger.com/auth/confirm`
   - `https://advancia-healthcare.com/auth/callback`
   - `https://advancia-healthcare.com/auth/confirm`
   - `https://api.advanciapayledger.com/auth/callback`
   - `http://localhost:5173/auth/callback`
   - `http://localhost:5174/auth/callback`
   - `http://localhost:3000/auth/callback`

**When done**: Reply with "Section 3 complete"

---

## Section 4: Google Cloud OAuth (30 min)

**Dashboard**: https://console.cloud.google.com

**Quick Steps**:
1. Log in
2. APIs & Services → Credentials
3. Edit OAuth 2.0 Client ID
4. Add 8 JavaScript Origins:
   - `https://advanciapayledger.com`
   - `https://www.advanciapayledger.com`
   - `https://advancia-healthcare.com`
   - `https://www.advancia-healthcare.com`
   - `https://api.advanciapayledger.com`
   - `http://localhost:5173`
   - `http://localhost:5174`
   - `http://localhost:3000`
5. Add 6 Redirect URIs:
   - `https://jwabwrcykdtpwdhwhmqq.supabase.co/auth/v1/callback`
   - `https://advanciapayledger.com/auth/callback`
   - `https://advancia-healthcare.com/auth/callback`
   - `http://localhost:5173/auth/callback`
   - `http://localhost:5174/auth/callback`
   - `http://localhost:3000/auth/callback`

**When done**: Reply with "Section 4 complete"

---

## Section 5: Email Routing (30 min)

**Dashboard**: https://dash.cloudflare.com

**Quick Steps**:
1. Log in
2. Select: `advanciapayledger.com`
3. Email Routing → Enable
4. Create address: `support` → `your-email@example.com`
5. Test: Send email to `support@advanciapayledger.com`

**When done**: Reply with "Section 5 complete"

---

## Section 6: VPS .env Setup (30 min) - AUTOMATED

**Run this command**:
```bash
chmod +x setup-vps-env.sh
./setup-vps-env.sh <YOUR_VPS_IP> <YOUR_VPS_PASSWORD>
```

**Then manually replace placeholder values**:
```bash
ssh root@YOUR_VPS_IP
nano /home/advancia/app/.env
# Replace all YOUR_* values with actual credentials
# Save: Ctrl+X, Y, Enter
pm2 restart advancia-api
```

**When done**: Reply with "Section 6 complete"

---

## Section 7: Security Config (30 min)

**Dashboard**: https://dash.cloudflare.com

**Quick Steps**:
1. Log in
2. Select: `advanciapayledger.com`
3. SSL/TLS → Set to: **Full (strict)**
4. Security → Bot Management → Enable
5. Security → Rate limiting:
   - Rule 1: 100 req/10s → Challenge
   - Rule 2: `/api/*` 1000 req/min → Block

**When done**: Reply with "Section 7 complete"

---

## Section 8: DMARC (15 min) - OPTIONAL

**Dashboard**: https://dash.cloudflare.com

**Quick Steps**:
1. Log in
2. Select: `advanciapayledger.com`
3. DNS → Add TXT record:
   - Name: `_dmarc`
   - Content: `v=DMARC1; p=quarantine; rua=mailto:dmarc@advanciapayledger.com; ruf=mailto:dmarc@advanciapayledger.com; fo=1`
4. Email Routing → Create: `dmarc` → `your-email@example.com`

**When done**: Reply with "Section 8 complete" (or skip if optional)

---

## Phase 1 Complete

Once all 8 sections are done, reply: **"Phase 1 complete"**

Then I'll run Phase 2 verification automatically.

---

**START NOW: Open https://dash.cloudflare.com and begin Section 1**

