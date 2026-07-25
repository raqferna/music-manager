#!/usr/bin/env bash
# Ejecutar EN EL HP (en ~/Pelis/music-catalog) para traer cambios y reconstruir Docker.
# Útil si desde el Mac falla SSH pero tienes acceso al teclado del HP.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BRANCH="${DEPLOY_BRANCH:-main}"

echo "→ git pull (${BRANCH})…"
git fetch origin "$BRANCH"
git pull --ff-only origin "$BRANCH"

docker stop catalogo-musica 2>/dev/null || true

echo "→ Reconstruyendo Docker (varios minutos)…"
bash deploy-docker.sh
docker compose up -d --force-recreate catalogo

sleep 2
HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5001/ || true)"
echo "HTTP local: ${HTTP_CODE}"
docker compose ps
echo ""
echo "Listo. Recarga https://musica.reicheleria.com con Ctrl+Shift+R"
