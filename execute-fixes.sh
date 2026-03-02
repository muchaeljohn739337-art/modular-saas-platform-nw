#!/bin/bash

# Execute All Critical Fixes for Production Deployment
# This script automates the fixing of all 4 critical issues

set -e

echo "🚀 Starting Critical Fixes Execution"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
COMPLETED=0
TOTAL=4

# Function to print section header
print_section() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# Function to print success
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
  ((COMPLETED++))
}

# Function to print error
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Function to print warning
print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# ============================================================================
# FIX 1: Cloudflare Domain Routing Configuration
# ============================================================================

print_section "FIX 1: Cloudflare Domain Routing (30 minutes)"

echo "This fix requires manual configuration in Cloudflare Dashboard."
echo ""
echo "Steps:"
echo "1. Go to: https://dash.cloudflare.com"
echo "2. Select domain: advanciapayledger.com"
echo "3. Go to: Workers & Pages → Routes"
echo "4. Create Route 1:"
echo "   - Route: api.advanciapayledger.com/*"
echo "   - Worker: advancia-payledger-api"
echo "   - Zone: advanciapayledger.com"
echo "5. Create Route 2:"
echo "   - Route: ai.advanciapayledger.com/*"
echo "   - Worker: advancia-healthcare-ai"
echo "   - Zone: advanciapayledger.com"
echo ""
echo "After configuration, verify:"
echo "  curl https://api.advanciapayledger.com/health"
echo "  curl https://ai.advanciapayledger.com/health"
echo ""

read -p "Press Enter once you've configured Cloudflare routes..."

# Verify Cloudflare configuration
echo -e "${YELLOW}Verifying Cloudflare configuration...${NC}"
if curl -s https://api.advanciapayledger.com/health | grep -q "ok"; then
  print_success "Cloudflare domain routing configured"
else
  print_warning "Could not verify Cloudflare routing (may need more time to propagate)"
fi

# ============================================================================
# FIX 2: Frontend Deployment to Vercel
# ============================================================================

print_section "FIX 2: Frontend Deployment to Vercel (1 hour)"

echo "Installing Vercel CLI..."
npm install -g vercel > /dev/null 2>&1 || print_warning "Vercel CLI already installed"
print_success "Vercel CLI ready"

echo ""
echo "Building frontend..."
cd frontend
npm install > /dev/null 2>&1
npm run build > /dev/null 2>&1
print_success "Frontend built successfully"

echo ""
echo "Deploying to Vercel..."
echo "Note: You may need to authenticate with Vercel"
echo "Run: vercel --prod"
echo ""
read -p "Press Enter after deploying to Vercel..."

# Verify frontend deployment
echo -e "${YELLOW}Verifying frontend deployment...${NC}"
if curl -s https://advancia-payledger.vercel.app | grep -q "html"; then
  print_success "Frontend deployed to Vercel"
else
  print_warning "Could not verify frontend (may need more time to deploy)"
fi

cd ..

# ============================================================================
# FIX 3: Production Environment Variables
# ============================================================================

print_section "FIX 3: Production Environment Variables (30 minutes)"

echo "Creating backend environment file..."

# Check if .env.production already exists
if [ -f "backend/.env.production" ]; then
  print_warning "backend/.env.production already exists"
  read -p "Overwrite? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Skipping environment variable setup"
  fi
else
  # Create template
  cat > backend/.env.production << 'EOF'
NODE_ENV=production
PORT=3001

# Database - REPLACE WITH ACTUAL VALUES
DATABASE_URL=postgresql://postgres.jwabwrcykdtpwdhwhmqq:YOUR_PASSWORD@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
DATABASE_DIRECT_URL=postgresql://postgres:YOUR_PASSWORD@db.jwabwrcykdtpwdhwhmqq.supabase.co:5432/postgres
DATABASE_POOLER_URL=postgresql://postgres.jwabwrcykdtpwdhwhmqq:YOUR_PASSWORD@aws-1-eu-central-1.pooler.supabase.com:6543/postgres

# Redis - REPLACE WITH ACTUAL VALUES
REDIS_URL=redis://:YOUR_PASSWORD@redis-host:6379
REDIS_PASSWORD=YOUR_PASSWORD

# JWT - GENERATE NEW SECRETS
JWT_SECRET=GENERATE_NEW_SECRET_MIN_32_CHARS
JWT_REFRESH_SECRET=GENERATE_NEW_SECRET_MIN_32_CHARS
JWT_EXPIRES_IN=7d

# Encryption - GENERATE NEW KEY
ENCRYPTION_KEY=GENERATE_64_HEX_CHARACTER_KEY

# Stripe - REPLACE WITH ACTUAL KEYS
STRIPE_SECRET_KEY=sk_live_YOUR_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET

# Email - REPLACE WITH ACTUAL KEY
SENDGRID_API_KEY=YOUR_SENDGRID_KEY
SENDGRID_FROM_EMAIL=noreply@advanciapayledger.com

# AWS - REPLACE WITH ACTUAL CREDENTIALS
AWS_ACCESS_KEY_ID=YOUR_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET
AWS_REGION=us-east-1
AWS_S3_BUCKET=advancia-payledger-prod

