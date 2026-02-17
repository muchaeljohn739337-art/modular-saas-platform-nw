# 🔧 CLOUDFLARE PAGES BUILD CONFIGURATION

## 📋 **Optimal Build Settings for Advancia PayLedger**

### **🎯 Framework Preset**
**Select**: `Next.js (Static Export)` or `React`

**If Next.js preset not available**: Use `None` and configure manually

### **🔧 Build Command**
```bash
# For Next.js Static Export
npm run build && npm run export

# Alternative for standard Next.js build
npm run build

# For development build
npm run build:production
```

### **📁 Build Output Directory**
```
# For Next.js Static Export
out

# For standard Next.js build
.next

# For Vite/React build
dist

# For Create React App
build
```

### **🌳 Root Directory**
```
# If frontend is in subdirectory
frontend

# If in root directory
/ (leave blank)
```

### **🔧 Environment Variables**
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com
NEXT_PUBLIC_WORKERS_URL=https://advancia-payledger-api.advancia-platform.workers.dev

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://advanciapayledger.com
NEXT_PUBLIC_DOCS_URL=https://docs.advanciapayledger.com

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_MONITORING=true

# Healthcare/Compliance
NEXT_PUBLIC_HIPAA_MODE=true
NEXT_PUBLIC_PRIVACY_LEVEL=maximum

# Development/Production
NODE_ENV=production
NEXT_PUBLIC_ENV=production
```

## 🚀 **Complete Configuration Example**

### **Option 1: Next.js Static Export (Recommended)**
```
Framework Preset: Next.js (Static Export)
Build Command: npm run build && npm run export
Build Output Directory: out
Root Directory: frontend
Environment Variables: [see above]
```

### **Option 2: Manual Configuration**
```
Framework Preset: None
Build Command: npm run build && npm run export
Build Output Directory: out
Root Directory: frontend
Environment Variables: [see above]
```

### **Option 3: Standard Next.js**
```
Framework Preset: Next.js
Build Command: npm run build
Build Output Directory: .next
Root Directory: frontend
Environment Variables: [see above]
```

## 📝 **Package.json Scripts Needed**

### **Add these scripts to your frontend/package.json:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "export": "next export",
    "build:production": "next build && next export",
    "build:static": "next build && next export",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### **Next.js Configuration (next.config.js):**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://advanciapayledger.com' 
    : undefined,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  }
}

module.exports = nextConfig
```

## 🔧 **Advanced Configuration**

### **Build Hooks (if needed):**
```bash
# Pre-build hook
npm install && npm run audit

# Post-build hook
npm run optimize && npm run deploy:static
```

### **Node.js Version:**
```
Node.js Version: 18.x or 20.x
```

### **Build Timeout:**
```
Build Timeout: 15 minutes (for large builds)
```

## 🌐 **Custom Domain Configuration**

### **After Build Setup:**
1. **Add Custom Domain**: `advanciapayledger.com`
2. **Add API Domain**: `api.advanciapayledger.com`
3. **Configure DNS**: Point to Cloudflare Pages
4. **SSL Certificate**: Auto-provisioned by Cloudflare

## 📊 **Build Process Flow**

### **What Happens During Build:**
1. **Install Dependencies**: `npm install`
2. **Run Build Command**: `npm run build && npm run export`
3. **Output Directory**: Static files generated in `out/`
4. **Deploy**: Files deployed to Cloudflare edge network
5. **Domain Mapping**: Custom domains configured
6. **SSL Setup**: HTTPS certificates provisioned

### **Expected Output Structure:**
```
out/
├── index.html
├── _next/
│   ├── static/
│   └── ...
├── api/
├── dashboard/
├── admin/
└── ...
```

## 🚀 **Verification Steps**

### **After Build Configuration:**
1. **Trigger Build**: Push to main branch or manual deploy
2. **Check Build Logs**: Verify no errors
3. **Test Deployment**: Visit deployed URL
4. **Verify API Integration**: Test frontend-backend connection
5. **Check Custom Domains**: Ensure proper routing

### **Test Commands:**
```bash
# Test build locally
cd frontend
npm run build && npm run export

# Verify output
ls -la out/

# Test locally
npx serve out -p 3000
```

## 🎯 **Production Optimization**

### **Build Optimizations:**
- **Static Generation**: Pre-build all pages
- **Image Optimization**: Disable for static export
- **Bundle Analysis**: Monitor bundle size
- **Compression**: Automatic via Cloudflare

### **Performance Settings:**
- **Edge Caching**: Automatic
- **Compression**: Brotli/Gzip
- **HTTP/3**: Enabled
- **CDN**: Global edge network

---

## 📋 **Quick Setup Checklist**

### **Before Build:**
- [ ] Update package.json with build scripts
- [ ] Configure next.config.js for static export
- [ ] Set environment variables
- [ ] Test build locally

### **Cloudflare Pages Setup:**
- [ ] Select framework preset (Next.js or None)
- [ ] Set build command: `npm run build && npm run export`
- [ ] Set output directory: `out`
- [ ] Set root directory: `frontend`
- [ ] Add environment variables
- [ ] Configure custom domains

### **After Build:**
- [ ] Verify deployment success
- [ ] Test all pages and routes
- [ ] Check API connectivity
- [ ] Monitor performance metrics
- [ ] Set up monitoring alerts

---

## 🎉 **Expected Result**

**After configuration, your Advancia PayLedger will:**
- ✅ Build automatically on code changes
- ✅ Deploy to global edge network
- ✅ Serve from custom domains
- ✅ Have <50ms global response times
- ✅ Include proper environment variables
- ✅ Connect to AI-generated backend API

**Your frontend will be fully integrated with your AI-powered backend!**
