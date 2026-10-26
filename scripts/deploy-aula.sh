#!/usr/bin/env bash
# Arranca el aula de canto (puerto 5002, carpeta propia). No recrea el catálogo.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f .env.aula ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.aula
  set +a
fi

if [ -z "${AULA_ADMIN_PASSWORD:-}" ]; then
  echo "Falta AULA_ADMIN_PASSWORD. Copia .env.aula.example a .env.aula y pon una contraseña." >&2
  exit 1
fi

export QUITAR_VOZ_HOST_PATH="${QUITAR_VOZ_HOST_PATH:-$ROOT/../quitarvoces}"
export AULA_MUSIC_HOST_PATH="${AULA_MUSIC_HOST_PATH:-$ROOT/music-aula}"
export CATALOG_MUSIC_HOST_PATH="${CATALOG_MUSIC_HOST_PATH:-$ROOT/../music-catalog/music}"
mkdir -p "$AULA_MUSIC_HOST_PATH"

echo "Construyendo imagen (el catálogo en marcha no se reinicia)..."
docker compose build catalogo

echo "Arrancando aula..."
docker compose --profile aula up -d --force-recreate aula

echo "Listo. Aula en http://localhost:5002"
docker compose --profile aula ps aula
