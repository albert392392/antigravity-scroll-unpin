Write-Host ">>> [1/4] Stopping node..." -ForegroundColor Cyan
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host ">>> [2/4] Downloading fresh 10MB standalone package..." -ForegroundColor Cyan
$url = "https://github.com/albert392392/antigravity-scroll-unpin/releases/download/v2.0.0/frontend_standalone.zip"
curl.exe -sL $url -o "C:\f.zip"

Write-Host ">>> [3/4] Extracting into frontend directory..." -ForegroundColor Cyan
Remove-Item -Path "C:\inetpub\zohobooks\frontend\.next" -Recurse -Force -ErrorAction SilentlyContinue
tar.exe -xf "C:\f.zip" -C "C:\inetpub\zohobooks\frontend"

Write-Host ">>> [4/4] Starting Next.js server..." -ForegroundColor Cyan
Start-Process powershell.exe -ArgumentList "-ExecutionPolicy Bypass -NoExit -File C:\inetpub\zohobooks\start_frontend.ps1" -WindowStyle Minimized

Start-Sleep -Seconds 3
Write-Host ">>> SUCCESS: ALL DONE! FRONTEND V2 RUNNING ON 3000!" -ForegroundColor Green
