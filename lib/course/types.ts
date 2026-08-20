export type StaffDuration = "whole" | "half" | "quarter" | "eighth" | "sixteenth";

export type StaffNote = {
  /** Cifrado científico: C4, F#4, Bb3… */
  pitch: string;
  duration?: StaffDuration;
  rest?: boolean;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explain?: string;
};

export type CalloutTone = "info" | "tip" | "remember";

export type InteractiveKind =
  | "note-identify"
  | "ear-high-low"
  | "ear-notes"
  | "ear-intervals"
  | "chord-lab"
  | "tempo-lab"
  | "meter-lab"
  | "structure-lab";

export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "callout"; tone: CalloutTone; title: string; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "staff"; notes: StaffNote[]; timeSignature?: [number, number]; caption?: string }
  | { type: "quiz"; id: string; questions: QuizQuestion[] }
  | { type: "interactive"; kind: InteractiveKind; title?: string; text?: string };

export type Lesson = {
  id: string;
  title: string;
  durationMin: number;
  summary: string;
  blocks: ContentBlock[];
};

export type CourseModule = {
  id: string;
  number: number;
  title: string;
  description: string;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  code: string;
  title: string;
  level: string;
  audience: string;
  description: string;
  goals: string[];
  modules: CourseModule[];
};

export type CourseProgress = {
  completedLessons: string[];
  quizScores: Record<string, number>;
  lastLessonId: string | null;
};
