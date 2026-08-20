"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { InteractiveKind, StaffNote } from "@/lib/course/types";
import {
  BEGINNER_PITCHES,
  SIMPLE_INTERVALS,
  SPANISH_NATURAL,
  TRIADS,
  parsePitch,
  spanishName,
} from "@/lib/course/notes";
import { clickMetronome, playChord, playPitches, playStructureDemo, type SongSection } from "@/lib/course/audio";
import Staff from "./Staff";
import PianoKeyboard from "./PianoKeyboard";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function RoundScore({
  round,
  total,
  correct,
  done,
  onAgain,
}: {
  round: number;
  total: number;
  correct: number;
  done: boolean;
  onAgain: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-white/70">
      <span>
        {done ? "Ronda terminada" : `Pregunta ${Math.min(round, total)} / ${total}`}
        {" · "}
        Aciertos: {correct}
      </span>
      {done ? (
        <button
          type="button"
          onClick={onAgain}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs hover:bg-white/10"
        >
          Otra ronda
        </button>
      ) : null}
    </div>
  );
}

function NoteIdentify({ onComplete }: { onComplete: () => void }) {
  const total = 10;
  const [pitch, setPitch] = useState(() => pick(BEGINNER_PITCHES));
  const [round, setRound] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function next(wasCorrect: boolean) {
    const c = correct + (wasCorrect ? 1 : 0);
    if (round >= total) {
      setCorrect(c);
      setDone(true);
      if (c >= 7) onComplete();
      return;
    }
    setCorrect(c);
    setRound((r) => r + 1);
    setPitch(pick(BEGINNER_PITCHES));
    setFeedback(null);
  }

  const letter = parsePitch(pitch).letter as keyof typeof SPANISH_NATURAL;

  return (
    <div className="space-y-3">
      <RoundScore round={round} total={total} correct={correct} done={done} onAgain={() => {
        setRound(1);
        setCorrect(0);
        setDone(false);
        setPitch(pick(BEGINNER_PITCHES));
        setFeedback(null);
      }} />
      <Staff notes={[{ pitch, duration: "quarter" }]} playable caption="Lee la nota en clave de sol." />
      <div className="flex flex-wrap gap-2">
        {(["C", "D", "E", "F", "G", "A", "B"] as const).map((l) => (
          <button
            key={l}
            type="button"
            disabled={done || Boolean(feedback)}
            onClick={() => {
              const ok = l === letter;
              setFeedback(ok ? "¡Bien!" : `Era ${SPANISH_NATURAL[letter]} (${letter})`);
              window.setTimeout(() => next(ok), 700);
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
          >
            {SPANISH_NATURAL[l]}
          </button>
        ))}
      </div>
      {feedback ? <p className="text-sm text-violet-200">{feedback}</p> : null}
    </div>
  );
}

function EarHighLow({ onComplete }: { onComplete: () => void }) {
  const total = 8;
  const [pair, setPair] = useState<[string, string]>(() => {
    const a = pick(BEGINNER_PITCHES);
    const b = pick(BEGINNER_PITCHES);
    return [a, b];
  });
  const [round, setRound] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function newPair(): [string, string] {
    const a = pick(BEGINNER_PITCHES);
    let b = pick(BEGINNER_PITCHES);
    if (Math.random() < 0.15) b = a;
    return [a, b];
  }

  const truth =
    parsePitch(pair[1]).midi > parsePitch(pair[0]).midi
      ? "up"
      : parsePitch(pair[1]).midi < parsePitch(pair[0]).midi
        ? "down"
        : "same";

  function answer(v: "up" | "down" | "same") {
    const ok = v === truth;
    setMsg(ok ? "Correcto" : "Casi: escucha otra vez la diferencia de altura");
    const c = correct + (ok ? 1 : 0);
    window.setTimeout(() => {
      if (round >= total) {
        setCorrect(c);
        setDone(true);
        if (c >= 6) onComplete();
        return;
      }
      setCorrect(c);
      setRound((r) => r + 1);
      setPair(newPair());
      setMsg(null);
    }, 650);
  }

  return (
    <div className="space-y-3">
      <RoundScore round={round} total={total} correct={correct} done={done} onAgain={() => {
        setRound(1); setCorrect(0); setDone(false); setPair(newPair()); setMsg(null);
      }} />
      <button
        type="button"
        onClick={() => playPitches(pair, 0.55, 0.25)}
        className="rounded-xl bg-violet-500/80 px-4 py-2 text-sm font-medium hover:bg-violet-500"
      >
        Reproducir las dos notas
      </button>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={done} onClick={() => answer("up")} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">
          La 2.ª es más aguda
        </button>
        <button type="button" disabled={done} onClick={() => answer("down")} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">
          La 2.ª es más grave
        </button>
        <button type="button" disabled={done} onClick={() => answer("same")} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">
          Son la misma
        </button>
      </div>
      {msg ? <p className="text-sm text-violet-200">{msg}</p> : null}
    </div>
  );
}

function EarNotes({ onComplete }: { onComplete: () => void }) {
  const naturals = BEGINNER_PITCHES.filter((p) => !p.includes("#") && parsePitch(p).octave === 4);
  const pool = naturals.length ? naturals : ["C4", "D4", "E4", "F4", "G4", "A4", "B4"];
  const total = 8;
  const [hidden, setHidden] = useState(() => pick(pool));
  const [round, setRound] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function play() {
    playPitches(["C4", hidden], 0.6, 0.35);
  }

  function answer(letter: string) {
    const ok = parsePitch(hidden).letter === letter;
    setMsg(ok ? "¡Eso es!" : `Era ${spanishName(hidden)}`);
    const c = correct + (ok ? 1 : 0);
    window.setTimeout(() => {
      if (round >= total) {
        setCorrect(c);
        setDone(true);
        if (c >= 5) onComplete();
        return;
      }
      setCorrect(c);
      setRound((r) => r + 1);
      setHidden(pick(pool));
      setMsg(null);
    }, 700);
  }

  return (
    <div className="space-y-3">
      <RoundScore round={round} total={total} correct={correct} done={done} onAgain={() => {
        setRound(1); setCorrect(0); setDone(false); setHidden(pick(pool)); setMsg(null);
      }} />
      <button type="button" onClick={play} className="rounded-xl bg-violet-500/80 px-4 py-2 text-sm font-medium hover:bg-violet-500">
        Do de referencia + nota
      </button>
      <div className="flex flex-wrap gap-2">
        {(["C", "D", "E", "F", "G", "A", "B"] as const).map((l) => (
          <button
            key={l}
            type="button"
            disabled={done}
            onClick={() => answer(l)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
          >
            {SPANISH_NATURAL[l]}
          </button>
        ))}
      </div>
      {msg ? <p className="text-sm text-violet-200">{msg}</p> : null}
    </div>
  );
}

function EarIntervals({ onComplete }: { onComplete: () => void }) {
  const total = 8;
  const [item, setItem] = useState(() => pick(SIMPLE_INTERVALS));
  const [round, setRound] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function rooted(): [string, string] {
    const roots = ["C4", "D4", "E4", "F4", "G4"];
    const root = pick(roots);
    const midi = parsePitch(root).midi;
    const second = midi + item.semitones;
    const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const oct = Math.floor(second / 12) - 1;
    const letter = names[second % 12]!;
    return [root, `${letter}${oct}`];
  }

  const [pair, setPair] = useState<[string, string]>(rooted);

  function play() {
    playPitches(pair, 0.55, 0.2);
  }

  function answer(semitones: number) {
    const ok = semitones === item.semitones;
    setMsg(ok ? "Correcto" : `Era ${item.name}`);
    const c = correct + (ok ? 1 : 0);
    window.setTimeout(() => {
      if (round >= total) {
        setCorrect(c);
        setDone(true);
        if (c >= 5) onComplete();
        return;
      }
      const next = pick(SIMPLE_INTERVALS);
      setItem(next);
      const r = pick(["C4", "D4", "E4", "F4", "G4"]);
      const midi = parsePitch(r).midi + next.semitones;
      const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
      setPair([r, `${names[midi % 12]}${Math.floor(midi / 12) - 1}`]);
      setCorrect(c);
      setRound((x) => x + 1);
      setMsg(null);
    }, 750);
  }

  return (
    <div className="space-y-3">
      <RoundScore round={round} total={total} correct={correct} done={done} onAgain={() => {
        setRound(1); setCorrect(0); setDone(false); setItem(pick(SIMPLE_INTERVALS)); setMsg(null);
      }} />
      <button type="button" onClick={play} className="rounded-xl bg-violet-500/80 px-4 py-2 text-sm font-medium hover:bg-violet-500">
        Escuchar intervalo
      </button>
      <div className="flex flex-wrap gap-2">
        {SIMPLE_INTERVALS.map((it) => (
          <button
            key={it.semitones}
            type="button"
            disabled={done}
            onClick={() => answer(it.semitones)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
          >
            {it.name.split(" (")[0]}
          </button>
        ))}
      </div>
      {msg ? <p className="text-sm text-violet-200">{msg}</p> : null}
    </div>
  );
}

function ChordLab() {
  const [cipher, setCipher] = useState("C");
  const triad = TRIADS.find((t) => t.cipher === cipher) ?? TRIADS[0]!;
  const staffNotes: StaffNote[] = triad.pitches.map((p) => ({ pitch: p, duration: "whole" as const }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TRIADS.map((t) => (
          <button
            key={t.cipher}
            type="button"
            onClick={() => setCipher(t.cipher)}
            className={`rounded-xl border px-3 py-1.5 text-sm ${
              cipher === t.cipher
                ? "border-violet-400/60 bg-violet-400/20"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            {t.cipher}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm">
        <p className="text-lg font-semibold tracking-tight">
          {triad.cipher} · {triad.name}
        </p>
        <p className="mt-1 text-white/60">
          {triad.pitches.map((p) => spanishName(p)).join(" – ")} ({triad.quality === "major" ? "4 + 3 semitonos" : "3 + 4 semitonos"})
        </p>
        <button
          type="button"
          onClick={() => playChord([...triad.pitches])}
          className="mt-3 rounded-xl bg-violet-500/80 px-4 py-2 text-sm font-medium hover:bg-violet-500"
        >
          Tocar tríada
        </button>
      </div>
      <PianoKeyboard fromOctave={4} octaves={2} active={[...triad.pitches]} />
      <Staff notes={staffNotes} caption="Las tres notas de la tríada, de grave a agudo." />
    </div>
  );
}

function TempoLab() {
  const [bpm, setBpm] = useState(90);
  const [on, setOn] = useState(false);
  const beatRef = useRef(0);

  useEffect(() => {
    if (!on) return;
    beatRef.current = 0;
    const id = window.setInterval(() => {
      clickMetronome(beatRef.current % 4 === 0);
      beatRef.current += 1;
    }, (60 / bpm) * 1000);
    clickMetronome(true);
    return () => window.clearInterval(id);
  }, [on, bpm]);

  const label = bpm < 70 ? "Adagio" : bpm < 90 ? "Andante" : bpm < 110 ? "Moderato" : bpm < 140 ? "Allegro" : "Presto";

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-semibold tabular-nums">{bpm} <span className="text-base font-normal text-white/50">BPM</span></p>
          <p className="text-sm text-violet-200">{label}</p>
        </div>
        <button
          type="button"
          onClick={() => setOn((v) => !v)}
          className="rounded-xl bg-violet-500/80 px-4 py-2 text-sm font-medium hover:bg-violet-500"
        >
          {on ? "Detener" : "Metrónomo"}
        </button>
      </div>
      <input
        type="range"
        min={40}
        max={180}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        className="nice-range"
        style={{ ["--val" as string]: `${((bpm - 40) / 140) * 100}%` }}
      />
    </div>
  );
}

function MeterLab() {
  const [beats, setBeats] = useState<2 | 3 | 4>(4);
  const [on, setOn] = useState(false);
  const beatRef = useRef(0);

  useEffect(() => {
    if (!on) return;
    beatRef.current = 0;
    const id = window.setInterval(() => {
      clickMetronome(beatRef.current % beats === 0);
      beatRef.current += 1;
    }, 500);
    clickMetronome(true);
    return () => window.clearInterval(id);
  }, [on, beats]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {([2, 3, 4] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setBeats(n)}
            className={`rounded-xl border px-3 py-1.5 text-sm ${
              beats === n ? "border-violet-400/60 bg-violet-400/20" : "border-white/10 bg-white/5"
            }`}
          >
            {n}/4
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOn((v) => !v)}
          className="rounded-xl bg-violet-500/80 px-4 py-1.5 text-sm font-medium hover:bg-violet-500"
        >
          {on ? "Detener" : "Escuchar acento"}
        </button>
      </div>
      <p className="text-xs text-white/50">
        El primer golpe de cada grupo de {beats} es más agudo. Cuenta «1» en ese.
      </p>
    </div>
  );
}

function StructureLab() {
  const [section, setSection] = useState<SongSection | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const labels: SongSection[] = ["intro", "verso", "estribillo", "puente"];

  function play() {
    stopRef.current?.();
    setSection("intro");
    stopRef.current = playStructureDemo(96, (s) => setSection(s));
  }

  useEffect(() => () => stopRef.current?.(), []);

  return (
    <div className="space-y-3">
      <button type="button" onClick={play} className="rounded-xl bg-violet-500/80 px-4 py-2 text-sm font-medium hover:bg-violet-500">
        Reproducir mini-canción
      </button>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {labels.map((s) => (
          <div
            key={s}
            className={`rounded-2xl border px-3 py-4 text-center text-sm capitalize ${
              section === s
                ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-100"
                : "border-white/10 bg-white/5 text-white/60"
            }`}
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InteractiveBlock({
  kind,
  onComplete,
}: {
  kind: InteractiveKind;
  onComplete: () => void;
}) {
  const body = useMemo(() => {
    switch (kind) {
      case "note-identify":
        return <NoteIdentify onComplete={onComplete} />;
      case "ear-high-low":
        return <EarHighLow onComplete={onComplete} />;
      case "ear-notes":
        return <EarNotes onComplete={onComplete} />;
      case "ear-intervals":
        return <EarIntervals onComplete={onComplete} />;
      case "chord-lab":
        return <ChordLab />;
      case "tempo-lab":
        return <TempoLab />;
      case "meter-lab":
        return <MeterLab />;
      case "structure-lab":
        return <StructureLab />;
      default:
        return null;
    }
  }, [kind, onComplete]);

  return <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-4">{body}</div>;
}
