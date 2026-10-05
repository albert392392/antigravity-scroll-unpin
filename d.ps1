Write-Host "=== CADDYFILE CONTENT ===" -ForegroundColor Cyan
Get-Content "C:\HealthOS\HealthOS-server\HealthOS-server\internet\Caddyfile"

Write-Host "`n=== CADDY CERTIFICATES ===" -ForegroundColor Cyan
Get-ChildItem -Path "C:\Users\Administrator\AppData\Roaming\Caddy\certificates" -Recurse | Select-Object FullName, Length

Write-Host "`n=== LISTENING PORTS ===" -ForegroundColor Cyan
Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -in 80, 443, 3000, 5000, 8000} | Select-Object LocalAddress, LocalPort, OwningProcess
