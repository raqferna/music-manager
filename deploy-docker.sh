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
