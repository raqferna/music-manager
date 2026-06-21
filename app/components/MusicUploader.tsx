"use client";

import { useRef, useState } from "react";
import { AUDIO_ACCEPT } from "@/lib/audio";
import { Upload } from "./icons";

type Props = {
  onUploaded: (files: string[]) => void | Promise<void>;
  compact?: boolean;
};

export default function MusicUploader({ onUploaded, compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }

      const res = await fetch("/api/songs/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const detail =
          data.errors?.map((e: { name: string; error: string }) => `${e.name}: ${e.error}`).join(" · ") ??
          data.error;
        throw new Error(detail ?? `HTTP ${res.status}`);
      }

      const uploaded = (data.uploaded ?? []) as { file: string }[];
      const partialErrors = (data.errors ?? []) as { name: string; error: string }[];

      if (uploaded.length > 0) {
        setMessage(
          uploaded.length === 1
            ? `Subido: ${uploaded[0].file}`
            : `${uploaded.length} archivos subidos`,
        );
        await onUploaded(uploaded.map((f) => f.file));
      }

      if (partialErrors.length > 0) {
        setError(
          partialErrors
            .map((e) => `${e.name}: ${e.error}`)
            .join(" · "),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    void uploadFiles(e.dataTransfer.files);
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
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
        onDrop={onDrop}
        className={`rounded-2xl border border-dashed p-4 text-center transition ${
          dragging
            ? "border-violet-400/60 bg-violet-400/10"
            : "border-white/15 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]"
        } ${uploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={AUDIO_ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void uploadFiles(e.target.files);
          }}
        />

        <Upload className="mx-auto mb-2 h-6 w-6 text-violet-300" />
        <p className="text-sm text-white/80">
          {uploading ? "Subiendo…" : "Arrastra archivos de audio aquí"}
        </p>
        <p className="mt-1 text-xs text-white/50">
          mp3, wav, m4a, flac, ogg, aac · hasta 200 MB
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-3 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-1.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          Elegir archivos
        </button>
      </div>

      {message ? (
        <p className="text-xs text-emerald-300/90">{message}</p>
      ) : null}
      {error ? (
        <p className="text-xs text-red-300/90">{error}</p>
      ) : null}
    </div>
  );
}
