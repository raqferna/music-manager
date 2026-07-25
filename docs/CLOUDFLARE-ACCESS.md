# Túnel fijo + Cloudflare Access

Guía para exponer Music Manager con **URL fija** y **login** (solo tú o quien autorices).

## Requisitos

- Cuenta [Cloudflare](https://dash.cloudflare.com/) (gratis)
- Un dominio con DNS en Cloudflare (plan Free vale)
- Docker en el HP con la app en el puerto `5001`

## Opción rápida: script asistente

En el HP, dentro del repo:

```bash
chmod +x scripts/setup-cloudflare-access.sh scripts/tunel-fijo.sh
./scripts/setup-cloudflare-access.sh
```

El script te guía por el panel de Cloudflare y crea `.env.tunnel`.

## Opción manual

### 1. Crear el túnel

1. [Zero Trust](https://one.dash.cloudflare.com/) → **Networks** → **Tunnels** → **Create a tunnel**
2. Conector: **Cloudflared**
3. Nombre: `music-manager`
4. En **Install connector** → Docker → copia el **token** (`eyJ…`)

### 2. Public Hostname

En el túnel → **Public Hostname** → **Add**:

| Campo | Valor |
|-------|--------|
| Subdomain | `musica` (o el que quieras) |
| Domain | tu dominio |
| Service | HTTP |
| URL | `localhost:5001` |

Quedará algo como `https://musica.tudominio.com`.

### 3. Cloudflare Access (obligatorio para uso público)

1. Zero Trust → **Access** → **Applications** → **Add an application**
2. Tipo: **Self-hosted**
3. Nombre: `Music Manager`
4. **Application domain**: `musica.tudominio.com` (el mismo del paso 2)
5. **Add a policy**:
   - Action: **Allow**
   - Include: **Emails** → `tu@email.com` (o varios)
6. Guardar

Al abrir la URL, Cloudflare pedirá un código por email (o login con Google si lo activas en **Settings → Authentication**).

### 4. Configurar el HP

```bash
cp .env.tunnel.example .env.tunnel
# Edita .env.tunnel:
#   CLOUDFLARE_TUNNEL_TOKEN=eyJ...
#   PUBLIC_HOSTNAME=musica.tudominio.com

./scripts/tunel-fijo.sh
```

## Despliegue diario

```bash
./deploy-docker.sh          # reinicia la app
# NO reinicies el túnel — la URL no cambia
```

Reinicia el túnel solo si falla o cambias el token:

```bash
./scripts/tunel-fijo.sh
```

## Comprobar

```bash
docker ps | grep -E 'app-catalogo|tunel-fijo'
curl -s -o /dev/null -w "local: %{http_code}\n" http://localhost:5001/
docker logs tunel-fijo-catalogo --tail 20
```

Abre `https://musica.tudominio.com` en el navegador: debe aparecer la pantalla de login de Cloudflare y, tras autenticarte, la app.

## Alternativa: config.yml (sin token)

Si prefieres `cloudflared tunnel create` en la CLI:

```bash
cloudflared tunnel login
cloudflared tunnel create music-manager
cp cloudflared/config.yml.example cloudflared/config.yml
# Edita UUID y hostname; copia el .json de credenciales a cloudflared/
cloudflared tunnel route dns music-manager musica.tudominio.com
```

Para Docker con config en lugar de token, monta `config.yml` y el JSON en un contenedor (ver `cloudflared/config.yml.example`).

## Seguridad

- **Access** protege el acceso web; sin él, cualquiera con la URL puede usar importación de YouTube y subir archivos.
- No indexes el sitio si no quieres que aparezca en Google (Access ya impide el acceso anónimo).
- `.env.tunnel` contiene secretos: no lo subas a git.

## Migrar desde túnel rápido (trycloudflare.com)

```bash
docker rm -f tunel-fijo-catalogo   # el viejo contenedor quick tunnel
./scripts/tunel-fijo.sh            # arranca túnel con nombre
```

La URL `*.trycloudflare.com` dejará de usarse.
