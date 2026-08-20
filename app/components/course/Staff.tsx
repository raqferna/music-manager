"use client";

import { useMemo } from "react";
import type { StaffNote } from "@/lib/course/types";
import { diatonicStepsFromE4, durationBeats, parsePitch, spanishName } from "@/lib/course/notes";
import { playPitches } from "@/lib/course/audio";
import { Play } from "@/app/components/icons";

const LINE_GAP = 12;
const TOP_LINE_Y = 36;
const LEFT = 56;
const NOTE_GAP = 36;

function noteY(pitch: string): number {
  const steps = diatonicStepsFromE4(pitch);
  const bottomLine = TOP_LINE_Y + 4 * LINE_GAP;
  return bottomLine - steps * (LINE_GAP / 2);
}

function ledgerLines(pitch: string): number[] {
  const steps = diatonicStepsFromE4(pitch);
  const bottomLine = TOP_LINE_Y + 4 * LINE_GAP;
  const ys: number[] = [];
  if (steps < 0) {
    for (let s = -2; s >= steps; s -= 2) {
      ys.push(bottomLine - s * (LINE_GAP / 2));
    }
  }
  if (steps > 8) {
    for (let s = 10; s <= steps; s += 2) {
      ys.push(bottomLine - s * (LINE_GAP / 2));
    }
  }
  return ys;
}

function Accidental({ kind, x, y }: { kind: "#" | "b"; x: number; y: number }) {
  if (kind === "#") {
    return (
      <text x={x} y={y + 5} fontSize="16" fill="currentColor" textAnchor="middle" fontFamily="serif">
        ♯
      </text>
    );
  }
  return (
    <text x={x} y={y + 6} fontSize="18" fill="currentColor" textAnchor="middle" fontFamily="serif">
      ♭
    </text>
  );
}

function NoteHead({
  x,
  y,
  duration,
  stemUp,
}: {
  x: number;
  y: number;
  duration: StaffNote["duration"];
  stemUp: boolean;
}) {
  const hollow = duration === "whole" || duration === "half";
  const stem = duration !== "whole";
  const stemH = LINE_GAP * 3.2;
  const stemX = stemUp ? x + 6.2 : x - 6.2;
  const stemY2 = stemUp ? y - stemH : y + stemH;

  return (
    <g>
      <ellipse
        cx={x}
        cy={y}
        rx={7}
        ry={5}
        transform={`rotate(-18 ${x} ${y})`}
        fill={hollow ? "none" : "currentColor"}
        stroke="currentColor"
        strokeWidth={1.4}
      />
      {stem ? (
        <line x1={stemX} y1={y} x2={stemX} y2={stemY2} stroke="currentColor" strokeWidth={1.4} />
      ) : null}
      {duration === "eighth" || duration === "sixteenth" ? (
        <path
          d={`M ${stemX} ${stemY2} c 10 6 12 16 4 22`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.4}
        />
      ) : null}
    </g>
  );
}

export default function Staff({
  notes,
  timeSignature,
  caption,
  playable = true,
}: {
  notes: StaffNote[];
  timeSignature?: [number, number];
  caption?: string;
  playable?: boolean;
}) {
  const width = useMemo(() => Math.max(280, LEFT + notes.length * NOTE_GAP + 24), [notes.length]);

  function handlePlay() {
    const pitches = notes.filter((n) => !n.rest).map((n) => n.pitch);
    if (pitches.length) playPitches(pitches, 0.45, 0.08);
  }

  return (
    <figure className="my-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-start justify-between gap-3">
        <svg
          viewBox={`0 0 ${width} 140`}
          className="h-36 w-full max-w-full text-violet-100"
          role="img"
          aria-label={caption ?? "Pentagrama"}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1={16}
              x2={width - 8}
              y1={TOP_LINE_Y + i * LINE_GAP}
              y2={TOP_LINE_Y + i * LINE_GAP}
              stroke="currentColor"
              strokeOpacity={0.55}
              strokeWidth={1.2}
            />
          ))}
          <text x="20" y={TOP_LINE_Y + 4 * LINE_GAP + 4} fontSize="56" fill="currentColor" fontFamily="Georgia, serif">
            𝄞
          </text>
          {timeSignature ? (
            <g fontFamily="Georgia, serif" fill="currentColor" textAnchor="middle">
              <text x="48" y={TOP_LINE_Y + LINE_GAP + 4} fontSize="16" fontWeight="700">
                {timeSignature[0]}
              </text>
              <text x="48" y={TOP_LINE_Y + 3 * LINE_GAP + 4} fontSize="16" fontWeight="700">
                {timeSignature[1]}
              </text>
            </g>
          ) : null}
          {notes.map((note, i) => {
            const x = LEFT + i * NOTE_GAP;
            if (note.rest) {
              return (
                <text key={i} x={x} y={TOP_LINE_Y + 2.6 * LINE_GAP} fontSize="22" textAnchor="middle" fill="currentColor">
                  𝄽
                </text>
              );
            }
            const y = noteY(note.pitch);
            const parsed = parsePitch(note.pitch);
            const stemUp = diatonicStepsFromE4(note.pitch) < 6;
            const duration = note.duration ?? "quarter";
            return (
              <g key={i}>
                {ledgerLines(note.pitch).map((ly) => (
                  <line
                    key={ly}
                    x1={x - 11}
                    x2={x + 11}
                    y1={ly}
                    y2={ly}
                    stroke="currentColor"
                    strokeOpacity={0.55}
                    strokeWidth={1.2}
                  />
                ))}
                {parsed.accidental ? <Accidental kind={parsed.accidental} x={x - 16} y={y} /> : null}
                <NoteHead x={x} y={y} duration={duration} stemUp={stemUp} />
                <title>{`${spanishName(note.pitch)} · ${durationBeats(duration)} tiempo(s)`}</title>
              </g>
            );
          })}
        </svg>
        {playable ? (
          <button
            type="button"
            onClick={handlePlay}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 p-2 text-violet-200 transition hover:bg-white/10"
            aria-label="Reproducir ejemplo"
          >
            <Play className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {caption ? <figcaption className="mt-2 px-1 text-xs text-white/50">{caption}</figcaption> : null}
    </figure>
  );
}
