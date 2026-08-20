"use client";

import { parsePitch } from "@/lib/course/notes";

const WHITES = ["C", "D", "E", "F", "G", "A", "B"] as const;

function isActive(pitch: string, active: string[]): boolean {
  const midi = parsePitch(pitch).midi;
  return active.some((a) => {
    try {
      return parsePitch(a).midi === midi;
    } catch {
      return false;
    }
  });
}

export default function PianoKeyboard({
  fromOctave = 4,
  octaves = 2,
  active = [],
}: {
  fromOctave?: number;
  octaves?: number;
  active?: string[];
}) {
  const whites: { pitch: string; letter: string }[] = [];
  for (let o = fromOctave; o < fromOctave + octaves; o++) {
    for (const letter of WHITES) {
      whites.push({ pitch: `${letter}${o}`, letter });
    }
  }

  const blackOf: Record<string, string | null> = {
    C: "C#",
    D: "D#",
    E: null,
    F: "F#",
    G: "G#",
    A: "A#",
    B: null,
  };

  const whiteW = 22;
  const width = whites.length * whiteW;

  return (
    <div className="overflow-x-auto py-2">
      <div className="relative mx-auto" style={{ width, height: 92 }}>
        <div className="flex h-full">
          {whites.map((w) => {
            const on = isActive(w.pitch, active);
            return (
              <div
                key={w.pitch}
                className={`relative h-full border border-black/40 ${
                  on ? "bg-violet-300" : "bg-white"
                }`}
                style={{ width: whiteW }}
                title={w.pitch}
              />
            );
          })}
        </div>
        {whites.map((w, i) => {
          const sharp = blackOf[w.letter];
          if (!sharp) return null;
          const oct = parsePitch(w.pitch).octave;
          const pitch = `${sharp}${oct}`;
          const on = isActive(pitch, active);
          return (
            <div
              key={pitch}
              className={`absolute top-0 rounded-b ${on ? "bg-fuchsia-400" : "bg-zinc-900"}`}
              style={{
                left: i * whiteW + whiteW * 0.68,
                width: whiteW * 0.62,
                height: 56,
              }}
              title={pitch}
            />
          );
        })}
      </div>
    </div>
  );
}
