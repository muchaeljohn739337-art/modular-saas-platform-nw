# VPS Environment Setup - PowerShell Version
# Usage: .\setup-vps-env.ps1 -VpsIP "76.13.77.8" -VpsPassword "gXF?5ZPRwVNRTv4"

param(
    [string]$VpsIP = "76.13.77.8",
    [string]$VpsPassword = "gXF?5ZPRwVNRTv4"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "VPS Environment Setup Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "VPS IP: $VpsIP" -ForegroundColor Green
Write-Host ""

# Create the .env file content
$envContent = @"
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
DATABASE_URL=postgresql://postgres.jwabwrcykdtpwdhwhmqq:Good_mother1!?@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
DATABASE_DIRECT_URL=postgresql://postgres:Good_mother1!?@db.jwabwrcykdtpwdhwhmqq.supabase.co:5432/postgres

# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================
SUPABASE_URL=https://jwabwrcykdtpwdhwhmqq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3YWJ3cmN5a2R0cHdkaHdobXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTI3NTQsImV4cCI6MjA4NTEyODc1NH0.wk7Ok5i8O4eigd7iYhb-LwR48-B9QpKuRPi5GZfGWwk
SUPABASE_SERVICE_ROLE_KEY=sb_publishable_feavCnnLOlbVTiU0jkQrIg_GpIBiqYd

# ============================================================================
# AUTHENTICATION
# ============================================================================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars-change-this
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
"@

Write-Host "Step 1: Creating .env file on VPS..." -ForegroundColor Yellow
Write-Host ""

# Save .env to temporary file
$tempEnvFile = "$env:TEMP\.env"
$envContent | Out-File -FilePath $tempEnvFile -Encoding UTF8

Write-Host "✓ .env file created locally" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Uploading .env to VPS..." -ForegroundColor Yellow
Write-Host ""

# Use SSH to upload file
try {
    # Create SSH command to upload file
    $sshCommand = "scp -o StrictHostKeyChecking=no `"$tempEnvFile`" root@${VpsIP}:/home/advancia/app/.env"
    
    Write-Host "Executing: $sshCommand" -ForegroundColor Gray
    Write-Host ""
    
    # Note: This will require manual SSH setup or PuTTY key
    Write-Host "⚠ Manual Step Required:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Since sshpass is not available, please manually upload the .env file:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Using SCP (if you have SSH key configured)" -ForegroundColor Cyan
    Write-Host "  scp `"$tempEnvFile`" root@${VpsIP}:/home/advancia/app/.env" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Using PuTTY/WinSCP" -ForegroundColor Cyan
    Write-Host "  1. Open WinSCP" -ForegroundColor White
    Write-Host "  2. Connect to: $VpsIP" -ForegroundColor White
    Write-Host "  3. Username: root" -ForegroundColor White
    Write-Host "  4. Password: (use provided password)" -ForegroundColor White
    Write-Host "  5. Upload: $tempEnvFile to /home/advancia/app/.env" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 3: Using SSH directly" -ForegroundColor Cyan
    Write-Host "  ssh root@${VpsIP}" -ForegroundColor White
    Write-Host "  nano /home/advancia/app/.env" -ForegroundColor White
    Write-Host "  (paste the content from: $tempEnvFile)" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 3: After uploading .env, SSH into VPS and run:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ssh root@${VpsIP}" -ForegroundColor Cyan
Write-Host "  pm2 restart advancia-api" -ForegroundColor Cyan
Write-Host "  pm2 status" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 4: Replace placeholder values in .env:" -ForegroundColor Yellow
Write-Host ""
Write-Host "After uploading, SSH into VPS and edit:" -ForegroundColor White
Write-Host "  nano /home/advancia/app/.env" -ForegroundColor Cyan
Write-Host ""
Write-Host "Replace these placeholder values:" -ForegroundColor White
Write-Host "  - YOUR_ACTUAL_STRIPE_SECRET_KEY" -ForegroundColor Gray
Write-Host "  - YOUR_ACTUAL_STRIPE_PUBLISHABLE_KEY" -ForegroundColor Gray
Write-Host "  - YOUR_ACTUAL_WEBHOOK_SECRET" -ForegroundColor Gray
Write-Host "  - YOUR_RESEND_API_KEY" -ForegroundColor Gray
Write-Host "  - YOUR_TWILIO_ACCOUNT_SID" -ForegroundColor Gray
Write-Host "  - YOUR_TWILIO_AUTH_TOKEN" -ForegroundColor Gray
Write-Host "  - YOUR_TWILIO_PHONE_NUMBER" -ForegroundColor Gray
Write-Host "  - YOUR_UPSTASH_PASSWORD" -ForegroundColor Gray
Write-Host "  - YOUR_UPSTASH_HOST" -ForegroundColor Gray
Write-Host "  - YOUR_UPSTASH_PORT" -ForegroundColor Gray
Write-Host "  - YOUR_UPSTASH_TOKEN" -ForegroundColor Gray
Write-Host "  - YOUR_SENTRY_KEY" -ForegroundColor Gray
Write-Host "  - YOUR_SENTRY_DOMAIN" -ForegroundColor Gray
Write-Host "  - YOUR_PROJECT_ID" -ForegroundColor Gray
Write-Host "  - YOUR_64_HEX_CHARACTER_ENCRYPTION_KEY" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 5: Restart API service:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  pm2 restart advancia-api" -ForegroundColor Cyan
Write-Host "  pm2 logs advancia-api" -ForegroundColor Cyan
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✓ VPS Environment Setup Ready" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host ".env file location: $tempEnvFile" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Upload .env to VPS and restart API service" -ForegroundColor Yellow
Write-Host ""
