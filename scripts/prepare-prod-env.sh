#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_TEMPLATE="$ROOT_DIR/.env.production"
ENV_OUT="$ROOT_DIR/.env.prod"

if ! command -v openssl >/dev/null 2>&1; then
  echo "ERROR: openssl not found. Install it and re-run."
  exit 1
fi

if [[ ! -f "$ENV_TEMPLATE" ]]; then
  echo "ERROR: $ENV_TEMPLATE not found."
  echo "Create it (or copy from .env.production.example) and re-run."
  exit 1
fi

cp "$ENV_TEMPLATE" "$ENV_OUT"

JWT_SECRET="$(openssl rand -base64 32)"
JWT_REFRESH_SECRET="$(openssl rand -base64 32)"

sed -i "s|^JWT_SECRET=.*$|JWT_SECRET=$JWT_SECRET|" "$ENV_OUT"
sed -i "s|^JWT_REFRESH_SECRET=.*$|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|" "$ENV_OUT"

echo "✅ Prepared .env.prod with fresh JWT secrets."
echo "   File: $ENV_OUT"
echo ""
echo "Next steps:"
echo "  1) Review .env.prod values (WEB_URL, WEB_URL_2, DB_*, etc.)"
echo "  2) Deploy: docker compose -f docker-compose.prod.yml up -d --build"
