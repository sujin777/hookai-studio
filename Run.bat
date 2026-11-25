@echo off
setlocal
cd /d "%~dp0"

echo [HookAI Studio] Stopping any existing server on port 3000...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo [HookAI Studio] Cleaning stale .next cache...
if exist ".next" rmdir /s /q ".next"

if exist ".env.local" (
  echo [HookAI Studio] .env.local detected - prioritizing .env.local keys over Windows env...
  set "GEMINI_API_KEY="
)

powershell -NoProfile -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1).IPAddress; if ($ip) { Write-Host ('[HookAI Studio] Smartphone (same Wi-Fi): http://' + $ip + ':3000') }"

echo [HookAI Studio] Starting Next.js Turbopack server on http://0.0.0.0:3000 ...
start "HookAI Studio Server" cmd /k "npm run dev"

echo [HookAI Studio] Waiting for server readiness...
powershell -NoProfile -Command "for ($i=0; $i -lt 30; $i++) { try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3000' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Seconds 1 }; exit 1"

set "EGO_EXE=C:\Program Files\Citro Labs\ego lite\Application\ego.exe"
if exist "%EGO_EXE%" (
  echo [HookAI Studio] Launching ego-lite browser...
  start "" "%EGO_EXE%" "http://localhost:3000"
) else (
  echo [HookAI Studio] ego-lite not found at default path, trying ego-browser CLI...
  ego-browser open "http://localhost:3000" 2>nul || start "" "http://localhost:3000"
)
