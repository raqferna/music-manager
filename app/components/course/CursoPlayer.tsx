"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Course } from "@/lib/course/types";
import {
  coursePercent,
  flattenLessons,
  loadProgress,
  saveProgress,
  type CourseProgress,
} from "@/lib/course/progress";
import LessonView from "@/app/components/course/LessonView";
import { Check, ChevronLeft, ChevronRight, GraduationCap } from "@/app/components/icons";

export default function CursoPlayer({ course }: { course: Course }) {
  const items = useMemo(() => flattenLessons(course), [course]);
  const [progress, setProgress] = useState<CourseProgress>({
    completedLessons: [],
    quizScores: {},
    lastLessonId: null,
  });
  const [lessonId, setLessonId] = useState(items[0]?.lesson.id ?? "");

  useEffect(() => {
    const loaded = loadProgress();
    setProgress(loaded);
    const fromUrl = new URLSearchParams(window.location.search).get("leccion");
    if (fromUrl && items.some((x) => x.lesson.id === fromUrl)) {
      setLessonId(fromUrl);
    } else if (loaded.lastLessonId && items.some((x) => x.lesson.id === loaded.lastLessonId)) {
      setLessonId(loaded.lastLessonId);
    }
  }, [items]);

  const currentIndex = items.findIndex((x) => x.lesson.id === lessonId);
  const current = items[currentIndex] ?? items[0];
  const percent = coursePercent(course, progress);

  function goTo(id: string) {
    setLessonId(id);
    setProgress((prev) => {
      const next = { ...prev, lastLessonId: id };
      saveProgress(next);
      return next;
    });
    const url = new URL(window.location.href);
    url.searchParams.set("leccion", id);
    window.history.replaceState(null, "", url.toString());
  }

  function markComplete(id: string) {
    setProgress((prev) => {
      if (prev.completedLessons.includes(id)) {
        const next = { ...prev, lastLessonId: id };
        saveProgress(next);
        return next;
      }
      const next = {
        ...prev,
        completedLessons: [...prev.completedLessons, id],
        lastLessonId: id,
      };
      saveProgress(next);
      return next;
    });
  }

  if (!current) return null;

  const prev = items[currentIndex - 1];
  const next = items[currentIndex + 1];

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl glass-strong">
              <GraduationCap className="h-7 w-7 text-violet-300" />
            </div>
            <div>
              <p className="text-xs text-white/45">
                <Link href="/curso" className="hover:text-white/80">
                  Cursos
                </Link>
                {" · "}CÓD. {course.code}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{course.title}</h1>
            </div>
          </div>
          <div className="min-w-[200px]">
            <div className="mb-1 flex justify-between text-xs text-white/50">
              <span>Progreso</span>
              <span>{percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-400 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(260px,340px)_1fr]">
          <nav className="glass max-h-[80vh] space-y-4 overflow-y-auto scroll-fancy rounded-3xl p-4 md:p-5">
            {course.modules.map((mod) => {
              const doneCount = mod.lessons.filter((l) => progress.completedLessons.includes(l.id)).length;
              return (
                <div key={mod.id}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">
                    Módulo {mod.number} · {doneCount}/{mod.lessons.length}
                  </p>
                  <p className="mb-2 text-sm text-white/80">{mod.title}</p>
                  <ul className="space-y-1">
                    {mod.lessons.map((lesson) => {
                      const active = lesson.id === current.lesson.id;
                      const done = progress.completedLessons.includes(lesson.id);
                      return (
                        <li key={lesson.id}>
                          <button
                            type="button"
                            onClick={() => goTo(lesson.id)}
                            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                              active
                                ? "bg-violet-400/20 text-white"
                                : "text-white/70 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <span
                              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] ${
                                done
                                  ? "border-emerald-400/40 bg-emerald-400/20 text-emerald-200"
                                  : "border-white/15 text-white/40"
                              }`}
                            >
                              {done ? <Check className="h-3 w-3" /> : mod.number}
                            </span>
                            <span className="leading-snug">{lesson.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>

          <section className="glass-strong rounded-3xl p-5 md:p-8 animate-fade-up">
            <LessonView
              lesson={current.lesson}
              moduleTitle={`Módulo ${current.module.number}. ${current.module.title}`}
              completed={progress.completedLessons.includes(current.lesson.id)}
              onQuizPassed={(quizId, score) => {
                setProgress((prev) => {
                  const next = {
                    ...prev,
                    quizScores: { ...prev.quizScores, [quizId]: score },
                    completedLessons: prev.completedLessons.includes(current.lesson.id)
                      ? prev.completedLessons
                      : [...prev.completedLessons, current.lesson.id],
                    lastLessonId: current.lesson.id,
                  };
                  saveProgress(next);
                  return next;
                });
              }}
              onComplete={() => markComplete(current.lesson.id)}
            />

            <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
              {prev ? (
                <button
                  type="button"
                  onClick={() => goTo(prev.lesson.id)}
                  className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {prev.lesson.title}
                </button>
              ) : (
                <span />
              )}
              {next ? (
                <button
                  type="button"
                  onClick={() => goTo(next.lesson.id)}
                  className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white"
                >
                  {next.lesson.title}
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : percent === 100 ? (
                <p className="text-sm text-emerald-300">Curso completado. ¡Bien hecho!</p>
              ) : (
                <span />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
