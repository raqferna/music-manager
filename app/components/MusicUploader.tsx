"use client";

import { useRef, useState } from "react";
import { AUDIO_ACCEPT, isAudioFilename } from "@/lib/audio";
import { Upload, X } from "./icons";

type Props = {
  onUploaded: (files: string[]) => void | Promise<void>;
  compact?: boolean;
};

type Variant = "vocal" | "instrumental";

type Pending = { id: number; file: File; title: string };

/** Título inicial a partir del nombre del archivo: sin extensión ni guiones bajos. */
function titleFromFilename(name: string): string {
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  return stem.replace(/_+/g, " ").replace(/\s+/g, " ").trim();
}

export default function MusicUploader({ onUploaded, compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);
  const [variant, setVariant] = useState<Variant>("vocal");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const valid = files.filter((f) => isAudioFilename(f.name));
    const rejected = files.filter((f) => !isAudioFilename(f.name));

    setMessage(null);
    setError(
      rejected.length > 0
        ? `${rejected.map((f) => f.name).join(", ")}: formato no soportado (usa mp3, wav, m4a, flac, ogg o aac)`
        : null,
    );

    if (valid.length > 0) {
      setPending((prev) => [
        ...prev,
        ...valid.map((file) => ({
          id: nextId.current++,
          file,
          title: titleFromFilename(file.name),
        })),
      ]);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function cancel() {
    setPending([]);
    setError(null);
  }

  async function upload() {
    if (pending.length === 0) return;
    if (pending.some((p) => !p.title.trim())) {
      setError("Cada canción necesita un título.");
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("variant", variant);
      for (const item of pending) {
        formData.append("files", item.file);
        formData.append("titles", item.title.trim());
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
            ? `Subida: ${uploaded[0].file}`
            : `${uploaded.length} canciones subidas`,
        );
        // Solo se quitan de la lista las que se subieron; las fallidas se pueden corregir.
        const failedNames = new Set(partialErrors.map((e) => e.name));
        setPending((prev) => prev.filter((p) => failedNames.has(p.file.name)));
        await onUploaded(uploaded.map((f) => f.file));
      }

      if (partialErrors.length > 0) {
        setError(partialErrors.map((e) => `${e.name}: ${e.error}`).join(" · "));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
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
            if (e.target.files) addFiles(e.target.files);
          }}
        />

        <Upload className="mx-auto mb-2 h-6 w-6 text-violet-300" />
        <p className="text-sm text-white/80">Arrastra archivos de audio aquí</p>
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

      {pending.length > 0 ? (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <ul className="space-y-2">
            {pending.map((item) => (
              <li key={item.id} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-[11px] text-white/45">
                  <span className="truncate">{item.file.name}</span>
                  <button
                    type="button"
                    title="Quitar de la lista"
                    disabled={uploading}
                    onClick={() => setPending((prev) => prev.filter((p) => p.id !== item.id))}
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-40"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <input
                  value={item.title}
                  disabled={uploading}
                  maxLength={150}
                  placeholder="Título de la canción"
                  aria-label={`Título de ${item.file.name}`}
                  onChange={(e) =>
                    setPending((prev) =>
                      prev.map((p) => (p.id === item.id ? { ...p, title: e.target.value } : p)),
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base text-white placeholder:text-white/40 outline-none transition focus:border-violet-400/60 focus:bg-white/10 sm:text-sm"
                />
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-2 text-xs">
            {(
              [
                ["vocal", "Con voz"],
                ["instrumental", "Sin voz (pista)"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`cursor-pointer rounded-full border px-3 py-1 transition ${
                  variant === value
                    ? "border-violet-400/50 bg-violet-400/15 text-violet-100"
                    : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                }`}
              >
                <input
                  type="radio"
                  name="upload-variant"
                  value={value}
                  checked={variant === value}
                  disabled={uploading}
                  onChange={() => setVariant(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancel}
              disabled={uploading}
              className="rounded-xl border border-white/10 px-3 py-1.5 text-sm text-white/70 hover:bg-white/5 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void upload()}
              disabled={uploading}
              className="rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-1.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading
                ? "Subiendo…"
                : pending.length === 1
                  ? "Subir canción"
                  : `Subir ${pending.length} canciones`}
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <p className="text-xs text-emerald-300/90">{message}</p>
      ) : null}
      {error ? (
        <p className="text-xs text-red-300/90">{error}</p>
      ) : null}
    </div>
  );
}
