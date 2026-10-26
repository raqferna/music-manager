export type SiteMode = "aula" | "catalogo";

export type SitePublicConfig = {
  siteMode: SiteMode;
  siteTitle: string;
  siteSubtitle: string;
  adminRequired: boolean;
  viewerRequired: boolean;
};

/** Acceso dinámico para que Docker lea el valor al arrancar, no al construir la imagen. */
function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function siteMode(): SiteMode {
  return env("SITE_MODE").toLowerCase() === "aula" ? "aula" : "catalogo";
}

export function siteTitle(): string {
  const custom = env("SITE_TITLE");
  if (custom) return custom;
  return siteMode() === "aula" ? "Aula 4" : "Catálogo Musical";
}

export function siteSubtitle(): string {
  const custom = env("SITE_SUBTITLE");
  if (custom) return custom;
  return siteMode() === "aula"
    ? "Escucha con voz o sin voz y sigue la letra."
    : "Importa canciones, alterna con/sin voz y añade letras en PDF.";
}

export function adminPassword(): string | null {
  const value = env("ADMIN_PASSWORD");
  return value.length > 0 ? value : null;
}

export function classUsername(): string {
  return env("AULA_CLASS_USER") || "aulacuatro";
}

export function classPassword(): string | null {
  const value = env("AULA_CLASS_PASSWORD");
  return value.length > 0 ? value : null;
}

export function viewerRequired(): boolean {
  return siteMode() === "aula";
}

export function getSitePublicConfig(): SitePublicConfig {
  return {
    siteMode: siteMode(),
    siteTitle: siteTitle(),
    siteSubtitle: siteSubtitle(),
    adminRequired: adminPassword() !== null,
    viewerRequired: viewerRequired(),
  };
}
