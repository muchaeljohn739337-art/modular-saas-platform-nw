# 🌐 DNS Records Required - Action Needed

## **⚡ IMMEDIATE ACTION REQUIRED**

You need to add the following DNS records in your domain registrar:

---

## **Domain: advancia.us**

### **Root Domain**
```
Type: A Record
Name: @
Value: 192.0.2.1
TTL: 3600
```

### **WWW Subdomain**
```
Type: CNAME
Name: www
Value: advancia.us
TTL: 3600
```

### **API Subdomain**
```
Type: CNAME
Name: api
Value: advancia-payledger-backend.advancia-platform.workers.dev
TTL: 3600
```

---

## **Domain: advanciapayledger.com**

### **Root Domain**
```
Type: A Record
Name: @
Value: 192.0.2.1
TTL: 3600
```

### **WWW Subdomain**
```
Type: CNAME
Name: www
Value: advanciapayledger.com
TTL: 3600
```

### **API Subdomain**
```
Type: CNAME
Name: api
Value: advancia-payledger-backend.advancia-platform.workers.dev
TTL: 3600
```

---

## **🔧 What I've Configured**

### **Backend Updates**
✅ Updated `wrangler.toml` with both domains
✅ Deployed new configuration to Cloudflare Workers
✅ Backend now serves both domains

### **Frontend Updates**
✅ Updated `next.config.js` with new domain URLs
✅ Updated wallet demo API configuration
✅ Frontend ready for `advancia.us`

---

## **🎯 Next Steps**

### **1. Add DNS Records**
Add the records above to your domain registrar:
- GoDaddy, Namecheap, Cloudflare, etc.
- Add all A and CNAME records
- Save changes

### **2. Wait for Propagation**
DNS changes take 5-15 minutes to propagate globally.

### **3. Test Configuration**
After DNS propagation, test:
```bash
# Test new domains
curl https://advancia.us
curl https://api.advancia.us/health
curl https://advanciapayledger.com
curl https://api.advanciapayledger.com/health
```

---

## **📋 Implementation Status**

- [x] Backend configured for both domains
- [x] Frontend configured for new domains
- [ ] **DNS records added by you**
- [ ] DNS propagation verified
- [ ] Full end-to-end testing

---

**Priority**: 🔴 **HIGH** - Add DNS records to complete setup
