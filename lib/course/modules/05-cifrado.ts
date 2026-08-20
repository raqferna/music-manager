import type { CourseModule } from "../types";

export const moduleCifrado: CourseModule = {
  id: "cifrado",
  number: 5,
  title: "Iniciación al cifrado americano: formación de tríadas",
  description: "C, Dm, G… y cómo se construye un acorde de tres notas.",
  lessons: [
    {
      id: "c5-que-es",
      title: "Qué es el cifrado americano",
      durationMin: 8,
      summary: "Letras en vez de pentagrama: el mapa de acordes de canciones y cifrados.",
      blocks: [
        {
          type: "p",
          text: "El cifrado americano (o cifrado anglosajón) nombra las notas con letras: C D E F G A B. Un acorde se escribe con esa letra más, a veces, un apéndice: m (menor), 7 (séptima), sus4… Encima de la letra de una canción ves C | Am | F | G y ya puedes acompañar con guitarra, piano o ukelele sin leer un pentagrama completo.",
        },
        {
          type: "table",
          headers: ["Cifrado", "Nombre latino", "Idea"],
          rows: [
            ["C", "Do mayor", "Letra sola = acorde mayor"],
            ["Cm", "Do menor", "La m minúscula = menor"],
            ["G", "Sol mayor", "Igual lógica en cualquier tónica"],
            ["Am", "La menor", "Muy habitual en pop"],
            ["D7", "Re séptima (adelanto)", "La 7 añade una cuarta nota; lo verás en cifrados, aquí no hace falta formarla aún"],
          ],
        },
        {
          type: "p",
          text: "No sustituye a la partitura: no te dice el ritmo exacto ni la melodía. Te dice la armonía, el «suelo» sobre el que ocurre la canción. Para tocar de oído y para ensayar con tu catálogo, es el atajo más útil que existe.",
        },
        {
          type: "callout",
          tone: "info",
          title: "Mayúscula y minúscula",
          text: "C es Do mayor. Cm (o a veces Cmin) es Do menor. Nunca se usa una c minúscula sola para el acorde: la letra de la nota va en mayúscula.",
        },
      ],
    },
    {
      id: "c5-triada",
      title: "Cómo se forma una tríada",
      durationMin: 12,
      summary: "Tónica, tercera y quinta: tres notas que suenan a acorde.",
      blocks: [
        {
          type: "p",
          text: "Una tríada es un acorde de tres notas. Se construye apilando terceras desde una nota que llamamos tónica (el cimiento, la letra del cifrado). Encima va la tercera (el color mayor o menor) y encima la quinta (el techo estable).",
        },
        {
          type: "p",
          text: "En la escala de Do (Do Re Mi Fa Sol La Si), si partes de Do y saltas una nota sí y una no: Do (tónica) – Mi (tercera) – Sol (quinta). Eso es C, Do mayor. Si partes de Re: Re–Fa–La = Dm. De Mi: Mi–Sol–Si = Em. Y así sucesivamente. Es el famoso «comerse una y coger la siguiente» sobre la escala.",
        },
        {
          type: "staff",
          notes: [
            { pitch: "C4", duration: "whole" },
            { pitch: "E4", duration: "whole" },
            { pitch: "G4", duration: "whole" },
          ],
          caption: "Do, Mi y Sol. Por separado son melodía; juntas (en el laboratorio las oirás a la vez) son el acorde C.",
        },
        {
          type: "h",
          text: "La receta en semitonos",
        },
        {
          type: "ul",
          items: [
            "Tríada mayor: tónica + 4 semitonos (3ª mayor) + 3 semitonos más (3ª menor) = 7 semitonos hasta la 5ª. Es decir: 2 tonos y luego 1 tono y medio.",
            "Tríada menor: tónica + 3 semitonos (3ª menor) + 4 semitonos más (3ª mayor). La quinta sigue estando a 7 semitonos. Cambia solo la nota del medio.",
          ],
        },
        {
          type: "p",
          text: "Esa nota del medio es el interruptor del ánimo: Mi hace que C suene «abierto» o alegre; Mi♭ hace que Cm suene más sombrío. La quinta (Sol) es la misma en C y en Cm. Por eso decimos que el modo mayor/menor lo decide la tercera.",
        },
        {
          type: "callout",
          tone: "remember",
          title: "Fórmula rápida",
          text: "Mayor = 4 + 3 semitonos. Menor = 3 + 4. Quinta justa = 7 desde la tónica en ambos casos (salvo acordes disminuidos o aumentados, que salen de este curso).",
        },
      ],
    },
    {
      id: "c5-mayores-menores",
      title: "Acordes mayores y menores más usados",
      durationMin: 10,
      summary: "Las tríadas que aparecen en casi cualquier canción de tu biblioteca.",
      blocks: [
        {
          type: "p",
          text: "No hace falta memorizar las 24 tríadas el primer día. Con estas cubres una barbaridad de temas en Do, Sol, Re, La y Mi (y sus relativos menores):",
        },
        {
          type: "table",
          headers: ["Cifrado", "Notas (tónica–3ª–5ª)", "Cifrado", "Notas"],
          rows: [
            ["C", "Do–Mi–Sol", "Am", "La–Do–Mi"],
            ["G", "Sol–Si–Re", "Em", "Mi–Sol–Si"],
            ["F", "Fa–La–Do", "Dm", "Re–Fa–La"],
            ["D", "Re–Fa♯–La", "Bm", "Si–Re–Fa♯"],
            ["A", "La–Do♯–Mi", "E", "Mi–Sol♯–Si"],
          ],
        },
        {
          type: "p",
          text: "Fíjate: C y Am comparten dos notas (Do y Mi). Por eso suenan emparentados: La menor es el relativo menor de Do mayor. G y Em, F y Dm… misma familia. Las canciones saltan entre primos así todo el rato.",
        },
        {
          type: "callout",
          tone: "tip",
          title: "Un progreso clásico",
          text: "C – G – Am – F (o I–V–vi–IV en números romanos) es el giro de miles de éxitos. Tócalo despacio en el laboratorio de la siguiente lección y lo reconocerás en la radio al día siguiente.",
        },
      ],
    },
    {
      id: "c5-lab",
      title: "Laboratorio de acordes",
      durationMin: 12,
      summary: "Elige tónica y modo, mira las tres notas, el teclado y el pentagrama, y escúchalo.",
      blocks: [
        {
          type: "p",
          text: "Cambia de C a Cm y quédate solo con la nota del medio: es el único semitono que se mueve. Luego recorre C, G, Am, F como si acompañaras una canción. Intenta cantar la tónica mientras suena el acorde.",
        },
        {
          type: "interactive",
          kind: "chord-lab",
          title: "Construye la tríada",
          text: "Tónica + mayor/menor. Se muestran cifrado, nombre latino, teclas y partitura.",
        },
      ],
    },
    {
      id: "c5-quiz",
      title: "Autoevaluación del módulo 5",
      durationMin: 6,
      summary: "Cifrado y construcción de tríadas.",
      blocks: [
        {
          type: "quiz",
          id: "quiz-c5",
          questions: [
            {
              id: "q1",
              prompt: "El cifrado Am significa…",
              options: ["La mayor", "La menor", "Do menor", "La séptima"],
              answer: 1,
              explain: "A = La, m = menor.",
            },
            {
              id: "q2",
              prompt: "Las tres notas de C (Do mayor) son…",
              options: ["Do–Re–Mi", "Do–Mi–Sol", "Do–Fa–Sol", "Do–Mi♭–Sol"],
              answer: 1,
              explain: "Tónica Do, tercera mayor Mi, quinta Sol.",
            },
            {
              id: "q3",
              prompt: "Lo que distingue un acorde mayor de su menor es…",
              options: ["La tónica", "La tercera", "La quinta", "El tempo"],
              answer: 1,
              explain: "C y Cm comparten Do y Sol; cambia Mi / Mi♭.",
            },
            {
              id: "q4",
              prompt: "Una tríada mayor se forma, en semitonos, con el esquema…",
              options: ["3 + 4", "4 + 3", "5 + 2", "2 + 2 + 3"],
              answer: 1,
              explain: "4 semitonos (3ª mayor) y luego 3 (hasta la 5ª justa).",
            },
            {
              id: "q5",
              prompt: "G se corresponde con…",
              options: ["Fa mayor", "Sol menor", "Sol mayor", "Re mayor"],
              answer: 2,
              explain: "G = Sol, letra sola = mayor.",
            },
            {
              id: "q6",
              prompt: "El relativo menor de Do mayor es…",
              options: ["Cm", "Am", "Em", "Dm"],
              answer: 1,
              explain: "Do mayor y La menor comparten la misma armadura y casi las mismas notas.",
            },
          ],
        },
      ],
    },
  ],
};
