"""
Ajustes de compatibilidad para yt-dlp (YouTube).

Las versiones recientes de yt-dlp necesitan un runtime de JavaScript (node/deno)
y el paquete yt-dlp-ejs para resolver los desafíos de YouTube; sin ellos muchas
descargas fallan con «Requested format is not available» o similares.
Además, quitar-voz fuerza player_client=android,web y el cliente android ya no
funciona sin PO token.

Este módulo parchea yt_dlp.YoutubeDL para que, sin tocar quitar-voz:
  - active los runtimes JS disponibles (node, deno, bun),
  - permita descargar el solver (ejs) desde GitHub si yt-dlp-ejs no está instalado,
  - ignore el player_client forzado y use los clientes por defecto de yt-dlp.
"""

from __future__ import annotations

import shutil


def _js_runtimes() -> dict:
    runtimes: dict = {}
    for name in ("deno", "node", "bun"):
        path = shutil.which(name)
        if path:
            runtimes[name] = {"path": path}
    return runtimes


def _has_ejs() -> bool:
    try:
        import yt_dlp_ejs  # noqa: F401
    except ImportError:
        return False
    return True


def install() -> None:
    import yt_dlp

    cls = yt_dlp.YoutubeDL
    if getattr(cls, "_aula_compat", False):
        return

    original_init = cls.__init__

    def patched_init(self, params=None, *args, **kwargs):
        params = dict(params or {})

        runtimes = _js_runtimes()
        if runtimes and "js_runtimes" not in params:
            params["js_runtimes"] = runtimes
        if not _has_ejs() and "remote_components" not in params:
            params["remote_components"] = ["ejs:github"]

        extractor_args = params.get("extractor_args")
        if isinstance(extractor_args, dict) and isinstance(
            extractor_args.get("youtube"), dict
        ):
            youtube_args = dict(extractor_args["youtube"])
            youtube_args.pop("player_client", None)
            extractor_args = dict(extractor_args)
            extractor_args["youtube"] = youtube_args
            params["extractor_args"] = extractor_args

        original_init(self, params, *args, **kwargs)

    cls.__init__ = patched_init
    cls._aula_compat = True
