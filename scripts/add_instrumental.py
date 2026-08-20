#!/usr/bin/env python3
"""
Genera la versión sin voz a partir del audio con voz ya guardado en el catálogo.
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


def find_vocal_file(output_dir: Path, group_key: str) -> Path | None:
    exact = output_dir / f"{group_key} (con voz).wav"
    if exact.is_file():
        return exact

    prefix = f"{group_key} (con voz)"
    matches = sorted(
        p
        for p in output_dir.iterdir()
        if p.is_file() and p.stem == prefix
    )
    return matches[0] if matches else None


def emit(payload: dict) -> None:
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def main() -> int:
    if len(sys.argv) < 3:
        emit({"ok": False, "error": "Uso: add_instrumental.py <carpeta_salida> <group_key>"})
        return 1

    output_dir = Path(sys.argv[1]).expanduser().resolve()
    group_key = sys.argv[2].strip()
    if not group_key:
        emit({"ok": False, "error": "Falta el identificador de la canción."})
        return 1

    quitar_voz = resolve_quitar_voz()
    if not quitar_voz.is_dir():
        emit({"ok": False, "error": f"No se encuentra quitar-voz en {quitar_voz}."})
        return 1

    scripts_dir = str(Path(__file__).resolve().parent)
    if scripts_dir not in sys.path:
        sys.path.insert(0, scripts_dir)
    folder = str(quitar_voz)
    if folder not in sys.path:
        sys.path.insert(0, folder)

    from separation_runtime import apply_cpu_limits, resolve_separation_model_file, separate_instrumental

    apply_cpu_limits()
    os.environ["SEPARATION_MODEL_FILE"] = resolve_separation_model_file()

    try:
        from app import (
            _aplicar_ffmpeg_al_entorno,
            _comprobar_dependencias,
        )
    except ImportError as exc:
        emit({"ok": False, "error": f"No se pudieron cargar módulos de quitar-voz: {exc}"})
        return 1

    deps_err = _comprobar_dependencias()
    if deps_err:
        emit({"ok": False, "error": deps_err.replace("\n", " ")})
        return 1

    _aplicar_ffmpeg_al_entorno()

    vocal_file = find_vocal_file(output_dir, group_key)
    if not vocal_file:
        emit(
            {
                "ok": False,
                "error": "No hay versión con voz para esta canción. Añádela primero.",
            }
        )
        return 1

    inst_dest = output_dir / f"{group_key} (instrumental).wav"
    if inst_dest.exists():
        emit(
            {
                "ok": False,
                "error": f"Ya existe una versión sin voz: {inst_dest.name}",
            }
        )
        return 1

    path_instrumental, sep_msg = separate_instrumental(str(vocal_file))
    if not path_instrumental:
        emit({"ok": False, "error": sep_msg.replace("\n", " ")})
        return 1

    try:
        shutil.move(path_instrumental, inst_dest)
        inst_parent = Path(path_instrumental).parent
        if inst_parent.name.startswith("quitar_voz_"):
            shutil.rmtree(inst_parent, ignore_errors=True)

        emit(
            {
                "ok": True,
                "groupKey": group_key,
                "file": inst_dest.name,
                "sourceFile": vocal_file.name,
                "message": "Versión sin voz generada correctamente.",
            }
        )
        return 0
    except Exception as exc:  # noqa: BLE001
        emit({"ok": False, "error": str(exc)})
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
