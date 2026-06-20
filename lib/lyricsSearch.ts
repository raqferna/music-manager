import type { LyricSearchResult } from "@/lib/types";

type LrcLibItem = {
  id: number;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  plainLyrics?: string | null;
  instrumental?: boolean;
};

const USER_AGENT = "music-lyrics-manager/0.1 (local app)";

function snippet(text: string, max = 140): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max).trim()}…`;
}

function scoreResult(item: LrcLibItem, query: string): number {
  const q = query.toLowerCase();
  const track = item.trackName.toLowerCase();
  const artist = item.artistName.toLowerCase();
  let score = 0;

  if (track === q) score += 100;
  else if (track.includes(q)) score += 50;
  else if (q.includes(track)) score += 30;

  if (artist === q) score += 40;
  else if (artist.includes(q)) score += 15;

  if (item.plainLyrics?.trim()) score += 20;
  if (item.instrumental) score -= 30;

  return score;
}

async function fetchLrcLib(url: string): Promise<LrcLibItem[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as LrcLibItem[];
  return Array.isArray(data) ? data : [];
}

export async function searchLyrics(query: string): Promise<LyricSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const urls = [
    `https://lrclib.net/api/search?track_name=${encodeURIComponent(q)}`,
    `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`,
  ];

  const seen = new Set<number>();
  const all: LrcLibItem[] = [];

  for (const url of urls) {
    try {
      const items = await fetchLrcLib(url);
      for (const item of items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          all.push(item);
        }
      }
    } catch {
      // Ignorar fallos puntuales de una fuente.
    }
  }

  return all
    .map((item) => ({
      id: item.id,
      title: item.trackName,
      artist: item.artistName,
      album: item.albumName,
      duration: item.duration,
      snippet: item.plainLyrics?.trim()
        ? snippet(item.plainLyrics)
        : "Sin letra disponible en esta fuente",
      hasFullLyrics: Boolean(item.plainLyrics?.trim()),
      source: "lrclib" as const,
      _score: scoreResult(item, q),
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 15)
    .map(({ _score: _, ...rest }) => rest);
}

export async function fetchLyricsById(
  id: number,
): Promise<{ title: string; artist: string; lyrics: string } | null> {
  const res = await fetch(`https://lrclib.net/api/get/${id}`, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const item = (await res.json()) as LrcLibItem;
  if (!item.plainLyrics?.trim()) return null;

  return {
    title: item.trackName,
    artist: item.artistName,
    lyrics: item.plainLyrics.trim(),
  };
}
