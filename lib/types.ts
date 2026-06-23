export type Song = {
  /** Nombre del fichero de audio (con extensión). */
  file: string;
  /** Nombre base sin extensión, usado para emparejar con su PDF. */
  baseName: string;
  /** Etiqueta legible (titlecase del baseName). */
  title: string;
  /** Tamaño en bytes. */
  size: number;
  /** Última modificación (epoch ms). */
  modifiedAt: number;
  /** Si existe un PDF de letra con el mismo baseName. */
  hasLyrics: boolean;
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
  baseName: string;
  artist: string;
  title: string;
  file: string;
  lyrics: string | null;
  lyricsSource: string | null;
  hasLyrics: boolean;
  message: string;
};
