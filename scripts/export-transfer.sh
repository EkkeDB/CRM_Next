#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/export-transfer.sh [/path/to/dest] [--include-secrets]
DEST="${1:-/tmp/nextcrm-transfer}"
INCLUDE_SECRETS=false
if [[ "${2:-}" == "--include-secrets" ]]; then INCLUDE_SECRETS=true; fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

mkdir -p "$DEST"

EXCLUDES=(
  "--exclude=.git/"
  "--exclude=__pycache__/"
  "--exclude=*.pyc" "--exclude=*.pyo" "--exclude=*.pyd" "--exclude=*.egg-info"
  "--exclude=backend/venv/" "--exclude=backend/logs/" "--exclude=*.log"
  "--exclude=frontend/node_modules/" "--exclude=frontend/.next/"
  "--exclude=staticfiles/"
  "--exclude=.DS_Store" "--exclude=cookies.txt" "--exclude=*.cookies"
)
# Always include env files (.env, .env.example, frontend/.env.local) in transfer

rsync -avh --delete "${EXCLUDES[@]}" "$REPO_ROOT/" "$DEST/"

# Copy helper script to set up env files in destination
mkdir -p "$DEST/scripts"
cp -f "$REPO_ROOT/scripts/setup-env.sh" "$DEST/scripts/setup-env.sh" 2>/dev/null || true

echo "Transfer bundle created at $DEST"
