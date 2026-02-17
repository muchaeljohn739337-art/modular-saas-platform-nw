# Advancia PayLedger - Multi-Cloud Mock Deployment Guide

## 🎯 Overview

This guide covers deploying the Advancia PayLedger platform with mock data to multiple cloud providers:
- **Frontend**: Vercel (Edge CDN)
- **Backend**: Cloudflare Workers (Edge Computing)
- **Domains**: advanciapayledger.com & advancia.us

## 🚀 Quick Deployment

### Step 1: Deploy Frontend to Vercel

#### Windows (PowerShell)
```powershell
cd frontend\scripts
.\deploy-vercel-mock.ps1
```

#### Linux/Mac (Bash)
```bash
cd frontend/scripts
chmod +x deploy-vercel-mock.sh
./deploy-vercel-mock.sh
```

### Step 2: Deploy Backend to Cloudflare Workers

#### Windows (PowerShell)
```powershell
cd backend-api\cloudflare-workers
wrangler login
wrangler deploy
```

#### Linux/Mac (Bash)
```bash
cd backend-api/cloudflare-workers
chmod +x deploy-mock.sh
./deploy-mock.sh
```

## 📋 Prerequisites

### Required Tools
- **Node.js** 18+
- **Vercel CLI**: `npm install -g vercel`
- **Wrangler CLI**: `npm install -g wrangler`
- **Git**: For version control

### Domain Requirements
- **advanciapayledger.com** - Primary domain
- **advancia.us** - Secondary domain
- **api.advanciapayledger.com** - Backend API domain

## 🔧 Configuration Details

### Frontend Configuration (Vercel)

#### Environment Variables
```env
# Vercel Production Environment
NEXT_PUBLIC_API_URL=https://advanciapayledger-api.workers.dev/api
NEXT_PUBLIC_APP_URL=https://advanciapayledger.vercel.app
NEXT_PUBLIC_APP_URL_ALT=https://advanciapayledger-demo.vercel.app
NEXT_PUBLIC_ENABLE_MOCK_DATA=true
NEXT_PUBLIC_MOCK_MODE=true
NEXT_PUBLIC_ENV=production
```

#### Vercel Configuration
```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

### Backend Configuration (Cloudflare Workers)

#### Wrangler Configuration
```toml
name = "advanciapayledger-api"
main = "src/index.js"
compatibility_date = "2024-01-01"

[vars]
MOCK_MODE = "true"
ENVIRONMENT = "production"
CORS_ORIGINS = "https://advanciapayledger.vercel.app,https://advanciapayledger-demo.vercel.app"

[[routes]]
pattern = "api.advanciapayledger.com/*"
zone_name = "advanciapayledger.com"
```

## 🌐 Access Points

### Frontend URLs
- **Primary**: `https://advanciapayledger.vercel.app`
- **Demo**: `https://advanciapayledger-demo.vercel.app`
- **Custom**: `https://advanciapayledger.com`

### Backend URLs
- **Workers**: `https://advanciapayledger-api.workers.dev`
- **Custom**: `https://api.advanciapayledger.com`

## 📱 Mock Data Features

### Authentication
- **Login**: `admin@demo.com` / `demo123`
- **Registration**: Any email/password combination
- **Tokens**: Mock JWT tokens with 1-hour expiry

### Wallet Features
- **Balances**: USD, USDC, ETH mock balances
- **Transactions**: Mock payment history
- **Addresses**: Mock blockchain addresses

### Payment Processing
- **Methods**: Crypto, card, bank transfer
- **Status**: pending, completed, failed
- **Providers**: Mock healthcare providers

### Crypto Prices
- **Supported**: BTC, ETH, USDC, USDT, MATIC, SOL
- **Updates**: Mock price changes
- **Real-time**: Simulated real-time data

## 🔍 Testing

### Frontend Tests
```bash
# Test frontend deployment
curl https://advanciapayledger.vercel.app

# Test API connectivity
curl https://advanciapayledger.vercel.app/api/health
```

