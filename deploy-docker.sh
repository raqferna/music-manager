#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

export QUITAR_VOZ_HOST_PATH="${QUITAR_VOZ_HOST_PATH:-$ROOT/../quitarvoces}"
export MUSIC_HOST_PATH="${MUSIC_HOST_PATH:-$ROOT/music}"

echo "Construyendo imagen..."
docker compose build

echo "Reiniciando contenedor..."
docker compose up -d --force-recreate

echo "Listo. App en http://localhost:5001"
docker compose ps

if docker ps --format '{{.Names}}' | grep -q '^tunel-fijo-catalogo$'; then
  echo ""
  echo "Túnel activo (no reiniciado). URL fija sin cambios."
  if [ -f .env.tunnel ]; then
    # shellcheck disable=SC1091
    set -a && source .env.tunnel && set +a
    [ -n "${PUBLIC_HOSTNAME:-}" ] && echo "  https://${PUBLIC_HOSTNAME}"
  fi
fi
