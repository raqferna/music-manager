import { randomUUID } from "node:crypto";
import { generateInstrumentalFromVocal, type InstrumentalGenerateResult } from "@/lib/instrumentalGenerate";
import { generateStemsFromSource, type StemGenerateResult } from "@/lib/stemGenerate";
import { importSongFromYoutube, type YoutubeImportResult } from "@/lib/youtubeImport";

export type ProcessingJobType = "youtube-import" | "add-instrumental" | "separate-stems";

export type YoutubeJobStatus = "queued" | "pending" | "running" | "completed" | "failed";

export type ProcessingJobResult = YoutubeImportResult | InstrumentalGenerateResult | StemGenerateResult;

export type YoutubeJob = {
  id: string;
  type: ProcessingJobType;
  url?: string;
  groupKey?: string;
  status: YoutubeJobStatus;
  createdAt: number;
  updatedAt: number;
  result?: ProcessingJobResult;
  error?: string;
};

type JobStore = Map<string, YoutubeJob>;

declare global {
  // eslint-disable-next-line no-var
  var __youtubeImportJobs: JobStore | undefined;
  // eslint-disable-next-line no-var
  var __youtubeImportActiveJobId: string | undefined;
  // eslint-disable-next-line no-var
  var __youtubeImportQueue: string[] | undefined;
}

const JOB_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_RECENT_JOBS = 20;

function jobs(): JobStore {
  if (!globalThis.__youtubeImportJobs) {
    globalThis.__youtubeImportJobs = new Map();
  }
  return globalThis.__youtubeImportJobs;
}

function queue(): string[] {
  if (!globalThis.__youtubeImportQueue) {
    globalThis.__youtubeImportQueue = [];
  }
  return globalThis.__youtubeImportQueue;
}

function isActiveStatus(status: YoutubeJobStatus): boolean {
  return status === "queued" || status === "pending" || status === "running";
}

function pruneOldJobs() {
  const cutoff = Date.now() - JOB_TTL_MS;
  for (const [id, job] of jobs()) {
    if (job.updatedAt < cutoff && !isActiveStatus(job.status)) {
      jobs().delete(id);
      const qi = queue().indexOf(id);
      if (qi >= 0) queue().splice(qi, 1);
    }
  }
}

export function getYoutubeJob(jobId: string): YoutubeJob | undefined {
  return jobs().get(jobId);
}

export function getActiveYoutubeJob(): YoutubeJob | null {
  pruneOldJobs();

  const activeId = globalThis.__youtubeImportActiveJobId;
  if (activeId) {
    const job = jobs().get(activeId);
    if (job && (job.status === "pending" || job.status === "running")) {
      return job;
    }
  }

  for (const job of jobs().values()) {
    if (job.status === "pending" || job.status === "running") {
      return job;
    }
  }

  return null;
}

export function getQueuedYoutubeJobs(): YoutubeJob[] {
  pruneOldJobs();
  return queue()
    .map((id) => jobs().get(id))
    .filter((job): job is YoutubeJob => job !== undefined && job.status === "queued");
}

export function getRecentYoutubeJobs(): YoutubeJob[] {
  pruneOldJobs();
  const recent: YoutubeJob[] = [];
  for (const job of jobs().values()) {
    if (job.status === "completed" || job.status === "failed") {
      recent.push(job);
    }
  }
  recent.sort((a, b) => b.updatedAt - a.updatedAt);
  return recent.slice(0, MAX_RECENT_JOBS);
}

export function getLatestYoutubeJob(): YoutubeJob | null {
  pruneOldJobs();
  let latest: YoutubeJob | null = null;
  for (const job of jobs().values()) {
    if (!latest || job.updatedAt > latest.updatedAt) {
      latest = job;
    }
  }
  return latest;
}

function findDuplicateJob(
  type: ProcessingJobType,
  key: string,
): YoutubeJob | null {
  const normalized = key.trim();
  for (const job of jobs().values()) {
    if (job.type !== type || !isActiveStatus(job.status)) continue;
    const jobKey = type === "youtube-import" ? job.url : job.groupKey;
    if (jobKey === normalized) return job;
  }
  return null;
}

