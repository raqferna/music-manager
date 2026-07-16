#!/usr/bin/env bash
# Alias de scripts/publicar.sh (compatibilidad).
exec "$(cd "$(dirname "$0")" && pwd)/publicar.sh" "$@"
