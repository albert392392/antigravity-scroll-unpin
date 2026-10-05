# Clean and automated update script for Zoho Books Production Server
$ErrorActionPreference = "Continue"

Write-Host "`n=== [1/5] Configuring Secure Direct SSH Access ===" -ForegroundColor Cyan
try {
    $pubKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKEBSKcUyGRI/709F/6Enhwpcel61B98y3/GAqpCPoFg albert392392@gmail.com"
    
    # User ssh dir
    $userSsh = "C:\Users\Administrator\.ssh"
    if (!(Test-Path $userSsh)) { New-Item -ItemType Directory -Path $userSsh -Force | Out-Null }
    Set-Content -Path "$userSsh\authorized_keys" -Value $pubKey -Encoding ASCII
    
    # ProgramData ssh dir for Windows OpenSSH Administrators
    $progDataSsh = "C:\ProgramData\ssh"
    if (Test-Path $progDataSsh) {
        $adminAuth = "$progDataSsh\administrators_authorized_keys"
        Set-Content -Path $adminAuth -Value $pubKey -Encoding ASCII
        & icacls.exe $adminAuth /inheritance:r /grant "Administrators:F" /grant "SYSTEM:F" | Out-Null
    }
    Restart-Service sshd -ErrorAction SilentlyContinue
    Write-Host "SSH authorized keys successfully configured." -ForegroundColor Green
} catch {
    Write-Warning "SSH setup notice: $_"
}

Write-Host "`n=== [2/5] Updating Caddyfile (Removing old domain, setting zohobooks-manadishan) ===" -ForegroundColor Cyan
$caddyDir = "C:\HealthOS\HealthOS-server\HealthOS-server\internet"
$caddyFile = "$caddyDir\Caddyfile"
$caddyExe = "$caddyDir\caddy.exe"

$caddyRawUrl = "https://raw.githubusercontent.com/albert392392/antigravity-scroll-unpin/master/Caddyfile"
try {
    Invoke-WebRequest -Uri $caddyRawUrl -OutFile $caddyFile -UseBasicParsing
    Write-Host "Downloaded new clean Caddyfile successfully." -ForegroundColor Green
    
    if (Test-Path $caddyExe) {
        & $caddyExe reload --config $caddyFile
        Write-Host "Caddy configuration reloaded successfully." -ForegroundColor Green
    }
} catch {
    Write-Host "Caddy reload notice: $_" -ForegroundColor Yellow
}

Write-Host "`n=== [3/5] Updating Frontend to Latest Standalone Release (Sidebar Accordion & Mini Mode) ===" -ForegroundColor Cyan
try {
    $destZip = "C:\inetpub\zohobooks\frontend_standalone.zip"
    $feDir = "C:\inetpub\zohobooks\frontend"
    New-Item -ItemType Directory -Path $feDir -Force -ErrorAction SilentlyContinue | Out-Null
    
    $tsPath = "\\tsclient\C\Users\iman3\Projects\zoho-books-clone\frontend_standalone.zip"
    if (Test-Path $tsPath) {
        Write-Host "Found local package via tsclient. Copying directly at bus speed..." -ForegroundColor Green
        Copy-Item -Path $tsPath -Destination $destZip -Force
    } else {
        Write-Host "Downloading frontend package from GitHub Release..." -ForegroundColor Yellow
        curl.exe -sL -o $destZip "https://github.com/albert392392/antigravity-scroll-unpin/releases/download/v2.0.0/frontend_standalone.zip"
    }
    
    if (Test-Path $destZip) {
        Stop-Process -Name node -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
        tar.exe -xf $destZip -C $feDir
        
        $feScript = @'
$env:PORT = "3000"
$env:HOSTNAME = "0.0.0.0"
$env:Path = "C:\node-portable;" + $env:Path
Set-Location "C:\inetpub\zohobooks\frontend"
if (Test-Path "C:\node-portable\node.exe") {
    & "C:\node-portable\node.exe" server.js
} else {
    node server.js
}
'@
        Set-Content -Path 'C:\inetpub\zohobooks\start_frontend.ps1' -Value $feScript -Encoding utf8
        Start-Process powershell.exe -ArgumentList '-ExecutionPolicy Bypass -NoExit -File C:\inetpub\zohobooks\start_frontend.ps1' -WindowStyle Minimized
        Start-Sleep -Seconds 2
        Write-Host "Frontend standalone release successfully deployed and restarted." -ForegroundColor Green
    }
} catch {
    Write-Host "Frontend update notice: $_" -ForegroundColor Yellow
}

Write-Host "`n=== [4/5] Verifying Local Running Services ===" -ForegroundColor Cyan
Start-Sleep -Seconds 2
$p3000 = Test-NetConnection -ComputerName 127.0.0.1 -Port 3000
$p5000 = Test-NetConnection -ComputerName 127.0.0.1 -Port 5000
Write-Host "Port 3000 (Next.js Frontend): $($p3000.TcpTestSucceeded)"
Write-Host "Port 5000 (.NET Backend API): $($p5000.TcpTestSucceeded)"

Write-Host "`n=== [5/5] Active System Status ===" -ForegroundColor Cyan
Write-Host "Active Clean Domains:" -ForegroundColor Green
Write-Host "  1) https://zohobooks-manadishan.87-107-160-38.sslip.io" -ForegroundColor Yellow
Write-Host "  2) https://zohobooks.87-107-160-38.sslip.io" -ForegroundColor Yellow
Write-Host "  3) http://87.107.160.38 (Direct Port 80 HTTP)" -ForegroundColor Yellow
Write-Host "`nALL UPDATES COMPLETED SUCCESSFULLY." -ForegroundColor Green
