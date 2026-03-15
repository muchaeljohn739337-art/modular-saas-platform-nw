#!/bin/bash

# Phase 2: Deployment Verification Script
# This script runs all verification commands to test your production deployment
# Usage: ./verify-deployment.sh

set -e

echo "=========================================="
echo "Phase 2: Deployment Verification"
echo "=========================================="
echo ""
echo "Testing all production endpoints..."
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $response)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $response)"
        return 1
    fi
}

# Track results
PASSED=0
FAILED=0

echo "--- FRONTEND DOMAINS ---"
if test_endpoint "PayLedger App" "https://advanciapayledger.com" "200"; then
    ((PASSED++))
else
    ((FAILED++))
fi

if test_endpoint "Healthcare App" "https://advancia-healthcare.com" "200"; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""
echo "--- API ENDPOINTS ---"
if test_endpoint "API Health" "https://api.advanciapayledger.com/health" "200"; then
    ((PASSED++))
else
    ((FAILED++))
fi

if test_endpoint "Supabase Connection" "https://jwabwrcykdtpwdhwhmqq.supabase.co/rest/v1/" "200"; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""
echo "--- REDIRECTS ---"
echo -n "Testing old domain redirect... "
redirect_response=$(curl -s -L -o /dev/null -w "%{url_effective}" "https://advanciapayroll.com" 2>/dev/null || echo "")
if [[ "$redirect_response" == *"advanciapayledger.com"* ]]; then
    echo -e "${GREEN}✓ PASS${NC} (Redirects to: $redirect_response)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Redirect not working)"
    ((FAILED++))
fi

echo ""
echo "--- SSL CERTIFICATES ---"
echo -n "Checking SSL certificate... "
ssl_check=$(echo | openssl s_client -servername advanciapayledger.com -connect advanciapayledger.com:443 2>/dev/null | grep -c "Verify return code: 0" || echo "0")
if [ "$ssl_check" -gt 0 ]; then
    echo -e "${GREEN}✓ PASS${NC} (Certificate valid)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (Could not verify certificate)"
fi

echo ""
echo "--- SUMMARY ---"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Ready for Phase 3.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Check configuration and try again.${NC}"
    exit 1
fi
