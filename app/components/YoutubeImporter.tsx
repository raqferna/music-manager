"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isYoutubeUrl } from "@/lib/audio";
import { Link, Loader } from "./icons";

type Props = {
  onImported: (groupKey: string) => void | Promise<void>;
};

type JobStatus = "queued" | "pending" | "running" | "completed" | "failed";

type JobPayload = {
  jobId: string;
  type?: "youtube-import" | "add-instrumental" | "separate-stems";
  url?: string | null;
  groupKey?: string | null;
  label?: string;
  status: JobStatus;
  queuePosition?: number | null;
  result?: {
    file?: string;
    groupKey?: string;
    title?: string;
    baseName?: string;
    vocalFile?: string;
    instrumentalFile?: string | null;
    partial?: boolean;
    message?: string;
  } | null;
  error?: string | null;
  createdAt?: number;
  updatedAt?: number;
};

type QueueResponse = {
  active?: JobPayload | null;
  queued?: JobPayload[];
  recent?: JobPayload[];
};

const POLL_MS = 3000;
const STORAGE_KEY = "youtube-import-tracking";

function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function statusLabel(status: JobStatus): string {
  if (status === "queued") return "En cola";
  if (status === "pending") return "Iniciando…";
  if (status === "running") return "Procesando";
  if (status === "completed") return "Completado";
  return "Error";
}

function statusColor(status: JobStatus): string {
  if (status === "queued") return "text-white/50";
  if (status === "pending" || status === "running") return "text-cyan-200";
  if (status === "completed") return "text-emerald-300/90";
  return "text-red-300/90";
}

function truncateUrl(url: string, max = 48): string {
  if (url.length <= max) return url;
  return url.slice(0, max - 1) + "…";
}

function jobDisplayLabel(job: JobPayload): string {
  if (job.label) return truncateUrl(job.label, 56);
  if (job.type === "add-instrumental" || job.type === "separate-stems") {
    return job.groupKey ?? (job.type === "separate-stems" ? "Instrumentos" : "Sin voz");
  }
  return truncateUrl(job.url ?? "");
}

function jobTypeHint(job: JobPayload): string {
  if (job.type === "add-instrumental") return "Generar sin voz";
  if (job.type === "separate-stems") return "Separar instrumentos";
  return "Importar YouTube";
}

