"use client";

import { useMemo, useState } from "react";
import { UNFILED_FOLDER_LABEL } from "@/lib/libraryFoldersShared";
import type { LibraryFolder, SongGroup } from "@/lib/types";
import { FileMusic, FileText, FolderOpen, Mic, Pencil, Plus, Trash, X } from "./icons";

type Props = {
  groups: SongGroup[];
  folders: LibraryFolder[];
  selectedGroupKey: string | null;
  onSelect: (group: SongGroup) => void;
  onRequestLyrics: (group: SongGroup) => void;
  onRequestVocal: (group: SongGroup) => void;
  onRequestInstrumental: (group: SongGroup) => void;
  onRequestStems: (group: SongGroup) => void;
  onRequestEdit: (group: SongGroup) => void;
  onRequestDelete: (group: SongGroup) => void;
  onCreateFolder?: (name: string) => Promise<void>;
  onRenameFolder?: (folderId: string, name: string) => Promise<void>;
  onDeleteFolder?: (folderId: string) => Promise<void>;
  onMoveSong?: (group: SongGroup, folderId: string | null) => Promise<void>;
  canManage?: boolean;
  canEditLyrics?: boolean;
  searching?: boolean;
};

type FolderSection = {
  folderId: string | null;
  folderName: string;
  groups: SongGroup[];
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
  folders,
  active,
  onSelect,
  onRequestLyrics,
  onRequestVocal,
  onRequestInstrumental,
  onRequestStems,
  onRequestEdit,
  onRequestDelete,
  onMoveSong,
  canManage,
  canEditLyrics,
}: {
  group: SongGroup;
  folders: LibraryFolder[];
  active: boolean;
  onSelect: (group: SongGroup) => void;
  onRequestLyrics: (group: SongGroup) => void;
  onRequestVocal: (group: SongGroup) => void;
  onRequestInstrumental: (group: SongGroup) => void;
  onRequestStems: (group: SongGroup) => void;
  onRequestEdit: (group: SongGroup) => void;
  onRequestDelete: (group: SongGroup) => void;
  onMoveSong?: (group: SongGroup, folderId: string | null) => Promise<void>;
  canManage: boolean;
  canEditLyrics: boolean;
}) {
  const [moving, setMoving] = useState(false);

  return (
    <li>
      <div
        data-active={active ? "true" : "false"}
        className={`song-row group flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${
          active
            ? "border-violet-400/40 bg-violet-400/10 shadow-[0_0_0_1px_rgba(167,139,250,0.25)_inset]"
            : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.06]"
        }`}
        onClick={() => onSelect(group)}
      >
        <div
          className={`song-mark grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
            active ? "bg-violet-400/20 text-violet-200" : "bg-white/5 text-white/70"
          }`}
        >
          <FileMusic className="h-5 w-5" />
        </div>
        <div className="min-w-0 grow">
          <div className="truncate text-sm font-medium text-white/90">{group.title}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-wide">
            {group.hasInstrumental ? (
              <span className="tone-instrumental rounded-full bg-cyan-400/15 px-2 py-0.5 text-cyan-200">
                Sin voz
              </span>
            ) : null}
            {group.hasVocal ? (
              <span className="tone-vocal rounded-full bg-violet-400/15 px-2 py-0.5 text-violet-200">
                Con voz
              </span>
            ) : null}
            {group.hasStems ? (
              <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-amber-200">
                Instrumentos
              </span>
            ) : null}
            <span className="text-white/35 normal-case">{formatSize(group.size)}</span>
          </div>
          {canManage && onMoveSong && folders.length > 0 ? (
            <select
              value={group.folderId ?? ""}
              disabled={moving}
              title="Mover a carpeta"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const next = e.target.value || null;
                setMoving(true);
                void onMoveSong(group, next).finally(() => setMoving(false));
              }}
              className="mt-2 max-w-full rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-white/70 outline-none"
            >
              <option value="">{UNFILED_FOLDER_LABEL}</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          ) : null}
        </div>
        {canEditLyrics && !canManage ? (
          group.hasLyrics ? (
            <button
              type="button"
              title="Editar letra"
              onClick={(e) => {
                e.stopPropagation();
                onRequestLyrics(group);
              }}
              className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-400/25"
            >
              <FileText className="h-3 w-3" />
              Letra
            </button>
          ) : (
            <button
              type="button"
              title="Añadir letra"
              onClick={(e) => {
                e.stopPropagation();
                onRequestLyrics(group);
              }}
              className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white/70 transition hover:border-violet-400/40 hover:bg-violet-400/15 hover:text-violet-100"
            >
              <Plus className="h-3 w-3" />
              Letra
            </button>
          )
        ) : null}
        {canManage ? (
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
                    title="Gestionar canción (renombrar, añadir con/sin voz)"
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
          {!group.hasInstrumental && group.hasVocal ? (
            <button
              title="Generar versión sin voz desde el audio con voz"
              onClick={(e) => {
                e.stopPropagation();
                onRequestInstrumental(group);
              }}
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white/70 transition hover:border-violet-400/40 hover:bg-violet-400/15 hover:text-violet-100"
            >
              <FileMusic className="h-3 w-3" />
              + Sin voz
            </button>
          ) : null}
          {!group.hasStems && (group.hasVocal || group.hasInstrumental) ? (
            <button
              title="Separar batería, bajo, guitarra, piano, etc."
              onClick={(e) => {
                e.stopPropagation();
                onRequestStems(group);
              }}
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white/70 transition hover:border-amber-400/40 hover:bg-amber-400/15 hover:text-amber-100"
            >
              <FileMusic className="h-3 w-3" />
              + Stems
            </button>
          ) : null}
        </div>
        ) : null}
      </div>
    </li>
  );
}

