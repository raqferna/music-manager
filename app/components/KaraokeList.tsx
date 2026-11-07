"use client";

import { useMemo, useState } from "react";
import { formatLabel, parseArtistTitle } from "@/lib/artistGroups";
import type { KaraokeVideo } from "@/lib/karaoke";
import { Film, Trash } from "./icons";

type Props = {
  videos: KaraokeVideo[];
  selectedId: string | null;
  canManage: boolean;
  onSelect: (video: KaraokeVideo) => void;
  onDeleted: (id: string) => void | Promise<void>;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

type Section = {
  artist: string;
  artistLabel: string;
  videos: KaraokeVideo[];
};

export default function KaraokeList({
  videos,
  selectedId,
  canManage,
  onSelect,
  onDeleted,
}: Props) {
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sections = useMemo<Section[]>(() => {
    const map = new Map<string, KaraokeVideo[]>();
    for (const video of videos) {
      const { artist } = parseArtistTitle(video.title);
      const list = map.get(artist) ?? [];
      list.push(video);
      map.set(artist, list);
    }
    return Array.from(map.entries()).map(([artist, items]) => ({
      artist,
      artistLabel: formatLabel(artist),
      videos: items,
    }));
  }, [videos]);

  async function confirmDelete(video: KaraokeVideo) {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/karaoke/${encodeURIComponent(video.id)}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      setPendingDelete(null);
      await onDeleted(video.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo borrar");
    } finally {
      setDeleting(false);
    }
  }

  if (videos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/50">
        Sin resultados para tu búsqueda.
      </div>
    );
  }

  return (
    <div className="scroll-fancy max-lg:overflow-visible space-y-5 pr-1 lg:max-h-[60vh] lg:overflow-y-auto">
      {error ? <p className="text-xs text-red-200">{error}</p> : null}
      {sections.map((section) => (
        <section key={section.artist}>
          <div className="artist-bar sticky top-0 z-10 mb-2 flex items-baseline gap-2 border-b border-white/10 bg-[#0f0a18]/95 px-1 py-2 backdrop-blur-sm">
            <h3 className="artist-label truncate text-sm font-semibold tracking-tight text-violet-200">
              {section.artistLabel}
            </h3>
            <span className="shrink-0 text-[10px] text-white/40">
              {section.videos.length} {section.videos.length === 1 ? "vídeo" : "vídeos"}
            </span>
          </div>
          <ul className="space-y-2">
            {section.videos.map((video) => {
              const active = selectedId === video.id;
              const { songTitle } = parseArtistTitle(video.title);
              return (
                <li key={video.id}>
                  <div
                    data-active={active ? "true" : "false"}
                    className={`song-row group flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${
                      active
                        ? "border-violet-400/40 bg-violet-400/10 shadow-[0_0_0_1px_rgba(167,139,250,0.25)_inset]"
                        : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.06]"
                    }`}
                    onClick={() => onSelect(video)}
                  >
                    <div
                      className={`song-mark grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl ${
                        active ? "bg-violet-400/20 text-violet-200" : "bg-white/5 text-white/70"
                      }`}
                    >
                      {video.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={video.thumbnailUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Film className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 grow">
                      <div className="truncate text-sm font-medium text-white/90">
                        {formatLabel(songTitle)}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-wide">
                        <span
                          className={`rounded-full px-2 py-0.5 ${
                            video.source === "youtube"
                              ? "bg-red-400/15 text-red-200"
                              : "bg-amber-400/15 text-amber-200"
                          }`}
                        >
                          {video.source === "youtube" ? "YouTube" : "Vídeo"}
                        </span>
                        {video.source === "file" ? (
                          <span className="normal-case text-white/35">{formatSize(video.size)}</span>
                        ) : null}
                      </div>
                    </div>
                    {canManage ? (
                      pendingDelete === video.id ? (
                        <div
                          className="flex shrink-0 flex-col items-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[10px] text-red-200">¿Borrar?</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={deleting}
                              onClick={() => void confirmDelete(video)}
                              className="rounded-full bg-red-400/20 px-2 py-0.5 text-[10px] text-red-100 hover:bg-red-400/30 disabled:opacity-50"
                            >
                              {deleting ? "…" : "Sí"}
                            </button>
                            <button
                              type="button"
                              disabled={deleting}
                              onClick={() => setPendingDelete(null)}
                              className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70 hover:bg-white/15"
                            >
                              No
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          title="Eliminar karaoke"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDelete(video.id);
                          }}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:border-red-400/40 hover:bg-red-400/15 hover:text-red-200"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      )
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
