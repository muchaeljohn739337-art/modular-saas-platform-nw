# VPS Environment Setup - PowerShell Execution Script
# Uploads .env file to VPS and restarts API service

param(
    [string]$VpsIP = "76.13.77.8",
    [string]$VpsUser = "root",
    [string]$VpsPassword = "gXF?5ZPRwVNRTv4",
    [string]$EnvFilePath = "$env:TEMP\.env"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "VPS Environment Setup - Execution" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  VPS IP: $VpsIP" -ForegroundColor White
Write-Host "  VPS User: $VpsUser" -ForegroundColor White
Write-Host ".env File: $EnvFilePath" -ForegroundColor White
Write-Host ""

# Verify .env file exists
if (-not (Test-Path $EnvFilePath)) {
    Write-Host "ERROR: .env file not found at $EnvFilePath" -ForegroundColor Red
    Write-Host "Please run setup-vps-env.ps1 first to create the .env file" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Reading .env file..." -ForegroundColor Yellow
$envContent = Get-Content $EnvFilePath -Raw
Write-Host "  File size: $($envContent.Length) bytes" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Preparing SSH commands..." -ForegroundColor Yellow

# Create SSH commands
$sshCommands = @"
cat > /home/advancia/app/.env << 'ENVEOF'
$envContent
ENVEOF
chmod 600 /home/advancia/app/.env
pm2 restart advancia-api
pm2 status
pm2 logs advancia-api --lines 20
"@

Write-Host "  Commands prepared" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Executing SSH commands..." -ForegroundColor Yellow
Write-Host ""

# Try to execute via SSH
try {
    # Check if SSH is available
    $sshTest = ssh -V 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SSH is available. Executing commands..." -ForegroundColor Green
        Write-Host ""
        
        # Execute SSH command
        $sshCommands | ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $VpsUser@$VpsIP
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "Step 2 Complete: .env uploaded successfully" -ForegroundColor Green
            Write-Host ""
        } else {
            Write-Host "ERROR: SSH command failed with exit code $LASTEXITCODE" -ForegroundColor Red
            Write-Host ""
            Write-Host "Manual execution required. See instructions below." -ForegroundColor Yellow
        }
    } else {
        Write-Host "SSH not available in PATH" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Manual execution required. See instructions below." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual execution required. See instructions below." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Manual Execution Instructions" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "If SSH execution failed, follow these steps:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Open Command Prompt or PowerShell" -ForegroundColor White
Write-Host ""

Write-Host "2. Connect to VPS:" -ForegroundColor White
Write-Host "   ssh root@76.13.77.8" -ForegroundColor Cyan
Write-Host ""

Write-Host "3. Enter password when prompted:" -ForegroundColor White
Write-Host "   gXF?5ZPRwVNRTv4" -ForegroundColor Cyan
Write-Host ""

Write-Host "4. Create/edit .env file:" -ForegroundColor White
Write-Host "   nano /home/advancia/app/.env" -ForegroundColor Cyan
Write-Host ""

Write-Host "5. Paste the content from:" -ForegroundColor White
Write-Host "   $EnvFilePath" -ForegroundColor Cyan
Write-Host ""

Write-Host "6. Save the file:" -ForegroundColor White
Write-Host "   Press Ctrl+X, then Y, then Enter" -ForegroundColor Cyan
Write-Host ""

Write-Host "7. Set proper permissions:" -ForegroundColor White
Write-Host "   chmod 600 /home/advancia/app/.env" -ForegroundColor Cyan
Write-Host ""

Write-Host "8. Restart API service:" -ForegroundColor White
Write-Host "   pm2 restart advancia-api" -ForegroundColor Cyan
Write-Host ""

Write-Host "9. Verify API is running:" -ForegroundColor White
Write-Host "   pm2 status" -ForegroundColor Cyan
Write-Host "   pm2 logs advancia-api" -ForegroundColor Cyan
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Verification" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "After Step 1 is complete, verify:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. SSH into VPS and check status:" -ForegroundColor White
Write-Host "   ssh root@76.13.77.8" -ForegroundColor Cyan
Write-Host "   pm2 status" -ForegroundColor Cyan
Write-Host ""

Write-Host "2. Check API endpoint:" -ForegroundColor White
Write-Host "   https://api.advanciapayledger.com/health" -ForegroundColor Cyan
Write-Host ""

Write-Host "3. Check API logs for errors:" -ForegroundColor White
Write-Host "   pm2 logs advancia-api" -ForegroundColor Cyan
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "After VPS setup is complete:" -ForegroundColor Yellow
Write-Host ""

Write-Host "Option A: Phase 1 Manual Configuration (optional, 2-3 hours)" -ForegroundColor White
Write-Host "  Follow: PHASE1_QUICK_START.md" -ForegroundColor Cyan
Write-Host ""

Write-Host "Option B: Phase 3 Go Live (1-2 hours)" -ForegroundColor White
Write-Host "  Follow: PHASE3_GO_LIVE.md" -ForegroundColor Cyan
Write-Host ""

Write-Host "==========================================" -ForegroundColor Green
Write-Host "VPS Setup Script Complete" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
