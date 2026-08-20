import { midiToFreq, parsePitch, pitchToFreq } from "./notes";

let ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function pianoVoice(audio: AudioContext, freq: number, start: number, duration: number, gain = 0.18) {
  const master = audio.createGain();
  master.gain.setValueAtTime(0, start);
  master.gain.linearRampToValueAtTime(gain, start + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0008, start + duration);
  master.connect(audio.destination);

  const harmonics = [
    { mul: 1, vol: 1 },
    { mul: 2, vol: 0.35 },
    { mul: 3, vol: 0.16 },
    { mul: 4, vol: 0.08 },
  ];
  for (const h of harmonics) {
    const osc = audio.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq * h.mul;
    const g = audio.createGain();
    g.gain.value = h.vol;
    osc.connect(g).connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }
}

export function playPitches(pitches: string[], noteDur = 0.7, gap = 0.08) {
  const audio = getAudioContext();
  let t = audio.currentTime + 0.02;
  for (const p of pitches) {
    pianoVoice(audio, pitchToFreq(p), t, noteDur);
    t += noteDur + gap;
  }
}

export function playChord(pitches: string[], duration = 1.4) {
  const audio = getAudioContext();
  const t = audio.currentTime + 0.02;
  const gain = 0.12;
  for (const p of pitches) {
    pianoVoice(audio, pitchToFreq(p), t, duration, gain);
  }
}

export function playMidi(midi: number, duration = 0.7) {
  const audio = getAudioContext();
  pianoVoice(audio, midiToFreq(midi), audio.currentTime + 0.02, duration);
}

export function clickMetronome(accent: boolean) {
  const audio = getAudioContext();
  const t = audio.currentTime;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = "square";
  osc.frequency.value = accent ? 1400 : 900;
  g.gain.setValueAtTime(accent ? 0.12 : 0.06, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + (accent ? 0.08 : 0.05));
  osc.connect(g).connect(audio.destination);
  osc.start(t);
  osc.stop(t + 0.1);
}

export type SongSection = "intro" | "verso" | "estribillo" | "puente";

const SECTION_PROGRESSION: { section: SongSection; chords: string[][] }[] = [
  { section: "intro", chords: [["C4", "E4", "G4"], ["C4", "E4", "G4"]] },
  {
    section: "verso",
    chords: [
      ["A3", "C4", "E4"],
      ["F3", "A3", "C4"],
      ["C4", "E4", "G4"],
      ["G3", "B3", "D4"],
    ],
  },
  {
    section: "estribillo",
    chords: [
      ["F3", "A3", "C4"],
      ["C4", "E4", "G4"],
      ["G3", "B3", "D4"],
      ["C4", "E4", "G4"],
    ],
  },
  {
    section: "puente",
    chords: [
      ["D4", "F4", "A4"],
      ["G3", "B3", "D4"],
    ],
  },
];

export function playStructureDemo(
  bpm: number,
  onSection: (section: SongSection, elapsed: number) => void,
): () => void {
  const audio = getAudioContext();
  const beat = 60 / bpm;
  let t = audio.currentTime + 0.05;
  const start = t;
  const timers: number[] = [];

  for (const part of SECTION_PROGRESSION) {
    for (const chord of part.chords) {
      const when = t;
      const delay = Math.max(0, (when - audio.currentTime) * 1000);
      timers.push(
        window.setTimeout(() => {
          onSection(part.section, audio.currentTime - start);
        }, delay),
      );
      for (const p of chord) {
        pianoVoice(audio, pitchToFreq(p), when, beat * 1.6, 0.1);
      }
      const melody = parsePitch(chord[chord.length - 1]).midi + (part.section === "estribillo" ? 12 : 0);
      pianoVoice(audio, midiToFreq(melody), when + beat * 0.5, beat * 0.4, 0.08);
      t += beat * 2;
    }
  }

  return () => {
    for (const id of timers) window.clearTimeout(id);
  };
}
