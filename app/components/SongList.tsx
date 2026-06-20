"use client";

import type { Song } from "@/lib/types";
import { FileMusic, FileText, Plus } from "./icons";

type Props = {
  songs: Song[];
  selectedFile: string | null;
  onSelect: (song: Song) => void;
  onRequestLyrics: (song: Song) => void;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export default function SongList({
  songs,
  selectedFile,
  onSelect,
  onRequestLyrics,
}: Props) {
  if (songs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/50">
        Sin resultados para tu búsqueda.
      </div>
    );
  }

  return (
    <ul className="scroll-fancy max-h-[60vh] space-y-2 overflow-y-auto pr-1">
      {songs.map((song) => {
        const active = selectedFile === song.file;
        return (
          <li key={song.file}>
            <div
              className={`group flex items-center gap-3 rounded-2xl border p-3 transition cursor-pointer ${
                active
                  ? "border-violet-400/40 bg-violet-400/10 shadow-[0_0_0_1px_rgba(167,139,250,0.25)_inset]"
                  : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.06]"
              }`}
              onClick={() => onSelect(song)}
            >
              <div
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                  active ? "bg-violet-400/20 text-violet-200" : "bg-white/5 text-white/70"
                }`}
              >
                <FileMusic className="h-5 w-5" />
              </div>
              <div className="min-w-0 grow">
                <div className="truncate text-sm font-medium text-white/90">
                  {song.title}
                </div>
                <div className="truncate text-xs text-white/40">
                  {song.file} · {formatSize(song.size)}
                </div>
              </div>
              {song.hasLyrics ? (
                <span
                  title="Letra disponible"
                  className="flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-200"
                >
                  <FileText className="h-3 w-3" />
                  Letra
                </span>
              ) : (
                <button
                  title="Añadir letra"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestLyrics(song);
                  }}
                  className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white/70 transition hover:border-violet-400/40 hover:bg-violet-400/15 hover:text-violet-100"
                >
                  <Plus className="h-3 w-3" />
                  Letra
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
