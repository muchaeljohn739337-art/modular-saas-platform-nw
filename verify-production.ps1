# Phase 2: Production Verification
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "PHASE 2: DEPLOYMENT VERIFICATION" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$passed = 0
$failed = 0

Write-Host "Testing Frontend Domains:" -ForegroundColor Yellow
try {
    $r1 = Invoke-WebRequest -Uri "https://advanciapayledger.com" -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($r1.StatusCode -eq 200) { Write-Host "  PayLedger App: PASS" -ForegroundColor Green; $passed++ } else { Write-Host "  PayLedger App: FAIL" -ForegroundColor Red; $failed++ }
} catch { Write-Host "  PayLedger App: FAIL" -ForegroundColor Red; $failed++ }

try {
    $r2 = Invoke-WebRequest -Uri "https://advancia-healthcare.com" -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($r2.StatusCode -eq 200) { Write-Host "  Healthcare App: PASS" -ForegroundColor Green; $passed++ } else { Write-Host "  Healthcare App: FAIL" -ForegroundColor Red; $failed++ }
} catch { Write-Host "  Healthcare App: FAIL" -ForegroundColor Red; $failed++ }

Write-Host ""
Write-Host "Testing API Endpoints:" -ForegroundColor Yellow
try {
    $r3 = Invoke-WebRequest -Uri "https://api.advanciapayledger.com/health" -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($r3.StatusCode -eq 200) { Write-Host "  API Health: PASS" -ForegroundColor Green; $passed++ } else { Write-Host "  API Health: FAIL" -ForegroundColor Red; $failed++ }
} catch { Write-Host "  API Health: FAIL" -ForegroundColor Red; $failed++ }

try {
    $r4 = Invoke-WebRequest -Uri "https://jwabwrcykdtpwdhwhmqq.supabase.co/rest/v1/" -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($r4.StatusCode -eq 200 -or $r4.StatusCode -eq 401) { Write-Host "  Supabase REST: PASS" -ForegroundColor Green; $passed++ } else { Write-Host "  Supabase REST: FAIL" -ForegroundColor Red; $failed++ }
} catch { Write-Host "  Supabase REST: FAIL" -ForegroundColor Red; $failed++ }

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "RESULTS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "ALL TESTS PASSED - READY FOR GO LIVE" -ForegroundColor Green
} else {
    Write-Host "Some tests failed - Check configuration" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Production URLs:" -ForegroundColor Yellow
Write-Host "  PayLedger: https://advanciapayledger.com" -ForegroundColor Cyan
Write-Host "  Healthcare: https://advancia-healthcare.com" -ForegroundColor Cyan
Write-Host "  API: https://api.advanciapayledger.com" -ForegroundColor Cyan
Write-Host ""
