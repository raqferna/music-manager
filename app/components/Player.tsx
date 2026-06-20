"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { Song } from "@/lib/types";
import { Pause, Play, SkipBack, SkipForward, Volume, VolumeMute } from "./icons";

type Props = {
  song: Song | null;
  onEnded?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
};

function fmt(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const Player = forwardRef<HTMLAudioElement, Props>(function Player(
  { song, onEnded, onPrev, onNext },
  ref,
) {
  const innerRef = useRef<HTMLAudioElement | null>(null);
  useImperativeHandle(ref, () => innerRef.current as HTMLAudioElement);

  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [muted, setMuted] = useState(false);

  // Reset al cambiar de canción.
  useEffect(() => {
    setCurrent(0);
    setDuration(0);
  }, [song?.file]);

  // Sincroniza volumen y mute con el elemento.
  useEffect(() => {
    const el = innerRef.current;
    if (el) {
      el.volume = volume;
      el.muted = muted;
    }
  }, [volume, muted]);

  function togglePlay() {
    const el = innerRef.current;
    if (!el || !song) return;
    if (el.paused) {
      void el.play();
    } else {
      el.pause();
    }
  }

  function onSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const el = innerRef.current;
    if (!el || !duration) return;
    const value = Number(e.target.value);
    el.currentTime = (value / 100) * duration;
    setCurrent(el.currentTime);
  }

  const progressPct = duration > 0 ? (current / duration) * 100 : 0;
  const volumePct = (muted ? 0 : volume) * 100;
  const audioSrc = song ? `/api/audio/${encodeURIComponent(song.file)}` : "";

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
            {song ? song.title : "Selecciona una canción"}
          </div>
          <div className="truncate text-xs text-white/50">
            {song ? song.file : "Tu lista está a la izquierda."}
          </div>
        </div>
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
          disabled={!song}
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
          disabled={!song}
          className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 disabled:opacity-40"
          title="Anterior"
        >
          <SkipBack className="h-5 w-5" />
        </button>
        <button
          onClick={togglePlay}
          disabled={!song}
          className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-white shadow-lg shadow-violet-500/30 transition hover:scale-[1.04] hover:shadow-violet-500/50 disabled:opacity-40 disabled:hover:scale-100"
          title={playing ? "Pausar" : "Reproducir"}
        >
          {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </button>
        <button
          onClick={() => onNext?.()}
          disabled={!song}
          className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 disabled:opacity-40"
          title="Siguiente"
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>

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
    </div>
  );
});

export default Player;
