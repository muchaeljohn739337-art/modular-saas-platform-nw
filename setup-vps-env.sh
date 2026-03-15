#!/bin/bash

# VPS Environment Setup Script - Phase 1 Section 6
# This script automates the production .env configuration on your VPS
# Usage: ./setup-vps-env.sh <VPS_IP> <VPS_PASSWORD>

set -e

VPS_IP=${1:-}
VPS_PASSWORD=${2:-}

if [ -z "$VPS_IP" ]; then
    echo "Usage: ./setup-vps-env.sh <VPS_IP> <VPS_PASSWORD>"
    echo "Example: ./setup-vps-env.sh 192.168.1.100 your_password"
    exit 1
fi

echo "=========================================="
echo "VPS Environment Setup Script"
echo "=========================================="
echo "VPS IP: $VPS_IP"
echo ""

# Create the .env file content
ENV_CONTENT='# ============================================================================
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
'

echo "Step 1: Creating .env file on VPS..."
echo "$ENV_CONTENT" | sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no root@$VPS_IP "cat > /home/advancia/app/.env"

echo "✓ .env file created"
echo ""
echo "Step 2: Verifying .env file..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no root@$VPS_IP "head -20 /home/advancia/app/.env"

echo ""
echo "Step 3: Restarting API service..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no root@$VPS_IP "pm2 restart advancia-api"

echo ""
echo "Step 4: Checking service status..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no root@$VPS_IP "pm2 status"

echo ""
echo "=========================================="
echo "✓ VPS Environment Setup Complete!"
echo "=========================================="
echo ""
echo "IMPORTANT: Replace the placeholder values in .env:"
echo "  - YOUR_DATABASE_PASSWORD"
echo "  - YOUR_SERVICE_ROLE_KEY"
echo "  - YOUR_JWT_SECRET_MIN_32_CHARS"
echo "  - YOUR_REFRESH_SECRET_MIN_32_CHARS"
echo "  - YOUR_ACTUAL_STRIPE_SECRET_KEY"
echo "  - YOUR_ACTUAL_STRIPE_PUBLISHABLE_KEY"
echo "  - YOUR_ACTUAL_WEBHOOK_SECRET"
echo "  - YOUR_RESEND_API_KEY"
echo "  - YOUR_TWILIO_ACCOUNT_SID"
echo "  - YOUR_TWILIO_AUTH_TOKEN"
echo "  - YOUR_TWILIO_PHONE_NUMBER"
echo "  - YOUR_UPSTASH_PASSWORD"
echo "  - YOUR_UPSTASH_HOST"
echo "  - YOUR_UPSTASH_PORT"
echo "  - YOUR_UPSTASH_TOKEN"
echo "  - YOUR_SENTRY_KEY"
echo "  - YOUR_SENTRY_DOMAIN"
echo "  - YOUR_PROJECT_ID"
echo "  - YOUR_64_HEX_CHARACTER_ENCRYPTION_KEY"
echo ""
echo "To update values, SSH into VPS and edit:"
echo "  ssh root@$VPS_IP"
echo "  nano /home/advancia/app/.env"
echo ""
echo "Then restart the service:"
echo "  pm2 restart advancia-api"