function FolderHeader({
  section,
  canManage,
  renaming,
  onStartRename,
  onCancelRename,
  onRename,
  onDelete,
}: {
  section: FolderSection;
  canManage: boolean;
  renaming: boolean;
  onStartRename: () => void;
  onCancelRename: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(section.folderName);

  return (
    <div className="artist-bar sticky top-0 z-10 mb-2 flex items-center gap-2 border-b border-white/10 bg-[#0f0a18]/95 px-1 py-2 backdrop-blur-sm">
      <FolderOpen className="h-4 w-4 shrink-0 text-violet-300" />
      {renaming && section.folderId ? (
        <form
          className="flex min-w-0 grow items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onRename(name);
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="min-w-0 grow rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-sm text-white outline-none"
          />
          <button type="submit" className="text-xs text-violet-200">
            Guardar
          </button>
          <button type="button" onClick={onCancelRename} className="grid h-6 w-6 place-items-center text-white/50">
            <X className="h-3.5 w-3.5" />
          </button>
        </form>
      ) : (
        <>
          <h3 className="artist-label min-w-0 truncate text-sm font-semibold tracking-tight text-violet-200">
            {section.folderName}
          </h3>
          <span className="shrink-0 text-[10px] text-white/40">
            {section.groups.length}{" "}
            {section.groups.length === 1 ? "canción" : "canciones"}
          </span>
          {canManage && section.folderId ? (
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                title="Renombrar carpeta"
                onClick={onStartRename}
                className="grid h-6 w-6 place-items-center rounded-full text-white/45 hover:bg-white/10 hover:text-white"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                type="button"
                title="Borrar carpeta (las canciones pasan a Sin carpeta)"
                onClick={onDelete}
                className="grid h-6 w-6 place-items-center rounded-full text-white/45 hover:bg-red-400/15 hover:text-red-200"
              >
                <Trash className="h-3 w-3" />
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function SongList({
  groups,
  folders,
  selectedGroupKey,
  onSelect,
  onRequestLyrics,
  onRequestVocal,
  onRequestInstrumental,
  onRequestStems,
  onRequestEdit,
  onRequestDelete,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveSong,
  canManage = true,
  canEditLyrics = false,
  searching = false,
}: Props) {
  const [newFolder, setNewFolder] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const sections = useMemo(() => {
    const map = new Map<string | null, SongGroup[]>();
    for (const folder of folders) map.set(folder.id, []);
    map.set(null, []);
    for (const group of groups) {
      const key = group.folderId && map.has(group.folderId) ? group.folderId : null;
      map.get(key)?.push(group);
    }
    const named: FolderSection[] = folders.map((folder) => ({
      folderId: folder.id,
      folderName: folder.name,
      groups: map.get(folder.id) ?? [],
    }));
    const unfiled = map.get(null) ?? [];
    const result = searching
      ? named.filter((section) => section.groups.length > 0)
      : named;
    if (unfiled.length > 0) {
      result.push({
        folderId: null,
        folderName: UNFILED_FOLDER_LABEL,
        groups: unfiled,
      });
    }
    return result;
  }, [folders, groups, searching]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newFolder.trim();
    if (!name || !onCreateFolder) return;
    setCreating(true);
    setCreateError(null);
    try {
      await onCreateFolder(name);
      setNewFolder("");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "No se pudo crear");
    } finally {
      setCreating(false);
    }
  }

  if (searching && groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/50">
        Sin resultados para tu búsqueda.
      </div>
    );
  }

  return (
    <div className="scroll-fancy max-lg:overflow-visible space-y-5 pr-1 lg:max-h-[60vh] lg:overflow-y-auto">
      {canManage && onCreateFolder ? (
        <form onSubmit={(e) => void handleCreate(e)} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              placeholder="Nueva carpeta…"
              disabled={creating}
              className="min-w-0 grow rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-violet-400/50"
            />
            <button
              type="submit"
              disabled={creating || !newFolder.trim()}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              Crear
            </button>
          </div>
          {createError ? <p className="text-xs text-red-300/90">{createError}</p> : null}
        </form>
      ) : null}

      {sections.map((section) => (
        <section key={section.folderId ?? "__unfiled"}>
          <FolderHeader
            key={`${section.folderId ?? "unfiled"}-${renamingId === section.folderId}`}
            section={section}
            canManage={canManage}
            renaming={renamingId === section.folderId}
            onStartRename={() => setRenamingId(section.folderId)}
            onCancelRename={() => setRenamingId(null)}
            onRename={(name) => {
              if (!section.folderId || !onRenameFolder) return;
              void onRenameFolder(section.folderId, name).then(() => setRenamingId(null));
            }}
            onDelete={() => {
              if (!section.folderId || !onDeleteFolder) return;
              if (
                !window.confirm(
                  `¿Borrar la carpeta «${section.folderName}»? Las canciones pasan a ${UNFILED_FOLDER_LABEL}.`,
                )
              ) {
                return;
              }
              void onDeleteFolder(section.folderId);
            }}
          />
          {section.groups.length === 0 ? (
            <p className="px-1 text-xs text-white/40">Carpeta vacía. Mueve canciones aquí o súbelas a esta carpeta.</p>
          ) : (
            <ul className="space-y-2">
              {section.groups.map((group) => (
                <SongRow
                  key={group.groupKey}
                  group={group}
                  folders={folders}
                  active={selectedGroupKey === group.groupKey}
                  onSelect={onSelect}
                  onRequestLyrics={onRequestLyrics}
                  onRequestVocal={onRequestVocal}
                  onRequestInstrumental={onRequestInstrumental}
                  onRequestStems={onRequestStems}
                  onRequestEdit={onRequestEdit}
                  onRequestDelete={onRequestDelete}
                  onMoveSong={onMoveSong}
                  canManage={canManage}
                  canEditLyrics={canEditLyrics}
                />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
