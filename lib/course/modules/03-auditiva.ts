import type { CourseModule } from "../types";

export const moduleAuditiva: CourseModule = {
  id: "auditiva",
  number: 3,
  title: "Educación auditiva",
  description: "Reconocer graves y agudos, notas e intervalos sencillos.",
  lessons: [
    {
      id: "a3-agudo-grave",
      title: "Agudo y grave",
      durationMin: 8,
      summary: "El primer músculo del oído: ¿sube o baja?",
      blocks: [
        {
          type: "p",
          text: "Antes de poner nombre a las notas, el oído necesita una brújula: más alto o más bajo. No es una metáfora poética, es física: más vibraciones por segundo = más agudo. En el pentagrama, más arriba = más agudo. En tu cuerpo, suele notarse en la tensión de la garganta si cantas, o en «dónde» imaginas el sonido.",
        },
        {
          type: "p",
          text: "Entrena primero con distancias grandes (un Do grave y un Sol agudo) y luego acorta. Si fallas un semitono, no pasa nada: el oído se afina con repetición, no con talento misterioso. Los músicos que «tienen oído» han comparado miles de sonidos, a menudo sin darse cuenta.",
        },
        {
          type: "callout",
          tone: "tip",
          title: "Cómo escuchar",
          text: "Cierra los ojos un segundo, espera el primer sonido, espera el segundo, y solo entonces decide. El error típico es contestar mientras aún suena la primera nota.",
        },
        {
          type: "interactive",
          kind: "ear-high-low",
          title: "¿Cuál es más aguda?",
          text: "Oirás dos notas seguidas. Di si la segunda es más aguda, más grave o la misma.",
        },
      ],
    },
    {
      id: "a3-intervalos",
      title: "Intervalos sencillos",
      durationMin: 12,
      summary: "La distancia entre dos notas: 2ª, 3ª, 4ª, 5ª y octava.",
      blocks: [
        {
          type: "p",
          text: "Un intervalo es el «hueco» entre dos notas. Se cuenta incluyendo la de partida: de Do a Re es una 2ª (Do–Re: dos nombres); de Do a Mi es una 3ª (Do–Re–Mi); de Do a Fa, 4ª; de Do a Sol, 5ª; de Do a Do, 8ª (octava).",
        },
        {
          type: "table",
          headers: ["Intervalo", "Ejemplo desde Do", "Semitonos", "Sensación aproximada"],
          rows: [
            ["2ª mayor", "Do–Re", "2", "Paso vecino, como subir un peldaño"],
            ["3ª mayor", "Do–Mi", "4", "Sonido «alegre» de acorde mayor"],
            ["4ª justa", "Do–Fa", "5", "Abierta, de himno o llamada"],
            ["5ª justa", "Do–Sol", "7", "Muy estable, poderosa"],
            ["8ª justa", "Do–Do", "12", "La misma nota, otra octava"],
          ],
        },
        {
          type: "staff",
          notes: [
            { pitch: "C4", duration: "half" },
            { pitch: "G4", duration: "half" },
            { pitch: "C4", duration: "half" },
            { pitch: "C5", duration: "half" },
          ],
          caption: "Do–Sol (5ª) y Do–Do (octava). Escúchalas: la 5ª es amplia; la octava es «la misma nota más fina».",
        },
        {
          type: "p",
          text: "Más adelante aparecerán 3ª menor (Do–Mi♭, el sabor «triste» del acorde menor) y tritono, pero para iniciación estas cinco distancias bastan. Cántalas: voz y oído se enseñan mutuamente.",
        },
        {
          type: "callout",
          tone: "remember",
          title: "Justa, mayor, menor",
          text: "Las 4ª, 5ª y 8ª «normales» se llaman justas. Las 2ª y 3ª de la escala mayor se llaman mayores. Si se encogen un semitono, pasan a menores. De momento quédate con los ejemplos de la tabla.",
        },
      ],
    },
    {
      id: "a3-notas",
      title: "Entrenador de notas",
      durationMin: 10,
      summary: "Oyes una nota (con Do de referencia) y eliges su nombre.",
      blocks: [
        {
          type: "p",
          text: "Primero suena un Do de referencia, para anclar el oído. Después, la nota misteriosa. Relaciónala con ese Do: ¿está un peldaño arriba (Re)? ¿Tres (Mi)? ¿Es el mismo Do más agudo?",
        },
        {
          type: "callout",
          tone: "info",
          title: "Oído relativo",
          text: "Esto es oído relativo: reconocer a partir de una referencia. El oído absoluto (identificar una nota suelta sin referencia) no hace falta para tocar ni para este curso.",
        },
        {
          type: "interactive",
          kind: "ear-notes",
          title: "Nombra la nota",
          text: "Do de referencia + nota oculta. Elige entre las siete notas naturales.",
        },
      ],
    },
    {
      id: "a3-entreno-intervalos",
      title: "Entrenador de intervalos",
      durationMin: 10,
      summary: "Dos notas seguidas: ¿2ª, 3ª, 4ª, 5ª u octava?",
      blocks: [
        {
          type: "p",
          text: "Suena la primera nota, luego la segunda (intervalo melódico, no a la vez). Canta internamente los peldaños si te ayuda: «Do–Re» para la 2ª, «Do–Mi» para la 3ª… Aunque la pareja no sea Do y Sol, la distancia es la misma que Do–Sol si es una 5ª.",
        },
        {
          type: "interactive",
          kind: "ear-intervals",
          title: "¿Qué intervalo es?",
          text: "2ª mayor, 3ª mayor, 4ª justa, 5ª justa u 8ª justa.",
        },
      ],
    },
    {
      id: "a3-quiz",
      title: "Autoevaluación del módulo 3",
      durationMin: 6,
      summary: "Conceptos de educación auditiva.",
      blocks: [
        {
          type: "quiz",
          id: "quiz-a3",
          questions: [
            {
              id: "q1",
              prompt: "De Do a Sol hay una…",
              options: ["3ª", "4ª", "5ª", "8ª"],
              answer: 2,
              explain: "Do–Re–Mi–Fa–Sol: cinco nombres = 5ª.",
            },
            {
              id: "q2",
              prompt: "Un intervalo de octava tiene…",
              options: ["5 semitonos", "7 semitonos", "12 semitonos", "8 semitonos"],
              answer: 2,
              explain: "Do a Do: doce semitonos, las doce teclas del piano hasta repetir el nombre.",
            },
            {
              id: "q3",
              prompt: "Reconocer una nota gracias a un Do previo es…",
              options: ["Oído absoluto", "Oído relativo", "Timbre", "Compás"],
              answer: 1,
              explain: "Relativo = por comparación. Absoluto = sin referencia.",
            },
            {
              id: "q4",
              prompt: "La 3ª mayor desde Do es…",
              options: ["Re", "Mi", "Fa", "Sol"],
              answer: 1,
              explain: "Do–Re–Mi: tercera. En semitonos, 4 (Do–Do♯–Re–Re♯–Mi).",
            },
            {
              id: "q5",
              prompt: "Si la segunda nota suena más «arriba», es más…",
              options: ["Grave", "Aguda", "Larga", "Fuerte"],
              answer: 1,
              explain: "Arriba en el pentagrama y en frecuencia = agudo.",
            },
          ],
        },
      ],
    },
  ],
};
