"use client";

import { useEffect, useState } from "react";
import type { SongGroup } from "@/lib/types";

type RequestKind = "youtube" | "vocal" | "instrumental" | "karaoke";
type DownloadRequest = {
  id: string;
  kind: RequestKind;
  url: string | null;
  groupKey: string | null;
  note: string;
  status: "pending" | "accepted" | "rejected";
};

function requestLabel(item: DownloadRequest): string {
  if (item.kind === "youtube") return "Canción nueva";
  if (item.kind === "vocal") return "Versión con voz";
  if (item.kind === "karaoke") return "Karaoke";
  return "Versión sin voz";
}

type Props = {
  admin: boolean;
  groups: SongGroup[];
  onAccepted?: () => void;
};

const KIND_OPTIONS: { id: RequestKind; label: string }[] = [
  { id: "youtube", label: "Canción nueva" },
  { id: "karaoke", label: "Karaoke (YouTube)" },
  { id: "vocal", label: "Con voz, de una que ya está" },
  { id: "instrumental", label: "Sin voz, de una que ya está" },
];

function statusText(status: DownloadRequest["status"]): string {
  if (status === "pending") return "Pendiente";
  if (status === "accepted") return "Aceptada";
  return "Rechazada";
}

export default function DownloadRequests({ admin, groups, onAccepted }: Props) {
  const [items, setItems] = useState<DownloadRequest[]>([]);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<RequestKind>("youtube");
  const [url, setUrl] = useState("");
  const [groupKey, setGroupKey] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const res = await fetch("/api/requests", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { requests?: DownloadRequest[] };
    setItems(data.requests ?? []);
  }

  useEffect(() => {
    void reload();
  }, []);

  const songOptions = groups.filter((group) =>
    kind === "vocal" ? !group.hasVocal : kind === "instrumental" ? group.hasVocal && !group.hasInstrumental : true,
  );

  async function submit() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, url, groupKey, note }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "No se pudo enviar");
        return;
      }
      setMessage("Petición enviada. La verá quien administra el aula.");
      setUrl("");
      setNote("");
      setOpen(false);
      await reload();
    } catch {
      setError("No se pudo enviar");
    } finally {
      setBusy(false);
    }
  }

  async function decide(id: string, action: "accept" | "reject") {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/requests/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "No se pudo actualizar");
        return;
      }
      setMessage(data?.message ?? "Listo");
      await reload();
      onAccepted?.();
    } catch {
      setError("No se pudo actualizar");
    } finally {
      setBusy(false);
    }
  }

  const pending = items.filter((item) => item.status === "pending");
  const recent = items.filter((item) => item.status !== "pending").slice(0, 6);

  return (
    <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-white/85">{admin ? "Peticiones de descarga" : "Pedir una versión"}</p>
          <p className="text-xs text-white/45">
            {admin
              ? "Si aceptas, las canciones entran en cola y el karaoke va a la lista."
              : "Pide una canción, un karaoke o una versión. No se añade hasta que se acepte."}
          </p>
        </div>
        {admin ? (
          <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/70">
            {pending.length} pendientes
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="aula-cta rounded-full px-3 py-1.5 text-xs font-semibold"
          >
            {open ? "Cerrar" : "Pedir"}
          </button>
        )}
      </div>

      {!admin && open ? (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-1">
            {KIND_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setKind(option.id);
                  setGroupKey("");
                }}
                className={`rounded-full px-2.5 py-1 text-[11px] ${
                  kind === option.id ? "bg-white/15 text-white" : "text-white/55 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {kind !== "instrumental" ? (
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enlace de YouTube"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-base text-white outline-none focus:border-amber-200/40 sm:text-sm"
            />
          ) : null}
          {kind !== "youtube" && kind !== "karaoke" ? (
            <select
              value={groupKey}
              onChange={(e) => setGroupKey(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-base text-white outline-none sm:text-sm"
            >
              <option value="">Elige la canción</option>
              {songOptions.map((group) => (
                <option key={group.groupKey} value={group.groupKey}>
                  {group.title}
                </option>
              ))}
            </select>
          ) : null}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={kind === "karaoke" ? "Título (opcional)" : "Nota, si hace falta"}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-base text-white outline-none focus:border-amber-200/40 sm:text-sm"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="aula-cta rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            {busy ? "Enviando…" : "Enviar petición"}
          </button>
        </div>
      ) : null}

      {admin && pending.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {pending.map((item) => (
            <li key={item.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-sm text-white/90">{requestLabel(item)}</p>
              <p className="truncate text-xs text-white/50">{item.groupKey || item.url}</p>
              {item.note ? <p className="mt-1 text-xs text-white/60">{item.note}</p> : null}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void decide(item.id, "accept")}
                  className="aula-cta rounded-full px-3 py-1 text-[11px] font-semibold disabled:opacity-40"
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void decide(item.id, "reject")}
                  className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/70 disabled:opacity-40"
                >
                  Rechazar
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {recent.length > 0 ? (
        <ul className="mt-3 space-y-1">
          {recent.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 text-[11px] text-white/45">
              <span className="truncate">{requestLabel(item)} · {item.groupKey || item.url}</span>
              <span>{statusText(item.status)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <p className="mt-2 text-xs text-red-200">{error}</p> : null}
      {message ? <p className="mt-2 text-xs text-emerald-200">{message}</p> : null}
    </div>
  );
}
