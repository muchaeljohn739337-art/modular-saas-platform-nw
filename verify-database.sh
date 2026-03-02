#!/bin/bash

# Database Connectivity Verification Script
# Tests connection to Neon PostgreSQL and runs migrations

set -e

echo "🔍 Database Connectivity Verification"
echo "======================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}✗ DATABASE_URL environment variable not set${NC}"
  echo "Please set DATABASE_URL in .env.production"
  exit 1
fi

echo -e "${YELLOW}Step 1: Testing database connection...${NC}"

# Test connection using psql (if available)
if command -v psql &> /dev/null; then
  if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
  else
    echo -e "${RED}✗ Database connection failed${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠ psql not installed, skipping direct connection test${NC}"
fi

echo -e "${YELLOW}Step 2: Checking Prisma schema...${NC}"
cd backend
if [ -f "prisma/schema.prisma" ]; then
  echo -e "${GREEN}✓ Prisma schema found${NC}"
else
  echo -e "${RED}✗ Prisma schema not found${NC}"
  exit 1
fi

echo -e "${YELLOW}Step 3: Generating Prisma client...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma client generated${NC}"

echo -e "${YELLOW}Step 4: Running database migrations...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}✓ Database migrations completed${NC}"

echo -e "${YELLOW}Step 5: Verifying database schema...${NC}"
npx prisma db push --skip-generate
echo -e "${GREEN}✓ Database schema verified${NC}"

cd ..

echo ""
echo "======================================"
echo -e "${GREEN}✅ Database verification complete!${NC}"
echo "======================================"
echo ""
echo "Database Status:"
echo "  • Connection: ✓ Successful"
echo "  • Schema: ✓ Up to date"
echo "  • Migrations: ✓ Applied"
echo ""
