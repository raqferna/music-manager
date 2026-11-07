"use client";

import { useRef, useState, type FormEvent } from "react";
import { isYoutubeUrl } from "@/lib/audio";
import { VIDEO_ACCEPT, isVideoFilename, parseYoutubeVideoId, titleFromFilename } from "@/lib/karaoke";
import type { KaraokeVideo } from "@/lib/karaoke";
import { Film, Link, Upload, X } from "./icons";

type Props = {
  onAdded: (video: KaraokeVideo) => void | Promise<void>;
};

type Mode = "file" | "youtube";

export default function KaraokeUploader({ onAdded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("file");
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function resetFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function addFile(next: File | undefined) {
    if (!next) return;
    setError(null);
    setMessage(null);
    if (!isVideoFilename(next.name)) {
      setError("Formato no soportado (usa mp4, webm, mov, mkv, m4v u ogv)");
      return;
    }
    setFile(next);
    setTitle((current) => current.trim() || titleFromFilename(next.name));
  }

  async function uploadFile() {
    if (!file) return;
    if (!title.trim()) {
      setError("Ponle un título al karaoke.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      const res = await fetch("/api/karaoke/upload", { method: "POST", body: formData });
      const data = (await res.json().catch(() => null)) as
        | { error?: string; video?: KaraokeVideo }
        | null;
      if (!res.ok || !data?.video) {
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      setMessage(`Añadido: ${data.video.title}`);
      setTitle("");
      resetFile();
      await onAdded(data.video);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir");
    } finally {
      setBusy(false);
    }
  }

  async function addYoutube(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || !isYoutubeUrl(trimmed) || !parseYoutubeVideoId(trimmed)) {
      setError("Pega un enlace válido de YouTube.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/karaoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, title: title.trim() }),
      });
      const data = (await res.json().catch(() => null)) as
        | { error?: string; video?: KaraokeVideo }
        | null;
      if (!res.ok || !data?.video) {
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      setMessage(`Añadido: ${data.video.title}`);
      setUrl("");
      setTitle("");
      await onAdded(data.video);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo añadir");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-sm text-white/85">Añadir karaoke</p>
      <div className="flex rounded-full border border-white/10 bg-white/5 p-1 text-xs">
        {(
          [
            ["file", "Subir vídeo"],
            ["youtube", "YouTube"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setError(null);
              setMessage(null);
            }}
            className={`flex-1 rounded-full px-3 py-1.5 transition ${
              mode === value ? "aula-cta font-semibold" : "text-white/60 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "file" ? (
        <div className="space-y-3">
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => {
              e.preventDefault();
              if (e.currentTarget === e.target) setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFile(e.dataTransfer.files[0]);
            }}
            className={`rounded-2xl border border-dashed p-4 text-center transition ${
              dragging
                ? "border-violet-400/60 bg-violet-400/10"
                : "border-white/15 bg-white/[0.02] hover:border-white/25"
            } ${busy ? "pointer-events-none opacity-70" : ""}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={VIDEO_ACCEPT}
              className="hidden"
              onChange={(e) => addFile(e.target.files?.[0])}
            />
            <Upload className="mx-auto mb-2 h-5 w-5 text-violet-300" />
            <p className="text-sm text-white/80">Arrastra un vídeo de karaoke</p>
            <p className="mt-1 text-xs text-white/50">mp4, webm, mov · hasta 800 MB</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="aula-cta mt-3 rounded-full px-4 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              Elegir vídeo
            </button>
          </div>

          {file ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-[11px] text-white/45">
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  title="Quitar"
                  disabled={busy}
                  onClick={resetFile}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-40"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <input
                value={title}
                disabled={busy}
                maxLength={150}
                placeholder="Título (Artista - Canción)"
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base text-white placeholder:text-white/40 outline-none focus:border-violet-400/60 sm:text-sm"
              />
              <button
                type="button"
                onClick={() => void uploadFile()}
                disabled={busy}
                className="aula-cta w-full rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {busy ? "Subiendo…" : "Subir karaoke"}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <form onSubmit={(e) => void addYoutube(e)} className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-white/50">
            <Link className="h-3.5 w-3.5" />
            Enlace de YouTube
          </label>
          <input
            value={url}
            disabled={busy}
            placeholder="https://www.youtube.com/watch?v=…"
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base text-white placeholder:text-white/40 outline-none focus:border-violet-400/60 sm:text-sm"
          />
          <input
            value={title}
            disabled={busy}
            maxLength={150}
            placeholder="Título (opcional: se lee de YouTube)"
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base text-white placeholder:text-white/40 outline-none focus:border-violet-400/60 sm:text-sm"
          />
          <button
            type="submit"
            disabled={busy || url.trim().length === 0}
            className="aula-cta w-full rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Añadiendo…" : "Añadir de YouTube"}
          </button>
        </form>
      )}

      {message ? <p className="text-xs text-emerald-200">{message}</p> : null}
      {error ? <p className="text-xs text-red-200">{error}</p> : null}
      {mode === "file" && !file ? (
        <p className="flex items-start gap-2 text-[11px] text-white/40">
          <Film className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          El vídeo se guarda junto a tu música y se puede poner a pantalla completa.
        </p>
      ) : null}
    </div>
  );
}
