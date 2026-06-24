"use client";

import { useState } from "react";
import type { SongGroup } from "@/lib/types";
import { Loader, X } from "./icons";

type Props = {
  group: SongGroup;
  onClose: () => void;
  onSaved: (newGroupKey: string) => void;
};

export default function EditSongModal({ group, onClose, onSaved }: Props) {
  const [name, setName] = useState(group.groupKey);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === group.groupKey) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/songs/${encodeURIComponent(group.groupKey)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newGroupKey: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      onSaved(data.newGroupKey ?? trimmed);
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
            <h2 className="text-lg font-semibold text-white">Renombrar canción</h2>
            <p className="mt-1 text-sm text-white/60">
              Cambia el nombre del pack. Se renombrarán los archivos de audio, el
              PDF y la letra asociados.
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
          <label className="block text-xs font-medium uppercase tracking-wide text-white/50">
            Nombre (artista - título)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-violet-400/50 disabled:opacity-60"
          />
          <p className="text-xs text-white/40">
            Ejemplo: Rozalén - Te Vi. Los sufijos «(con voz)» e «(instrumental)» se
            mantienen automáticamente.
          </p>
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
              disabled={loading || !name.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin-slow" />
                  Guardando…
                </>
              ) : (
                "Guardar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
