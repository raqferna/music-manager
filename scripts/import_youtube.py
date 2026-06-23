#!/usr/bin/env python3
"""
Importa una canción desde YouTube al gestor de música:
descarga audio, quita la voz y devuelve metadatos básicos.

Reutiliza el proyecto quitar-voz (QUITAR_VOZ_PATH o ../quitar-voz).
Imprime un JSON en stdout como última línea.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import sys
from pathlib import Path


def resolve_quitar_voz() -> Path:
    configured = os.environ.get("QUITAR_VOZ_PATH", "").strip()
    if configured:
        return Path(configured).expanduser().resolve()
    return Path(__file__).resolve().parent.parent / "quitar-voz"


def safe_base_name(artist: str, title: str) -> str:
    raw = f"{artist} - {title}".strip(" -")
    cleaned = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", raw)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned[:120] or "cancion-youtube"


def parse_artist_title(video_title: str, uploader: str = "") -> tuple[str, str]:
    title = (video_title or "").strip()
    artist = (uploader or "").strip()
    if " - " in title:
        left, right = title.split(" - ", 1)
        if left.strip() and right.strip():
            return left.strip(), right.strip()
    return artist, title


def fetch_youtube_metadata(url: str) -> tuple[str, str]:
    import yt_dlp

    opts = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "extractor_args": {"youtube": {"player_client": ["android", "web"]}},
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)
    if not info:
        return "", ""
    title = str(info.get("title") or "")
    uploader = str(
        info.get("artist") or info.get("uploader") or info.get("channel") or ""
    )
    return parse_artist_title(title, uploader)


def resolve_separation_model_file() -> str:
    models = {
        "fast": "UVR-MDX-NET-Inst_3.onnx",
        "quality": "MDX23C-8KFFT-InstVoc_HQ.ckpt",
    }
    explicit = os.environ.get("SEPARATION_MODEL_FILE", "").strip()
    if explicit:
        return explicit
    mode = os.environ.get("SEPARATION_MODEL", "fast").strip().lower()
    if mode in models:
        return models[mode]
    if mode.endswith((".onnx", ".ckpt", ".pth")):
        return mode
    return models["fast"]


def emit(payload: dict) -> None:
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def main() -> int:
    if len(sys.argv) < 3:
        emit({"ok": False, "error": "Uso: import_youtube.py <url> <carpeta_salida>"})
        return 1

    url = sys.argv[1].strip()
    output_dir = Path(sys.argv[2]).expanduser().resolve()

    quitar_voz = resolve_quitar_voz()
    if not quitar_voz.is_dir():
        emit(
            {
                "ok": False,
                "error": f"No se encuentra quitar-voz en {quitar_voz}. Define QUITAR_VOZ_PATH.",
            }
        )
        return 1

    folder = str(quitar_voz)
    if folder not in sys.path:
        sys.path.insert(0, folder)

    os.environ["SEPARATION_MODEL_FILE"] = resolve_separation_model_file()

    try:
        from app import (
            _aplicar_ffmpeg_al_entorno,
            _comprobar_dependencias,
            _procesar_archivo,
            descargar_audio_youtube,
        )
    except ImportError as exc:
        emit(
            {
                "ok": False,
                "error": f"No se pudieron cargar módulos de quitar-voz: {exc}. "
                "¿Tienes instaladas las dependencias Python?",
            }
        )
        return 1

    deps_err = _comprobar_dependencias()
    if deps_err:
        emit({"ok": False, "error": deps_err.replace("\n", " ")})
        return 1

    _aplicar_ffmpeg_al_entorno()

    try:
        artist, title = fetch_youtube_metadata(url)
    except Exception:
        artist, title = "", ""

    path_audio, dl_err = descargar_audio_youtube(url)
    if dl_err or not path_audio:
        emit({"ok": False, "error": (dl_err or "No se descargó audio").replace("\n", " ")})
        return 1

    base_name = safe_base_name(artist, title)
    dir_descarga = os.path.dirname(path_audio)

    try:
        path_instrumental, sep_msg = _procesar_archivo(path_audio)
        if not path_instrumental:
            emit({"ok": False, "error": sep_msg.replace("\n", " ")})
            return 1

        output_dir.mkdir(parents=True, exist_ok=True)
        final_base = base_name
        n = 1
        while (output_dir / f"{final_base}.wav").exists():
            n += 1
            final_base = f"{base_name} ({n})"

        dest = output_dir / f"{final_base}.wav"
        shutil.move(path_instrumental, dest)

        inst_parent = Path(path_instrumental).parent
        if inst_parent.name.startswith("quitar_voz_"):
            shutil.rmtree(inst_parent, ignore_errors=True)

        emit(
            {
                "ok": True,
                "baseName": final_base,
                "artist": artist,
                "title": title,
                "file": dest.name,
                "lyrics": None,
                "lyricsSource": None,
                "hasLyrics": False,
                "message": "Instrumental guardado correctamente.",
            }
        )
        return 0
    finally:
        shutil.rmtree(dir_descarga, ignore_errors=True)


if __name__ == "__main__":
    raise SystemExit(main())
