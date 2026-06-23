export type Song = {
  /** @deprecated Usar SongGroup en la lista del catálogo. */
  file: string;
  baseName: string;
  title: string;
  size: number;
  modifiedAt: number;
  hasLyrics: boolean;
};

/** Canción agrupada: instrumental y/o voz comparten letra PDF. */
export type SongGroup = {
  /** Clave compartida para PDF y emparejamiento de variantes. */
  groupKey: string;
  title: string;
  instrumentalFile: string | null;
  vocalFile: string | null;
  hasInstrumental: boolean;
  hasVocal: boolean;
  hasLyrics: boolean;
  modifiedAt: number;
  size: number;
};

export type LyricSearchResult = {
  id: number;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  snippet: string;
  hasFullLyrics: boolean;
  source: "lrclib";
};

export type YoutubeImportResult = {
  ok: true;
  groupKey: string;
  baseName: string;
  artist: string;
  title: string;
  file: string;
  instrumentalFile: string;
  vocalFile: string;
  lyrics: string | null;
  lyricsSource: string | null;
  hasLyrics: boolean;
  message: string;
};
