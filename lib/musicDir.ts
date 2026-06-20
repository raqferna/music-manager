import fs from "node:fs/promises";
import path from "node:path";

/**
 * Devuelve la ruta absoluta de la carpeta de música configurada.
 * Si no existe la variable de entorno MUSIC_DIR usa ./music dentro del proyecto.
 * Crea la carpeta si no existe.
 */
export async function getMusicDir(): Promise<string> {
  const configured = process.env.MUSIC_DIR?.trim();
  const dir = configured && configured.length > 0
    ? path.resolve(configured.replace(/^~(?=$|\/|\\)/, process.env.HOME ?? ""))
    : path.join(process.cwd(), "music");

  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Sanitiza un nombre de archivo para evitar path traversal.
 * Solo se permite el "basename" (sin separadores) y se prohíbe ".." explícito.
 */
export function safeBasename(name: string): string {
  const base = path.basename(name);
  if (base === "" || base === "." || base === "..") {
    throw new Error("Nombre de archivo inválido");
  }
  return base;
}
