# Music & Lyrics Manager

Aplicación web local (Next.js + React + Tailwind v4) para gestionar tu música:
reproduce los archivos `.mp3` / `.wav` / `.m4a` / `.flac` / `.ogg` / `.aac` de
una carpeta y muestra junto a cada canción su letra en PDF.

Si una canción no tiene PDF, puedes:

- **Buscar en internet** (LRCLib) y elegir la letra correcta.
- **Pegar el texto** de la letra y la app lo convierte en PDF automáticamente.
- **Pegar la URL** de un PDF y la app lo descarga.

El archivo se guarda con el mismo nombre base que el audio (por ejemplo
`mi-cancion.mp3` → `mi-cancion.pdf`) en la misma carpeta.

## Requisitos

- Node.js 18.18+ (probado con Node 26).
- macOS / Linux / Windows.

## Configuración

Por defecto, la carpeta de música es `./music` dentro del proyecto. Puedes
cambiarla creando un archivo `.env` (o `.env.local`) con:

```
MUSIC_DIR=/Users/tu-usuario/Music/MiBiblioteca
```

Si la carpeta no existe se crea automáticamente al arrancar.

## Desarrollo

```bash
npm install
npm run dev
# abre http://localhost:3000
```

## Producción

```bash
npm run build
npm start
```

## Estructura

- `app/page.tsx` – punto de entrada que monta `MusicApp`.
- `app/MusicApp.tsx` – cliente principal: estado, datos y composición de UI.
- `app/components/` – `SongList`, `Player`, `PdfViewer`, `LyricsModal`, iconos.
- `app/api/songs` – lista las canciones y comprueba qué PDFs hay.
- `app/api/audio/[name]` – sirve el audio con soporte de Range para seek.
- `app/api/pdf/[base]` – sirve / borra el PDF emparejado a una canción.
- `app/api/lyrics` – genera el PDF (a partir de texto) o lo descarga (URL).
- `app/api/lyrics/search` – busca letras en internet (LRCLib) y obtiene el texto completo.
- `lib/musicDir.ts` – resuelve la carpeta de música y sanea nombres de archivo.

## Notas de seguridad

Esta app está pensada para uso **local**: el backend lee y escribe en una
carpeta de tu máquina. No la expongas públicamente sin añadir autenticación.
