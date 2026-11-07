"use client";

import { useState, type FormEvent } from "react";
import { isYoutubeUrl } from "@/lib/audio";
import { parseYoutubeVideoId } from "@/lib/karaoke";
import { Link } from "./icons";

type Props = {
  onSent?: () => void;
};

export default function KaraokeRequestForm({ onSent }: Props) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: FormEvent) {
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
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "karaoke", url: trimmed, note: title.trim() }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "No se pudo enviar");
        return;
      }
      setUrl("");
      setTitle("");
      setMessage("Petición enviada. Quien administra el aula la verá.");
      onSent?.();
    } catch {
      setError("No se pudo enviar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="mb-4 space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-sm text-white/85">Pedir un karaoke</p>
      <p className="text-xs text-white/45">
        Pega un enlace de YouTube. No se añade hasta que lo acepte quien administra el aula.
      </p>
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
        placeholder="Título (opcional)"
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base text-white placeholder:text-white/40 outline-none focus:border-violet-400/60 sm:text-sm"
      />
      <button
        type="submit"
        disabled={busy || url.trim().length === 0}
        className="aula-cta w-full rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50"
      >
        {busy ? "Enviando…" : "Enviar petición"}
      </button>
      {message ? <p className="text-xs text-emerald-200">{message}</p> : null}
      {error ? <p className="text-xs text-red-200">{error}</p> : null}
    </form>
  );
}
