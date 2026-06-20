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
