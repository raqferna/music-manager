"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { downloadAudioFile } from "@/lib/audio";
import { resolvePlaybackFile } from "@/lib/songGroups";
import { STEM_IDS, STEM_LABELS, type StemId } from "@/lib/stems";
import type { SongGroup } from "@/lib/types";
import {
  Download,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume,
  VolumeMute,
} from "./icons";

export type PlaybackVariant = "instrumental" | "vocal";

type Props = {
  group: SongGroup | null;
  variant: PlaybackVariant;
  onVariantChange: (variant: PlaybackVariant) => void;
  onEnded?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
};

type StemTrack = {
  id: StemId;
  audio: HTMLAudioElement;
  gain: GainNode;
};

function fmt(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function availableStems(group: SongGroup): StemId[] {
  return STEM_IDS.filter((id) => Boolean(group.stemFiles[id]));
}

const Player = forwardRef<HTMLAudioElement, Props>(function Player(
  { group, variant, onVariantChange, onEnded, onPrev, onNext },
  ref,
) {
  const innerRef = useRef<HTMLAudioElement | null>(null);
  const stemTracksRef = useRef<StemTrack[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stemLeaderRef = useRef<HTMLAudioElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const [stemMode, setStemMode] = useState(false);
  const [mutedStems, setMutedStems] = useState<Set<StemId>>(() => new Set());

  const activeFile = group ? resolvePlaybackFile(group, variant) : null;
  const canToggleVariant = Boolean(group?.hasInstrumental && group?.hasVocal);
  const stems = group ? availableStems(group) : [];
  const usingStems = stemMode && stems.length > 0;

  const cleanupStems = useCallback(() => {
    for (const track of stemTracksRef.current) {
      track.audio.pause();
      track.audio.src = "";
      track.gain.disconnect();
    }
    stemTracksRef.current = [];
    stemLeaderRef.current = null;
    if (audioCtxRef.current?.state !== "closed") {
      void audioCtxRef.current?.close();
    }
    audioCtxRef.current = null;
  }, []);

  useEffect(() => {
    if (!group?.hasStems) {
      setStemMode(false);
      setMutedStems(new Set());
    }
  }, [group?.groupKey, group?.hasStems]);

  useEffect(() => {
    cleanupStems();
    if (!usingStems || !group) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const tracks: StemTrack[] = [];

    for (const id of stems) {
      const file = group.stemFiles[id];
      if (!file) continue;
      const audio = new Audio(`/api/audio/${encodeURIComponent(file)}`);
      audio.preload = "metadata";
      const source = ctx.createMediaElementSource(audio);
      const gain = ctx.createGain();
      source.connect(gain);
      gain.connect(ctx.destination);
      tracks.push({ id, audio, gain });
    }

    stemTracksRef.current = tracks;
    stemLeaderRef.current = tracks[0]?.audio ?? null;

    const leader = stemLeaderRef.current;
    if (!leader) return;

    const onMeta = () => setDuration(leader.duration || 0);
    const onTime = () => setCurrent(leader.currentTime);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => {
      setPlaying(false);
      onEnded?.();
    };

    leader.addEventListener("loadedmetadata", onMeta);
    leader.addEventListener("timeupdate", onTime);
    leader.addEventListener("play", onPlay);
    leader.addEventListener("pause", onPause);
    leader.addEventListener("ended", onEnd);

    return () => {
      leader.removeEventListener("loadedmetadata", onMeta);
      leader.removeEventListener("timeupdate", onTime);
      leader.removeEventListener("play", onPlay);
      leader.removeEventListener("pause", onPause);
      leader.removeEventListener("ended", onEnd);
      cleanupStems();
    };
  }, [usingStems, group, stems.join(","), cleanupStems, onEnded]);

  useEffect(() => {
    setCurrent(0);
    setDuration(0);
    setPlaying(false);
  }, [activeFile, usingStems, group?.groupKey]);

  useEffect(() => {
    const el = innerRef.current;
    if (el && !usingStems) {
      el.volume = volume;
      el.muted = muted;
    }
  }, [volume, muted, usingStems]);

  useEffect(() => {
    const effectiveVolume = muted ? 0 : volume;
    for (const track of stemTracksRef.current) {
      track.gain.gain.value = mutedStems.has(track.id) ? 0 : effectiveVolume;
    }
  }, [mutedStems, muted, volume, usingStems]);

  const playStems = useCallback(async () => {
    const tracks = stemTracksRef.current;
    const leader = stemLeaderRef.current;
    if (!tracks.length || !leader) return;

    if (audioCtxRef.current?.state === "suspended") {
      await audioCtxRef.current.resume();
    }

    const t = leader.currentTime;
    for (const track of tracks) {
      track.audio.currentTime = t;
    }
    await Promise.all(tracks.map((track) => track.audio.play()));
  }, []);

  const pauseStems = useCallback(() => {
    for (const track of stemTracksRef.current) {
      track.audio.pause();
    }
  }, []);

  const seekStems = useCallback((time: number) => {
    for (const track of stemTracksRef.current) {
      track.audio.currentTime = time;
    }
    setCurrent(time);
  }, []);

  useImperativeHandle(ref, () => {
    if (usingStems && stemLeaderRef.current) {
      const leader = stemLeaderRef.current;
      return {
        ...leader,
        play: () => playStems(),
        pause: pauseStems,
        get currentTime() {
          return leader.currentTime;
        },
        set currentTime(t: number) {
          seekStems(t);
        },
      } as unknown as HTMLAudioElement;
    }
    return innerRef.current as HTMLAudioElement;
  }, [usingStems, playStems, pauseStems, seekStems]);

  function togglePlay() {
    if (usingStems) {
      if (playing) pauseStems();
      else void playStems();
      return;
    }
    const el = innerRef.current;
    if (!el || !activeFile) return;
    if (el.paused) void el.play();
    else el.pause();
  }

  function onSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    const time = duration > 0 ? (value / 100) * duration : 0;
    if (usingStems) {
      seekStems(time);
      return;
    }
    const el = innerRef.current;
    if (!el || !duration) return;
    el.currentTime = time;
    setCurrent(el.currentTime);
  }

  function toggleStem(id: StemId) {
    setMutedStems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const canPlay = usingStems ? stems.length > 0 : Boolean(activeFile);
  const progressPct = duration > 0 ? (current / duration) * 100 : 0;
  const volumePct = (muted ? 0 : volume) * 100;
  const audioSrc = activeFile && !usingStems
    ? `/api/audio/${encodeURIComponent(activeFile)}`
    : "";

  const subtitle = usingStems
    ? `Mezcla personalizada · ${stems.length - mutedStems.size}/${stems.length} pistas`
    : activeFile
      ? variant === "vocal"
        ? "Versión con voz"
        : "Versión sin voz (instrumental)"
      : "Tu lista está a la izquierda.";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div
          className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/40 to-cyan-400/30 text-white shadow-inner ${
            playing ? "animate-float" : ""
          }`}
        >
          <span className={playing ? "animate-spin-slow" : ""}>
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
          </span>
        </div>
        <div className="min-w-0 grow">
          <div className="truncate text-base font-semibold text-white">
            {group ? group.title : "Selecciona una canción"}
          </div>
          <div className="truncate text-xs text-white/50">{subtitle}</div>
        </div>
        {group?.hasStems ? (
          <button
            type="button"
            onClick={() => setStemMode((v) => !v)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              stemMode
                ? "border-amber-400/40 bg-amber-400/15 text-amber-100"
                : "border-white/10 bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            Instrumentos
          </button>
        ) : null}
        {canToggleVariant && !usingStems ? (
          <div className="flex rounded-full border border-white/10 bg-white/5 p-1 text-xs">
            <button
              type="button"
              onClick={() => onVariantChange("instrumental")}
              className={`rounded-full px-3 py-1 transition ${
                variant === "instrumental"
                  ? "bg-cyan-400/20 text-cyan-100"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Sin voz
            </button>
            <button
              type="button"
              onClick={() => onVariantChange("vocal")}
              className={`rounded-full px-3 py-1 transition ${
                variant === "vocal"
                  ? "bg-violet-400/20 text-violet-100"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Con voz
            </button>
          </div>
        ) : null}
        {group && (group.hasInstrumental || group.hasVocal) && !usingStems ? (
          <div className="flex shrink-0 items-center gap-1.5">
            {group.hasInstrumental && group.instrumentalFile ? (
              <button
                type="button"
                title="Descargar sin voz"
                onClick={() => downloadAudioFile(group.instrumentalFile!)}
                className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1.5 text-[11px] text-cyan-100 transition hover:bg-cyan-400/20"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sin voz</span>
              </button>
            ) : null}
            {group.hasVocal && group.vocalFile ? (
              <button
                type="button"
                title="Descargar con voz"
                onClick={() => downloadAudioFile(group.vocalFile!)}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/25 bg-violet-400/10 px-2.5 py-1.5 text-[11px] text-violet-100 transition hover:bg-violet-400/20"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Con voz</span>
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="hidden items-center gap-2 md:flex">
          <button
            onClick={() => setMuted((m) => !m)}
            title={muted ? "Activar sonido" : "Silenciar"}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
          >
            {muted || volume === 0 ? (
              <VolumeMute className="h-4 w-4" />
            ) : (
              <Volume className="h-4 w-4" />
            )}
          </button>
          <input
            aria-label="Volumen"
            type="range"
            min={0}
            max={100}
            value={volumePct}
            onChange={(e) => {
              const v = Number(e.target.value) / 100;
              setVolume(v);
              if (v > 0 && muted) setMuted(false);
            }}
            className="nice-range w-32"
            style={{ ["--val" as string]: `${volumePct}%` }}
          />
        </div>
      </div>

      {usingStems ? (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-amber-400/15 bg-amber-400/5 p-3">
          <p className="w-full text-[11px] text-amber-100/70">
            Pulsa para quitar o restaurar cada instrumento en la mezcla:
          </p>
          {stems.map((id) => {
            const isMuted = mutedStems.has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleStem(id)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  isMuted
                    ? "border-white/10 bg-white/5 text-white/35 line-through"
                    : "border-amber-400/30 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20"
                }`}
              >
                {STEM_LABELS[id]}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <span className="w-12 text-right text-xs tabular-nums text-white/60">
          {fmt(current)}
        </span>
        <input
          aria-label="Progreso"
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={progressPct}
          onChange={onSeek}
          disabled={!canPlay}
          className="nice-range grow disabled:opacity-50"
          style={{ ["--val" as string]: `${progressPct}%` }}
        />
        <span className="w-12 text-xs tabular-nums text-white/60">
          {fmt(duration)}
        </span>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => onPrev?.()}
          disabled={!group}
          className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 disabled:opacity-40"
          title="Anterior"
        >
          <SkipBack className="h-5 w-5" />
        </button>
        <button
          onClick={togglePlay}
          disabled={!canPlay}
          className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-white shadow-lg shadow-violet-500/30 transition hover:scale-[1.04] hover:shadow-violet-500/50 disabled:opacity-40 disabled:hover:scale-100"
          title={playing ? "Pausar" : "Reproducir"}
        >
          {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </button>
        <button
          onClick={() => onNext?.()}
          disabled={!group}
          className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 disabled:opacity-40"
          title="Siguiente"
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>

      {!usingStems ? (
        <audio
          ref={innerRef}
          src={audioSrc}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            onEnded?.();
          }}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        />
      ) : null}
    </div>
  );
});

export default Player;
