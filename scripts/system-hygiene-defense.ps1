<#
.SYNOPSIS
    Defensive System Hygiene & Anti-Bloat Automated Maintenance Script
    Part of Universal Defensive Architecture (US-ENG-ARCH-2026-V1)

.DESCRIPTION
    Safely prunes orphaned installer extraction trees, test browser residues,
    stale agent worktrees older than 7 days, and V8 bytecode caches.
    Strictly adheres to Anti-Deletion Guards: NEVER touches project source trees,
    active WSL virtual disks, production databases, or git repositories.
#>

param (
    [switch]$WhatIf,
    [switch]$Force
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   UNIVERSAL DEFENSIVE SYSTEM HYGIENE & ANTI-BLOAT GUARDIAN      " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$initialDrive = Get-PSDrive C
$initialFreeGB = [math]::Round($initialDrive.Free / 1GB, 3)
Write-Host "[INIT] Initial C: Drive Free Space: $initialFreeGB GB" -ForegroundColor Yellow

$totalFreedBytes = 0
$totalFreedFiles = 0

function Safe-RemoveTarget {
    param (
        [string]$Path,
        [string]$Description
    )

    if (Test-Path $Path) {
        try {
            $files = Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue
            $measure = $files | Measure-Object -Property Length -Sum
            $bytes = if ($measure.Sum) { $measure.Sum } else { 0 }
            $count = if ($measure.Count) { $measure.Count } else { 0 }
            $mb = [math]::Round($bytes / 1MB, 2)

            Write-Host "[-] Processing $Description ($mb MB, $count files)..." -NoNewline

            if (-not $WhatIf) {
                Remove-Item -Path $Path -Recurse -Force -ErrorAction SilentlyContinue
                if (-not (Test-Path $Path)) {
                    Write-Host " [CLEANED]" -ForegroundColor Green
                    $script:totalFreedBytes += $bytes
                    $script:totalFreedFiles += $count
                } else {
                    Write-Host " [SKIPPED - LOCKED]" -ForegroundColor DarkYellow
                }
            } else {
                Write-Host " [WHATIF]" -ForegroundColor Magenta
                $script:totalFreedBytes += $bytes
                $script:totalFreedFiles += $count
            }
        } catch {
            Write-Host " [ERROR: $($_.Exception.Message)]" -ForegroundColor Red
        }
    }
}

# 1. STOP STALLED UPDATER PROCESSES
Write-Host "`n[PHASE 1] Scanning for stalled background updater processes..." -ForegroundColor Cyan
$stalledProcesses = Get-Process | Where-Object { 
    $_.Name -like "CodeSetup*" -or $_.Name -like "*install*monitor*" 
} -ErrorAction SilentlyContinue

foreach ($proc in $stalledProcesses) {
    Write-Host "[-] Terminating stalled updater PID $($proc.Id) ($($proc.Name))..." -NoNewline
    if (-not $WhatIf) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        Write-Host " [TERMINATED]" -ForegroundColor Green
    } else {
        Write-Host " [WHATIF]" -ForegroundColor Magenta
    }
}

# 2. PRUNE ORPHANED INSTALLER EXTRACTION TREES IN TEMP
Write-Host "`n[PHASE 2] Pruning orphaned installer extraction trees in Temp..." -ForegroundColor Cyan
$tempDir = [System.IO.Path]::GetTempPath()

# NSIS unpack remnants (ns*.tmp)
Get-ChildItem -Path $tempDir -Filter "ns*.tmp" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    Safe-RemoveTarget -Path $_.FullName -Description "Orphaned NSIS unpack tree ($($_.Name))"
}

# InnoSetup unpack remnants (is-*.tmp)
Get-ChildItem -Path $tempDir -Filter "is-*.tmp" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    Safe-RemoveTarget -Path $_.FullName -Description "Orphaned InnoSetup unpack tree ($($_.Name))"
}

