<#
.SYNOPSIS
    Antigravity Scroll Unpin - 1-Click PowerShell Runner

.DESCRIPTION
    Fixes and unpins sticky user prompt headers in Google Antigravity & Antigravity IDE
    while ensuring 100% cryptographic checksum validity in product.json.
    Includes a self-healing background watcher daemon to survive auto-updates.

.PARAMETER Apply
    Applies the unpin patch to both Standalone and IDE environments.

.PARAMETER Restore
    Restores original stock files from .bak backups.

.PARAMETER Status
    Checks installation directories and product.json checksum status.

.PARAMETER Watch
    Runs the live self-healing file watcher in the console.

.PARAMETER InstallService
    Installs the silent background watcher in Windows Startup.

.PARAMETER UninstallService
    Removes the silent background watcher from Windows Startup.

.EXAMPLE
    .\patch.ps1 -Apply
    .\patch.ps1 -Watch
    .\patch.ps1 -InstallService
    .\patch.ps1 -UninstallService
    .\patch.ps1 -Restore
    .\patch.ps1 -Status
#>

[CmdletBinding(DefaultParameterSetName = 'Apply')]
param(
    [Parameter(ParameterSetName = 'Apply')]
    [switch]$Apply,

    [Parameter(ParameterSetName = 'Restore')]
    [switch]$Restore,

    [Parameter(ParameterSetName = 'Status')]
    [switch]$Status,

    [Parameter(ParameterSetName = 'Watch')]
    [switch]$Watch,

    [Parameter(ParameterSetName = 'InstallService')]
    [switch]$InstallService,

    [Parameter(ParameterSetName = 'UninstallService')]
    [switch]$UninstallService
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = Split-Path -Parent $scriptDir
$cliPath = Join-Path $projectRoot "bin\cli.js"

if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is required but not found in PATH. Please install Node.js."
    exit 1
}

if ($Restore) {
    node "$cliPath" --restore
} elseif ($Status) {
    node "$cliPath" --status
} elseif ($Watch) {
    node "$cliPath" --watch
} elseif ($InstallService) {
    node "$cliPath" --install-service
} elseif ($UninstallService) {
    node "$cliPath" --uninstall-service
} else {
    node "$cliPath" --apply
}