function parseUrls(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isProcessing(status: JobStatus): boolean {
  return status === "queued" || status === "pending" || status === "running";
}

export default function YoutubeImporter({ onImported }: Props) {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeJob, setActiveJob] = useState<JobPayload | null>(null);
  const [queuedJobs, setQueuedJobs] = useState<JobPayload[]>([]);
  const [recentJobs, setRecentJobs] = useState<JobPayload[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [networkWarning, setNetworkWarning] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onImportedRef = useRef(onImported);
  const handledCompletedRef = useRef<Set<string>>(new Set());
  onImportedRef.current = onImported;

  const hasWork =
    queuedJobs.length > 0 ||
    (activeJob !== null && isProcessing(activeJob.status));

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const handleCompletedJob = useCallback(async (job: JobPayload) => {
    if (handledCompletedRef.current.has(job.jobId)) return;
    handledCompletedRef.current.add(job.jobId);

    const groupKey =
      job.result?.groupKey ||
      job.groupKey ||
      job.result?.baseName ||
      job.result?.file ||
      job.result?.vocalFile;
    if (!groupKey) return;

    await onImportedRef.current(groupKey);
  }, []);

  const applyQueueState = useCallback(
    async (data: QueueResponse) => {
      setActiveJob(data.active ?? null);
      setQueuedJobs(data.queued ?? []);
      setRecentJobs(data.recent ?? []);

      const processing =
        data.active && (data.active.status === "pending" || data.active.status === "running");
      if (processing && data.active?.createdAt) {
        setStartedAt((prev) => prev ?? data.active!.createdAt!);
      } else if (!processing && !(data.queued?.length)) {
        setStartedAt(null);
        setElapsedMs(0);
      }

      const newlyCompleted = (data.recent ?? []).filter(
        (j) => j.status === "completed" && (j.result?.file || j.result?.groupKey),
      );
      for (const job of newlyCompleted) {
        await handleCompletedJob(job);
      }

      const hasActiveOrQueued =
        (data.active && isProcessing(data.active.status)) || (data.queued?.length ?? 0) > 0;

      if (hasActiveOrQueued) {
        localStorage.setItem(STORAGE_KEY, "1");
      } else {
        localStorage.removeItem(STORAGE_KEY);
        stopPolling();
      }
    },
    [handleCompletedJob, stopPolling],
  );

  const pollQueue = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/songs/import-youtube", { cache: "no-store" });
      const data = (await res.json()) as QueueResponse & { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      setNetworkWarning(null);
      await applyQueueState(data);

      const stillWorking =
        (data.active && isProcessing(data.active.status)) || (data.queued?.length ?? 0) > 0;
      return !stillWorking;
    } catch {
      setNetworkWarning(
        "Problema de conexión al consultar el estado. El servidor puede seguir procesando — reintentando…",
      );
      return false;
    }
  }, [applyQueueState]);

  const beginPolling = useCallback(() => {
    stopPolling();
    void pollQueue().then((done) => {
      if (done) return;
      pollRef.current = setInterval(() => {
        void pollQueue().then((finished) => {
          if (finished) stopPolling();
        });
      }, POLL_MS);
    });
  }, [pollQueue, stopPolling]);

  useEffect(() => {
    const onQueueChanged = () => beginPolling();
    window.addEventListener("processing-queue-changed", onQueueChanged);
    return () => window.removeEventListener("processing-queue-changed", onQueueChanged);
  }, [beginPolling]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/songs/import-youtube", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as QueueResponse;
        await applyQueueState(data);

        const hasActiveOrQueued =
          (data.active && isProcessing(data.active.status)) || (data.queued?.length ?? 0) > 0;
        if (hasActiveOrQueued || localStorage.getItem(STORAGE_KEY)) {
          beginPolling();
        }
      } catch {
        // Ignorar: el usuario puede iniciar manualmente.
      }
    })();
  }, [applyQueueState, beginPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    const processing = activeJob?.status === "pending" || activeJob?.status === "running";
    if (!processing || !startedAt) return;
    const tick = () => setElapsedMs(Date.now() - startedAt);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeJob?.status, startedAt]);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    const urls = parseUrls(url);
    if (urls.length === 0) return;

    const invalid = urls.filter((u) => !isYoutubeUrl(u));
    if (invalid.length > 0) {
      setError("Pega enlaces válidos de YouTube (watch, youtu.be o shorts).");
      setMessage(null);
      return;
    }

    setSubmitting(true);
    setError(null);
    setNetworkWarning(null);

    try {
      const res = await fetch("/api/songs/import-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(urls.length === 1 ? { url: urls[0] } : { urls }),
      });

      const data = (await res.json()) as JobPayload & {
        error?: string;
        message?: string;
        jobs?: JobPayload[];
      };

      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      setMessage(data.message ?? "Canciones encoladas.");
      setUrl("");
      beginPolling();
      await pollQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar");
      setMessage(null);
    } finally {
      setSubmitting(false);
    }
  }

  const totalPending = queuedJobs.length + (activeJob && isProcessing(activeJob.status) ? 1 : 0);

  return (
    <div className="space-y-2">
      <form onSubmit={(e) => void handleImport(e)} className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-white/50">
          <Link className="h-3.5 w-3.5 text-cyan-300" />
          Cola de procesamiento
          {totalPending > 0 ? (
            <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] normal-case text-cyan-200">
              {totalPending} en cola
            </span>
          ) : null}
        </div>
        <textarea
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={"https://www.youtube.com/watch?v=…\n(o varias URLs, una por línea)"}
          rows={2}
          disabled={submitting}
          className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-cyan-400/50 focus:bg-white/10 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={submitting || !url.trim()}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader className="h-4 w-4 animate-spin-slow" />
              Encolando…
            </span>
          ) : hasWork ? (
            "Añadir a la cola"
          ) : (
            "Quitar voz y añadir"
          )}
        </button>
      </form>

      {activeJob && (activeJob.status === "pending" || activeJob.status === "running") ? (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-medium text-cyan-100">
              <Loader className="h-4 w-4 animate-spin-slow shrink-0" />
              {statusLabel(activeJob.status)}
            </span>
            <span className="tabular-nums text-sm text-cyan-200/90">{formatElapsed(elapsedMs)}</span>
          </div>
          <p className="text-xs text-cyan-100/70 truncate" title={jobDisplayLabel(activeJob)}>
            <span className="text-cyan-200/60">{jobTypeHint(activeJob)} · </span>
            {jobDisplayLabel(activeJob)}
          </p>
          <p className="text-xs text-cyan-100/80 leading-relaxed">
            {activeJob.type === "add-instrumental"
              ? "Separando la pista instrumental. Puedes seguir añadiendo canciones a la cola."
              : "Descargando audio y quitando la voz. Modo rápido: suele tardar 15–40 min. Puedes seguir añadiendo canciones a la cola."}
          </p>
        </div>
      ) : null}

      {queuedJobs.length > 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-white/40 px-1">
            En espera ({queuedJobs.length})
          </p>
          <ul className="space-y-1">
            {queuedJobs.map((job) => (
              <li
                key={job.jobId}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-white/60"
              >
                <span className="shrink-0 tabular-nums text-white/40 w-4 text-right">
                  {job.queuePosition ?? "·"}
                </span>
                <span className="truncate flex-1" title={jobDisplayLabel(job)}>
                  <span className="text-white/35">{jobTypeHint(job)} · </span>
                  {jobDisplayLabel(job)}
                </span>
                <span className={`shrink-0 ${statusColor(job.status)}`}>
                  {statusLabel(job.status)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {recentJobs.length > 0 ? (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2 space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-white/30 px-1">
            Recientes
          </p>
          <ul className="space-y-1 max-h-32 overflow-y-auto">
            {recentJobs.slice(0, 5).map((job) => (
              <li
                key={job.jobId}
                className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs"
              >
                <span className="truncate flex-1 text-white/50" title={jobDisplayLabel(job)}>
                  {job.result?.title || job.groupKey || jobDisplayLabel(job)}
                </span>
                <span className={`shrink-0 ${statusColor(job.status)}`}>
                  {job.status === "completed"
                    ? job.type === "add-instrumental"
                      ? "Sin voz OK"
                      : job.result?.partial
                        ? "Solo voz"
                        : "OK"
                    : statusLabel(job.status)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {message && !error ? <p className="text-xs text-emerald-300/90">{message}</p> : null}

      {networkWarning ? (
        <p className="text-xs text-amber-200/90 rounded-lg border border-amber-400/20 bg-amber-500/10 px-2 py-1.5">
          {networkWarning}
        </p>
      ) : null}
      {error ? <p className="text-xs text-red-300/90">{error}</p> : null}
    </div>
  );
}
