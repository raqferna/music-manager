"use client";

import { useMemo, useState } from "react";
import type { QuizQuestion } from "@/lib/course/types";

export default function Quiz({
  quizId,
  questions,
  onPassed,
}: {
  quizId: string;
  questions: QuizQuestion[];
  onPassed: (quizId: string, score: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => {
    if (!submitted) return 0;
    return questions.filter((q) => answers[q.id] === q.answer).length;
  }, [answers, questions, submitted]);

  const passed = submitted && score >= Math.ceil(questions.length * 0.7);

  function submit() {
    if (Object.keys(answers).length < questions.length) return;
    setSubmitted(true);
    const s = questions.filter((q) => answers[q.id] === q.answer).length;
    if (s >= Math.ceil(questions.length * 0.7)) onPassed(quizId, s);
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <div className="space-y-4">
      {questions.map((q, idx) => {
        const chosen = answers[q.id];
        return (
          <fieldset key={q.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <legend className="mb-3 text-sm font-medium text-white/90">
              {idx + 1}. {q.prompt}
            </legend>
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const selected = chosen === i;
                let cls = "border-white/10 bg-white/5 hover:bg-white/10";
                if (submitted) {
                  if (i === q.answer) cls = "border-emerald-400/50 bg-emerald-400/15 text-emerald-100";
                  else if (selected) cls = "border-red-400/40 bg-red-400/10 text-red-100";
                } else if (selected) {
                  cls = "border-violet-400/50 bg-violet-400/15";
                }
                return (
                  <label
                    key={opt}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${cls}`}
                  >
                    <input
                      type="radio"
                      className="accent-violet-400"
                      name={q.id}
                      checked={selected}
                      disabled={submitted}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
            {submitted && q.explain ? (
              <p className="mt-2 text-xs text-white/55">{q.explain}</p>
            ) : null}
          </fieldset>
        );
      })}

      <div className="flex flex-wrap items-center gap-3">
        {!submitted ? (
          <button
            type="button"
            onClick={submit}
            disabled={Object.keys(answers).length < questions.length}
            className="rounded-xl bg-violet-500/80 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-40"
          >
            Corregir
          </button>
        ) : (
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Reintentar
          </button>
        )}
        {submitted ? (
          <p className={`text-sm ${passed ? "text-emerald-300" : "text-amber-200"}`}>
            {score} / {questions.length}
            {passed ? " · Módulo asentado" : " · Revisa las explicaciones y vuelve a probar"}
          </p>
        ) : (
          <p className="text-xs text-white/40">Responde todas las preguntas para corregir.</p>
        )}
      </div>
    </div>
  );
}
