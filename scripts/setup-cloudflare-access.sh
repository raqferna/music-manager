#!/usr/bin/env bash
# Asistente para configurar túnel con URL fija + Cloudflare Access.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

section() {
  echo ""
  echo -e "${BOLD}=== $1 ===${NC}"
}

step() {
  echo ""
  echo -e "${BOLD}$1${NC}"
}

dim() {
  echo -e "${DIM}$1${NC}"
}

section "Cloudflare: túnel fijo + Access para Music Manager"

cat <<'EOF'

Necesitas:
  • Una cuenta Cloudflare (gratis)
  • Un dominio añadido a Cloudflare (DNS gestionado por Cloudflare)
  • Acceso SSH al HP (reichel@192.168.1.219)

EOF

read -r -p "¿Tienes ya un dominio en Cloudflare? [s/N] " tiene_dominio
tiene_dominio=$(echo "$tiene_dominio" | tr '[:upper:]' '[:lower:]')

if [[ ! "$tiene_dominio" =~ ^s|^si|^y|^yes ]]; then
  step "1. Añadir un dominio a Cloudflare"
  dim "  1. Entra en https://dash.cloudflare.com/"
  dim "  2. Add a site → introduce tu dominio"
  dim "  3. Elige plan Free"
  dim "  4. Cambia los nameservers en tu registrador a los que te indique Cloudflare"
  dim "  5. Espera a que el dominio quede Active (puede tardar unas horas)"
  echo ""
  read -r -p "Pulsa Enter cuando el dominio esté Active en Cloudflare…"
fi

step "2. Crear el túnel (Zero Trust)"
dim "  1. Abre https://one.dash.cloudflare.com/"
dim "  2. Networks → Tunnels → Create a tunnel"
dim "  3. Tipo: Cloudflared → Next"
dim "  4. Nombre del túnel: music-manager → Save tunnel"
dim "  5. En «Install connector» elige Docker y copia el TOKEN (empieza por eyJ…)"
dim "     No hace falta ejecutar el comando en el HP todavía."
echo ""
read -r -p "Pega aquí el CLOUDFLARE_TUNNEL_TOKEN: " TUNNEL_TOKEN

if [ -z "$TUNNEL_TOKEN" ]; then
  echo "❌ Token vacío. Vuelve a ejecutar el script cuando lo tengas."
  exit 1
fi

step "3. Public Hostname del túnel"
dim "  En la misma pantalla del túnel (o Tunnels → music-manager → Public Hostname):"
dim "  • Add a public hostname"
dim "  • Subdomain: musica  (o el que prefieras)"
dim "  • Domain: tu-dominio.com"
dim "  • Service type: HTTP"
dim "  • URL: localhost:5001"
dim "  → Save"
echo ""
read -r -p "¿Qué hostname quedó? (ej. musica.tudominio.com): " PUBLIC_HOSTNAME

if [ -z "$PUBLIC_HOSTNAME" ]; then
  echo "❌ Hostname vacío."
  exit 1
fi

step "4. Cloudflare Access (login antes de entrar)"
dim "  1. Zero Trust → Access → Applications → Add an application"
dim "  2. Self-hosted → Next"
dim "  3. Application name: Music Manager"
dim "  4. Session Duration: 24 hours (o lo que quieras)"
dim "  5. Add public hostname → Application domain: $PUBLIC_HOSTNAME"
dim "  6. Add a policy:"
dim "       Policy name: Solo yo"
dim "       Action: Allow"
dim "       Include → Emails → tu@email.com"
dim "       (puedes añadir varios emails o «Emails ending in @tudominio.com»)"
dim "  7. Next → Save application"
echo ""
read -r -p "¿Access ya configurado con tu email? [s/N] " access_ok
access_ok=$(echo "$access_ok" | tr '[:upper:]' '[:lower:]')

if [[ ! "$access_ok" =~ ^s|^si|^y|^yes ]]; then
  echo ""
  echo "Configura Access en el panel y vuelve a ejecutar:"
  echo "  ./scripts/tunel-fijo.sh"
  exit 0
fi

section "Guardando configuración en el HP"

ENV_FILE="$ROOT/.env.tunnel"
cat > "$ENV_FILE" <<EOF
# Generado por setup-cloudflare-access.sh — no subir a git
CLOUDFLARE_TUNNEL_TOKEN=$TUNNEL_TOKEN
PUBLIC_HOSTNAME=$PUBLIC_HOSTNAME
EOF
chmod 600 "$ENV_FILE"
echo "✅ Escrito $ENV_FILE"

section "Arrancando túnel"
"$ROOT/scripts/tunel-fijo.sh"

section "Listo"
cat <<EOF

  URL fija (con login): https://${PUBLIC_HOSTNAME}

  Flujo habitual:
    Desplegar cambios  →  ./deploy-docker.sh
    Reiniciar túnel    →  ./scripts/tunel-fijo.sh   (solo si falla o cambias token)

  El túnel rápido (trycloudflare.com) ya no hace falta:
    ./scripts/reiniciar-tunel.sh  ← URL aleatoria, sin Access

EOF
