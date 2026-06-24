import path from "node:path";
import { randomUUID } from "node:crypto";
import { safeBasename } from "@/lib/musicDir";
import { transcribeLyricsFromAudio, type TranscribeResult } from "@/lib/lyricsTranscribe";
import { resolvePlaybackFile } from "@/lib/songGroups";
import type { SongGroup } from "@/lib/types";

export type TranscribeJobStatus = "pending" | "running" | "completed" | "failed";

export type TranscribeJob = {
  id: string;
  groupKey: string;
  audioFile: string;
  status: TranscribeJobStatus;
  createdAt: number;
  updatedAt: number;
  result?: TranscribeResult;
  error?: string;
};

type JobStore = Map<string, TranscribeJob>;

declare global {
  // eslint-disable-next-line no-var
  var __transcribeJobs: JobStore | undefined;
  // eslint-disable-next-line no-var
  var __transcribeActiveJobId: string | undefined;
}

const JOB_TTL_MS = 2 * 60 * 60 * 1000;

function jobs(): JobStore {
  if (!globalThis.__transcribeJobs) {
    globalThis.__transcribeJobs = new Map();
  }
  return globalThis.__transcribeJobs;
}

function pruneOldJobs() {
  const cutoff = Date.now() - JOB_TTL_MS;
  for (const [id, job] of jobs()) {
    if (job.updatedAt < cutoff && job.status !== "running" && job.status !== "pending") {
      jobs().delete(id);
    }
  }
}

export function getTranscribeJob(jobId: string): TranscribeJob | undefined {
  return jobs().get(jobId);
}

export function getActiveTranscribeJob(): TranscribeJob | null {
  pruneOldJobs();

  const activeId = globalThis.__transcribeActiveJobId;
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

export function resolveVocalAudioPath(
  musicDir: string,
  group: SongGroup,
): { audioFile: string; audioPath: string } {
  const audioFile = resolvePlaybackFile(group, "vocal");
  if (!audioFile) {
    throw new Error("Esta canción no tiene versión con voz. La transcripción solo funciona con audio vocal.");
  }
  const safe = safeBasename(audioFile);
  return {
    audioFile: safe,
    audioPath: path.join(musicDir, safe),
  };
}

export function startTranscribeJob(
  musicDir: string,
  group: SongGroup,
): TranscribeJob {
  pruneOldJobs();

  const active = getActiveTranscribeJob();
  if (active) {
    return active;
  }

  const { audioFile, audioPath } = resolveVocalAudioPath(musicDir, group);

  const job: TranscribeJob = {
    id: randomUUID(),
    groupKey: group.groupKey,
    audioFile,
    status: "pending",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  jobs().set(job.id, job);
  globalThis.__transcribeActiveJobId = job.id;

  void (async () => {
    job.status = "running";
    job.updatedAt = Date.now();

    try {
      const result = await transcribeLyricsFromAudio(audioPath);
      job.status = "completed";
      job.result = result;
      job.error = undefined;
    } catch (err) {
      job.status = "failed";
      job.error = err instanceof Error ? err.message : "Error desconocido";
    } finally {
      job.updatedAt = Date.now();
      if (globalThis.__transcribeActiveJobId === job.id) {
        globalThis.__transcribeActiveJobId = undefined;
      }
    }
  })();

  return job;
}

export function jobToPayload(job: TranscribeJob) {
  return {
    jobId: job.id,
    groupKey: job.groupKey,
    audioFile: job.audioFile,
    status: job.status,
    result: job.result ?? null,
    error: job.error ?? null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}
