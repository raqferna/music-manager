"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { COURSES } from "@/lib/course/catalog";
import { coursePercent, loadProgress } from "@/lib/course/progress";
import { Disc, GraduationCap } from "@/app/components/icons";

export default function CursoCatalog() {
  const [percents, setPercents] = useState<Record<string, number>>({});

  useEffect(() => {
    const progress = loadProgress();
    const next: Record<string, number> = {};
    for (const c of COURSES) next[c.id] = coursePercent(c, progress);
    setPercents(next);
  }, []);

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-white/50">
          <Link href="/" className="hover:text-white/80">
            ← Catálogo
          </Link>
        </p>
        <header className="mb-8 mt-4 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl glass-strong">
            <GraduationCap className="h-7 w-7 text-violet-300" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Cursos de lenguaje musical</h1>
            <p className="text-sm text-white/60">
              Formación amena y rigurosa, pensada para quien parte de cero o quiere complementar el instrumento.
            </p>
          </div>
        </header>

        <div className="space-y-4">
          {COURSES.map((course) => {
            const pct = percents[course.id] ?? 0;
            return (
              <Link
                key={course.id}
                href={`/curso/${course.id}`}
                className="glass block rounded-3xl p-5 transition hover:bg-white/[0.06] md:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-violet-300/80">
                      CÓD. {course.code} · {course.level}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">{course.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">{course.description}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                    {course.audience}
                  </span>
                </div>
                <ol className="mt-4 space-y-1.5 text-sm text-white/70">
                  {course.goals.map((g, i) => (
                    <li key={g} className="flex gap-2">
                      <span className="text-white/35">{i + 1}.</span>
                      {g}
                    </li>
                  ))}
                </ol>
                <div className="mt-5">
                  <div className="mb-1 flex justify-between text-xs text-white/45">
                    <span>{course.modules.length} módulos</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="mt-8 flex items-center gap-2 text-xs text-white/40">
          <Disc className="h-4 w-4" />
          El progreso se guarda en este navegador. Puedes saltar entre lecciones con libertad.
        </p>
      </div>
    </div>
  );
}
