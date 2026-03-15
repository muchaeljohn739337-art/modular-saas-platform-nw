# Upload .env to VPS and restart API
param(
    [string]$VpsIP = "76.13.77.8",
    [string]$VpsPassword = "gXF?5ZPRwVNRTv4",
    [string]$EnvFile = "$env:TEMP\.env"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VPS Environment Upload & Restart" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path $EnvFile)) {
    Write-Host "Error: .env file not found at $EnvFile" -ForegroundColor Red
    exit 1
}

Write-Host "VPS IP: $VpsIP" -ForegroundColor Green
Write-Host ".env file: $EnvFile" -ForegroundColor Green
Write-Host ""

# Create SSH command to upload and restart
Write-Host "Step 1: Uploading .env to VPS..." -ForegroundColor Yellow
Write-Host ""

# Read the .env content
$envContent = Get-Content $EnvFile -Raw

# Create a here-string for the SSH command
$sshScript = @"
cat > /home/advancia/app/.env << 'ENVEOF'
$envContent
ENVEOF
chmod 600 /home/advancia/app/.env
pm2 restart advancia-api
pm2 status
"@

# Save SSH script to temp file
$sshScriptFile = "$env:TEMP\vps-setup.sh"
$sshScript | Out-File -FilePath $sshScriptFile -Encoding UTF8 -NoNewline

Write-Host "SSH script created at: $sshScriptFile" -ForegroundColor Gray
Write-Host ""

# Try to execute via SSH
Write-Host "Attempting SSH connection to $VpsIP..." -ForegroundColor Yellow
Write-Host ""

try {
    # Use SSH to execute the script
    $sshCommand = "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@$VpsIP"
    
    Write-Host "Executing SSH command..." -ForegroundColor Gray
    
    # Create PowerShell script that uses SSH
    $psScript = @"
`$sshOutput = `$envContent | ssh -o StrictHostKeyChecking=no root@$VpsIP "cat > /home/advancia/app/.env && chmod 600 /home/advancia/app/.env && pm2 restart advancia-api && pm2 status"
Write-Host `$sshOutput
"@
    
    # Alternative: Use plink if available (PuTTY)
    $plinkPath = "C:\Program Files\PuTTY\plink.exe"
    if (Test-Path $plinkPath) {
        Write-Host "Using PuTTY plink for SSH..." -ForegroundColor Cyan
        
        # Create batch file for plink
        $batchFile = "$env:TEMP\vps-setup.bat"
        $batchContent = @"
@echo off
echo $envContent | "$plinkPath" -ssh -l root -pw $VpsPassword $VpsIP "cat > /home/advancia/app/.env && chmod 600 /home/advancia/app/.env && pm2 restart advancia-api && pm2 status"
"@
        $batchContent | Out-File -FilePath $batchFile -Encoding ASCII
        
        Write-Host "Executing: $batchFile" -ForegroundColor Gray
        & $batchFile
        
        Write-Host ""
        Write-Host "✓ VPS setup complete" -ForegroundColor Green
        
    } else {
        Write-Host "PuTTY not found. Using alternative method..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Manual steps required:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. Open Command Prompt or PowerShell" -ForegroundColor White
        Write-Host "2. Run this command:" -ForegroundColor White
        Write-Host ""
        Write-Host "   ssh root@$VpsIP" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "3. When prompted for password, enter: $VpsPassword" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "4. Once connected, run:" -ForegroundColor White
        Write-Host ""
        Write-Host "   nano /home/advancia/app/.env" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "5. Paste the content from: $EnvFile" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "6. Save (Ctrl+X, Y, Enter)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "7. Run:" -ForegroundColor White
        Write-Host ""
        Write-Host "   pm2 restart advancia-api" -ForegroundColor Cyan
        Write-Host "   pm2 status" -ForegroundColor Cyan
        Write-Host ""
    }
    
} catch {
    Write-Host "Error during SSH execution: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual upload required. See instructions above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next: Run Phase 2 Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Once VPS is updated, run:" -ForegroundColor White
Write-Host ""
Write-Host "  .\verify-deployment.sh" -ForegroundColor Cyan
Write-Host ""
