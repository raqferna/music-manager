import { randomUUID } from "node:crypto";
import fsp from "node:fs/promises";
import path from "node:path";
import { isYoutubeUrl } from "@/lib/audio";
import { addYoutubeKaraoke, fetchYoutubeKaraokeTitle } from "@/lib/karaokeStorage";
import { loadLibrary } from "@/lib/library";
import { getMusicDir, safeBasename } from "@/lib/musicDir";
import type { SongGroup } from "@/lib/types";
import {
  enqueueInstrumentalJob,
  enqueueVocalJob,
  enqueueYoutubeImportJob,
} from "@/lib/youtubeJobs";

export type RequestKind = "youtube" | "vocal" | "instrumental" | "karaoke";
export type RequestStatus = "pending" | "accepted" | "rejected";

export type DownloadRequest = {
  id: string;
  kind: RequestKind;
  url: string | null;
  groupKey: string | null;
  note: string;
  status: RequestStatus;
  createdAt: number;
  decidedAt: number | null;
  jobId: string | null;
};

const FILE_NAME = ".download-requests.json";
const MAX_NOTE = 280;
const MAX_KEPT = 40;

let chain: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function filePath(): Promise<string> {
  return path.join(await getMusicDir(), FILE_NAME);
}

async function readAll(): Promise<DownloadRequest[]> {
  try {
    const raw = await fsp.readFile(await filePath(), "utf8");
    const parsed = JSON.parse(raw) as DownloadRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(items: DownloadRequest[]): Promise<void> {
  const pending = items.filter((item) => item.status === "pending");
  const decided = items
    .filter((item) => item.status !== "pending")
    .sort((a, b) => (b.decidedAt ?? 0) - (a.decidedAt ?? 0))
    .slice(0, MAX_KEPT);
  await fsp.writeFile(await filePath(), JSON.stringify([...pending, ...decided], null, 2));
}

async function loadGroups(): Promise<SongGroup[]> {
  const { groups } = await loadLibrary(await getMusicDir());
  return groups;
}

function samePending(current: DownloadRequest, next: DownloadRequest): boolean {
  if (current.status !== "pending" || current.kind !== next.kind) return false;
  if (next.kind === "youtube" || next.kind === "karaoke") return current.url === next.url;
  return current.groupKey === next.groupKey;
}

export function requestLabel(item: DownloadRequest): string {
  if (item.kind === "youtube") return "Canción nueva";
  if (item.kind === "vocal") return "Versión con voz";
  if (item.kind === "karaoke") return "Karaoke";
  return "Versión sin voz";
}

export async function listDownloadRequests(): Promise<DownloadRequest[]> {
  const items = await readAll();
  return items.sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return b.createdAt - a.createdAt;
  });
}

export async function createDownloadRequest(input: {
  kind: RequestKind;
  url?: string;
  groupKey?: string;
  note?: string;
}): Promise<DownloadRequest> {
  return withLock(async () => {
    const kind = input.kind;
    if (kind !== "youtube" && kind !== "vocal" && kind !== "instrumental" && kind !== "karaoke") {
      throw new Error("Tipo de petición no válido");
    }

    const note = (input.note ?? "").trim().slice(0, MAX_NOTE);
    const url = (input.url ?? "").trim();
    const groupKey = (input.groupKey ?? "").trim();

    if ((kind === "youtube" || kind === "vocal" || kind === "karaoke") && !isYoutubeUrl(url)) {
      throw new Error("Hace falta un enlace de YouTube válido");
    }
    if (kind !== "youtube" && kind !== "karaoke" && !groupKey) {
      throw new Error("Elige la canción");
    }

    const groups = kind === "youtube" || kind === "karaoke" ? [] : await loadGroups();
    const group = groups.find((item) => item.groupKey === groupKey) ?? null;
    if (kind !== "youtube" && kind !== "karaoke" && !group) {
      throw new Error("Esa canción no está en el aula");
    }
    if (kind === "vocal" && group?.hasVocal) {
      throw new Error("Esa canción ya tiene versión con voz");
    }
    if (kind === "instrumental" && !group?.hasVocal) {
      throw new Error("Para pedir la versión sin voz, la canción tiene que tener voz");
    }
    if (kind === "instrumental" && group?.hasInstrumental) {
      throw new Error("Esa canción ya tiene versión sin voz");
    }

    const draft: DownloadRequest = {
      id: randomUUID(),
      kind,
      url: url || null,
      groupKey: groupKey ? safeBasename(groupKey) : null,
      note,
      status: "pending",
      createdAt: Date.now(),
      decidedAt: null,
      jobId: null,
    };

    const all = await readAll();
    if (all.some((item) => samePending(item, draft))) {
      throw new Error("Esa petición ya está pendiente");
    }
    all.push(draft);
    await writeAll(all);
    return draft;
  });
}

export async function rejectDownloadRequest(id: string): Promise<DownloadRequest> {
  return withLock(async () => {
    const all = await readAll();
    const item = all.find((entry) => entry.id === id);
    if (!item || item.status !== "pending") {
      throw new Error("Esa petición ya no está pendiente");
    }
    item.status = "rejected";
    item.decidedAt = Date.now();
    await writeAll(all);
    return item;
  });
}

export async function acceptDownloadRequest(id: string): Promise<DownloadRequest> {
  return withLock(async () => {
    const all = await readAll();
    const item = all.find((entry) => entry.id === id);
    if (!item || item.status !== "pending") {
      throw new Error("Esa petición ya no está pendiente");
    }

    const dir = await getMusicDir();
    const groups = item.kind === "youtube" || item.kind === "karaoke" ? [] : await loadGroups();
    const group = groups.find((entry) => entry.groupKey === item.groupKey) ?? null;

    let jobId: string | null = null;
    if (item.kind === "karaoke") {
      if (!item.url || !isYoutubeUrl(item.url)) throw new Error("El enlace ya no es válido");
      let title = item.note.trim();
      if (!title) title = (await fetchYoutubeKaraokeTitle(item.url)) ?? "";
      if (!title) {
        throw new Error("Ese karaoke no tiene título. Pídelo otra vez con un título.");
      }
      await addYoutubeKaraoke(item.url, title);
    } else if (item.kind === "youtube") {
      if (!item.url || !isYoutubeUrl(item.url)) throw new Error("El enlace ya no es válido");
      jobId = enqueueYoutubeImportJob(item.url, dir).job.id;
    } else if (item.kind === "vocal") {
      if (!group) throw new Error("La canción ya no está en el aula");
      if (group.hasVocal) throw new Error("Esa canción ya tiene versión con voz");
      if (!item.url || !isYoutubeUrl(item.url)) throw new Error("El enlace ya no es válido");
      jobId = enqueueVocalJob(group.groupKey, item.url, dir).job.id;
    } else {
      if (!group) throw new Error("La canción ya no está en el aula");
      if (!group.hasVocal) throw new Error("Falta la versión con voz para generar la de sin voz");
      if (group.hasInstrumental) throw new Error("Esa canción ya tiene versión sin voz");
      jobId = enqueueInstrumentalJob(group.groupKey, dir).job.id;
    }

    item.status = "accepted";
    item.decidedAt = Date.now();
    item.jobId = jobId;
    await writeAll(all);
    return item;
  });
}
