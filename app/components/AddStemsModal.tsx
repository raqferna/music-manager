"use client";

import { useState } from "react";
import { STEM_IDS, STEM_LABELS } from "@/lib/stems";
import type { SongGroup } from "@/lib/types";
import { FileMusic, Loader, X } from "./icons";

type Props = {
  group: SongGroup;
  onClose: () => void;
  onSaved: () => void;
};

function notifyQueueChanged() {
  window.dispatchEvent(new CustomEvent("processing-queue-changed"));
}

export default function AddStemsModal({ group, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/songs/separate-stems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupKey: group.groupKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      notifyQueueChanged();
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  const sourceFile = group.vocalFile ?? group.instrumentalFile ?? "audio";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-strong w-full max-w-md rounded-3xl p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Separar instrumentos</h2>
            <p className="mt-1 text-sm text-white/60">
              Analiza <span className="text-white/80">{sourceFile}</span> y genera pistas
              independientes. Podrás silenciar batería, bajo, guitarra, piano, voz u otros
              durante la reproducción.
            </p>
            <p className="mt-2 text-xs text-amber-200/80">
              Proceso lento (varios minutos por canción). Se encolará en el servidor.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="mb-4 flex flex-wrap gap-1.5 text-[10px] uppercase tracking-wide">
          {STEM_IDS.map((id) => (
            <li
              key={id}
              className="rounded-full bg-white/5 px-2 py-0.5 text-white/60"
            >
              {STEM_LABELS[id]}
            </li>
          ))}
        </ul>

        {error ? <p className="mb-3 text-xs text-red-300/90">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin-slow" />
                Encolando…
              </>
            ) : (
              <>
                <FileMusic className="h-4 w-4" />
                Añadir a la cola
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
