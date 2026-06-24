#!/usr/bin/env python3
"""
Transcribe la letra de un archivo de audio con faster-whisper.
Imprime un JSON en stdout como última línea.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path


def emit(payload: dict) -> None:
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def main() -> int:
    if len(sys.argv) < 2:
        emit({"ok": False, "error": "Uso: transcribe_lyrics.py <ruta_audio>"})
        return 1

    audio_path = Path(sys.argv[1]).expanduser().resolve()
    if not audio_path.is_file():
        emit({"ok": False, "error": f"No se encuentra el audio: {audio_path}"})
        return 1

    model_name = os.environ.get("WHISPER_MODEL", "base").strip() or "base"
    language = os.environ.get("WHISPER_LANGUAGE", "es").strip() or "es"

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        emit(
            {
                "ok": False,
                "error": "faster-whisper no está instalado en el servidor.",
            }
        )
        return 1

    try:
        model = WhisperModel(model_name, device="cpu", compute_type="int8")
        segments, info = model.transcribe(
            str(audio_path),
            language=language,
            beam_size=5,
            vad_filter=True,
        )

        lines: list[str] = []
        for segment in segments:
            text = segment.text.strip()
            if text:
                lines.append(text)

        lyrics = "\n".join(lines).strip()
        if not lyrics:
            emit({"ok": False, "error": "No se detectó voz en el audio."})
            return 1

        emit(
            {
                "ok": True,
                "lyrics": lyrics,
                "language": info.language,
                "duration": info.duration,
                "model": model_name,
            }
        )
        return 0
    except Exception as exc:  # noqa: BLE001
        emit({"ok": False, "error": str(exc)})
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