### Backend Tests
```bash
# Test health endpoint
curl https://advanciapayledger-api.workers.dev/health

# Test authentication
curl -X POST https://advanciapayledger-api.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"demo123"}'

# Test wallet balances
curl https://advanciapayledger-api.workers.dev/api/wallet/balances \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Integration Tests
```bash
# Test full flow
# 1. Login to get token
TOKEN=$(curl -s -X POST https://advanciapayledger-api.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"demo123"}' | \
  jq -r '.data.tokens.accessToken')

# 2. Get wallet data
curl https://advanciapayledger-api.workers.dev/api/wallet/balances \
  -H "Authorization: Bearer $TOKEN"

# 3. Get dashboard data
curl https://advanciapayledger-api.workers.dev/api/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

## 📊 Monitoring

### Vercel Analytics
- **Page Views**: Track frontend usage
- **Performance**: Monitor load times
- **Errors**: Frontend error tracking

### Cloudflare Analytics
- **Requests**: API request metrics
- **Latency**: Response time tracking
- **Errors**: Backend error monitoring

## 🔒 Security Features

### CORS Configuration
```javascript
// Cloudflare Workers CORS
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
};
```

### Rate Limiting
- **Vercel**: Built-in rate limiting
- **Cloudflare**: DDoS protection
- **Custom**: API rate limiting

### Authentication
- **Mock JWT**: Token-based authentication
- **Authorization**: Bearer token required
- **Session Management**: Mock session handling

## 🚀 Performance

### Frontend Optimization
- **Edge CDN**: Global content delivery
- **Static Assets**: Optimized images and scripts
- **Caching**: Browser and CDN caching

### Backend Optimization
- **Edge Computing**: Global serverless deployment
- **Cold Starts**: Optimized worker startup
- **Caching**: KV store for frequently accessed data

## 🔄 Updates and Maintenance

### Frontend Updates
```bash
# Update frontend
cd frontend
npm run build
vercel --prod
```

### Backend Updates
```bash
# Update backend
cd cloudflare-workers
wrangler deploy
```

### Configuration Updates
```bash
# Update environment variables
wrangler secret put API_KEY
wrangler secret put DATABASE_URL
```

## 🆘 Troubleshooting

### Common Issues

#### Frontend Not Loading
```bash
# Check Vercel deployment
vercel logs

# Check build errors
npm run build
```

#### Backend API Errors
```bash
# Check Cloudflare Workers logs
wrangler tail

# Test deployment
curl https://advanciapayledger-api.workers.dev/health
```

#### CORS Issues
```bash
# Check CORS headers
curl -I https://advanciapayledger-api.workers.dev/api/auth/login

# Test OPTIONS request
curl -X OPTIONS https://advanciapayledger-api.workers.dev/api/auth/login
```

### Debug Commands
```bash
# Frontend debug
vercel logs --follow

# Backend debug
wrangler tail

# Network debug
curl -v https://advanciapayledger-api.workers.dev/health
```

## 📞 Support

### Documentation
- **Vercel Docs**: https://vercel.com/docs
- **Cloudflare Docs**: https://developers.cloudflare.com/workers
- **Project Docs**: https://docs.advanciapayledger.com

### Contact
- **Email**: support@advanciapayledger.com
- **GitHub**: https://github.com/advanciapayledger/issues
- **Discord**: https://discord.gg/advanciapayledger

---

## 🎉 Success Criteria

✅ **Frontend deployed to Vercel**
✅ **Backend deployed to Cloudflare Workers**
✅ **Mock data fully functional**
✅ **Multi-domain support working**
✅ **CORS properly configured**
✅ **Authentication flow working**
✅ **API endpoints responding**
✅ **Frontend-backend integration complete**

## 🚀 Next Steps

1. **Configure Custom Domains**
   - Set up DNS records
   - Configure SSL certificates
   - Test domain propagation

2. **Enhance Mock Data**
   - Add more realistic data
   - Implement data relationships
   - Add edge cases and error scenarios

3. **Add Monitoring**
   - Set up error tracking
   - Configure performance monitoring
   - Implement alerting

4. **Scale Up**
   - Add more features
   - Implement real database
   - Add real blockchain integration

Your Advancia PayLedger platform is now running on multiple cloud providers with full mock data support! 🎉
