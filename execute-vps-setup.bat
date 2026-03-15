@echo off
REM VPS .env Upload and API Restart Script
REM This script uploads the .env file to VPS and restarts the API service

setlocal enabledelayedexpansion

echo ==========================================
echo VPS Environment Setup - Execution
echo ==========================================
echo.

set VPS_IP=76.13.77.8
set VPS_USER=root
set VPS_PASSWORD=gXF?5ZPRwVNRTv4
set ENV_FILE=%TEMP%\.env
set VPS_ENV_PATH=/home/advancia/app/.env

echo VPS IP: %VPS_IP%
echo VPS User: %VPS_USER%
echo .env File: %ENV_FILE%
echo VPS Path: %VPS_ENV_PATH%
echo.

REM Check if .env file exists
if not exist "%ENV_FILE%" (
    echo ERROR: .env file not found at %ENV_FILE%
    echo Please run setup-vps-env.ps1 first to create the .env file
    pause
    exit /b 1
)

echo Step 1: Uploading .env to VPS...
echo.

REM Try using plink (PuTTY) if available
set PLINK_PATH=C:\Program Files\PuTTY\plink.exe
if exist "%PLINK_PATH%" (
    echo Using PuTTY plink for SSH connection...
    echo.
    
    REM Create temporary script for plink
    set PLINK_SCRIPT=%TEMP%\plink_commands.txt
    (
        echo cat ^> %VPS_ENV_PATH% ^<^< 'ENVEOF'
        for /f "delims=" %%A in ('type "%ENV_FILE%"') do echo %%A
        echo ENVEOF
        echo chmod 600 %VPS_ENV_PATH%
        echo pm2 restart advancia-api
        echo pm2 status
    ) > "%PLINK_SCRIPT%"
    
    REM Execute plink with password
    "%PLINK_PATH%" -ssh -l %VPS_USER% -pw %VPS_PASSWORD% %VPS_IP% < "%PLINK_SCRIPT%"
    
    if errorlevel 0 (
        echo.
        echo Step 1 Complete: .env uploaded successfully
        echo.
        echo Step 2: Verifying API status...
        echo.
        echo Run the following command to verify:
        echo   "%PLINK_PATH%" -ssh -l %VPS_USER% -pw %VPS_PASSWORD% %VPS_IP% "pm2 status"
        echo.
    ) else (
        echo ERROR: Failed to upload .env file
        pause
        exit /b 1
    )
    
) else (
    echo PuTTY not found. Using alternative method...
    echo.
    echo Please manually execute these commands:
    echo.
    echo 1. Open Command Prompt or PowerShell
    echo 2. Run: ssh %VPS_USER%@%VPS_IP%
    echo 3. Enter password: %VPS_PASSWORD%
    echo 4. Run: nano %VPS_ENV_PATH%
    echo 5. Paste content from: %ENV_FILE%
    echo 6. Save: Ctrl+X, Y, Enter
    echo 7. Run: pm2 restart advancia-api
    echo 8. Run: pm2 status
    echo.
    pause
)

echo.
echo ==========================================
echo VPS Setup Complete
echo ==========================================
echo.
echo Next Steps:
echo 1. Verify API is running: pm2 status
echo 2. Check API logs: pm2 logs advancia-api
echo 3. Test endpoint: https://api.advanciapayledger.com/health
echo.
echo Then proceed to:
echo - Phase 1 Manual Config (optional): PHASE1_QUICK_START.md
echo - Phase 3 Go Live: PHASE3_GO_LIVE.md
echo.
pause
