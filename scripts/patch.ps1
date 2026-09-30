<#
.SYNOPSIS
    Antigravity Scroll Unpin - 1-Click PowerShell Runner

.DESCRIPTION
    Fixes and unpins sticky user prompt headers in Google Antigravity & Antigravity IDE
    while ensuring 100% cryptographic checksum validity in product.json.

.PARAMETER Apply
    Applies the unpin patch to both Standalone and IDE environments.

.PARAMETER Restore
    Restores original stock files from .bak backups.

.PARAMETER Status
    Checks installation directories and product.json checksum status.

.EXAMPLE
    .\patch.ps1 -Apply
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
    [switch]$Status
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
} else {
    node "$cliPath" --apply
}
