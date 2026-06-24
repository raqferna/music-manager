"use client";

import { useState } from "react";
import type { SongGroup } from "@/lib/types";
import { Loader, Trash, X } from "./icons";

type DeleteScope = "all" | "instrumental" | "vocal" | "lyrics";

type Props = {
  group: SongGroup;
  onClose: () => void;
  onDeleted: (deletedGroupKey: string) => void;
};

type Option = {
  scope: DeleteScope;
  label: string;
  description: string;
  disabled?: boolean;
};

export default function DeleteSongModal({ group, onClose, onDeleted }: Props) {
  const [scope, setScope] = useState<DeleteScope>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options: Option[] = [
    {
      scope: "all",
      label: "Todo el pack",
      description: "Elimina sin voz, con voz y letra (si existen).",
      disabled: !group.hasInstrumental && !group.hasVocal && !group.hasLyrics,
    },
    {
      scope: "instrumental",
      label: "Solo sin voz",
      description: group.instrumentalFile ?? "No hay versión sin voz.",
      disabled: !group.hasInstrumental,
    },
    {
      scope: "vocal",
      label: "Solo con voz",
      description: group.vocalFile ?? "No hay versión con voz.",
      disabled: !group.hasVocal,
    },
    {
      scope: "lyrics",
      label: "Solo letra",
      description: "Elimina el PDF y el texto editable.",
      disabled: !group.hasLyrics,
    },
  ];

  const selected = options.find((o) => o.scope === scope && !o.disabled);
  const activeScope = selected?.scope ?? options.find((o) => !o.disabled)?.scope ?? "all";

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/songs/${encodeURIComponent(group.groupKey)}?scope=${activeScope}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      onDeleted(group.groupKey);
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
            <h2 className="text-lg font-semibold text-white">Eliminar canción</h2>
            <p className="mt-1 text-sm text-white/60">
              Elige qué quieres borrar de{" "}
              <span className="text-white/80">{group.title}</span>. Esta acción no
              se puede deshacer.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          {options.map((option) => (
            <label
              key={option.scope}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                option.disabled
                  ? "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-40"
                  : activeScope === option.scope
                    ? "border-red-400/40 bg-red-400/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                name="delete-scope"
                value={option.scope}
                checked={activeScope === option.scope}
                disabled={option.disabled}
                onChange={() => setScope(option.scope)}
                className="mt-1 accent-red-400"
              />
              <span>
                <span className="block text-sm font-medium text-white/90">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs text-white/50">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>

        {error ? <p className="mt-3 text-xs text-red-300/90">{error}</p> : null}

        <div className="mt-4 flex justify-end gap-2">
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
            onClick={() => void handleDelete()}
            disabled={loading || !selected}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500/90 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin-slow" />
                Eliminando…
              </>
            ) : (
              <>
                <Trash className="h-4 w-4" />
                Eliminar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
