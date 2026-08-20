import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCourse } from "@/lib/course/catalog";
import CursoPlayer from "@/app/components/course/CursoPlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>;
}): Promise<Metadata> {
  const { courseId } = await params;
  const course = getCourse(courseId);
  if (!course) return { title: "Curso no encontrado" };
  return {
    title: `${course.title} · CÓD. ${course.code}`,
    description: course.description,
  };
}

export function generateStaticParams() {
  return [{ courseId: "025" }];
}

export default async function CursoPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = getCourse(courseId);
  if (!course) notFound();
  return <CursoPlayer course={course} />;
}