async function executeJob(job: YoutubeJob, musicDir: string): Promise<ProcessingJobResult> {
  if (job.type === "add-instrumental") {
    if (!job.groupKey) throw new Error("Falta groupKey");
    return generateInstrumentalFromVocal(musicDir, job.groupKey);
  }
  if (job.type === "separate-stems") {
    if (!job.groupKey) throw new Error("Falta groupKey");
    return generateStemsFromSource(musicDir, job.groupKey);
  }
  if (!job.url) throw new Error("Falta URL");
  return importSongFromYoutube(job.url, musicDir);
}

function runJob(job: YoutubeJob, musicDir: string) {
  globalThis.__youtubeImportActiveJobId = job.id;
  job.status = "pending";
  job.updatedAt = Date.now();

  void (async () => {
    job.status = "running";
    job.updatedAt = Date.now();

    try {
      const result = await executeJob(job, musicDir);
      job.status = "completed";
      job.result = result;
      job.error = undefined;
    } catch (err) {
      job.status = "failed";
      job.error = err instanceof Error ? err.message : "Error desconocido";
    } finally {
      job.updatedAt = Date.now();
      if (globalThis.__youtubeImportActiveJobId === job.id) {
        globalThis.__youtubeImportActiveJobId = undefined;
      }
      processNextInQueue(musicDir);
    }
  })();
}

function processNextInQueue(musicDir: string) {
  if (getActiveYoutubeJob()) return;

  while (queue().length > 0) {
    const nextId = queue().shift();
    if (!nextId) break;

    const job = jobs().get(nextId);
    if (!job || job.status !== "queued") continue;

    runJob(job, musicDir);
    return;
  }
}

function enqueueJob(
  job: YoutubeJob,
  musicDir: string,
): { job: YoutubeJob; duplicate: boolean } {
  jobs().set(job.id, job);

  const active = getActiveYoutubeJob();
  if (active) {
    queue().push(job.id);
    return { job, duplicate: false };
  }

  runJob(job, musicDir);
  return { job, duplicate: false };
}

export function enqueueYoutubeImportJob(url: string, musicDir: string): { job: YoutubeJob; duplicate: boolean } {
  pruneOldJobs();

  const duplicate = findDuplicateJob("youtube-import", url);
  if (duplicate) {
    return { job: duplicate, duplicate: true };
  }

  const job: YoutubeJob = {
    id: randomUUID(),
    type: "youtube-import",
    url,
    status: "queued",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return enqueueJob(job, musicDir);
}

export function enqueueInstrumentalJob(
  groupKey: string,
  musicDir: string,
): { job: YoutubeJob; duplicate: boolean } {
  pruneOldJobs();

  const duplicate = findDuplicateJob("add-instrumental", groupKey);
  if (duplicate) {
    return { job: duplicate, duplicate: true };
  }

  const job: YoutubeJob = {
    id: randomUUID(),
    type: "add-instrumental",
    groupKey,
    status: "queued",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return enqueueJob(job, musicDir);
}

export function enqueueStemSeparationJob(
  groupKey: string,
  musicDir: string,
): { job: YoutubeJob; duplicate: boolean } {
  pruneOldJobs();

  const duplicate = findDuplicateJob("separate-stems", groupKey);
  if (duplicate) {
    return { job: duplicate, duplicate: true };
  }

  const job: YoutubeJob = {
    id: randomUUID(),
    type: "separate-stems",
    groupKey,
    status: "queued",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return enqueueJob(job, musicDir);
}

/** @deprecated Usar enqueueYoutubeImportJob */
export function startYoutubeImportJob(url: string, musicDir: string): YoutubeJob {
  return enqueueYoutubeImportJob(url, musicDir).job;
}

export function jobLabel(job: YoutubeJob): string {
  if (job.type === "add-instrumental") {
    return job.groupKey ?? "Sin voz";
  }
  if (job.type === "separate-stems") {
    return job.groupKey ?? "Instrumentos";
  }
  return job.url ?? "";
}

export function jobToPayload(job: YoutubeJob, queuePosition?: number) {
  return {
    jobId: job.id,
    type: job.type,
    url: job.url ?? null,
    groupKey: job.groupKey ?? null,
    label: jobLabel(job),
    status: job.status,
    queuePosition: queuePosition ?? null,
    result: job.result ?? null,
    error: job.error ?? null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export function getQueuePosition(jobId: string): number | null {
  const job = jobs().get(jobId);
  if (!job || job.status !== "queued") return null;
  const idx = queue().indexOf(jobId);
  return idx >= 0 ? idx + 1 : null;
}
