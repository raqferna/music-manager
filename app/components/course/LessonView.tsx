"use client";

import type { ContentBlock, Lesson } from "@/lib/course/types";
import Quiz from "./Quiz";
import Staff from "./Staff";
import InteractiveBlock from "./Interactives";

function Block({
  block,
  onQuizPassed,
  onInteractiveDone,
}: {
  block: ContentBlock;
  onQuizPassed: (quizId: string, score: number) => void;
  onInteractiveDone: () => void;
}) {
  switch (block.type) {
    case "p":
      return <p className="text-[15px] leading-relaxed text-white/80">{block.text}</p>;
    case "h":
      return <h3 className="mt-6 text-lg font-semibold tracking-tight text-white">{block.text}</h3>;
    case "ul":
      return (
        <ul className="my-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-white/80">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "callout": {
      const tone =
        block.tone === "tip"
          ? "border-cyan-400/25 bg-cyan-400/10"
          : block.tone === "remember"
            ? "border-amber-400/25 bg-amber-400/10"
            : "border-violet-400/25 bg-violet-400/10";
      return (
        <aside className={`my-4 rounded-2xl border p-4 ${tone}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{block.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-white/80">{block.text}</p>
        </aside>
      );
    }
    case "table":
      return (
        <div className="my-4 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-white/5 text-white/60">
              <tr>
                {block.headers.map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-t border-white/10">
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2 text-white/80">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "staff":
      return <Staff notes={block.notes} timeSignature={block.timeSignature} caption={block.caption} />;
    case "quiz":
      return <Quiz quizId={block.id} questions={block.questions} onPassed={onQuizPassed} />;
    case "interactive":
      return (
        <div className="my-4 space-y-2">
          {block.title ? <p className="text-sm font-medium text-white/90">{block.title}</p> : null}
          {block.text ? <p className="text-sm text-white/55">{block.text}</p> : null}
          <InteractiveBlock kind={block.kind} onComplete={onInteractiveDone} />
        </div>
      );
    default:
      return null;
  }
}

export default function LessonView({
  lesson,
  moduleTitle,
  completed,
  onQuizPassed,
  onComplete,
}: {
  lesson: Lesson;
  moduleTitle: string;
  completed: boolean;
  onQuizPassed: (quizId: string, score: number) => void;
  onComplete: () => void;
}) {
  const hasQuiz = lesson.blocks.some((b) => b.type === "quiz");
  const hasInteractive = lesson.blocks.some((b) => b.type === "interactive");

  return (
    <article className="space-y-3">
      <header className="mb-4">
        <p className="text-xs uppercase tracking-wide text-violet-300/80">{moduleTitle}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{lesson.title}</h2>
        <p className="mt-2 text-sm text-white/55">
          {lesson.summary} · {lesson.durationMin} min
          {completed ? " · Completada" : ""}
        </p>
      </header>
      {lesson.blocks.map((block, i) => (
        <Block
          key={i}
          block={block}
          onQuizPassed={onQuizPassed}
          onInteractiveDone={onComplete}
        />
      ))}
      {!hasQuiz ? (
        <div className="pt-4">
          <button
            type="button"
            onClick={onComplete}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
          >
            {completed
              ? "Completada"
              : hasInteractive
                ? "Marcar lección como completada"
                : "He leído esta lección"}
          </button>
        </div>
      ) : null}
    </article>
  );
}
