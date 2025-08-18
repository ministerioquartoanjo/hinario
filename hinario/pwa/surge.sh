#!/usr/bin/env bash
set -euo pipefail

# Simple deploy script for Surge.sh
# Usage:
#   ./surge.sh                        # deploy to a temporary random domain
#   DOMAIN=seu-dominio.surge.sh ./surge.sh   # deploy to a fixed domain
#   SURGE_TOKEN=xxxx DOMAIN=... ./surge.sh   # with auth token (optional)

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Build and assemble deploy folder
npm run predeploy

# SPA fallback: serve index.html for unknown routes
cp ./deploy/index.html ./deploy/200.html

# Domain handling: default to project domain unless overridden via env
DEFAULT_DOMAIN="hinario.advertenciafinal.com"
DOMAIN_ARG="${DOMAIN:-$DEFAULT_DOMAIN}"

# Ensure CNAME inside deploy folder for Surge custom domain
echo "$DOMAIN_ARG" > ./deploy/CNAME

# Deploy using npx (no global install required)
if [[ -n "${SURGE_TOKEN:-}" ]]; then
  # Auth via token if available
  npx surge ./deploy "$DOMAIN_ARG" --token "$SURGE_TOKEN"
else
  npx surge ./deploy "$DOMAIN_ARG"
fi

echo "\nDeployed to Surge. Check: $DOMAIN_ARG"
