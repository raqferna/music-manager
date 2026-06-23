#!/usr/bin/env bash
# Reinicia el catálogo y el túnel Cloudflare; muestra la URL pública nueva.
set -euo pipefail

echo "=== Catálogo local ==="
docker start app-catalogo 2>/dev/null || true
sleep 2
curl -s -o /dev/null -w "http://localhost:5001 -> HTTP %{http_code}\n" http://localhost:5001/ || echo "⚠️  El catálogo no responde en :5001"

echo ""
echo "=== Reiniciando túnel Cloudflare ==="
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
  echo "✅ Nueva URL pública:"
  echo "   $URL"
  echo ""
  echo "La URL anterior (fusion-occupational-…) ya no sirve: cambia cada vez que reinicias el túnel."
else
  echo "⚠️  No se encontró URL. Revisa:"
  echo "   docker logs tunel-fijo-catalogo"
fi
