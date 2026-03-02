# Cloudflare Workers Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Cloudflare account with Workers enabled
- Wrangler CLI installed (`npm install -g wrangler`)
- API token from Cloudflare dashboard

### Step 1: Authenticate with Cloudflare
```bash
wrangler login
```

### Step 2: Deploy Main API Worker
```bash
cd advancia-payledger-api
wrangler deploy
```

**Expected Output:**
```
✓ Uploaded advancia-payledger-api
✓ Published to https://advancia-payledger-api.advancia-platform.workers.dev
```

### Step 3: Deploy Healthcare AI Worker
```bash
cd ../healthcare-ai-worker
wrangler deploy
```

**Expected Output:**
```
✓ Uploaded advancia-healthcare-ai
✓ Published to https://advancia-healthcare-ai.advancia-platform.workers.dev
```

---

## 🔧 Configure Custom Domains

### In Cloudflare Dashboard:

1. **Go to Workers Routes**
   - Navigate to: Workers & Pages → Routes

2. **Add Route for Main API**
   - Pattern: `api.advanciapayledger.com/*`
   - Worker: `advancia-payledger-api`
   - Zone: `advanciapayledger.com`

3. **Add Route for AI Service**
   - Pattern: `ai.advanciapayledger.com/*`
   - Worker: `advancia-healthcare-ai`
   - Zone: `advanciapayledger.com`

4. **Verify Routes**
   - Test: `curl https://api.advanciapayledger.com/health`
   - Test: `curl https://ai.advanciapayledger.com/health`

---

## 📝 Environment Variables

Create `wrangler.toml` in each worker directory:

### advancia-payledger-api/wrangler.toml
```toml
name = "advancia-payledger-api"
compatibility_date = "2026-02-21"
main = "src/index.js"

[env.production]
routes = [
  { pattern = "api.advanciapayledger.com/*", zone_name = "advanciapayledger.com" }
]

[env.staging]
routes = [
  { pattern = "staging-api.advanciapayledger.com/*", zone_name = "advanciapayledger.com" }
]
```

### healthcare-ai-worker/wrangler.toml
```toml
name = "advancia-healthcare-ai"
compatibility_date = "2025-07-18"
main = "src/index.js"

[env.production]
routes = [
  { pattern = "ai.advanciapayledger.com/*", zone_name = "advanciapayledger.com" }
]

[env.staging]
routes = [
  { pattern = "staging-ai.advanciapayledger.com/*", zone_name = "advanciapayledger.com" }
]
```

---

## ✅ Verification Checklist

- [ ] Workers deployed successfully
- [ ] Custom domains configured
- [ ] Health endpoints responding
- [ ] CORS headers configured
- [ ] Error handling working
- [ ] Performance acceptable

---

## 🚨 Troubleshooting

### Issue: 404 on custom domain
**Solution**: Verify route configuration in Cloudflare dashboard

### Issue: CORS errors
**Solution**: Check CORS headers in worker code

### Issue: Slow response times
**Solution**: Check worker CPU time, optimize code

---

## 📊 Monitoring

Monitor worker performance in Cloudflare dashboard:
- Workers Analytics
- Error rates
- Request latency
- CPU time usage

