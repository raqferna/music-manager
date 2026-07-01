import type { SongGroup } from "@/lib/types";

export type ArtistSection = {
  artist: string;
  artistLabel: string;
  groups: SongGroup[];
};

const UNCLASSIFIED = "Sin clasificar";

/** Separa «Artista - Título» del groupKey. */
export function parseArtistTitle(groupKey: string): { artist: string; songTitle: string } {
  const idx = groupKey.indexOf(" - ");
  if (idx > 0) {
    const artist = groupKey.slice(0, idx).trim();
    const songTitle = groupKey.slice(idx + 3).trim();
    if (artist && songTitle) {
      return { artist, songTitle };
    }
  }
  return { artist: UNCLASSIFIED, songTitle: groupKey };
}

export function formatLabel(text: string): string {
  return text
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function compareArtists(a: string, b: string): number {
  if (a === UNCLASSIFIED && b !== UNCLASSIFIED) return 1;
  if (b === UNCLASSIFIED && a !== UNCLASSIFIED) return -1;
  return a.localeCompare(b, "es", { sensitivity: "base" });
}

export function sortGroupsByArtist(groups: SongGroup[]): SongGroup[] {
  return [...groups].sort((a, b) => {
    const pa = parseArtistTitle(a.groupKey);
    const pb = parseArtistTitle(b.groupKey);
    const byArtist = compareArtists(pa.artist, pb.artist);
    if (byArtist !== 0) return byArtist;
    return pa.songTitle.localeCompare(pb.songTitle, "es", { sensitivity: "base" });
  });
}

export function groupByArtist(groups: SongGroup[]): ArtistSection[] {
  const map = new Map<string, SongGroup[]>();

  for (const group of groups) {
    const { artist } = parseArtistTitle(group.groupKey);
    const list = map.get(artist) ?? [];
    list.push(group);
    map.set(artist, list);
  }

  const sections: ArtistSection[] = [];
  for (const [artist, artistGroups] of map) {
    artistGroups.sort((a, b) => {
      const ta = parseArtistTitle(a.groupKey).songTitle;
      const tb = parseArtistTitle(b.groupKey).songTitle;
      return ta.localeCompare(tb, "es", { sensitivity: "base" });
    });
    sections.push({
      artist,
      artistLabel: formatLabel(artist),
      groups: artistGroups,
    });
  }

  sections.sort((a, b) => compareArtists(a.artist, b.artist));
  return sections;
}

export function matchesSearch(group: SongGroup, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const { artist, songTitle } = parseArtistTitle(group.groupKey);
  return (
    group.title.toLowerCase().includes(q) ||
    group.groupKey.toLowerCase().includes(q) ||
    artist.toLowerCase().includes(q) ||
    songTitle.toLowerCase().includes(q) ||
    formatLabel(artist).toLowerCase().includes(q) ||
    formatLabel(songTitle).toLowerCase().includes(q) ||
    (group.instrumentalFile?.toLowerCase().includes(q) ?? false) ||
    (group.vocalFile?.toLowerCase().includes(q) ?? false)
  );
}
