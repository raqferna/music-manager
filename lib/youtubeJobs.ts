import { randomUUID } from "node:crypto";
import { importSongFromYoutube, type YoutubeImportResult } from "@/lib/youtubeImport";

export type YoutubeJobStatus = "pending" | "running" | "completed" | "failed";

export type YoutubeJob = {
  id: string;
  url: string;
  status: YoutubeJobStatus;
  createdAt: number;
  updatedAt: number;
  result?: YoutubeImportResult;
  error?: string;
};

type JobStore = Map<string, YoutubeJob>;

declare global {
  // eslint-disable-next-line no-var
  var __youtubeImportJobs: JobStore | undefined;
  // eslint-disable-next-line no-var
  var __youtubeImportActiveJobId: string | undefined;
}

const JOB_TTL_MS = 2 * 60 * 60 * 1000;

function jobs(): JobStore {
  if (!globalThis.__youtubeImportJobs) {
    globalThis.__youtubeImportJobs = new Map();
  }
  return globalThis.__youtubeImportJobs;
}

function pruneOldJobs() {
  const cutoff = Date.now() - JOB_TTL_MS;
  for (const [id, job] of jobs()) {
    if (job.updatedAt < cutoff && job.status !== "running" && job.status !== "pending") {
      jobs().delete(id);
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

export function startYoutubeImportJob(url: string, musicDir: string): YoutubeJob {
  pruneOldJobs();

  const active = getActiveYoutubeJob();
  if (active) {
    return active;
  }

  const job: YoutubeJob = {
    id: randomUUID(),
    url,
    status: "pending",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  jobs().set(job.id, job);
  globalThis.__youtubeImportActiveJobId = job.id;

  void (async () => {
    job.status = "running";
    job.updatedAt = Date.now();

    try {
      const result = await importSongFromYoutube(url, musicDir);
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
    }
  })();

  return job;
}

export function jobToPayload(job: YoutubeJob) {
  return {
    jobId: job.id,
    url: job.url,
    status: job.status,
    result: job.result ?? null,
    error: job.error ?? null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}
