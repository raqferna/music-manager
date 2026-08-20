#!/usr/bin/env python3
"""
Separa una canción en stems individuales (voz, batería, bajo, guitarra, piano, otros).
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


def find_source_file(output_dir: Path, group_key: str) -> Path | None:
    """Prefiere la versión con voz; si no, instrumental u otro audio del grupo."""
    candidates = [
        output_dir / f"{group_key} (con voz).wav",
        output_dir / f"{group_key} (instrumental).wav",
    ]
    for path in candidates:
        if path.is_file():
            return path

    prefix = group_key
    matches = sorted(
        p
        for p in output_dir.iterdir()
        if p.is_file()
        and p.suffix.lower() in {".wav", ".mp3", ".flac", ".m4a"}
        and p.stem.startswith(prefix)
        and " (stem " not in p.stem
    )
    return matches[0] if matches else None


def existing_stems(output_dir: Path, group_key: str) -> list[str]:
    prefix = f"{group_key} (stem "
    return sorted(
        p.stem.replace(prefix, "").rstrip(")")
        for p in output_dir.iterdir()
        if p.is_file() and p.stem.startswith(prefix) and p.stem.endswith(")")
    )


def emit(payload: dict) -> None:
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def main() -> int:
    if len(sys.argv) < 3:
        emit({"ok": False, "error": "Uso: separate_stems.py <carpeta_salida> <group_key>"})
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

    from separation_runtime import apply_cpu_limits, stems_backend_error

    apply_cpu_limits()

    try:
        from app import (
            _aplicar_ffmpeg_al_entorno,
            _comprobar_dependencias,
            _procesar_stems,
        )
    except ImportError as exc:
        emit({"ok": False, "error": f"No se pudieron cargar módulos de quitar-voz: {exc}"})
        return 1

    deps_err = _comprobar_dependencias()
    if deps_err:
        emit({"ok": False, "error": deps_err.replace("\n", " ")})
        return 1

    stems_err = stems_backend_error()
    if stems_err:
        emit({"ok": False, "error": stems_err})
        return 1

    _aplicar_ffmpeg_al_entorno()

    already = existing_stems(output_dir, group_key)
    if already:
        emit(
            {
                "ok": False,
                "error": f"Esta canción ya tiene stems separados: {', '.join(already)}",
            }
        )
        return 1

    source = find_source_file(output_dir, group_key)
    if not source:
        emit(
            {
                "ok": False,
                "error": "No hay audio para esta canción. Importa o sube un archivo primero.",
            }
        )
        return 1

    stems_map, sep_msg = _procesar_stems(str(source))
    if not stems_map:
        emit({"ok": False, "error": sep_msg.replace("\n", " ")})
        return 1

    saved: dict[str, str] = {}
    temp_dirs: set[str] = set()

    try:
        for stem_id, src_path in stems_map.items():
            dest = output_dir / f"{group_key} (stem {stem_id}).wav"
            shutil.move(src_path, dest)
            saved[stem_id] = dest.name
            parent = Path(src_path).parent
            if parent.name.startswith("quitar_voz_stems_"):
                temp_dirs.add(str(parent))

        for td in temp_dirs:
            shutil.rmtree(td, ignore_errors=True)

        emit(
            {
                "ok": True,
                "groupKey": group_key,
                "stems": saved,
                "sourceFile": source.name,
                "message": f"Separados {len(saved)} instrumentos.",
            }
        )
        return 0
    except Exception as exc:  # noqa: BLE001
        emit({"ok": False, "error": str(exc)})
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
