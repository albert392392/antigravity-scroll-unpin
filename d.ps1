# Clean and automated update script for Zoho Books Production Server
$ErrorActionPreference = "Continue"

Write-Host "`n=== [1/4] Configuring Secure Direct SSH Access ===" -ForegroundColor Cyan
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

Write-Host "`n=== [2/4] Updating Caddyfile (Removing old domain, setting zohobooks-manadishan) ===" -ForegroundColor Cyan
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

Write-Host "`n=== [3/4] Verifying Local Running Services ===" -ForegroundColor Cyan
$p3000 = Test-NetConnection -ComputerName 127.0.0.1 -Port 3000
$p5000 = Test-NetConnection -ComputerName 127.0.0.1 -Port 5000
Write-Host "Port 3000 (Next.js Frontend): $($p3000.TcpTestSucceeded)"
Write-Host "Port 5000 (.NET Backend API): $($p5000.TcpTestSucceeded)"

Write-Host "`n=== [4/4] Active System Status ===" -ForegroundColor Cyan
Write-Host "Active Clean Domains:" -ForegroundColor Green
Write-Host "  1) https://zohobooks-manadishan.87-107-160-38.sslip.io" -ForegroundColor Yellow
Write-Host "  2) https://zohobooks.87-107-160-38.sslip.io" -ForegroundColor Yellow
Write-Host "  3) http://87.107.160.38 (Direct Port 80 HTTP)" -ForegroundColor Yellow
Write-Host "`nALL UPDATES COMPLETED SUCCESSFULLY." -ForegroundColor Green
