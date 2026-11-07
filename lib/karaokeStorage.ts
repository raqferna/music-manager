import fsp from "node:fs/promises";
import path from "node:path";
import { getMusicDir, safeBasename } from "@/lib/musicDir";
import {
  KARAOKE_DIR_NAME,
  KARAOKE_JSON_SUFFIX,
  cleanKaraokeTitle,
  isKaraokeJsonFilename,
  isValidYoutubeId,
  isVideoFilename,
  karaokeJsonStem,
  parseYoutubeVideoId,
  titleFromFilename,
  youtubeThumbnailUrl,
  type KaraokeVideo,
  type KaraokeYoutubeMeta,
} from "@/lib/karaoke";

export async function getKaraokeDir(): Promise<string> {
  const dir = path.join(await getMusicDir(), KARAOKE_DIR_NAME);
  await fsp.mkdir(dir, { recursive: true });
  return dir;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function takenIds(dir: string): Promise<Set<string>> {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const taken = new Set<string>();
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (isVideoFilename(entry.name)) {
      taken.add(path.basename(entry.name, path.extname(entry.name)).toLowerCase());
    } else if (isKaraokeJsonFilename(entry.name)) {
      taken.add(karaokeJsonStem(entry.name).toLowerCase());
    }
  }
  return taken;
}

function assertAvailable(taken: Set<string>, id: string): void {
  if (taken.has(id.toLowerCase())) {
    throw new Error(`Ya hay un karaoke llamado «${id}». Cambia el título o bórralo antes.`);
  }
}

export async function listKaraokeVideos(): Promise<KaraokeVideo[]> {
  const dir = await getKaraokeDir();
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const videos: KaraokeVideo[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const filePath = path.join(dir, entry.name);
    const stat = await fsp.stat(filePath);

    if (isVideoFilename(entry.name)) {
      const title = titleFromFilename(entry.name) || entry.name;
      videos.push({
        id: path.basename(entry.name, path.extname(entry.name)),
        title,
        source: "file",
        fileName: entry.name,
        thumbnailUrl: null,
        size: stat.size,
        modifiedAt: stat.mtimeMs,
      });
      continue;
    }

    if (!isKaraokeJsonFilename(entry.name)) continue;

    try {
      const raw = await fsp.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<KaraokeYoutubeMeta>;
      const youtubeId = isValidYoutubeId(parsed.youtubeId)
        ? parsed.youtubeId
        : parseYoutubeVideoId(parsed.url ?? "");
      if (!youtubeId) continue;
      const stem = karaokeJsonStem(entry.name);
      const title = (parsed.title?.trim() || stem || "Karaoke").slice(0, 150);
      videos.push({
        id: stem,
        title,
        source: "youtube",
        fileName: entry.name,
        youtubeId,
        youtubeUrl: parsed.url?.trim() || `https://www.youtube.com/watch?v=${youtubeId}`,
        thumbnailUrl: youtubeThumbnailUrl(youtubeId),
        size: stat.size,
        modifiedAt: stat.mtimeMs,
      });
    } catch {
      // JSON corrupto: se ignora.
    }
  }

  videos.sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }));
  return videos;
}

export async function fetchYoutubeKaraokeTitle(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string };
    const title = data.title?.trim();
    return title ? cleanKaraokeTitle(title) : null;
  } catch {
    return null;
  }
}

export async function addYoutubeKaraoke(
  url: string,
  titleRaw?: string | null,
): Promise<KaraokeVideo> {
  const youtubeId = parseYoutubeVideoId(url);
  if (!youtubeId) {
    throw new Error("Enlace no reconocido. Usa un enlace de YouTube (watch, youtu.be o shorts).");
  }

  const title = cleanKaraokeTitle(titleRaw?.trim() || `Karaoke ${youtubeId}`);
  const dir = await getKaraokeDir();
  assertAvailable(await takenIds(dir), title);

  const meta: KaraokeYoutubeMeta = {
    youtubeId,
    url: url.trim(),
    title,
  };
  const fileName = `${title}${KARAOKE_JSON_SUFFIX}`;
  const filePath = path.join(dir, fileName);
  await fsp.writeFile(filePath, JSON.stringify(meta, null, 2), "utf8");
  const stat = await fsp.stat(filePath);

  return {
    id: title,
    title,
    source: "youtube",
    fileName,
    youtubeId,
    youtubeUrl: meta.url,
    thumbnailUrl: youtubeThumbnailUrl(youtubeId),
    size: stat.size,
    modifiedAt: stat.mtimeMs,
  };
}

export async function saveKaraokeVideoFile(
  titleRaw: string,
  originalName: string,
  write: (outPath: string) => Promise<void>,
): Promise<KaraokeVideo> {
  if (!isVideoFilename(originalName)) {
    throw new Error("Formato no soportado (usa mp4, webm, mov, mkv, m4v u ogv)");
  }

  const title = cleanKaraokeTitle(titleFromFilename(titleRaw) || titleRaw);
  const dir = await getKaraokeDir();
  assertAvailable(await takenIds(dir), title);

  const ext = path.extname(originalName).toLowerCase();
  const fileName = `${title}${ext}`;
  const outPath = path.join(dir, fileName);

  try {
    await write(outPath);
  } catch (err) {
    await fsp.unlink(outPath).catch(() => undefined);
    throw err;
  }

  const stat = await fsp.stat(outPath);
  return {
    id: title,
    title,
    source: "file",
    fileName,
    thumbnailUrl: null,
    size: stat.size,
    modifiedAt: stat.mtimeMs,
  };
}

export async function deleteKaraokeVideo(idRaw: string): Promise<{ deleted: string }> {
  const id = safeBasename(idRaw.trim());
  if (!id) throw new Error("Karaoke no encontrado");

  const videos = await listKaraokeVideos();
  const video = videos.find((item) => item.id === id);
  if (!video) throw new Error("Karaoke no encontrado");

  const dir = await getKaraokeDir();
  const filePath = path.join(dir, safeBasename(video.fileName));
  if (!(await fileExists(filePath))) {
    throw new Error("Karaoke no encontrado");
  }
  await fsp.unlink(filePath);
  return { deleted: video.fileName };
}

export async function resolveKaraokeFile(name: string): Promise<string> {
  const dir = await getKaraokeDir();
  const fileName = safeBasename(decodeURIComponent(name));
  if (!isVideoFilename(fileName)) {
    throw new Error("Archivo no válido");
  }
  return path.join(dir, fileName);
}
