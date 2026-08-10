import { AUDIO_EXTS } from "@/lib/audio";
import { sortGroupsByArtist } from "@/lib/artistGroups";
import { parseStemFromBaseName, type StemId } from "@/lib/stems";
import type { SongGroup } from "@/lib/types";

export const VOCAL_SUFFIX = " (con voz)";
export const INSTRUMENTAL_SUFFIX = " (instrumental)";

const VOCAL_PATTERN = / \(con voz\)$/i;
const INSTRUMENTAL_PATTERN = / \((instrumental|sin voz)\)$/i;
const STEM_PATTERN = / \(stem [a-z]+\)$/i;

export type ParsedAudio = {
  groupKey: string;
  variant: "vocal" | "instrumental" | "stem";
  stemId?: StemId;
};

/** Interpreta el nombre base de un audio y devuelve la clave de grupo compartida. */
export function parseAudioBaseName(baseName: string): ParsedAudio {
  if (VOCAL_PATTERN.test(baseName)) {
    return {
      groupKey: baseName.replace(VOCAL_PATTERN, ""),
      variant: "vocal",
    };
  }
  if (INSTRUMENTAL_PATTERN.test(baseName)) {
    return {
      groupKey: baseName.replace(INSTRUMENTAL_PATTERN, ""),
      variant: "instrumental",
    };
  }
  if (STEM_PATTERN.test(baseName)) {
    const stemId = parseStemFromBaseName(baseName);
    return {
      groupKey: baseName.replace(STEM_PATTERN, ""),
      variant: "stem",
      stemId: stemId ?? undefined,
    };
  }
  // Legacy: un solo fichero sin sufijo se trata como instrumental.
  return { groupKey: baseName, variant: "instrumental" };
}

export function vocalFileName(groupKey: string): string {
  return `${groupKey}${VOCAL_SUFFIX}.wav`;
}

export function instrumentalFileName(groupKey: string): string {
  return `${groupKey}${INSTRUMENTAL_SUFFIX}.wav`;
}

export function resolvePlaybackFile(
  group: SongGroup,
  variant: "instrumental" | "vocal",
): string | null {
  if (variant === "vocal") {
    return group.vocalFile;
  }
  return group.instrumentalFile ?? group.vocalFile;
}

type RawAudio = {
  file: string;
  baseName: string;
  size: number;
  modifiedAt: number;
  parsed: ParsedAudio;
};

export function buildSongGroups(
  files: RawAudio[],
  pdfBaseNames: Set<string>,
): SongGroup[] {
  const map = new Map<
    string,
    {
      instrumentalFile: string | null;
      vocalFile: string | null;
      stemFiles: Partial<Record<StemId, string>>;
      modifiedAt: number;
      size: number;
    }
  >();

  for (const entry of files) {
    const key = entry.parsed.groupKey;
    const bucket = map.get(key) ?? {
      instrumentalFile: null,
      vocalFile: null,
      stemFiles: {},
      modifiedAt: 0,
      size: 0,
    };

    if (entry.parsed.variant === "vocal") {
      bucket.vocalFile = entry.file;
    } else if (entry.parsed.variant === "stem" && entry.parsed.stemId) {
      bucket.stemFiles[entry.parsed.stemId] = entry.file;
    } else {
      bucket.instrumentalFile = entry.file;
    }

    bucket.modifiedAt = Math.max(bucket.modifiedAt, entry.modifiedAt);
    bucket.size += entry.size;
    map.set(key, bucket);
  }

  const groups: SongGroup[] = [];
  for (const [groupKey, bucket] of map) {
    const stemCount = Object.keys(bucket.stemFiles).length;
    groups.push({
      groupKey,
      title: toTitle(groupKey),
      instrumentalFile: bucket.instrumentalFile,
      vocalFile: bucket.vocalFile,
      hasInstrumental: Boolean(bucket.instrumentalFile),
      hasVocal: Boolean(bucket.vocalFile),
      stemFiles: bucket.stemFiles,
      hasStems: stemCount > 0,
      hasLyrics: pdfBaseNames.has(groupKey.toLowerCase()),
      modifiedAt: bucket.modifiedAt,
      size: bucket.size,
    });
  }

  return sortGroupsByArtist(groups);
}

export function isAudioFile(name: string): boolean {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return false;
  return AUDIO_EXTS.has(name.slice(dot).toLowerCase());
}

function toTitle(name: string) {
  return name
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
