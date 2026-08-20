import type { Course } from "./types";
import { moduleNotacion } from "./modules/01-notacion";
import { modulePartituras } from "./modules/02-partituras";
import { moduleAuditiva } from "./modules/03-auditiva";
import { moduleElementos } from "./modules/04-elementos";
import { moduleCifrado } from "./modules/05-cifrado";

export const INICIACION: Course = {
  id: "025",
  code: "025",
  title: "Lenguaje musical: iniciación",
  level: "Iniciación",
  audience: "Sin conocimientos previos",
  description:
    "Una formación básica para acercarte de forma amena e informal, pero rigurosa, a las cualidades y elementos que conforman la música. Sirve por sí sola o como complemento a las clases de instrumento.",
  goals: [
    "Conocimientos teóricos básicos y notación musical",
    "Comprensión, lectura y escritura de partituras sencillas",
    "Educación auditiva: notas e intervalos sencillos",
    "Tempo, compás y estructura a través de la audición",
    "Iniciación al cifrado americano y formación de tríadas",
  ],
  modules: [moduleNotacion, modulePartituras, moduleAuditiva, moduleElementos, moduleCifrado],
};

export const COURSES: Course[] = [INICIACION];

export function getCourse(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}
