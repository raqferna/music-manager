#!/usr/bin/env python3
"""Separación de voz (ONNX ligero) y stems (Demucs, opcional y pesado)."""

from __future__ import annotations

import os
import shutil
import sys
import tempfile
from pathlib import Path

VOCAL_MODELS = {
    "fast": "UVR-MDX-NET-Inst_3.onnx",
    "quality": "MDX23C-8KFFT-InstVoc_HQ.ckpt",
}

STEM_MIN_RAM_MB = 6144


def resolve_separation_model_file() -> str:
    explicit = os.environ.get("SEPARATION_MODEL_FILE", "").strip()
    if explicit:
        return explicit
    mode = os.environ.get("SEPARATION_MODEL", "fast").strip().lower()
    if mode in VOCAL_MODELS:
        return VOCAL_MODELS[mode]
    if mode.endswith((".onnx", ".ckpt", ".pth", ".yaml")):
        return mode
    return VOCAL_MODELS["fast"]


def available_ram_mb() -> int | None:
    try:
        with open("/proc/meminfo", encoding="utf-8") as fh:
            for line in fh:
                if line.startswith("MemAvailable:"):
                    return int(line.split()[1]) // 1024
    except OSError:
        return None
    return None


def apply_cpu_limits() -> None:
    """Evita que ONNX/BLAS usen todos los núcleos y tumben el HP."""
    for key in (
        "OMP_NUM_THREADS",
        "MKL_NUM_THREADS",
        "OPENBLAS_NUM_THREADS",
        "NUMEXPR_NUM_THREADS",
        "ONNXRUNTIME_INTRA_OP_NUM_THREADS",
    ):
        os.environ.setdefault(key, "2")
    os.environ.setdefault("ONNXRUNTIME_INTER_OP_NUM_THREADS", "1")


def _limpiar_cache_modelo(modelo: str) -> None:
    candidatos = [
        Path(tempfile.gettempdir()) / "audio-separator-models" / modelo,
        Path("/tmp/audio-separator-models") / modelo,
        Path.home() / ".cache" / "audio-separator-models" / modelo,
    ]
    for path in candidatos:
        try:
            if path.is_file():
                path.unlink()
        except OSError:
            pass


def _ruta_en_dir(dir_salida: str, archivo: str) -> str:
    if os.path.isabs(archivo) and os.path.isfile(archivo):
        return archivo
    if not os.path.dirname(archivo):
        return os.path.join(dir_salida, archivo)
    return archivo


def separate_instrumental(path_entrada: str) -> tuple[str | None, str]:
    """Quita la voz con el modelo rápido ONNX (o el de SEPARATION_MODEL_FILE)."""
    apply_cpu_limits()
    try:
        from audio_separator.separator import Separator
    except ImportError:
        return None, "No está instalado audio-separator en el Python del contenedor."

    dir_salida = tempfile.mkdtemp(prefix="quitar_voz_")
    modelo = resolve_separation_model_file()
    output_files = None

    for intento in (1, 2):
        try:
            separator = Separator(
                output_dir=dir_salida,
                output_single_stem="Instrumental",
            )
            separator.load_model(model_filename=modelo)
            output_files = separator.separate(path_entrada)
            break
        except KeyboardInterrupt:
            shutil.rmtree(dir_salida, ignore_errors=True)
            raise
        except SystemExit:
            if intento == 1:
                _limpiar_cache_modelo(modelo)
                continue
            shutil.rmtree(dir_salida, ignore_errors=True)
            return None, "El modelo de separación estaba corrupto. Reintenta la importación."
        except Exception as exc:  # noqa: BLE001
            err_txt = str(exc).lower()
            if intento == 1 and any(
                token in err_txt
                for token in ("failed finding central directory", "zip archive", "corrupt", "incomplete")
            ):
                _limpiar_cache_modelo(modelo)
                continue
            shutil.rmtree(dir_salida, ignore_errors=True)
            return None, f"Error al quitar la voz: {exc}"

    instrumental = None
    for raw in output_files or []:
        ruta = _ruta_en_dir(dir_salida, raw)
        if os.path.isfile(ruta) and "instrumental" in os.path.basename(ruta).lower():
            instrumental = ruta
            break
    if not instrumental:
        for raw in output_files or []:
            ruta = _ruta_en_dir(dir_salida, raw)
            if os.path.isfile(ruta):
                instrumental = ruta
                break

    if not instrumental or not os.path.isfile(instrumental):
        shutil.rmtree(dir_salida, ignore_errors=True)
        return None, "No se generó el archivo instrumental."

    nombre_base = Path(path_entrada).stem
    nombre_final = "".join(c for c in f"{nombre_base}_instrumental.wav" if c.isalnum() or c in "._- ")
    nombre_final = nombre_final.strip() or "instrumental.wav"
    ruta_final = os.path.join(dir_salida, nombre_final)
    if instrumental != ruta_final:
        shutil.move(instrumental, ruta_final)
    return os.path.abspath(ruta_final), "Instrumental generado."


def stems_backend_error() -> str | None:
    """Demucs 6s tumba un HP con poca RAM; fallar rápido en vez de colgarse."""
    try:
        import torch  # noqa: F401
    except ImportError:
        return (
            "La separación por instrumentos necesita PyTorch/Demucs y consume mucha RAM. "
            "En este servidor no está disponible (o no es seguro). "
            "Usa «Quitar voz» / «Generar sin voz», que sí funciona con el modelo rápido."
        )

    if sys.platform.startswith("linux"):
        ram = available_ram_mb()
        if ram is not None and ram < STEM_MIN_RAM_MB:
            return (
                f"Poca RAM libre ({ram} MB) para separar instrumentos (Demucs). "
                "Eso deja el servidor sin memoria y bloquea la descarga de YouTube. "
                "Usa solo «sin voz»; los stems requieren más de 6 GB libres."
            )
    return None
