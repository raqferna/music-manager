"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isYoutubeUrl } from "@/lib/audio";
import { Link, Loader } from "./icons";

type Props = {
  onImported: (groupKey: string) => void | Promise<void>;
};

type JobStatus = "pending" | "running" | "completed" | "failed";

type JobPayload = {
  jobId: string;
  url?: string;
  status: JobStatus;
  result?: {
    file?: string;
    groupKey?: string;
    title?: string;
    baseName?: string;
    message?: string;
  } | null;
  error?: string | null;
  createdAt?: number;
  updatedAt?: number;
};

const POLL_MS = 3000;
const STORAGE_KEY = "youtube-import-job-id";

function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function statusLabel(status: JobStatus): string {
  if (status === "pending") return "Iniciando…";
  if (status === "running") return "Procesando en el servidor";
  if (status === "completed") return "Completado";
  return "Error";
}

export default function YoutubeImporter({ onImported }: Props) {
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [networkWarning, setNetworkWarning] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onImportedRef = useRef(onImported);
  onImportedRef.current = onImported;

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const finishJob = useCallback(
    async (data: JobPayload) => {
      stopPolling();
      localStorage.removeItem(STORAGE_KEY);

      const file = data.result?.file;
      if (!file) {
        setError("La importación terminó sin archivo.");
        setImporting(false);
        setJobStatus("failed");
        return;
      }

      const label = data.result?.title || data.result?.baseName || file;
      const groupKey = data.result?.groupKey || data.result?.baseName || file;
      setMessage(`Instrumental añadido: ${label}`);
      setError(null);
      setNetworkWarning(null);
      setJobStatus("completed");
      setImporting(false);
      setUrl("");
      await onImportedRef.current(groupKey);
    },
    [stopPolling],
  );

  const pollJob = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/songs/import-youtube/${id}`, { cache: "no-store" });
        const data = (await res.json()) as JobPayload & { error?: string };

        if (res.status === 404) {
          setNetworkWarning(null);
          setError(
            "No se encuentra el trabajo en el servidor (¿reinició el contenedor?). Comprueba la lista por si la canción ya se guardó.",
          );
          setImporting(false);
          stopPolling();
          localStorage.removeItem(STORAGE_KEY);
          return true;
        }

        if (!res.ok) {
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }

        setNetworkWarning(null);
        setJobStatus(data.status);
        if (data.createdAt) {
          setStartedAt((prev) => prev ?? data.createdAt!);
        }

        if (data.status === "pending" || data.status === "running") {
          setMessage(
            "Descargando audio y quitando la voz. Modo rápido: suele tardar 15–40 min. Puedes recargar la página.",
          );
          return false;
        }

        if (data.status === "failed") {
          stopPolling();
          localStorage.removeItem(STORAGE_KEY);
          setError(data.error ?? "La importación falló en el servidor.");
          setImporting(false);
          return true;
        }

        await finishJob(data);
        return true;
      } catch (err) {
        setNetworkWarning(
          "Problema de conexión al consultar el estado. El servidor puede seguir procesando — reintentando…",
        );
        return false;
      }
    },
    [finishJob, stopPolling],
  );

  const beginPolling = useCallback(
    (id: string, createdAt?: number) => {
      setJobId(id);
      setImporting(true);
      setError(null);
      setNetworkWarning(null);
      setJobStatus("running");
      setStartedAt(createdAt ?? Date.now());
      localStorage.setItem(STORAGE_KEY, id);

      stopPolling();
      void pollJob(id).then((done) => {
        if (done) return;
        pollRef.current = setInterval(() => {
          void pollJob(id).then((finished) => {
            if (finished) stopPolling();
          });
        }, POLL_MS);
      });
    },
    [pollJob, stopPolling],
  );

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/songs/import-youtube", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { active?: JobPayload | null; latest?: JobPayload | null };
        const stored = localStorage.getItem(STORAGE_KEY);

        const candidate =
          data.active ??
          (data.latest &&
          (data.latest.status === "pending" || data.latest.status === "running")
            ? data.latest
            : null) ??
          (stored ? { jobId: stored, status: "running" as const } : null);

        if (!candidate?.jobId) return;

        if (candidate.url) setUrl(candidate.url);

        if (candidate.status === "completed" && candidate.result?.file) {
          await finishJob(candidate as JobPayload);
          return;
        }

        if (candidate.status === "failed") {
          setError(candidate.error ?? "La última importación falló.");
          setJobStatus("failed");
          return;
        }

        beginPolling(candidate.jobId, candidate.createdAt);
      } catch {
        // Ignorar: el usuario puede iniciar manualmente.
      }
    })();
  }, [beginPolling, finishJob]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    if (!importing || !startedAt) return;
    const tick = () => setElapsedMs(Date.now() - startedAt);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [importing, startedAt]);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    if (!isYoutubeUrl(trimmed)) {
      setError("Pega un enlace válido de YouTube (watch, youtu.be o shorts).");
      setMessage(null);
      return;
    }

    setImporting(true);
    setError(null);
    setNetworkWarning(null);
    setMessage("Encolando importación en el servidor…");

    try {
      const res = await fetch("/api/songs/import-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = (await res.json()) as JobPayload & { error?: string; message?: string };

      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      if (!data.jobId) {
        throw new Error("No se recibió identificador de trabajo");
      }

      setMessage(data.message ?? "Importación en curso…");
      beginPolling(data.jobId, data.createdAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar");
      setMessage(null);
      setImporting(false);
    }
  }

  return (
    <div className="space-y-2">
      <form onSubmit={(e) => void handleImport(e)} className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-white/50">
          <Link className="h-3.5 w-3.5 text-cyan-300" />
          Importar desde YouTube
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            disabled={importing}
            className="min-w-0 grow rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-cyan-400/50 focus:bg-white/10 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={importing || !url.trim()}
            className="shrink-0 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {importing ? (
              <span className="flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin-slow" />
                Procesando…
              </span>
            ) : (
              "Quitar voz"
            )}
          </button>
        </div>
      </form>

      {importing ? (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-medium text-cyan-100">
              <Loader className="h-4 w-4 animate-spin-slow shrink-0" />
              {jobStatus ? statusLabel(jobStatus) : "Procesando…"}
            </span>
            <span className="tabular-nums text-sm text-cyan-200/90">{formatElapsed(elapsedMs)}</span>
          </div>
          <p className="text-xs text-cyan-100/80 leading-relaxed">{message}</p>
          {jobId ? (
            <p className="text-[10px] text-white/40 truncate" title={jobId}>
              ID: {jobId.slice(0, 8)}…
            </p>
          ) : null}
        </div>
      ) : message ? (
        <p className="text-xs text-emerald-300/90">{message}</p>
      ) : null}

      {networkWarning ? (
        <p className="text-xs text-amber-200/90 rounded-lg border border-amber-400/20 bg-amber-500/10 px-2 py-1.5">
          {networkWarning}
        </p>
      ) : null}
      {error ? <p className="text-xs text-red-300/90">{error}</p> : null}
    </div>
  );
}
