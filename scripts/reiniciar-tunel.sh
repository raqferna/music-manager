#!/usr/bin/env bash
# Túnel RÁPIDO (URL aleatoria *.trycloudflare.com) — solo pruebas temporales.
# Para URL fija + login: usa ./scripts/setup-cloudflare-access.sh
set -euo pipefail

echo "⚠️  Modo túnel rápido: la URL cambia en cada reinicio."
echo "    Para URL fija y Cloudflare Access:"
echo "    ./scripts/setup-cloudflare-access.sh"
echo ""

read -r -p "¿Continuar con túnel rápido de todos modos? [s/N] " ok
ok=$(echo "${ok:-N}" | tr '[:upper:]' '[:lower:]')
if [[ ! "$ok" =~ ^s|^si|^y|^yes ]]; then
  echo "Cancelado."
  exit 0
fi

echo "=== Catálogo local ==="
docker start app-catalogo 2>/dev/null || true
sleep 2
curl -s -o /dev/null -w "http://localhost:5001 -> HTTP %{http_code}\n" http://localhost:5001/ || echo "⚠️  El catálogo no responde en :5001"

echo ""
echo "=== Reiniciando túnel rápido Cloudflare ==="
docker rm -f tunel-fijo-catalogo 2>/dev/null || true
docker run -d \
  --name tunel-fijo-catalogo \
  --restart unless-stopped \
  --network host \
  cloudflare/cloudflared:latest \
  tunnel --url http://localhost:5001

echo "Esperando URL (15 s)…"
sleep 15

URL=$(docker logs tunel-fijo-catalogo 2>&1 | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -1)

echo ""
if [ -n "$URL" ]; then
  echo "✅ URL pública (temporal, sin Access):"
  echo "   $URL"
else
  echo "⚠️  No se encontró URL. Revisa:"
  echo "   docker logs tunel-fijo-catalogo"
fi
