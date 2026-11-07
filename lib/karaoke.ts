export const KARAOKE_DIR_NAME = "karaoke";
export const KARAOKE_JSON_SUFFIX = ".karaoke.json";
export const MAX_KARAOKE_TITLE_LENGTH = 150;
export const MAX_KARAOKE_BYTES = 800 * 1024 * 1024;

export const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".mkv", ".m4v", ".ogv"]);
export const VIDEO_ACCEPT = Array.from(VIDEO_EXTS).join(",");

export const VIDEO_MIME: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
  ".m4v": "video/x-m4v",
  ".ogv": "video/ogg",
};

export type KaraokeSource = "file" | "youtube";

export type KaraokeVideo = {
  id: string;
  title: string;
  source: KaraokeSource;
  fileName: string;
  youtubeId?: string;
  youtubeUrl?: string;
  thumbnailUrl?: string | null;
  size: number;
  modifiedAt: number;
};

export type KaraokeYoutubeMeta = {
  youtubeId: string;
  url: string;
  title: string;
};

export function isVideoExtension(ext: string): boolean {
  return VIDEO_EXTS.has(ext.toLowerCase());
}

export function isVideoFilename(name: string): boolean {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return false;
  return isVideoExtension(name.slice(dot));
}

export function isKaraokeJsonFilename(name: string): boolean {
  return name.toLowerCase().endsWith(KARAOKE_JSON_SUFFIX);
}

export function karaokeJsonStem(name: string): string {
  return name.slice(0, -KARAOKE_JSON_SUFFIX.length);
}

export function maxKaraokeBytes(): number {
  return MAX_KARAOKE_BYTES;
}

export function youtubeThumbnailUrl(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`;
}

export function isValidYoutubeId(id: string | undefined | null): id is string {
  return Boolean(id && /^[\w-]{11}$/.test(id));
}

/** Extrae el id de un enlace de YouTube (watch, youtu.be, shorts, embed, live). */
export function parseYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0]?.split("?")[0];
      return isValidYoutubeId(id) ? id : null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const fromQuery = parsed.searchParams.get("v");
      if (isValidYoutubeId(fromQuery)) return fromQuery;

      const parts = parsed.pathname.split("/").filter(Boolean);
      const prefix = parts[0]?.toLowerCase();
      if (
        (prefix === "embed" || prefix === "shorts" || prefix === "live" || prefix === "v") &&
        isValidYoutubeId(parts[1])
      ) {
        return parts[1];
      }
    }
  } catch {
    // URL inválida.
  }
  return null;
}

/** Limpia el título para usarlo como nombre de archivo e id. */
export function cleanKaraokeTitle(raw: string): string {
  const title = raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_KARAOKE_TITLE_LENGTH)
    .trim();
  if (!title || title === "." || title === "..") {
    throw new Error("El título no puede estar vacío");
  }
  return title;
}

export function titleFromFilename(name: string): string {
  const fileName = name.toLowerCase().endsWith(KARAOKE_JSON_SUFFIX)
    ? karaokeJsonStem(name)
    : name;
  const dot = fileName.lastIndexOf(".");
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName;
  return stem.replace(/_+/g, " ").replace(/\s+/g, " ").trim();
}
