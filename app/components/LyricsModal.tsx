"use client";

import { useCallback, useEffect, useState } from "react";
import type { LyricSearchResult, SongGroup } from "@/lib/types";
import { Search, X } from "./icons";

type Props = {
  group: SongGroup;
  onClose: () => void;
  onSaved: () => void;
};

type Mode = "search" | "text" | "url";

function formatDuration(seconds?: number) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function LyricsModal({ group, onClose, onSaved }: Props) {
  const isEditing = group.hasLyrics;
  const [mode, setMode] = useState<Mode>(isEditing ? "text" : "search");
  const [searchQuery, setSearchQuery] = useState(group.title);
  const [results, setResults] = useState<LyricSearchResult[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [searching, setSearching] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEditing);
  const [missingSidecar, setMissingSidecar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!isEditing) return;

    void (async () => {
      setLoadingExisting(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/lyrics?baseName=${encodeURIComponent(group.groupKey)}`,
          { cache: "no-store" },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error ?? `HTTP ${res.status}`);
        }
        const data = (await res.json()) as {
          lyrics?: string;
          hasSidecar?: boolean;
          hasPdf?: boolean;
        };
        if (data.lyrics) {
          setText(data.lyrics);
          setMode("text");
        } else if (data.hasPdf && !data.hasSidecar) {
          setMissingSidecar(true);
          setMode("text");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoadingExisting(false);
      }
    })();
  }, [isEditing, group.groupKey]);

  const runSearch = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearched(false);
      return;
    }

    setSearching(true);
    setError(null);
    setSelectedId(null);
    setText("");
    setPreviewTitle("");

    try {
      const res = await fetch(`/api/lyrics/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResults(data.results ?? []);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setResults([]);
      setSearched(true);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (mode === "search" && !isEditing) {
      void runSearch(group.title);
    }
  }, [mode, group.title, runSearch, isEditing]);

  async function selectResult(result: LyricSearchResult) {
    if (!result.hasFullLyrics) {
      setError("Este resultado no tiene letra disponible. Prueba otro.");
      return;
    }

    setSelectedId(result.id);
    setLoadingPreview(true);
    setError(null);

    try {
      const res = await fetch(`/api/lyrics/search?id=${result.id}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setText(data.lyrics ?? "");
      setPreviewTitle(`${data.title} — ${data.artist}`);
    } catch (err) {
      setSelectedId(null);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const body =
        mode === "url"
          ? { baseName: group.groupKey, pdfUrl: url }
          : {
              baseName: group.groupKey,
              title: previewTitle || group.title,
              lyrics: text,
            };
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
    !loadingPreview &&
    !loadingExisting &&
    ((mode === "search" && selectedId !== null && text.trim().length > 0) ||
      (mode === "text" && text.trim().length > 0) ||
      (mode === "url" && /^https?:\/\//i.test(url.trim())));

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 py-6 backdrop-blur-sm animate-fade-up"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="glass-strong flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-white">
              {isEditing ? "Editar letra" : "Añadir letra"} · {group.title}
            </h2>
            <p className="truncate text-xs text-white/50">
              Se guardará como{" "}
              <code className="rounded bg-white/10 px-1">
                {group.groupKey}.pdf
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loadingExisting ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/50">
              Cargando letra guardada…
            </div>
          ) : (
            <>
          {missingSidecar && mode === "text" ? (
            <p className="mb-3 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
              Esta canción tiene PDF pero no texto editable guardado (p. ej. se importó
              desde una URL). Pega la letra abajo para regenerar el PDF.
            </p>
          ) : null}
          <div className="mb-4 flex gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-xs sm:text-sm">
            {(
              [
                ["search", "Buscar en internet"],
                ["text", "Pegar texto"],
                ["url", "PDF (URL)"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`grow rounded-full px-2 py-1.5 transition sm:px-3 ${
                  mode === key
                    ? "bg-gradient-to-r from-violet-500 to-cyan-400 text-white shadow"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "search" ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative min-w-0 grow">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void runSearch(searchQuery);
                    }}
                    placeholder={`Buscar letra de "${group.title}"…`}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-violet-400/60 focus:bg-white/10"
                  />
                </div>
                <button
                  onClick={() => void runSearch(searchQuery)}
                  disabled={searching || !searchQuery.trim()}
                  className="shrink-0 rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  {searching ? "Buscando…" : "Buscar"}
                </button>
              </div>

              <p className="text-xs text-white/50">
                Busca en LRCLib (base comunitaria de letras). Puedes añadir el
                nombre del artista para afinar, por ejemplo{" "}
                <em>Rozalén Te Vi</em>.
              </p>

              {searching ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/50">
                  Buscando letras en internet…
                </div>
              ) : searched && results.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center text-sm text-white/60">
                  <p className="text-white/80">Sin resultados.</p>
                  <p className="mt-2">
                    Prueba con otro título o artista, o usa{" "}
                    <button
                      type="button"
                      onClick={() => setMode("text")}
                      className="text-violet-300 underline underline-offset-2 hover:text-violet-200"
                    >
                      pegar el texto manualmente
                    </button>
                    .
                  </p>
                </div>
              ) : results.length > 0 ? (
                <ul className="scroll-fancy max-h-48 space-y-2 overflow-y-auto pr-1">
                  {results.map((result) => {
                    const active = selectedId === result.id;
                    const duration = formatDuration(result.duration);
                    return (
                      <li key={result.id}>
                        <button
                          type="button"
                          onClick={() => void selectResult(result)}
                          disabled={!result.hasFullLyrics || loadingPreview}
                          className={`w-full rounded-2xl border p-3 text-left transition ${
                            active
                              ? "border-violet-400/40 bg-violet-400/10"
                              : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-white/90">
                                {result.title}
                              </div>
                              <div className="truncate text-xs text-violet-200/80">
                                {result.artist}
                                {result.album ? ` · ${result.album}` : ""}
                              </div>
                            </div>
                            {duration ? (
                              <span className="shrink-0 text-[10px] text-white/40">
                                {duration}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-white/50">
                            {result.snippet}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              {loadingPreview ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center text-sm text-white/50">
                  Cargando letra completa…
                </div>
              ) : selectedId && text ? (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-white/70">
                    {isEditing ? "Letra (editable)" : "Vista previa"}
                    {previewTitle ? ` · ${previewTitle}` : ""}
                  </div>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="scroll-fancy h-40 w-full resize-y rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/80 outline-none transition focus:border-violet-400/60 focus:bg-white/10"
                  />
                </div>
              ) : null}
            </div>
          ) : mode === "text" ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Pega aquí la letra de "${group.title}"…\n\nCada línea aparecerá tal cual en el PDF.`}
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
            </>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-white/10 bg-white/[0.02] px-5 py-3">
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
            {loading ? "Guardando…" : isEditing ? "Guardar cambios" : "Guardar letra"}
          </button>
        </footer>
      </div>
    </div>
  );
}
