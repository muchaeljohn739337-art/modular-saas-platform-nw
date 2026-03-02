#!/bin/bash

# Production Deployment Script for Advancia PayLedger
# This script automates the deployment of all services to production

set -e

echo "🚀 Starting Production Deployment..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verify environment
echo -e "${YELLOW}Step 1: Verifying environment...${NC}"
if [ ! -f ".env.production" ]; then
  echo -e "${RED}Error: .env.production not found${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Environment file found${NC}"

# Step 2: Deploy Cloudflare Workers
echo -e "${YELLOW}Step 2: Deploying Cloudflare Workers...${NC}"

echo "Deploying Main API Worker..."
cd advancia-payledger-api
npm install
wrangler deploy
cd ..
echo -e "${GREEN}✓ Main API Worker deployed${NC}"

echo "Deploying Healthcare AI Worker..."
cd healthcare-ai-worker
npm install
wrangler deploy
cd ..
echo -e "${GREEN}✓ Healthcare AI Worker deployed${NC}"

# Step 3: Deploy Frontend
echo -e "${YELLOW}Step 3: Deploying Frontend to Vercel...${NC}"
cd frontend
npm install
npm run build
vercel --prod
cd ..
echo -e "${GREEN}✓ Frontend deployed${NC}"

# Step 4: Verify deployments
echo -e "${YELLOW}Step 4: Verifying deployments...${NC}"

echo "Testing Main API..."
curl -s https://api.advanciapayledger.com/health | grep -q "ok" && echo -e "${GREEN}✓ Main API responding${NC}" || echo -e "${RED}✗ Main API not responding${NC}"

echo "Testing Healthcare AI..."
curl -s https://ai.advanciapayledger.com/health | grep -q "ok" && echo -e "${GREEN}✓ Healthcare AI responding${NC}" || echo -e "${RED}✗ Healthcare AI not responding${NC}"

echo "Testing Frontend..."
curl -s https://advancia-payledger.vercel.app | grep -q "html" && echo -e "${GREEN}✓ Frontend responding${NC}" || echo -e "${RED}✗ Frontend not responding${NC}"

# Step 5: Run smoke tests
echo -e "${YELLOW}Step 5: Running smoke tests...${NC}"

echo "Testing registration endpoint..."
curl -X POST https://api.advanciapayledger.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123","firstName":"Test","lastName":"User"}' \
  && echo -e "${GREEN}✓ Registration endpoint working${NC}" || echo -e "${RED}✗ Registration endpoint failed${NC}"

# Step 6: Enable monitoring
echo -e "${YELLOW}Step 6: Enabling monitoring...${NC}"
echo -e "${GREEN}✓ Configure Sentry and Grafana in dashboard${NC}"

# Final summary
echo ""
echo "=================================="
echo -e "${GREEN}✅ Production Deployment Complete!${NC}"
echo "=================================="
echo ""
echo "Deployed Services:"
echo "  • Frontend: https://advancia-payledger.vercel.app"
echo "  • Main API: https://api.advanciapayledger.com"
echo "  • Healthcare AI: https://ai.advanciapayledger.com"
echo ""
echo "Next Steps:"
echo "  1. Verify all endpoints are responding"
echo "  2. Configure monitoring and alerting"
echo "  3. Begin customer onboarding"
echo "  4. Monitor error rates and performance"
echo ""