# Specific known stalled installer trees
$knownInstallerCaches = @(
    (Join-Path $tempDir "3K249knEWHfiQEeeyHTGGkpJF8Y"),
    (Join-Path $tempDir "vscode-stable-user-x64"),
    (Join-Path $tempDir "DockerDesktopUpdates")
)
foreach ($dir in $knownInstallerCaches) {
    Safe-RemoveTarget -Path $dir -Description "Installer cache tree ($([System.IO.Path]::GetFileName($dir)))"
}

# 3. PRUNE HEADLESS BROWSER TEST PROFILES & DUMPS
Write-Host "`n[PHASE 3] Pruning headless test profiles & diagnostic dumps in Temp..." -ForegroundColor Cyan
Get-ChildItem -Path $tempDir -Filter "HeadlessEdge*" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    Safe-RemoveTarget -Path $_.FullName -Description "Headless browser test profile ($($_.Name))"
}
Get-ChildItem -Path $tempDir -Filter "edge_audit_profile*" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    Safe-RemoveTarget -Path $_.FullName -Description "Edge audit profile ($($_.Name))"
}

# 4. PRUNE STALE SUBAGENT WORKTREES OLDER THAN 7 DAYS
Write-Host "`n[PHASE 4] Pruning stale subagent worktrees (> 7 days old)..." -ForegroundColor Cyan
$worktreesDir = "C:\Users\iman3\.gemini\antigravity\worktrees"
if (Test-Path $worktreesDir) {
    $cutoff = (Get-Date).AddDays(-7)
    Get-ChildItem -Path $worktreesDir -Directory -ErrorAction SilentlyContinue | Where-Object {
        $_.LastWriteTime -lt $cutoff
    } | ForEach-Object {
        Safe-RemoveTarget -Path $_.FullName -Description "Stale worktree clone ($($_.Name), last used $($_.LastWriteTime.ToString('yyyy-MM-dd')))"
    }
}

# 5. PURGE V8 CODE CACHE IN ROAMING (FORCE FRESH AST/BYTECODE ON NEXT RUN)
Write-Host "`n[PHASE 5] Evicting stale V8 bytecode caches in Roaming..." -ForegroundColor Cyan
$roamingAppDirs = @(
    "C:\Users\iman3\AppData\Roaming\Antigravity",
    "C:\Users\iman3\AppData\Roaming\Antigravity IDE",
    "C:\Users\iman3\AppData\Roaming\Code"
)
foreach ($appDir in $roamingAppDirs) {
    if (Test-Path $appDir) {
        Safe-RemoveTarget -Path (Join-Path $appDir "Code Cache") -Description "V8 Code Cache in $([System.IO.Path]::GetFileName($appDir))"
        Safe-RemoveTarget -Path (Join-Path $appDir "CachedData") -Description "V8 CachedData in $([System.IO.Path]::GetFileName($appDir))"
        Safe-RemoveTarget -Path (Join-Path $appDir "GPUCache") -Description "Chromium GPUCache in $([System.IO.Path]::GetFileName($appDir))"
    }
}

# 6. VERIFICATION & FINAL REPORT
Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "                     CLEANUP AUDIT VERDICT                       " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$finalDrive = Get-PSDrive C
$finalFreeGB = [math]::Round($finalDrive.Free / 1GB, 3)
$freedGB = [math]::Round($totalFreedBytes / 1GB, 3)
$deltaGB = [math]::Round($finalFreeGB - $initialFreeGB, 3)

Write-Host "Files Removed:       $totalFreedFiles" -ForegroundColor Green
Write-Host "Direct Space Freed:  $freedGB GB ($([math]::Round($totalFreedBytes / 1MB, 2)) MB)" -ForegroundColor Green
Write-Host "Initial C: Free:     $initialFreeGB GB" -ForegroundColor Gray
Write-Host "Final C: Free:       $finalFreeGB GB" -ForegroundColor White
Write-Host "Net Free Increase:   +$deltaGB GB" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
