export const NATURAL_NAMES = ["C", "D", "E", "F", "G", "A", "B"] as const;
export const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export const SPANISH_NATURAL: Record<(typeof NATURAL_NAMES)[number], string> = {
  C: "Do",
  D: "Re",
  E: "Mi",
  F: "Fa",
  G: "Sol",
  A: "La",
  B: "Si",
};

export const SPANISH_CHROMATIC: Record<string, string> = {
  C: "Do",
  "C#": "Do♯",
  Db: "Re♭",
  D: "Re",
  "D#": "Re♯",
  Eb: "Mi♭",
  E: "Mi",
  F: "Fa",
  "F#": "Fa♯",
  Gb: "Sol♭",
  G: "Sol",
  "G#": "Sol♯",
  Ab: "La♭",
  A: "La",
  "A#": "La♯",
  Bb: "Si♭",
  B: "Si",
};

export type ParsedPitch = {
  letter: string;
  accidental: "" | "#" | "b";
  octave: number;
  midi: number;
};

const LETTER_SEMITONES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export function parsePitch(pitch: string): ParsedPitch {
  const match = pitch.match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
  if (!match) throw new Error(`Nota no válida: ${pitch}`);
  const letter = match[1].toUpperCase();
  const accidental = (match[2] || "") as "" | "#" | "b";
  const octave = Number(match[3]);
  let midi = (octave + 1) * 12 + LETTER_SEMITONES[letter];
  if (accidental === "#") midi += 1;
  if (accidental === "b") midi -= 1;
  return { letter, accidental, octave, midi };
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function pitchToFreq(pitch: string): number {
  return midiToFreq(parsePitch(pitch).midi);
}

export function spanishName(pitch: string, withOctave = false): string {
  const parsed = parsePitch(pitch);
  const key = parsed.letter + parsed.accidental;
  const name = SPANISH_CHROMATIC[key] ?? parsed.letter;
  return withOctave ? `${name}${parsed.octave}` : name;
}

/** Pasos diatónicos desde E4 (línea inferior de la clave de sol). */
export function diatonicStepsFromE4(pitch: string): number {
  const p = parsePitch(pitch);
  const e4 = parsePitch("E4");
  const letterIdx = NATURAL_NAMES.indexOf(p.letter as (typeof NATURAL_NAMES)[number]);
  const eIdx = NATURAL_NAMES.indexOf("E");
  return (p.octave - e4.octave) * 7 + (letterIdx - eIdx);
}

export function durationBeats(duration: string | undefined): number {
  switch (duration) {
    case "whole":
      return 4;
    case "half":
      return 2;
    case "eighth":
      return 0.5;
    case "sixteenth":
      return 0.25;
    default:
      return 1;
  }
}

export const BEGINNER_PITCHES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5"];

export const SIMPLE_INTERVALS: { semitones: number; name: string; example: [string, string] }[] = [
  { semitones: 2, name: "2ª mayor (Do–Re)", example: ["C4", "D4"] },
  { semitones: 4, name: "3ª mayor (Do–Mi)", example: ["C4", "E4"] },
  { semitones: 5, name: "4ª justa (Do–Fa)", example: ["C4", "F4"] },
  { semitones: 7, name: "5ª justa (Do–Sol)", example: ["C4", "G4"] },
  { semitones: 12, name: "8ª justa (Do–Do)", example: ["C4", "C5"] },
];

export type TriadQuality = "major" | "minor";

export const TRIADS: { root: string; quality: TriadQuality; cipher: string; name: string; pitches: [string, string, string] }[] = [
  { root: "C", quality: "major", cipher: "C", name: "Do mayor", pitches: ["C4", "E4", "G4"] },
  { root: "C", quality: "minor", cipher: "Cm", name: "Do menor", pitches: ["C4", "Eb4", "G4"] },
  { root: "D", quality: "major", cipher: "D", name: "Re mayor", pitches: ["D4", "F#4", "A4"] },
  { root: "D", quality: "minor", cipher: "Dm", name: "Re menor", pitches: ["D4", "F4", "A4"] },
  { root: "E", quality: "major", cipher: "E", name: "Mi mayor", pitches: ["E4", "G#4", "B4"] },
  { root: "E", quality: "minor", cipher: "Em", name: "Mi menor", pitches: ["E4", "G4", "B4"] },
  { root: "F", quality: "major", cipher: "F", name: "Fa mayor", pitches: ["F4", "A4", "C5"] },
  { root: "F", quality: "minor", cipher: "Fm", name: "Fa menor", pitches: ["F4", "Ab4", "C5"] },
  { root: "G", quality: "major", cipher: "G", name: "Sol mayor", pitches: ["G4", "B4", "D5"] },
  { root: "G", quality: "minor", cipher: "Gm", name: "Sol menor", pitches: ["G4", "Bb4", "D5"] },
  { root: "A", quality: "major", cipher: "A", name: "La mayor", pitches: ["A4", "C#5", "E5"] },
  { root: "A", quality: "minor", cipher: "Am", name: "La menor", pitches: ["A4", "C5", "E5"] },
  { root: "B", quality: "major", cipher: "B", name: "Si mayor", pitches: ["B4", "D#5", "F#5"] },
  { root: "B", quality: "minor", cipher: "Bm", name: "Si menor", pitches: ["B4", "D5", "F#5"] },
];