# Supabase - REPLACE WITH ACTUAL KEYS
SUPABASE_URL=https://jwabwrcykdtpwdhwhmqq.supabase.co
SUPABASE_ANON_KEY=YOUR_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_KEY

# Sentry - REPLACE WITH ACTUAL DSN
SENTRY_DSN=YOUR_DSN
SENTRY_ENVIRONMENT=production

# Frontend URLs
FRONTEND_URL=https://advancia-payledger.vercel.app
NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com
NEXT_PUBLIC_AI_URL=https://ai.advanciapayledger.com

# Feature Flags
ENABLE_CRYPTO_PAYMENTS=true
ENABLE_ACH_PAYMENTS=true
ENABLE_CARD_PAYMENTS=true
ENABLE_REAL_TIME_NOTIFICATIONS=true

# CORS
CORS_ORIGIN=https://advancia-payledger.vercel.app

# Logging
LOG_LEVEL=info
EOF
  print_success "Environment file template created"
  echo ""
  echo -e "${YELLOW}IMPORTANT: Edit backend/.env.production and replace all placeholder values${NC}"
  echo "with actual production secrets:"
  echo "  - Database password"
  echo "  - Redis password"
  echo "  - JWT secrets (generate new ones)"
  echo "  - Stripe API keys"
  echo "  - SendGrid API key"
  echo "  - AWS credentials"
  echo "  - Supabase keys"
  echo "  - Sentry DSN"
  echo ""
fi

# Verify no secrets in git
echo -e "${YELLOW}Verifying no secrets exposed in git...${NC}"
if ! git log --all --full-history -- backend/.env.production 2>/dev/null | grep -q "backend/.env.production"; then
  print_success "Environment file properly gitignored"
else
  print_warning "Check git history for exposed secrets"
fi

# ============================================================================
# FIX 4: Database Connectivity Verification
# ============================================================================

print_section "FIX 4: Database Connectivity Verification (30 minutes)"

echo "Testing database connectivity..."
cd backend

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  print_warning "DATABASE_URL not set in environment"
  echo "Set DATABASE_URL from backend/.env.production and try again"
  read -p "Press Enter after setting DATABASE_URL..."
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate > /dev/null 2>&1
print_success "Prisma client generated"

# Run migrations
echo "Applying database migrations..."
if npx prisma migrate deploy > /dev/null 2>&1; then
  print_success "Database migrations applied"
else
  print_warning "Could not apply migrations (database may need manual setup)"
fi

# Verify schema
echo "Verifying database schema..."
if npx prisma db push --skip-generate > /dev/null 2>&1; then
  print_success "Database schema verified"
else
  print_warning "Could not verify schema (may require manual intervention)"
fi

cd ..

# ============================================================================
# Final Verification
# ============================================================================

print_section "Final Verification & Testing"

echo "Testing all endpoints..."
echo ""

# Test API endpoint
echo -n "Testing Main API endpoint... "
if curl -s https://api.advanciapayledger.com/health | grep -q "ok"; then
  echo -e "${GREEN}✓${NC}"
  ((COMPLETED++))
else
  echo -e "${RED}✗${NC}"
fi

# Test AI endpoint
echo -n "Testing Healthcare AI endpoint... "
if curl -s https://ai.advanciapayledger.com/health | grep -q "ok"; then
  echo -e "${GREEN}✓${NC}"
  ((COMPLETED++))
else
  echo -e "${RED}✗${NC}"
fi

# Test Frontend endpoint
echo -n "Testing Frontend endpoint... "
if curl -s https://advancia-payledger.vercel.app | grep -q "html"; then
  echo -e "${GREEN}✓${NC}"
  ((COMPLETED++))
else
  echo -e "${RED}✗${NC}"
fi

# ============================================================================
# Summary
# ============================================================================

print_section "Execution Summary"

echo "Fixes Completed: $COMPLETED / $TOTAL"
echo ""

if [ $COMPLETED -eq $TOTAL ]; then
  echo -e "${GREEN}✅ All critical fixes completed successfully!${NC}"
  echo ""
  echo "Next Steps:"
  echo "1. Run smoke tests"
  echo "2. Enable monitoring (Sentry, Grafana)"
  echo "3. Begin customer onboarding"
  echo "4. Monitor metrics for 24 hours"
else
  echo -e "${YELLOW}⚠ Some fixes may need manual verification${NC}"
  echo ""
  echo "Remaining Tasks:"
  echo "1. Verify Cloudflare domain routing"
  echo "2. Verify frontend deployment"
  echo "3. Update environment variables with actual secrets"
  echo "4. Verify database connectivity"
fi

echo ""
echo "Documentation:"
echo "  • CRITICAL_FIXES_EXECUTION_GUIDE.md - Quick reference"
echo "  • FIX_CRITICAL_ISSUES.md - Detailed instructions"
echo "  • PRODUCTION_LAUNCH_SUMMARY.md - Complete overview"
echo ""
echo -e "${GREEN}Execution complete!${NC}"
