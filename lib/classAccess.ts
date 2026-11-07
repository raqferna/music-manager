import fsp from "node:fs/promises";
import path from "node:path";
import { getMusicDir } from "@/lib/musicDir";

const FILE_NAME = ".aula-class.json";
const MIN_LENGTH = 8;

function envPassword(): string | null {
  const value = process.env.AULA_CLASS_PASSWORD?.trim() ?? "";
  return value.length > 0 ? value : null;
}

async function filePath(): Promise<string> {
  return path.join(await getMusicDir(), FILE_NAME);
}

/** Contraseña vigente: la guardada desde el admin, o la del entorno si aún no se ha cambiado. */
export async function getClassPassword(): Promise<string | null> {
  try {
    const raw = await fsp.readFile(await filePath(), "utf8");
    const parsed = JSON.parse(raw) as { password?: string };
    const saved = parsed.password?.trim() ?? "";
    if (saved.length > 0) return saved;
  } catch {
    // Todavía no hay contraseña cambiada desde el admin.
  }
  return envPassword();
}

export async function setClassPassword(password: string): Promise<void> {
  const next = password.trim();
  if (next.length < MIN_LENGTH) {
    throw new Error(`La contraseña necesita al menos ${MIN_LENGTH} caracteres`);
  }
  if (next.length > 200) {
    throw new Error("La contraseña es demasiado larga");
  }
  const target = await filePath();
  await fsp.writeFile(target, JSON.stringify({ password: next }), { mode: 0o600 });
}
