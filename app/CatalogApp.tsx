"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { matchesSearch, parseArtistTitle } from "@/lib/artistGroups";
import type { KaraokeVideo } from "@/lib/karaoke";
import type { SitePublicConfig } from "@/lib/siteConfig";
import type { LibraryFolder, SongGroup } from "@/lib/types";
import AdminLogin from "./components/AdminLogin";
import AulaDecor from "./components/AulaDecor";
import AulaLogin from "./components/AulaLogin";
import CatalogImportModal from "./components/CatalogImportModal";
import ClassAccessPanel from "./components/ClassAccessPanel";
import DownloadRequests from "./components/DownloadRequests";
import AddStemsModal from "./components/AddStemsModal";
import AddVocalModal from "./components/AddVocalModal";
import AddInstrumentalModal from "./components/AddInstrumentalModal";
import DeleteSongModal from "./components/DeleteSongModal";
import EditSongModal from "./components/EditSongModal";
import KaraokeList from "./components/KaraokeList";
import KaraokePlayer from "./components/KaraokePlayer";
import KaraokeRequestForm from "./components/KaraokeRequestForm";
import KaraokeUploader from "./components/KaraokeUploader";
import SongList from "./components/SongList";
import Player, { type PlaybackVariant } from "./components/Player";
import PdfViewer from "./components/PdfViewer";
import LyricsModal from "./components/LyricsModal";
import MusicUploader from "./components/MusicUploader";
import YoutubeImporter from "./components/YoutubeImporter";
import { Disc, Search, FolderOpen, GraduationCap } from "./components/icons";

type ApiResponse = { dir: string; groups: SongGroup[]; folders?: LibraryFolder[] };

type SessionResponse = SitePublicConfig & { admin?: boolean; viewer?: boolean };

type Props = {
  initialSite: SitePublicConfig;
};

