#!/usr/bin/env bash
# Arranca el túnel con nombre (URL fija). No reiniciar al desplegar la app.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-$ROOT/.env.tunnel}"

echo "=== Comprobando app local ==="
for c in app-catalogo catalogo-musica; do
  docker start "$c" 2>/dev/null || true
done
sleep 2
if curl -sf -o /dev/null http://localhost:5001/; then
  echo "✅ App responde en http://localhost:5001"
else
  echo "⚠️  La app no responde. Arranca antes:"
  echo "   ./deploy-docker.sh"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo ""
  echo "❌ Falta $ENV_FILE"
  echo "   cp .env.tunnel.example .env.tunnel"
  echo "   # Edita .env.tunnel y pega CLOUDFLARE_TUNNEL_TOKEN"
  echo ""
  echo "   Guía completa: docs/CLOUDFLARE-ACCESS.md"
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

if [ -z "${CLOUDFLARE_TUNNEL_TOKEN:-}" ] || [ "$CLOUDFLARE_TUNNEL_TOKEN" = "eyJhIjoi..." ]; then
  echo "❌ CLOUDFLARE_TUNNEL_TOKEN no está configurado en $ENV_FILE"
  echo "   Guía: docs/CLOUDFLARE-ACCESS.md (paso 2)"
  exit 1
fi

echo ""
echo "=== Túnel con nombre (URL fija) ==="
docker rm -f tunel-fijo-catalogo 2>/dev/null || true
docker compose -f docker-compose.tunnel.yml --env-file "$ENV_FILE" up -d

sleep 3
if docker ps --format '{{.Names}}' | grep -q '^tunel-fijo-catalogo$'; then
  echo ""
  echo "✅ Túnel en marcha."
  echo ""
  if [ -n "${PUBLIC_HOSTNAME:-}" ]; then
    echo "   URL: https://${PUBLIC_HOSTNAME}"
  else
    echo "   Abre la URL que configuraste en Zero Trust → Tunnels → Public Hostname"
    echo "   (añade PUBLIC_HOSTNAME=musica.tudominio.com en .env.tunnel para verla aquí)"
  fi
  echo ""
  echo "   Logs: docker logs -f tunel-fijo-catalogo"
  echo ""
  echo "   Al desplegar cambios, usa solo ./deploy-docker.sh (no reinicies el túnel)."
else
  echo "❌ El contenedor no arrancó. Revisa:"
  echo "   docker logs tunel-fijo-catalogo"
  exit 1
fi
