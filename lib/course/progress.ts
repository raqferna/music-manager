import type { Course, CourseProgress } from "./types";

export type { CourseProgress };

const KEY = "music-course-progress";

const EMPTY: CourseProgress = {
  completedLessons: [],
  quizScores: {},
  lastLessonId: null,
};

export function loadProgress(): CourseProgress {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as CourseProgress;
    return {
      completedLessons: parsed.completedLessons ?? [],
      quizScores: parsed.quizScores ?? {},
      lastLessonId: parsed.lastLessonId ?? null,
    };
  } catch {
    return EMPTY;
  }
}

export function saveProgress(progress: CourseProgress) {
  localStorage.setItem(KEY, JSON.stringify(progress));
}

export function flattenLessons(course: Course) {
  return course.modules.flatMap((m) => m.lessons.map((lesson) => ({ module: m, lesson })));
}

export function coursePercent(course: Course, progress: CourseProgress): number {
  const total = flattenLessons(course).length;
  if (!total) return 0;
  const done = flattenLessons(course).filter((x) => progress.completedLessons.includes(x.lesson.id)).length;
  return Math.round((done / total) * 100);
}