export default function CatalogApp({ initialSite }: Props) {
  const [groups, setGroups] = useState<SongGroup[]>([]);
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [musicDir, setMusicDir] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [playbackVariant, setPlaybackVariant] = useState<PlaybackVariant>("instrumental");
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [showVocalModal, setShowVocalModal] = useState(false);
  const [showInstrumentalModal, setShowInstrumentalModal] = useState(false);
  const [showStemsModal, setShowStemsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionGroup, setActionGroup] = useState<SongGroup | null>(null);
  const [admin, setAdmin] = useState(!initialSite.adminRequired);
  const [adminRequired, setAdminRequired] = useState(initialSite.adminRequired);
  const [viewerRequired, setViewerRequired] = useState(initialSite.viewerRequired);
  const [viewer, setViewer] = useState(!initialSite.viewerRequired);
  const [sessionReady, setSessionReady] = useState(!initialSite.viewerRequired);
  const [siteMode, setSiteMode] = useState(initialSite.siteMode);
  const [siteTitle, setSiteTitle] = useState(initialSite.siteTitle);
  const [siteSubtitle, setSiteSubtitle] = useState(initialSite.siteSubtitle);
  const [showLogin, setShowLogin] = useState(false);
  const [showCatalogImport, setShowCatalogImport] = useState(false);
  const [libraryTab, setLibraryTab] = useState<"songs" | "karaoke">("songs");
  const [karaokeVideos, setKaraokeVideos] = useState<KaraokeVideo[]>([]);
  const [karaokeLoading, setKaraokeLoading] = useState(false);
  const [karaokeError, setKaraokeError] = useState<string | null>(null);
  const [karaokeQuery, setKaraokeQuery] = useState("");
  const [selectedKaraokeId, setSelectedKaraokeId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canManage = admin;
  const canEditLyrics = siteMode === "aula" && viewer;
  /** En el aula solo el admin añade o borra karaokes; la clase solo los ve. */
  const canManageKaraoke = siteMode === "aula" ? Boolean(admin && adminRequired) : admin;

  async function refresh(preferGroupKey?: string | null): Promise<SongGroup[]> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/songs", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();
      setGroups(data.groups);
      setFolders(data.folders ?? []);
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

      return data.groups;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      return [];
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

  async function refreshKaraoke(preferId?: string | null): Promise<KaraokeVideo[]> {
    setKaraokeLoading(true);
    setKaraokeError(null);
    try {
      const res = await fetch("/api/karaoke", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { videos?: KaraokeVideo[] };
      const videos = data.videos ?? [];
      setKaraokeVideos(videos);

      const preferred =
        preferId ??
        (selectedKaraokeId && videos.some((video) => video.id === selectedKaraokeId)
          ? selectedKaraokeId
          : null);

      if (preferred && videos.some((video) => video.id === preferred)) {
        setSelectedKaraokeId(preferred);
      } else if (videos.length > 0) {
        setSelectedKaraokeId(videos[0].id);
      } else {
        setSelectedKaraokeId(null);
      }
      return videos;
    } catch (err) {
      setKaraokeError(err instanceof Error ? err.message : "Error desconocido");
      return [];
    } finally {
      setKaraokeLoading(false);
    }
  }

  useEffect(() => {
    if (viewerRequired && !viewer) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer, viewerRequired]);

  useEffect(() => {
    if (viewerRequired && !viewer) return;
    if (libraryTab !== "karaoke") return;
    void refreshKaraoke();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryTab, viewer, viewerRequired]);

  useEffect(() => {
    void fetch("/api/admin/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: SessionResponse) => {
        setAdmin(Boolean(data.admin));
        setAdminRequired(Boolean(data.adminRequired));
        setViewerRequired(Boolean(data.viewerRequired));
        setViewer(Boolean(data.viewer));
        if (data.siteMode === "aula" || data.siteMode === "catalogo") setSiteMode(data.siteMode);
        if (typeof data.siteTitle === "string" && data.siteTitle) setSiteTitle(data.siteTitle);
        if (typeof data.siteSubtitle === "string" && data.siteSubtitle) setSiteSubtitle(data.siteSubtitle);
      })
      .catch(() => undefined)
      .finally(() => setSessionReady(true));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAdmin(false);
    setViewer(false);
  }

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return groups;
    return groups.filter((g) => matchesSearch(g, q));
  }, [groups, query]);

  const selected = useMemo(
    () => groups.find((g) => g.groupKey === selectedGroupKey) ?? null,
    [groups, selectedGroupKey],
  );

  const filteredKaraoke = useMemo(() => {
    const q = karaokeQuery.trim().toLowerCase();
    if (!q) return karaokeVideos;
    return karaokeVideos.filter((video) => {
      const { artist, songTitle } = parseArtistTitle(video.title);
      return (
        video.title.toLowerCase().includes(q) ||
        artist.toLowerCase().includes(q) ||
        songTitle.toLowerCase().includes(q)
      );
    });
  }, [karaokeVideos, karaokeQuery]);

  const selectedKaraoke = useMemo(
    () => karaokeVideos.find((video) => video.id === selectedKaraokeId) ?? null,
    [karaokeVideos, selectedKaraokeId],
  );

  function showSongs() {
    videoRef.current?.pause();
    setLibraryTab("songs");
  }

  function showKaraoke() {
    audioRef.current?.pause();
    setLibraryTab("karaoke");
  }

  function handleSelectKaraoke(video: KaraokeVideo) {
    audioRef.current?.pause();
    setSelectedKaraokeId(video.id);
  }

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

  if (viewerRequired && !sessionReady) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-white/50">Cargando…</div>
    );
  }

  if (viewerRequired && !viewer) {
    return (
      <AulaLogin
        title={siteTitle}
        subtitle={siteSubtitle}
        onSuccess={(isAdmin) => {
          setViewer(true);
          setAdmin(isAdmin);
        }}
      />
    );
  }

  const aula = siteMode === "aula";

  return (
    <div className="relative min-h-screen overflow-x-hidden px-4 py-6 md:px-8 md:py-10">
      <div className="relative mx-auto max-w-[1400px]">
        <header className="mb-6 flex flex-col items-start justify-between gap-3 md:mb-8 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className={`grid h-12 w-12 place-items-center rounded-2xl ${aula ? "vinyl" : "glass-strong"}`}>
              <span className={aula ? "" : "animate-spin-slow"}>
                <Disc className={`h-7 w-7 ${aula ? "text-[#f3e0b0]" : "text-violet-300"}`} />
              </span>
            </div>
            <div className="min-w-0">
              <h1 className={`text-2xl md:text-3xl ${aula ? "font-display text-3xl leading-tight text-[#f6efe6] sm:text-4xl md:text-5xl" : "font-semibold tracking-tight"}`}>
                {siteTitle}
              </h1>
              <p className={aula ? "font-display text-sm italic text-[#f3e0b0]/75" : "text-sm text-white/60"}>
                {siteSubtitle}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
            {!viewerRequired && adminRequired && !admin ? (
              <button
                type="button"
                onClick={() => setShowLogin(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Entrar
              </button>
            ) : null}
            {(viewerRequired && viewer) || (!viewerRequired && adminRequired && admin) ? (
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Salir
              </button>
            ) : null}
            {siteMode === "aula" ? null : (
            <a
              href="/curso"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <GraduationCap className="h-4 w-4 text-violet-300" />
              Cursos
            </a>
            )}
            {canManage ? (
              <span className="hidden max-w-xs items-center gap-2 md:inline-flex">
                <FolderOpen className="h-4 w-4 shrink-0 text-violet-300" />
                <code className="truncate rounded-lg bg-white/5 px-2 py-1 text-white/80">
                  {musicDir || "Cargando…"}
                </code>
              </span>
            ) : null}
          </div>
        </header>
        {aula ? <AulaDecor /> : null}

        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(320px,420px)_1fr] lg:grid-rows-[minmax(0,1fr)_auto] lg:gap-5">
          <section className="glass order-2 rounded-3xl p-4 animate-fade-up md:p-5 lg:order-none lg:col-start-1 lg:row-span-2">
            {aula && canManage ? <ClassAccessPanel /> : null}
            {aula ? (
              <DownloadRequests
                admin={canManage}
                groups={groups}
                onAccepted={() => void refreshKaraoke()}
              />
            ) : null}
            <div className="mb-4 flex rounded-full border border-white/10 bg-white/5 p-1 text-xs">
              <button
                type="button"
                onClick={showSongs}
                className={`flex-1 rounded-full px-3 py-1.5 transition ${
                  libraryTab === "songs" ? "aula-cta font-semibold" : "text-white/60 hover:text-white"
                }`}
              >
                Canciones
              </button>
              <button
                type="button"
                onClick={showKaraoke}
                className={`flex-1 rounded-full px-3 py-1.5 transition ${
                  libraryTab === "karaoke" ? "aula-cta font-semibold" : "text-white/60 hover:text-white"
                }`}
              >
                Karaoke
              </button>
            </div>
            {libraryTab === "karaoke" ? (
              <>
                {canManageKaraoke ? (
                  <KaraokeUploader onAdded={(video) => void refreshKaraoke(video.id)} />
                ) : aula ? (
                  <KaraokeRequestForm />
                ) : null}
                <div className="relative mb-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                  <input
                    value={karaokeQuery}
                    onChange={(e) => setKaraokeQuery(e.target.value)}
                    placeholder="Buscar karaoke…"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-base text-white placeholder:text-white/40 outline-none transition focus:border-violet-400/60 focus:bg-white/10 sm:text-sm"
                  />
                </div>
                <div className="mb-3 flex items-center justify-between text-xs text-white/50">
                  <span>
                    {karaokeLoading
                      ? "Cargando…"
                      : `${filteredKaraoke.length} de ${karaokeVideos.length} karaokes`}
                  </span>
                  <button
                    onClick={() => void refreshKaraoke()}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    Refrescar
                  </button>
                </div>
                {karaokeError ? (
                  <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
                    {karaokeError}
                  </div>
                ) : karaokeVideos.length === 0 && !karaokeLoading ? (
                  <KaraokeEmptyState canManage={canManageKaraoke} />
                ) : (
                  <KaraokeList
                    videos={filteredKaraoke}
                    selectedId={selectedKaraokeId}
                    canManage={canManageKaraoke}
                    onSelect={handleSelectKaraoke}
                    onDeleted={(id) => {
                      if (selectedKaraokeId === id) setSelectedKaraokeId(null);
                      void refreshKaraoke();
                    }}
                  />
                )}
              </>
            ) : (
              <>
            {canManage && siteMode === "aula" ? (
              <button
                type="button"
                onClick={() => setShowCatalogImport(true)}
                className="aula-cta mb-4 w-full rounded-2xl px-3 py-2.5 text-sm font-medium transition hover:brightness-105"
              >
                Importar del catálogo personal
              </button>
            ) : null}
            {canManage ? (
              <div className="mb-5 space-y-5">
                <YoutubeImporter folders={folders} onImported={handleImported} />
                <div className="border-t border-white/10" />
                <MusicUploader folders={folders} onUploaded={handleUploaded} compact />
              </div>
            ) : null}

            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar canción o carpeta…"
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-base text-white placeholder:text-white/40 outline-none transition focus:border-violet-400/60 focus:bg-white/10 sm:text-sm"
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
            ) : groups.length === 0 && folders.length === 0 && !loading && !canManage ? (
              <EmptyState dir={musicDir} canManage={canManage} aula={aula} />
            ) : (
              <>
            {groups.length === 0 && !loading ? (
              <EmptyState dir={musicDir} canManage={canManage} aula={aula} />
            ) : null}
              <SongList
                groups={filtered}
                folders={folders}
                selectedGroupKey={selectedGroupKey}
                canManage={canManage}
                canEditLyrics={canEditLyrics}
                searching={Boolean(query.trim())}
                onCreateFolder={
                  canManage
                    ? async (name) => {
                        const res = await fetch("/api/folders", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ name }),
                        });
                        const data = (await res.json().catch(() => null)) as { error?: string } | null;
                        if (!res.ok) throw new Error(data?.error ?? "No se pudo crear la carpeta");
                        await refresh();
                      }
                    : undefined
                }
                onRenameFolder={
                  canManage
                    ? async (folderId, name) => {
                        const res = await fetch(`/api/folders/${encodeURIComponent(folderId)}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ name }),
                        });
                        const data = (await res.json().catch(() => null)) as { error?: string } | null;
                        if (!res.ok) throw new Error(data?.error ?? "No se pudo renombrar");
                        await refresh();
                      }
                    : undefined
                }
                onDeleteFolder={
                  canManage
                    ? async (folderId) => {
                        const res = await fetch(`/api/folders/${encodeURIComponent(folderId)}`, {
                          method: "DELETE",
                        });
                        const data = (await res.json().catch(() => null)) as { error?: string } | null;
                        if (!res.ok) throw new Error(data?.error ?? "No se pudo borrar");
                        await refresh();
                      }
                    : undefined
                }
                onMoveSong={
                  canManage
                    ? async (group, folderId) => {
                        const res = await fetch(`/api/songs/${encodeURIComponent(group.groupKey)}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ folderId }),
                        });
                        const data = (await res.json().catch(() => null)) as { error?: string } | null;
                        if (!res.ok) throw new Error(data?.error ?? "No se pudo mover");
                        await refresh(group.groupKey);
                      }
                    : undefined
                }
                onSelect={handleSelect}
                onRequestLyrics={(g) => {
                  setSelectedGroupKey(g.groupKey);
                  setShowLyricsModal(true);
                }}
                onRequestVocal={(g) => {
                  setSelectedGroupKey(g.groupKey);
                  setShowVocalModal(true);
                }}
                onRequestInstrumental={(g) => {
                  setSelectedGroupKey(g.groupKey);
                  setShowInstrumentalModal(true);
                }}
                onRequestStems={(g) => {
                  setSelectedGroupKey(g.groupKey);
                  setShowStemsModal(true);
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
              </>
            )}
              </>
            )}
          </section>

          {libraryTab === "karaoke" ? (
            <div className="glass-strong order-1 min-h-[46vh] rounded-3xl p-3 animate-fade-up max-lg:sticky max-lg:top-2 max-lg:z-30 max-lg:bg-[#0c1424]/95 max-lg:shadow-2xl md:p-4 lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:min-h-[70vh]">
              <KaraokePlayer ref={videoRef} video={selectedKaraoke} />
            </div>
          ) : (
            <>
          <div className="glass-strong order-3 min-h-[46vh] rounded-3xl p-3 animate-fade-up md:p-4 lg:order-none lg:col-start-2 lg:row-start-1 lg:min-h-[70vh]">
              <PdfViewer
                group={selected}
                canManage={canManage}
                canEditLyrics={canEditLyrics}
                onAddLyrics={() => setShowLyricsModal(true)}
                onEditLyrics={() => setShowLyricsModal(true)}
              />
          </div>
          <div className="glass-strong order-1 rounded-3xl p-4 animate-fade-up max-lg:sticky max-lg:top-2 max-lg:z-30 max-lg:bg-[#0c1424]/95 max-lg:shadow-2xl md:p-5 lg:order-none lg:col-start-2 lg:row-start-2">
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
            </>
          )}
        </div>
      </div>

      {showCatalogImport ? (
        <CatalogImportModal
          folders={folders}
          onClose={() => setShowCatalogImport(false)}
          onImported={() => void refresh()}
        />
      ) : null}

      {showLogin ? (
        <AdminLogin
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setShowLogin(false);
            setAdmin(true);
          }}
        />
      ) : null}

      {(canManage || canEditLyrics) && showLyricsModal && selected ? (
        <LyricsModal
          group={selected}
          allowTranscribe={canManage}
          onClose={() => setShowLyricsModal(false)}
          onSaved={async () => {
            setShowLyricsModal(false);
            await refresh(selected.groupKey);
          }}
        />
      ) : null}

      {canManage && showVocalModal && selected ? (
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

      {canManage && showInstrumentalModal && selected ? (
        <AddInstrumentalModal
          group={selected}
          onClose={() => setShowInstrumentalModal(false)}
          onSaved={async () => {
            setShowInstrumentalModal(false);
            await refresh(selected.groupKey);
            setPlaybackVariant("instrumental");
          }}
        />
      ) : null}

      {canManage && showStemsModal && selected ? (
        <AddStemsModal
          group={selected}
          onClose={() => setShowStemsModal(false)}
          onSaved={async () => {
            await refresh(selected.groupKey);
          }}
        />
      ) : null}

      {canManage && showEditModal && actionGroup ? (
        <EditSongModal
          group={actionGroup}
          folders={folders}
          onClose={() => {
            setShowEditModal(false);
            setActionGroup(null);
          }}
          onSaved={async (groupKey) => {
            setShowEditModal(false);
            setActionGroup(null);
            await refresh(groupKey);
          }}
          onUpdated={async (groupKey) => {
            const updated = await refresh(groupKey);
            const next = updated.find((g) => g.groupKey === groupKey) ?? null;
            if (next) setActionGroup(next);
          }}
        />
      ) : null}

      {canManage && showDeleteModal && actionGroup ? (
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

function KaraokeEmptyState({ canManage }: { canManage: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-center text-sm text-white/60">
      <p className="text-base text-white/85">Aún no hay karaokes.</p>
      {canManage ? (
        <p className="mt-1">Sube un vídeo o pega un enlace de YouTube para cantarlos aquí.</p>
      ) : (
        <p className="mt-1">Pide uno con un enlace de YouTube. Cuando se acepte, aparecerá aquí.</p>
      )}
    </div>
  );
}

function EmptyState({ dir, canManage, aula }: { dir: string; canManage: boolean; aula: boolean }) {
  if (!canManage) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-center text-sm text-white/60">
        {aula ? (
          <>
            <p className="font-display text-base text-[#f6efe6]/85">El ensayo todavía está en silencio.</p>
            <p className="mt-1">Cuando haya canciones, aparecerán aquí.</p>
          </>
        ) : (
          <p className="text-white/80">Aún no hay canciones.</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-center text-sm text-white/60">
      <p className="mb-1 text-white/80">
        {aula ? "El aula todavía no tiene canciones." : "Tu catálogo está vacío."}
      </p>
      <p>
        {aula
          ? "Importa las que quieras de tu catálogo, pega un enlace de YouTube o sube un archivo."
          : "Pega un enlace de YouTube arriba o sube archivos manualmente."}
      </p>
      <p className="mt-2">También puedes copiar audios directamente en:</p>
      <code className="mt-2 inline-block rounded-lg bg-white/10 px-2 py-1 text-white/80">
        {dir}
      </code>
    </div>
  );
}
