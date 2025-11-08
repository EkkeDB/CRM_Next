#!/usr/bin/env bash
set -euo pipefail

# Run from repo root (transfer folder)
ROOT="$(pwd)"

# Backend .env: prefer backend/.env; else copy from .env or .env.example
if [[ -f "$ROOT/backend/.env" ]]; then
  echo "backend/.env already exists"
elif [[ -f "$ROOT/.env" ]]; then
  cp -f "$ROOT/.env" "$ROOT/backend/.env"
  echo "Copied .env -> backend/.env"
elif [[ -f "$ROOT/.env.example" ]]; then
  cp -f "$ROOT/.env.example" "$ROOT/backend/.env"
  echo "Copied .env.example -> backend/.env (please review values)"
else
  echo "WARN: No .env or .env.example found; please create backend/.env manually" >&2
fi

# Frontend .env.local
if [[ -f "$ROOT/frontend/.env.local" ]]; then
  echo "frontend/.env.local already exists"
elif [[ -f "$ROOT/frontend/.env.local.example" ]]; then
  cp -f "$ROOT/frontend/.env.local.example" "$ROOT/frontend/.env.local"
  echo "Copied frontend/.env.local.example -> frontend/.env.local"
else
  cat > "$ROOT/frontend/.env.local" <<'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
  echo "Created minimal frontend/.env.local (edit values as needed)"
fi

echo "Environment files are set up."
