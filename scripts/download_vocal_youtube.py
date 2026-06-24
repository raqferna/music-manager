#!/usr/bin/env python3
"""
Descarga solo la versión con voz desde YouTube para emparejarla con un
instrumental ya existente. Guarda como «{groupKey} (con voz).wav».
"""

from __future__ import annotations

import json
import os
import shutil
import sys
from pathlib import Path


def resolve_quitar_voz() -> Path:
    configured = os.environ.get("QUITAR_VOZ_PATH", "").strip()
    if configured:
        return Path(configured).expanduser().resolve()
    return Path(__file__).resolve().parent.parent / "quitar-voz"


def emit(payload: dict) -> None:
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def main() -> int:
    if len(sys.argv) < 4:
        emit(
            {
                "ok": False,
                "error": "Uso: download_vocal_youtube.py <url> <carpeta_salida> <group_key>",
            }
        )
        return 1

    url = sys.argv[1].strip()
    output_dir = Path(sys.argv[2]).expanduser().resolve()
    group_key = sys.argv[3].strip()

    if not group_key:
        emit({"ok": False, "error": "Falta el identificador de la canción."})
        return 1

    quitar_voz = resolve_quitar_voz()
    if not quitar_voz.is_dir():
        emit({"ok": False, "error": f"No se encuentra quitar-voz en {quitar_voz}."})
        return 1

    folder = str(quitar_voz)
    if folder not in sys.path:
        sys.path.insert(0, folder)

    try:
        from app import _aplicar_ffmpeg_al_entorno, descargar_audio_youtube
    except ImportError as exc:
        emit({"ok": False, "error": f"No se pudieron cargar módulos de quitar-voz: {exc}"})
        return 1

    _aplicar_ffmpeg_al_entorno()

    dest_name = f"{group_key} (con voz).wav"
    dest = output_dir / dest_name
    if dest.exists():
        emit(
            {
                "ok": False,
                "error": f"Ya existe una versión con voz: {dest_name}",
            }
        )
        return 1

    path_audio, dl_err = descargar_audio_youtube(url)
    if dl_err or not path_audio:
        emit({"ok": False, "error": (dl_err or "No se descargó audio").replace("\n", " ")})
        return 1

    dir_descarga = os.path.dirname(path_audio)
    try:
        output_dir.mkdir(parents=True, exist_ok=True)
        shutil.move(path_audio, dest)
        emit(
            {
                "ok": True,
                "groupKey": group_key,
                "file": dest.name,
                "message": "Versión con voz guardada correctamente.",
            }
        )
        return 0
    finally:
        shutil.rmtree(dir_descarga, ignore_errors=True)


if __name__ == "__main__":
    raise SystemExit(main())
