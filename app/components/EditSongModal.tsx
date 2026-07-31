"use client";

import { useState } from "react";
import { downloadAudioFile, isYoutubeUrl } from "@/lib/audio";
import type { SongGroup } from "@/lib/types";
import { Download, Link, Loader, Mic, X } from "./icons";

type Props = {
  group: SongGroup;
  onClose: () => void;
  onSaved: (groupKey: string) => void;
  onUpdated: (groupKey: string) => void;
};

export default function EditSongModal({ group, onClose, onSaved, onUpdated }: Props) {
  const [name, setName] = useState(group.groupKey);
  const [vocalUrl, setVocalUrl] = useState("");
  const [loadingRename, setLoadingRename] = useState(false);
  const [loadingVocal, setLoadingVocal] = useState(false);
  const [loadingInstrumental, setLoadingInstrumental] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const busy = loadingRename || loadingVocal || loadingInstrumental;
  const activeGroupKey = group.groupKey;

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === group.groupKey) {
      return;
    }

    setLoadingRename(true);
    setError(null);
    setMessage(null);

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
      setLoadingRename(false);
    }
  }

  async function handleAddVocal(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = vocalUrl.trim();
    if (!trimmed || !isYoutubeUrl(trimmed)) {
      setError("Pega un enlace válido de YouTube.");
      return;
    }

    setLoadingVocal(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/songs/add-vocal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupKey: activeGroupKey, url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setMessage(data.message ?? "Versión con voz añadida.");
      setVocalUrl("");
      onUpdated(activeGroupKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoadingVocal(false);
    }
  }

  async function handleAddInstrumental() {
    setLoadingInstrumental(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/songs/add-instrumental", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupKey: activeGroupKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setMessage(data.message ?? "Encolada para generar sin voz.");
      window.dispatchEvent(new CustomEvent("processing-queue-changed"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoadingInstrumental(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-strong max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Gestionar canción</h2>
            <p className="mt-1 text-sm text-white/60">
              Renombra el pack o completa las versiones con voz y sin voz.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <section className="mb-5 space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-white/50">Nombre</h3>
          <form onSubmit={(e) => void handleRename(e)} className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-400/50 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={busy || !name.trim() || name.trim() === group.groupKey}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/5 disabled:opacity-50"
            >
              {loadingRename ? "Guardando…" : "Guardar nombre"}
            </button>
          </form>
        </section>

        <section className="space-y-4 border-t border-white/10 pt-5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-white/50">
            Versiones del pack
          </h3>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-white/85">Con voz</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                  group.hasVocal
                    ? "bg-violet-400/15 text-violet-200"
                    : "bg-white/10 text-white/45"
                }`}
              >
                {group.hasVocal ? "Sí" : "Falta"}
              </span>
            </div>
            {group.hasVocal && group.vocalFile ? (
              <div className="mt-2 flex items-center gap-2">
                <p className="min-w-0 grow truncate text-xs text-white/40">
                  {group.vocalFile}
                </p>
                <button
                  type="button"
                  title="Descargar con voz"
                  onClick={() => downloadAudioFile(group.vocalFile!)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-violet-400/25 bg-violet-400/10 px-2.5 py-1 text-[11px] text-violet-100 transition hover:bg-violet-400/20"
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => void handleAddVocal(e)} className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-white/45">
                  <Link className="h-3 w-3 text-cyan-300" />
                  Enlace de YouTube
                </div>
                <input
                  type="url"
                  value={vocalUrl}
                  onChange={(e) => setVocalUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=…"
                  disabled={busy}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-cyan-400/50 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={busy || !vocalUrl.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {loadingVocal ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin-slow" />
                      Descargando…
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Añadir con voz
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-white/85">Sin voz</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                  group.hasInstrumental
                    ? "bg-cyan-400/15 text-cyan-200"
                    : "bg-white/10 text-white/45"
                }`}
              >
                {group.hasInstrumental ? "Sí" : "Falta"}
              </span>
            </div>
            {group.hasInstrumental && group.instrumentalFile ? (
              <div className="mt-2 flex items-center gap-2">
                <p className="min-w-0 grow truncate text-xs text-white/40">
                  {group.instrumentalFile}
                </p>
                <button
                  type="button"
                  title="Descargar sin voz"
                  onClick={() => downloadAudioFile(group.instrumentalFile!)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 text-[11px] text-cyan-100 transition hover:bg-cyan-400/20"
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar
                </button>
              </div>
            ) : group.hasVocal ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-white/50">
                  Genera la pista sin voz a partir del audio con voz que ya tienes. Tarda
                  varios minutos.
                </p>
                <button
                  type="button"
                  onClick={() => void handleAddInstrumental()}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {loadingInstrumental ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin-slow" />
                      Generando…
                    </>
                  ) : (
                    "Añadir a la cola"
                  )}
                </button>
              </div>
            ) : (
              <p className="mt-2 text-xs text-white/45">
                Primero necesitas la versión con voz para poder generar la instrumental.
              </p>
            )}
          </div>
        </section>

        {message ? <p className="mt-4 text-xs text-emerald-200/90">{message}</p> : null}
        {error ? <p className="mt-4 text-xs text-red-300/90">{error}</p> : null}
      </div>
    </div>
  );
}
