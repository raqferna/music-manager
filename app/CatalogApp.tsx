"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { matchesSearch } from "@/lib/artistGroups";
import type { SongGroup } from "@/lib/types";
import AddVocalModal from "./components/AddVocalModal";
import DeleteSongModal from "./components/DeleteSongModal";
import EditSongModal from "./components/EditSongModal";
import SongList from "./components/SongList";
import Player, { type PlaybackVariant } from "./components/Player";
import PdfViewer from "./components/PdfViewer";
import LyricsModal from "./components/LyricsModal";
import MusicUploader from "./components/MusicUploader";
import YoutubeImporter from "./components/YoutubeImporter";
import { Disc, Search, FolderOpen } from "./components/icons";

type ApiResponse = { dir: string; groups: SongGroup[] };

export default function CatalogApp() {
  const [groups, setGroups] = useState<SongGroup[]>([]);
  const [musicDir, setMusicDir] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [playbackVariant, setPlaybackVariant] = useState<PlaybackVariant>("instrumental");
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [showVocalModal, setShowVocalModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionGroup, setActionGroup] = useState<SongGroup | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function refresh(preferGroupKey?: string | null) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/songs", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();
      setGroups(data.groups);
      setMusicDir(data.dir);

      const preferred =
        preferGroupKey ??
        (selectedGroupKey && data.groups.some((g) => g.groupKey === selectedGroupKey)
          ? selectedGroupKey
          : null);

      if (preferred && data.groups.some((g) => g.groupKey === preferred)) {
        setSelectedGroupKey(preferred);
      } else if (data.groups.length > 0) {
        setSelectedGroupKey(data.groups[0].groupKey);
      } else {
        setSelectedGroupKey(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function handleImported(groupKey: string) {
    await refresh(groupKey);
  }

  async function handleUploaded(_files: string[]) {
    await refresh();
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return groups;
    return groups.filter((g) => matchesSearch(g, q));
  }, [groups, query]);

  const selected = useMemo(
    () => groups.find((g) => g.groupKey === selectedGroupKey) ?? null,
    [groups, selectedGroupKey],
  );

  useEffect(() => {
    if (!selected) return;
    if (playbackVariant === "instrumental" && !selected.hasInstrumental && selected.hasVocal) {
      setPlaybackVariant("vocal");
    }
    if (playbackVariant === "vocal" && !selected.hasVocal && selected.hasInstrumental) {
      setPlaybackVariant("instrumental");
    }
  }, [selected, playbackVariant]);

  function handleSelect(group: SongGroup) {
    setSelectedGroupKey(group.groupKey);
    setPlaybackVariant(group.hasInstrumental ? "instrumental" : "vocal");
    requestAnimationFrame(() => {
      const el = audioRef.current;
      if (el) {
        el.currentTime = 0;
        void el.play().catch(() => undefined);
      }
    });
  }

  function handleVariantChange(variant: PlaybackVariant) {
    setPlaybackVariant(variant);
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
                Catálogo Musical
              </h1>
              <p className="text-sm text-white/60">
                Importa canciones, alterna con/sin voz y añade letras en PDF.
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
          <section className="glass rounded-3xl p-4 md:p-5 animate-fade-up">
            <div className="space-y-5">
              <YoutubeImporter onImported={handleImported} />
              <div className="border-t border-white/10" />
              <MusicUploader onUploaded={handleUploaded} compact />
            </div>

            <div className="relative mb-4 mt-5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar cantante o canción…"
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-violet-400/60 focus:bg-white/10"
              />
            </div>

            <div className="mb-3 flex items-center justify-between text-xs text-white/50">
              <span>
                {loading
                  ? "Cargando…"
                  : `${filtered.length} de ${groups.length} canciones`}
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
            ) : groups.length === 0 && !loading ? (
              <EmptyState dir={musicDir} />
            ) : (
              <SongList
                groups={filtered}
                selectedGroupKey={selectedGroupKey}
                onSelect={handleSelect}
                onRequestLyrics={(g) => {
                  setSelectedGroupKey(g.groupKey);
                  setShowLyricsModal(true);
                }}
                onRequestVocal={(g) => {
                  setSelectedGroupKey(g.groupKey);
                  setShowVocalModal(true);
                }}
                onRequestEdit={(g) => {
                  setActionGroup(g);
                  setShowEditModal(true);
                }}
                onRequestDelete={(g) => {
                  setActionGroup(g);
                  setShowDeleteModal(true);
                }}
              />
            )}
          </section>

          <section className="flex min-h-[70vh] flex-col gap-4">
            <div className="grow glass-strong rounded-3xl p-3 md:p-4 animate-fade-up">
              <PdfViewer
                group={selected}
                onAddLyrics={() => setShowLyricsModal(true)}
                onEditLyrics={() => setShowLyricsModal(true)}
              />
            </div>
            <div className="glass-strong rounded-3xl p-4 md:p-5 animate-fade-up">
              <Player
                ref={audioRef}
                group={selected}
                variant={playbackVariant}
                onVariantChange={handleVariantChange}
                onEnded={() => {
                  if (!selected) return;
                  const idx = groups.findIndex((g) => g.groupKey === selected.groupKey);
                  const next = groups[(idx + 1) % groups.length];
                  if (next) handleSelect(next);
                }}
                onPrev={() => {
                  if (!selected) return;
                  const idx = groups.findIndex((g) => g.groupKey === selected.groupKey);
                  const prev = groups[(idx - 1 + groups.length) % groups.length];
                  if (prev) handleSelect(prev);
                }}
                onNext={() => {
                  if (!selected) return;
                  const idx = groups.findIndex((g) => g.groupKey === selected.groupKey);
                  const next = groups[(idx + 1) % groups.length];
                  if (next) handleSelect(next);
                }}
              />
            </div>
          </section>
        </div>
      </div>

      {showLyricsModal && selected ? (
        <LyricsModal
          group={selected}
          onClose={() => setShowLyricsModal(false)}
          onSaved={async () => {
            setShowLyricsModal(false);
            await refresh(selected.groupKey);
          }}
        />
      ) : null}

      {showVocalModal && selected ? (
        <AddVocalModal
          group={selected}
          onClose={() => setShowVocalModal(false)}
          onSaved={async () => {
            setShowVocalModal(false);
            await refresh(selected.groupKey);
            setPlaybackVariant("vocal");
          }}
        />
      ) : null}

      {showEditModal && actionGroup ? (
        <EditSongModal
          group={actionGroup}
          onClose={() => {
            setShowEditModal(false);
            setActionGroup(null);
          }}
          onSaved={async (newGroupKey) => {
            setShowEditModal(false);
            setActionGroup(null);
            await refresh(newGroupKey);
          }}
        />
      ) : null}

      {showDeleteModal && actionGroup ? (
        <DeleteSongModal
          group={actionGroup}
          onClose={() => {
            setShowDeleteModal(false);
            setActionGroup(null);
          }}
          onDeleted={async (deletedGroupKey) => {
            setShowDeleteModal(false);
            setActionGroup(null);
            if (selectedGroupKey === deletedGroupKey) {
              setSelectedGroupKey(null);
            }
            await refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function EmptyState({ dir }: { dir: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-center text-sm text-white/60">
      <p className="mb-1 text-white/80">Tu catálogo está vacío.</p>
      <p>Pega un enlace de YouTube arriba o sube archivos manualmente.</p>
      <p className="mt-2">También puedes copiar audios directamente en:</p>
      <code className="mt-2 inline-block rounded-lg bg-white/10 px-2 py-1 text-white/80">
        {dir}
      </code>
    </div>
  );
}
