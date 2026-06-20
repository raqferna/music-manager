"use client";

import { useState } from "react";
import type { Song } from "@/lib/types";
import { X } from "./icons";

type Props = {
  song: Song;
  onClose: () => void;
  onSaved: () => void;
};

type Mode = "text" | "url";

export default function LyricsModal({ song, onClose, onSaved }: Props) {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const body =
        mode === "text"
          ? { baseName: song.baseName, title: song.title, lyrics: text }
          : { baseName: song.baseName, pdfUrl: url };
      const res = await fetch("/api/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    !loading &&
    ((mode === "text" && text.trim().length > 0) ||
      (mode === "url" && /^https?:\/\//i.test(url.trim())));

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 py-6 backdrop-blur-sm animate-fade-up"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="glass-strong w-full max-w-2xl overflow-hidden rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-white">
              Añadir letra · {song.title}
            </h2>
            <p className="truncate text-xs text-white/50">
              Se guardará como{" "}
              <code className="rounded bg-white/10 px-1">
                {song.baseName}.pdf
              </code>{" "}
              en la carpeta de música.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
            title="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="px-5 py-4">
          <div className="mb-4 flex gap-2 rounded-full border border-white/10 bg-white/5 p-1 text-sm">
            <button
              onClick={() => setMode("text")}
              className={`grow rounded-full px-3 py-1.5 transition ${
                mode === "text"
                  ? "bg-gradient-to-r from-violet-500 to-cyan-400 text-white shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Pegar texto
            </button>
            <button
              onClick={() => setMode("url")}
              className={`grow rounded-full px-3 py-1.5 transition ${
                mode === "url"
                  ? "bg-gradient-to-r from-violet-500 to-cyan-400 text-white shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Descargar PDF (URL)
            </button>
          </div>

          {mode === "text" ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Pega aquí la letra de "${song.title}"…\n\nCada línea aparecerá tal cual en el PDF.`}
              className="scroll-fancy h-72 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-violet-400/60 focus:bg-white/10"
            />
          ) : (
            <div className="space-y-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://ejemplo.com/letra.pdf"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-violet-400/60 focus:bg-white/10"
              />
              <p className="text-xs text-white/50">
                Pega un enlace directo a un archivo PDF y lo guardaré en tu
                carpeta.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-2xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-white/10 bg-white/[0.02] px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? "Guardando…" : "Guardar letra"}
          </button>
        </footer>
      </div>
    </div>
  );
}
