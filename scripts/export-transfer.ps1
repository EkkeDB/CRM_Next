Param(
  [string]$Destination = "C:\tmp\nextcrm-transfer",
  [switch]$IncludeSecrets
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Repo root is parent of this script directory
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

Write-Host "Source: $RepoRoot"
Write-Host "Destination: $Destination"
if ($IncludeSecrets) { Write-Host "Include secrets: YES" } else { Write-Host "Include secrets: NO" }

if (-not (Test-Path $Destination)) {
  New-Item -ItemType Directory -Force -Path $Destination | Out-Null
}

# Robocopy options
$opts = @('/MIR','/R:1','/W:1','/NFL','/NDL','/NJH','/NJS')

# Exclude directories/files
$xd = @(
  '.git',
  '__pycache__',
  'backend\venv',
  'backend\logs',
  'frontend\node_modules',
  'frontend\.next',
  'staticfiles'
)
$xf = @(
  '*.pyc','*.pyo','*.pyd','*.egg-info','*.log',
  '.DS_Store','cookies.txt','*.cookies'
)
# Always include env files (.env and .env.example) in the transfer bundle

# Copy everything from root honoring excludes
robocopy $RepoRoot $Destination @opts /XD $xd /XF $xf | Out-Null

# Ensure key files/paths exist (no-op if already copied)
$paths = @(
  'backend','frontend',
  'docker-compose.yml','docker-compose.prod.yml','Dockerfile','Makefile',
  'README.md','TROUBLESHOOTING.md','quick-start.sh','start-simple.sh','install-docker.sh'
)
foreach ($p in $paths) {
  $srcPath  = Join-Path $RepoRoot $p
  if (Test-Path $srcPath) {
    $srcDir  = Split-Path $srcPath -Parent
    $srcName = Split-Path $srcPath -Leaf
    $dstDir  = Join-Path $Destination (Split-Path $p -Parent)
    if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Force -Path $dstDir | Out-Null }
    robocopy $srcDir $dstDir @opts /XD $xd /XF $xf $srcName | Out-Null
  }
}

# Drop a helper script into the transfer folder to set up env files on the target machine
$setupScriptSrc = Join-Path $PSScriptRoot 'setup-env.ps1'
if (Test-Path $setupScriptSrc) {
  Copy-Item $setupScriptSrc -Destination (Join-Path $Destination 'scripts\setup-env.ps1') -Force
}

Write-Host "Transfer bundle created at $Destination"

Write-Host "Transfer bundle created at $Destination"
