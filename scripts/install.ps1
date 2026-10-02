# Antigravity Scroll Unpin - 1-Click Remote Installer
# Usage:
#   irm https://raw.githubusercontent.com/albert392392/antigravity-scroll-unpin/master/scripts/install.ps1 | iex

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   Antigravity Scroll Unpin - 1-Click Remote Installer          " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Verify Node.js
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js (version 16 or newer) is required to run Antigravity Scroll Unpin." -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org and re-run this command." -ForegroundColor Yellow
    return
}

$nodeVersion = node -v
Write-Host "[INFO] Detected Node.js: $nodeVersion" -ForegroundColor Green

# 2. Run patch via npx from GitHub repository directly
Write-Host "`n[1/3] Applying unpin patch to Antigravity & Antigravity IDE..." -ForegroundColor Cyan
& npx --yes github:albert392392/antigravity-scroll-unpin --apply

# 3. Install silent self-healing service
Write-Host "`n[2/3] Registering self-healing background watcher (survives auto-updates)..." -ForegroundColor Cyan
& npx --yes github:albert392392/antigravity-scroll-unpin --install-service

# 4. Verify environment status
Write-Host "`n[3/3] Verifying environment integrity..." -ForegroundColor Cyan
& npx --yes github:albert392392/antigravity-scroll-unpin --status

Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host "   Antigravity Scroll Unpin is now active and protected!         " -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
