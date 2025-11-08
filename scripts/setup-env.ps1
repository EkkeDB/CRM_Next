Param(
  [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Run from repo root (transfer folder)
$Root = Resolve-Path '.'

function Ensure-Dir($p) { if (-not (Test-Path $p)) { New-Item -ItemType Directory -Force -Path $p | Out-Null } }

# Backend .env: prefer backend/.env; else copy from .env or .env.example at repo root
$backendEnv = Join-Path $Root 'backend\.env'
$rootEnv    = Join-Path $Root '.env'
$rootEnvEx  = Join-Path $Root '.env.example'
if (Test-Path $backendEnv) {
  Write-Host "backend/.env already exists"
} elseif (Test-Path $rootEnv) {
  Copy-Item $rootEnv $backendEnv -Force:$Force
  Write-Host "Copied .env -> backend/.env"
} elseif (Test-Path $rootEnvEx) {
  Copy-Item $rootEnvEx $backendEnv -Force:$Force
  Write-Host "Copied .env.example -> backend/.env (please review values)"
} else {
  Write-Warning "No .env or .env.example found; please create backend/.env manually"
}

# Frontend .env.local: if missing, create from example if present
$feEnv = Join-Path $Root 'frontend\.env.local'
$feEnvEx = Join-Path $Root 'frontend\.env.local.example'
if (Test-Path $feEnv) {
  Write-Host "frontend/.env.local already exists"
} elseif (Test-Path $feEnvEx) {
  Copy-Item $feEnvEx $feEnv -Force:$Force
  Write-Host "Copied frontend/.env.local.example -> frontend/.env.local"
} else {
  # Fallback: create minimal .env.local from current defaults
  @(
    'NEXT_PUBLIC_API_URL=http://localhost:8000',
    'NEXT_PUBLIC_APP_URL=http://localhost:3000'
  ) | Set-Content -NoNewline $feEnv
  Write-Host "Created minimal frontend/.env.local (edit values as needed)"
}

Write-Host "Environment files are set up."
