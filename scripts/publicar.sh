#!/usr/bin/env bash
# Publica cambios de código en el servidor HP y reconstruye Docker.
#
# Uso habitual (desde el Mac, en la misma red que el HP):
#   ./publicar.sh
#   npm run publicar
#
# Opciones:
#   --rsync      Sincroniza archivos sin git (útil con cambios sin commit)
#   --no-push    No hace git push (si ya subiste los cambios a GitHub)
#   --force      Continúa aunque haya cambios locales sin commitear (solo con --rsync)
#
# Configuración opcional en .env.deploy (no se sube a git):
#   DEPLOY_REMOTE=reichel@192.168.1.219
#   DEPLOY_BASE=/home/reichel/Pelis/music-catalog
#   DEPLOY_BRANCH=main
#   DEPLOY_SSH_PASS=...          # solo si no usas clave SSH; requiere sshpass
#   PUBLIC_URL=https://musica.reicheleria.com

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if [[ -f .env.deploy ]]; then
  # shellcheck disable=SC1091
  set -a && source .env.deploy && set +a
fi

REMOTE="${DEPLOY_REMOTE:-reichel@192.168.1.219}"
REMOTE_BASE="${DEPLOY_BASE:-/home/reichel/Pelis/music-catalog}"
BRANCH="${DEPLOY_BRANCH:-main}"
PUBLIC_URL="${PUBLIC_URL:-https://musica.reicheleria.com}"

MODE="git"
DO_PUSH=1
FORCE=0

for arg in "$@"; do
  case "$arg" in
    --rsync) MODE="rsync" ;;
    --no-push) DO_PUSH=0 ;;
    --force) FORCE=1 ;;
    -h|--help)
      sed -n '2,18p' "$0"
      exit 0
      ;;
    *)
      echo "Opción desconocida: $arg (usa --help)" >&2
      exit 1
      ;;
  esac
done

ssh_cmd() {
  if [[ -n "${DEPLOY_SSH_PASS:-}" ]] && command -v sshpass >/dev/null 2>&1; then
    sshpass -p "$DEPLOY_SSH_PASS" ssh -o StrictHostKeyChecking=no "$@"
  else
    ssh -o StrictHostKeyChecking=no "$@"
  fi
}

rsync_cmd() {
  if [[ -n "${DEPLOY_SSH_PASS:-}" ]] && command -v sshpass >/dev/null 2>&1; then
    sshpass -p "$DEPLOY_SSH_PASS" rsync -e "ssh -o StrictHostKeyChecking=no" "$@"
  else
    rsync -e "ssh -o StrictHostKeyChecking=no" "$@"
  fi
}

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: no estás en un repositorio git." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  if [[ "$MODE" == "git" && "$FORCE" -eq 0 ]]; then
    echo "Hay cambios locales sin commitear." >&2
    echo "  1) Haz commit y vuelve a lanzar:  git add … && git commit -m \"…\" && ./publicar.sh" >&2
    echo "  2) O publica sin commit:           ./publicar.sh --rsync --force" >&2
    exit 1
  fi
  if [[ "$MODE" == "rsync" && "$FORCE" -eq 0 ]]; then
    echo "Hay cambios locales. Usa --force para confirmar el despliegue por rsync." >&2
    exit 1
  fi
fi

echo "══════════════════════════════════════════"
echo "  Publicar catálogo musical"
echo "  Servidor: ${REMOTE}"
echo "  Modo:     ${MODE}"
echo "══════════════════════════════════════════"
echo ""

if [[ "$MODE" == "git" ]]; then
  if [[ "$DO_PUSH" -eq 1 ]]; then
    echo "→ Subiendo cambios a GitHub (${BRANCH})…"
    git push origin "HEAD:${BRANCH}"
  else
    echo "→ Omitiendo git push (--no-push)"
  fi

  echo "→ Actualizando código en el servidor (git pull)…"
  ssh_cmd "${REMOTE}" bash -s -- "${REMOTE_BASE}" "${BRANCH}" <<'REMOTE_GIT'
set -euo pipefail
BASE="$1"
BRANCH="$2"
cd "$BASE"
git fetch origin "$BRANCH"
git pull --ff-only origin "$BRANCH"
REMOTE_GIT
else
  echo "→ Sincronizando archivos por rsync…"
  rsync_cmd -avz --delete \
    --exclude node_modules \
    --exclude .next \
    --exclude music \
    --exclude .git \
    --exclude .env \
    --exclude .env.local \
    --exclude .env.deploy \
    "${ROOT}/" "${REMOTE}:${REMOTE_BASE}/"
fi

echo "→ Reconstruyendo Docker en el servidor (puede tardar varios minutos)…"
ssh_cmd "${REMOTE}" bash -s -- "${REMOTE_BASE}" <<'REMOTE_DOCKER'
set -euo pipefail
BASE="$1"
cd "$BASE"

# Contenedor antiguo que a veces bloquea el puerto 5001
docker stop catalogo-musica 2>/dev/null || true

bash deploy-docker.sh
docker compose up -d --force-recreate catalogo

echo ""
echo "→ Comprobando que la app responde…"
sleep 2
HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5001/ || true)"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Aviso: la app devolvió HTTP ${HTTP_CODE:-error}" >&2
  docker compose ps
  exit 1
fi

curl -sf http://localhost:5001/api/songs | head -c 120
echo ""
docker compose ps
REMOTE_DOCKER

echo ""
echo "══════════════════════════════════════════"
echo "  Despliegue completado"
echo "  Web: ${PUBLIC_URL}"
echo "  Recarga con Ctrl+Shift+R (o Ctrl+F5)"
echo "══════════════════════════════════════════"
