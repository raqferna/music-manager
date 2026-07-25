"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type LatestMeta = {
  appName: string;
  versionName: string;
  versionCode: number;
  downloadPath: string;
  sizeBytes: number;
  builtAt: string;
};

function formatSize(bytes: number): string {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-ES");
  } catch {
    return iso;
  }
}

export default function AndroidDownloadPage() {
  const [meta, setMeta] = useState<LatestMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/android/latest.json", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("No hay APK publicado todavía");
        return res.json() as Promise<LatestMeta>;
      })
      .then(setMeta)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar");
      });
  }, []);

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
          {error && !meta ? (
            <p className="text-sm text-rose-300">{error}</p>
          ) : !meta ? (
            <p className="text-sm text-white/60">Cargando…</p>
          ) : (
            <>
              <div>
                <p className="text-lg font-medium">{meta.appName}</p>
                <p className="text-sm text-white/60">
                  v{meta.versionName} · {formatSize(meta.sizeBytes)} ·{" "}
                  {formatDate(meta.builtAt)}
                </p>
              </div>
              <a
                href={meta.downloadPath}
                download
                className="inline-flex w-full items-center justify-center rounded-2xl bg-violet-500/90 px-4 py-3 text-sm font-medium text-white hover:bg-violet-400"
              >
                Descargar APK
              </a>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-white/70">
                <li>Abre el APK e instálalo (permite “apps desconocidas” si Android lo pide).</li>
                <li>En la app → Ajustes → pega la URL de este servidor.</li>
                <li>Pulsa sincronizar (nube) para bajar el catálogo.</li>
              </ol>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
