"use client";

import { useMemo } from "react";
import type { SongGroup } from "@/lib/types";
import { FileText, Plus } from "./icons";

type Props = {
  group: SongGroup | null;
  onAddLyrics: () => void;
  onEditLyrics: () => void;
};

export default function PdfViewer({ group, onAddLyrics, onEditLyrics }: Props) {
  const src = useMemo(() => {
    if (!group?.hasLyrics) return null;
    return `/api/pdf/${encodeURIComponent(group.groupKey)}?v=${group.modifiedAt}`;
  }, [group]);

  if (!group) {
    return (
      <div className="grid h-full min-h-[40vh] place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-white/50">
        <div>
          <FileText className="mx-auto mb-3 h-10 w-10 text-white/30" />
          <p className="text-sm">Elige una canción para ver su letra.</p>
        </div>
      </div>
    );
  }

  if (!group.hasLyrics) {
    return (
      <div className="grid h-full min-h-[40vh] place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
        <div className="max-w-sm">
          <FileText className="mx-auto mb-3 h-10 w-10 text-white/30" />
          <h3 className="text-base font-medium text-white/90">
            Esta canción no tiene letra todavía
          </h3>
          <p className="mt-1 text-sm text-white/50">
            Busca la letra en internet, pega el texto manualmente o descarga un
            PDF desde una URL. Se guardará para las versiones con y sin voz.
          </p>
          <button
            onClick={onAddLyrics}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            Añadir letra
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[40vh] flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <FileText className="h-4 w-4 text-violet-300" />
          <span className="truncate">{group.title} — letra</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEditLyrics}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:bg-white/10"
          >
            Editar
          </button>
          <a
            href={src ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:bg-white/10"
          >
            Abrir en pestaña
          </a>
        </div>
      </div>
      <div className="grow overflow-hidden rounded-2xl border border-white/10 bg-white/95">
        {src ? (
          <object data={src} type="application/pdf" className="h-full w-full">
            <iframe src={src} className="h-full w-full" title="Letra en PDF" />
          </object>
        ) : null}
      </div>
    </div>
  );
}
