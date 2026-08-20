import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cursos de lenguaje musical",
  description:
    "Iniciación al lenguaje musical: notación, lectura de partituras, educación auditiva, elementos musicales y cifrado americano.",
};

export default function CursoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
