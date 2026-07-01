"use client";

import { useMemo } from "react";
import { formatLabel, groupByArtist, parseArtistTitle } from "@/lib/artistGroups";
import type { SongGroup } from "@/lib/types";
import { FileMusic, FileText, Mic, Pencil, Plus, Trash } from "./icons";

type Props = {
  groups: SongGroup[];
  selectedGroupKey: string | null;
  onSelect: (group: SongGroup) => void;
  onRequestLyrics: (group: SongGroup) => void;
  onRequestVocal: (group: SongGroup) => void;
  onRequestEdit: (group: SongGroup) => void;
  onRequestDelete: (group: SongGroup) => void;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function SongRow({
  group,
  active,
  onSelect,
  onRequestLyrics,
  onRequestVocal,
  onRequestEdit,
  onRequestDelete,
}: {
  group: SongGroup;
  active: boolean;
  onSelect: (group: SongGroup) => void;
  onRequestLyrics: (group: SongGroup) => void;
  onRequestVocal: (group: SongGroup) => void;
  onRequestEdit: (group: SongGroup) => void;
  onRequestDelete: (group: SongGroup) => void;
}) {
  const { songTitle } = parseArtistTitle(group.groupKey);
  const displayTitle = formatLabel(songTitle);

  return (
    <li>
      <div
        className={`group flex items-center gap-3 rounded-2xl border p-3 transition cursor-pointer ${
          active
            ? "border-violet-400/40 bg-violet-400/10 shadow-[0_0_0_1px_rgba(167,139,250,0.25)_inset]"
            : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.06]"
        }`}
        onClick={() => onSelect(group)}
      >
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
            active ? "bg-violet-400/20 text-violet-200" : "bg-white/5 text-white/70"
          }`}
        >
          <FileMusic className="h-5 w-5" />
        </div>
        <div className="min-w-0 grow">
          <div className="truncate text-sm font-medium text-white/90">{displayTitle}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-wide">
            {group.hasInstrumental ? (
              <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-cyan-200">
                Sin voz
              </span>
            ) : null}
            {group.hasVocal ? (
              <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-violet-200">
                Con voz
              </span>
            ) : null}
            <span className="text-white/35 normal-case">{formatSize(group.size)}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Renombrar canción"
              onClick={(e) => {
                e.stopPropagation();
                onRequestEdit(group);
              }}
              className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:border-violet-400/40 hover:bg-violet-400/15 hover:text-violet-100"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Eliminar canción"
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete(group);
              }}
              className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:border-red-400/40 hover:bg-red-400/15 hover:text-red-200"
            >
              <Trash className="h-3.5 w-3.5" />
            </button>
          </div>
          {group.hasLyrics ? (
            <button
              type="button"
              title="Editar letra"
              onClick={(e) => {
                e.stopPropagation();
                onRequestLyrics(group);
              }}
              className="flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-400/25"
            >
              <FileText className="h-3 w-3" />
              Letra
            </button>
          ) : (
            <button
              title="Añadir letra"
              onClick={(e) => {
                e.stopPropagation();
                onRequestLyrics(group);
              }}
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white/70 transition hover:border-violet-400/40 hover:bg-violet-400/15 hover:text-violet-100"
            >
              <Plus className="h-3 w-3" />
              Letra
            </button>
          )}
          {!group.hasVocal && group.hasInstrumental ? (
            <button
              title="Descargar versión con voz desde YouTube"
              onClick={(e) => {
                e.stopPropagation();
                onRequestVocal(group);
              }}
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white/70 transition hover:border-cyan-400/40 hover:bg-cyan-400/15 hover:text-cyan-100"
            >
              <Mic className="h-3 w-3" />
              + Voz
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default function SongList({
  groups,
  selectedGroupKey,
  onSelect,
  onRequestLyrics,
  onRequestVocal,
  onRequestEdit,
  onRequestDelete,
}: Props) {
  const sections = useMemo(() => groupByArtist(groups), [groups]);

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/50">
        Sin resultados para tu búsqueda.
      </div>
    );
  }

  return (
    <div className="scroll-fancy max-h-[60vh] space-y-5 overflow-y-auto pr-1">
      {sections.map((section) => (
        <section key={section.artist}>
          <div className="sticky top-0 z-10 mb-2 flex items-baseline gap-2 border-b border-white/10 bg-[#0f0a18]/95 px-1 py-2 backdrop-blur-sm">
            <h3 className="truncate text-sm font-semibold tracking-tight text-violet-200">
              {section.artistLabel}
            </h3>
            <span className="shrink-0 text-[10px] text-white/40">
              {section.groups.length}{" "}
              {section.groups.length === 1 ? "canción" : "canciones"}
            </span>
          </div>
          <ul className="space-y-2">
            {section.groups.map((group) => (
              <SongRow
                key={group.groupKey}
                group={group}
                active={selectedGroupKey === group.groupKey}
                onSelect={onSelect}
                onRequestLyrics={onRequestLyrics}
                onRequestVocal={onRequestVocal}
                onRequestEdit={onRequestEdit}
                onRequestDelete={onRequestDelete}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
