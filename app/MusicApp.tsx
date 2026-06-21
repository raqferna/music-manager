"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Song } from "@/lib/types";
import SongList from "./components/SongList";
import Player from "./components/Player";
import PdfViewer from "./components/PdfViewer";
import LyricsModal from "./components/LyricsModal";
import MusicUploader from "./components/MusicUploader";
import { Disc, Search, FolderOpen } from "./components/icons";

type ApiResponse = { dir: string; songs: Song[] };

export default function MusicApp() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [musicDir, setMusicDir] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function refresh(selectFile?: string | null) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/songs", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();
      setSongs(data.songs);
      setMusicDir(data.dir);

      const preferred =
        selectFile ??
        (selectedFile && data.songs.some((s) => s.file === selectedFile)
          ? selectedFile
          : null);

      if (preferred && data.songs.some((s) => s.file === preferred)) {
        setSelectedFile(preferred);
      } else if (data.songs.length > 0) {
        setSelectedFile(data.songs[0].file);
      } else {
        setSelectedFile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function handleUploaded(files: string[]) {
    const last = files[files.length - 1];
    await refresh(last);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) || s.file.toLowerCase().includes(q),
    );
  }, [songs, query]);

  const selected = useMemo(
    () => songs.find((s) => s.file === selectedFile) ?? null,
    [songs, selectedFile],
  );

  function handleSelect(song: Song) {
    setSelectedFile(song.file);
    // Auto-play al cambiar de canción.
    requestAnimationFrame(() => {
      const el = audioRef.current;
      if (el) {
        el.currentTime = 0;
        void el.play().catch(() => undefined);
      }
    });
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-6 flex flex-col items-start justify-between gap-3 md:mb-8 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl glass-strong">
              <span className="animate-spin-slow">
                <Disc className="h-7 w-7 text-violet-300" />
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Music &amp; Lyrics Manager
              </h1>
              <p className="text-sm text-white/60">
                Reproduce tu música y visualiza las letras en PDF.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <FolderOpen className="h-4 w-4 text-violet-300" />
            <code className="rounded-lg bg-white/5 px-2 py-1 text-white/80">
              {musicDir || "Cargando…"}
            </code>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
          {/* Panel izquierdo: búsqueda + lista */}
          <section className="glass rounded-3xl p-4 md:p-5 animate-fade-up">
            <MusicUploader onUploaded={handleUploaded} compact />

            <div className="relative mb-4 mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar canción…"
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-violet-400/60 focus:bg-white/10"
              />
            </div>

            <div className="mb-3 flex items-center justify-between text-xs text-white/50">
              <span>
                {loading
                  ? "Cargando…"
                  : `${filtered.length} de ${songs.length} canciones`}
              </span>
              <button
                onClick={() => void refresh()}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Refrescar
              </button>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
                {error}
              </div>
            ) : songs.length === 0 && !loading ? (
              <EmptyState dir={musicDir} />
            ) : (
              <SongList
                songs={filtered}
                selectedFile={selectedFile}
                onSelect={handleSelect}
                onRequestLyrics={(s) => {
                  setSelectedFile(s.file);
                  setShowLyricsModal(true);
                }}
              />
            )}
          </section>

          {/* Panel derecho: visor + reproductor */}
          <section className="flex min-h-[70vh] flex-col gap-4">
            <div className="grow glass-strong rounded-3xl p-3 md:p-4 animate-fade-up">
              <PdfViewer
                song={selected}
                onAddLyrics={() => setShowLyricsModal(true)}
              />
            </div>
            <div className="glass-strong rounded-3xl p-4 md:p-5 animate-fade-up">
              <Player
                ref={audioRef}
                song={selected}
                onEnded={() => {
                  // Pasar a la siguiente
                  if (!selected) return;
                  const idx = songs.findIndex((s) => s.file === selected.file);
                  const next = songs[(idx + 1) % songs.length];
                  if (next) handleSelect(next);
                }}
                onPrev={() => {
                  if (!selected) return;
                  const idx = songs.findIndex((s) => s.file === selected.file);
                  const prev = songs[(idx - 1 + songs.length) % songs.length];
                  if (prev) handleSelect(prev);
                }}
                onNext={() => {
                  if (!selected) return;
                  const idx = songs.findIndex((s) => s.file === selected.file);
                  const next = songs[(idx + 1) % songs.length];
                  if (next) handleSelect(next);
                }}
              />
            </div>
          </section>
        </div>
      </div>

      {showLyricsModal && selected && (
        <LyricsModal
          song={selected}
          onClose={() => setShowLyricsModal(false)}
          onSaved={async () => {
            setShowLyricsModal(false);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function EmptyState({ dir }: { dir: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-center text-sm text-white/60">
      <p className="mb-1 text-white/80">Tu biblioteca está vacía.</p>
      <p>Usa la zona de arriba para subir archivos o colócalos en:</p>
      <code className="mt-2 inline-block rounded-lg bg-white/10 px-2 py-1 text-white/80">
        {dir}
      </code>
    </div>
  );
}
