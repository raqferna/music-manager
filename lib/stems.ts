/** Identificadores de stems generados por htdemucs_6s. */
export const STEM_IDS = [
  "vocals",
  "drums",
  "bass",
  "guitar",
  "piano",
  "other",
] as const;

export type StemId = (typeof STEM_IDS)[number];

export const STEM_LABELS: Record<StemId, string> = {
  vocals: "Voz",
  drums: "Batería",
  bass: "Bajo",
  guitar: "Guitarra",
  piano: "Piano",
  other: "Otros",
};

export const STEM_SUFFIX = " (stem ";

export function stemFileName(groupKey: string, stemId: StemId): string {
  return `${groupKey}${STEM_SUFFIX}${stemId}).wav`;
}

export function parseStemFromBaseName(baseName: string): StemId | null {
  const match = baseName.match(/ \(stem ([a-z]+)\)$/i);
  if (!match) return null;
  const id = match[1].toLowerCase() as StemId;
  return STEM_IDS.includes(id) ? id : null;
}

export function isStemId(value: string): value is StemId {
  return (STEM_IDS as readonly string[]).includes(value);
}

/** Mapeo de nombres que devuelve audio-separator → id interno. */
export function normalizeStemName(raw: string): StemId | null {
  const key = raw.toLowerCase().replace(/[^a-z]/g, "");
  const aliases: Record<string, StemId> = {
    vocals: "vocals",
    vocal: "vocals",
    voz: "vocals",
    drums: "drums",
    drum: "drums",
    bateria: "drums",
    bass: "bass",
    bajo: "bass",
    guitar: "guitar",
    guitarra: "guitar",
    piano: "piano",
    other: "other",
    otros: "other",
  };
  return aliases[key] ?? null;
}
