"use client";

import { useEffect, useMemo, useState } from "react";
import type { LibraryFolder } from "@/lib/types";
import FolderSelect from "./FolderSelect";
import { X } from "./icons";

type CatalogSong = {
  groupKey: string;
  hasVocal: boolean;
  hasInstrumental: boolean;
  hasLyrics: boolean;
  hasStems: boolean;
};

type Props = {
  folders?: LibraryFolder[];
  onClose: () => void;
  onImported: () => void;
};

export default function CatalogImportModal({ folders = [], onClose, onImported }: Props) {
  const [songs, setSongs] = useState<CatalogSong[]>([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [folderId, setFolderId] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/catalog", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { available?: boolean; groups?: CatalogSong[]; error?: string }) => {
        if (data.error) setError(data.error);
        setAvailable(Boolean(data.available));
        setSongs(data.groups ?? []);
      })
      .catch(() => setError("No se pudo leer el catálogo personal"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter((song) => song.groupKey.toLowerCase().includes(q));
  }, [songs, query]);

  function toggle(groupKey: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  }

  async function importSelected() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupKeys: [...selected], folderId }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "No se pudo copiar");
        return;
      }
      setMessage(data?.message ?? "Copiadas");
      onImported();
    } catch {
      setError("No se pudo copiar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-strong flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl p-5 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-white">Del catálogo personal</h2>
            <p className="mt-1 text-sm text-white/60">
              Elige las canciones. Se copian con voz, sin voz y letra, sin volver a procesarlas.
              La clase solo verá las que importes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? <p className="text-sm text-white/50">Cargando catálogo…</p> : null}
        {!loading && !available ? (
          <p className="text-sm text-white/70">El catálogo personal no está conectado a este aula.</p>
        ) : null}

        {available && !loading ? (
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en tu catálogo…"
              className="mb-3 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-400/60"
            />
            <ul className="scroll-fancy min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
              {filtered.map((song) => (
                <li key={song.groupKey}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={selected.has(song.groupKey)}
                      onChange={() => toggle(song.groupKey)}
                      className="mt-1"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-white/90">{song.groupKey}</span>
                      <span className="text-[10px] uppercase tracking-wide text-white/40">
                        {song.hasVocal ? "con voz " : ""}
                        {song.hasInstrumental ? "sin voz " : ""}
                        {song.hasLyrics ? "letra" : ""}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {error ? <p className="mt-3 text-sm text-red-200">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-emerald-200">{message}</p> : null}

        <FolderSelect
          folders={folders}
          value={folderId}
          onChange={setFolderId}
          disabled={busy}
          label="Copiar a"
          className="mt-3"
        />

        <button
          type="button"
          disabled={busy || selected.size === 0}
          onClick={() => void importSelected()}
          className="aula-cta mt-4 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-40"
        >
          {busy ? "Copiando…" : `Importar ${selected.size || ""}`.trim()}
        </button>
      </div>
    </div>
  );
}
