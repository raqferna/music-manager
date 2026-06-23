"use client";

import { useState } from "react";
import { isYoutubeUrl } from "@/lib/audio";
import type { SongGroup } from "@/lib/types";
import { Link, Loader, X } from "./icons";

type Props = {
  group: SongGroup;
  onClose: () => void;
  onSaved: () => void;
};

export default function AddVocalModal({ group, onClose, onSaved }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    if (!isYoutubeUrl(trimmed)) {
      setError("Pega un enlace válido de YouTube.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/songs/add-vocal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupKey: group.groupKey, url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-strong w-full max-w-md rounded-3xl p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Añadir versión con voz</h2>
            <p className="mt-1 text-sm text-white/60">
              Descarga el audio original de YouTube y lo empareja con{" "}
              <span className="text-white/80">{group.title}</span>. Tarda unos minutos,
              no hace falta quitar la voz otra vez.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-white/50">
            <Link className="h-3.5 w-3.5 text-cyan-300" />
            Enlace de YouTube
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            disabled={loading}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-cyan-400/50 disabled:opacity-60"
          />
          {error ? <p className="text-xs text-red-300/90">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin-slow" />
                  Descargando…
                </>
              ) : (
                "Descargar con voz"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
