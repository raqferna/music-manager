import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";

export const dynamic = "force-dynamic";

type LatestMeta = {
  appName: string;
  versionName: string;
  versionCode: number;
  downloadPath: string;
  sizeBytes: number;
  builtAt: string;
};

const FALLBACK: LatestMeta = {
  appName: "Catálogo Offline",
  versionName: "0.1.0",
  versionCode: 1,
  downloadPath: "/releases/catalogo-offline.apk",
  sizeBytes: 0,
  builtAt: "",
};

function formatSize(bytes: number): string {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-ES");
  } catch {
    return iso;
  }
}

async function loadMeta(): Promise<LatestMeta> {
  const candidates = [
    path.join(process.cwd(), "public", "releases", "latest.json"),
    path.join(process.cwd(), "public", "android", "latest.json"),
  ];

  for (const file of candidates) {
    try {
      const raw = await readFile(file, "utf8");
      const parsed = JSON.parse(raw) as LatestMeta;
      if (parsed?.downloadPath) return parsed;
    } catch {
      // probar siguiente ruta
    }
  }

  return FALLBACK;
}

export default async function AndroidDownloadPage() {
  const meta = await loadMeta();

  return (
    <main className="min-h-screen px-4 py-10 md:px-8">
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <p className="text-sm text-white/50">
            <Link href="/" className="hover:text-white/80">
              ← Catálogo
            </Link>
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            App Android
          </h1>
          <p className="mt-2 text-white/65">
            Descarga el catálogo offline en tu móvil. Tras instalarla, configura
            la URL de este servidor y sincroniza.
          </p>
        </div>

        <section className="glass rounded-3xl p-5 space-y-4">
          <div>
            <p className="text-lg font-medium">{meta.appName}</p>
            <p className="text-sm text-white/60">
              v{meta.versionName} · {formatSize(meta.sizeBytes)} ·{" "}
              {formatDate(meta.builtAt)}
            </p>
          </div>
          <a
            href={meta.downloadPath}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-violet-500/90 px-4 py-3 text-sm font-medium text-white hover:bg-violet-400"
          >
            Descargar APK
          </a>
          <p className="text-xs text-white/45 break-all">{meta.downloadPath}</p>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-white/70">
            <li>
              Abre el APK e instálalo (permite “apps desconocidas” si Android lo
              pide).
            </li>
            <li>En la app → Ajustes → pega la URL de este servidor.</li>
            <li>Pulsa sincronizar (nube) para bajar el catálogo.</li>
          </ol>
        </section>
      </div>
    </main>
  );
}
