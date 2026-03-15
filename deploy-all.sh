#!/bin/bash

# Complete Production Deployment Automation Script
# This script orchestrates the entire deployment process
# Usage: ./deploy-all.sh <VPS_IP> [VPS_PASSWORD]

set -e

VPS_IP=${1:-}
VPS_PASSWORD=${2:-}

if [ -z "$VPS_IP" ]; then
    echo "Usage: ./deploy-all.sh <VPS_IP> [VPS_PASSWORD]"
    echo "Example: ./deploy-all.sh 192.168.1.100 your_password"
    exit 1
fi

echo "=========================================="
echo "Advancia PayLedger - Complete Deployment"
echo "=========================================="
echo ""
echo "This script will:"
echo "  1. Set up VPS environment variables"
echo "  2. Restart API services"
echo "  3. Run verification tests"
echo "  4. Generate deployment report"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo ""
echo "=========================================="
echo "STEP 1: VPS Environment Setup"
echo "=========================================="
echo ""

# Create temporary .env file
ENV_FILE="/tmp/advancia.env"

cat > "$ENV_FILE" << 'EOF'
# ============================================================================
# FRONTEND CONFIGURATION
# ============================================================================
FRONTEND_URL=https://advanciapayledger.com
HEALTHCARE_URL=https://advancia-healthcare.com
NODE_ENV=production
PORT=3001

# ============================================================================
# CORS CONFIGURATION
# ============================================================================
CORS_ORIGINS=https://advanciapayledger.com,https://www.advanciapayledger.com,https://advancia-healthcare.com,https://www.advancia-healthcare.com,https://api.advanciapayledger.com

# ============================================================================
# DATABASE CONFIGURATION (Supabase PostgreSQL)
# ============================================================================
DATABASE_URL=postgresql://postgres.jwabwrcykdtpwdhwhmqq:YOUR_DATABASE_PASSWORD@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
DATABASE_DIRECT_URL=postgresql://postgres:YOUR_DATABASE_PASSWORD@db.jwabwrcykdtpwdhwhmqq.supabase.co:5432/postgres

# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================
SUPABASE_URL=https://jwabwrcykdtpwdhwhmqq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3YWJ3cmN5a2R0cHdkaHdobXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTI3NTQsImV4cCI6MjA4NTEyODc1NH0.wk7Ok5i8O4eigd7iYhb-LwR48-B9QpKuRPi5GZfGWwk
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# ============================================================================
# AUTHENTICATION
# ============================================================================
JWT_SECRET=YOUR_JWT_SECRET_MIN_32_CHARS
JWT_REFRESH_SECRET=YOUR_REFRESH_SECRET_MIN_32_CHARS
JWT_EXPIRES_IN=7d

# ============================================================================
# STRIPE CONFIGURATION
# ============================================================================
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET

# ============================================================================
# EMAIL SERVICE (Resend)
# ============================================================================
RESEND_API_KEY=YOUR_RESEND_API_KEY
RESEND_FROM_EMAIL=noreply@advanciapayledger.com

# ============================================================================
# SMS SERVICE (Twilio)
# ============================================================================
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=+1YOUR_TWILIO_PHONE_NUMBER

# ============================================================================
# CACHING (Upstash Redis)
# ============================================================================
UPSTASH_REDIS_URL=redis://default:YOUR_UPSTASH_PASSWORD@YOUR_UPSTASH_HOST:YOUR_UPSTASH_PORT
UPSTASH_REDIS_TOKEN=YOUR_UPSTASH_TOKEN

# ============================================================================
# ERROR TRACKING (Sentry)
# ============================================================================
SENTRY_DSN=https://YOUR_SENTRY_KEY@YOUR_SENTRY_DOMAIN.ingest.sentry.io/YOUR_PROJECT_ID
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# ============================================================================
# SECURITY
# ============================================================================
TRUST_PROXY=1
ENCRYPTION_KEY=YOUR_64_HEX_CHARACTER_ENCRYPTION_KEY

# ============================================================================
# LOGGING
# ============================================================================
LOG_LEVEL=info

# ============================================================================
# FEATURE FLAGS
# ============================================================================
ENABLE_STRIPE_PAYMENTS=true
ENABLE_ACH_PAYMENTS=true
ENABLE_CRYPTO_PAYMENTS=false
ENABLE_REAL_TIME_NOTIFICATIONS=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=true
EOF

echo "Uploading .env to VPS..."
if command -v sshpass &> /dev/null; then
    sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no "$ENV_FILE" root@$VPS_IP:/home/advancia/app/.env
else
    scp -o StrictHostKeyChecking=no "$ENV_FILE" root@$VPS_IP:/home/advancia/app/.env
fi

echo "✓ .env uploaded"

echo ""
echo "=========================================="
echo "STEP 2: Restarting API Services"
echo "=========================================="
echo ""

if command -v sshpass &> /dev/null; then
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no root@$VPS_IP "pm2 restart advancia-api && sleep 3 && pm2 status"
else
    ssh -o StrictHostKeyChecking=no root@$VPS_IP "pm2 restart advancia-api && sleep 3 && pm2 status"
fi

echo "✓ Services restarted"

echo ""
echo "=========================================="
echo "STEP 3: Running Verification Tests"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

# Test endpoints
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Testing $name... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $response)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $response)"
        ((FAILED++))
    fi
}

test_endpoint "PayLedger App" "https://advanciapayledger.com" "200"
test_endpoint "Healthcare App" "https://advancia-healthcare.com" "200"
test_endpoint "API Health" "https://api.advanciapayledger.com/health" "200"
test_endpoint "Supabase Connection" "https://jwabwrcykdtpwdhwhmqq.supabase.co/rest/v1/" "200"

echo ""
echo "--- REDIRECT TEST ---"
echo -n "Testing old domain redirect... "
redirect_response=$(curl -s -L -o /dev/null -w "%{url_effective}" "https://advanciapayroll.com" 2>/dev/null || echo "")
if [[ "$redirect_response" == *"advanciapayledger.com"* ]]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

echo ""
echo "=========================================="
echo "DEPLOYMENT REPORT"
echo "=========================================="
echo ""
echo "Tests Passed: ${GREEN}$PASSED${NC}"
echo "Tests Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ DEPLOYMENT SUCCESSFUL!${NC}"
    echo ""
    echo "Your Advancia PayLedger platform is now live!"
    echo ""
    echo "Production URLs:"
    echo "  - PayLedger: https://advanciapayledger.com"
    echo "  - Healthcare: https://advancia-healthcare.com"
    echo "  - API: https://api.advanciapayledger.com"
    echo ""
    echo "Next steps:"
    echo "  1. Monitor error logs: pm2 logs advancia-api"
    echo "  2. Enable Sentry alerts"
    echo "  3. Set up Grafana dashboards"
    echo "  4. Begin customer onboarding"
    echo ""
    exit 0
else
    echo -e "${RED}✗ DEPLOYMENT INCOMPLETE${NC}"
    echo ""
    echo "Issues found:"
    echo "  - Check VPS connectivity"
    echo "  - Verify all environment variables are correct"
    echo "  - Check API logs: pm2 logs advancia-api"
    echo ""
    exit 1
fi
