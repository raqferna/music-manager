import type { CourseModule } from "../types";

export const moduleElementos: CourseModule = {
  id: "elementos",
  number: 4,
  title: "Elementos musicales a través de la audición",
  description: "Tempo, compás, dinámica y estructura escuchando, no solo leyendo.",
  lessons: [
    {
      id: "e4-tempo",
      title: "Pulso y tempo",
      durationMin: 10,
      summary: "El latido de la música y las palabras italianas que lo nombran.",
      blocks: [
        {
          type: "p",
          text: "El pulso es el latido regular sobre el que se apoya casi toda la música que escuchamos. Puedes marcarlo con el pie. El tempo es la velocidad de ese latido, en pulsaciones por minuto (BPM). 60 BPM = un pulso por segundo. 120 BPM = dos por segundo, típico de un pop que invita a mover la cabeza.",
        },
        {
          type: "table",
          headers: ["Indicación", "BPM orientativo", "Carácter"],
          rows: [
            ["Largo / Adagio", "40–70", "Lento, amplio"],
            ["Andante", "70–90", "«Andando», cómodo"],
            ["Moderato", "90–110", "Ni prisa ni calma extrema"],
            ["Allegro", "110–140", "Vivo, alegre"],
            ["Presto", "140+", "Muy rápido"],
          ],
        },
        {
          type: "p",
          text: "Esas palabras italianas aparecen sobre la partitura. Hoy en día también verás un metrónomo numérico (♩ = 96). Ningún número es sagrado: el tempo también es expresión. Un himno puede ir más lento en la última estrofa a propósito.",
        },
        {
          type: "interactive",
          kind: "tempo-lab",
          title: "Laboratorio de tempo",
          text: "Mueve el metrónomo y siente cómo cambia el carácter. Empieza a 60, súbelo a 120 y vuelve: el patrón rítmico es el mismo; lo que cambia es la prisa.",
        },
      ],
    },
    {
      id: "e4-compas",
      title: "Sentir el compás",
      durationMin: 8,
      summary: "El acento del primer tiempo es lo que distingue 2, 3 o 4.",
      blocks: [
        {
          type: "p",
          text: "Si el tempo es «cuán rápido va el reloj», el compás es «cómo agrupamos los tics». Un metrónomo que acentúa cada dos golpes sugiere 2/4; cada tres, un vals (3/4); cada cuatro, el 4/4 del pop. El oído busca el uno: el golpe un poco más marcado.",
        },
        {
          type: "p",
          text: "En una canción, prueba a contar «1-2-3-4» en voz baja. Si el 1 cae siempre con el bombo o con el acorde que «apoya», has encontrado el compás. Si te encaja mejor «1-2-3», quizá es un vals o un minué. No todas las músicas son regulares (el flamenco, el jazz impar…), pero para iniciación el oído cuaternario y ternario es el mapa.",
        },
        {
          type: "interactive",
          kind: "meter-lab",
          title: "Metrónomo con acento",
          text: "Elige 2, 3 o 4 tiempos y escucha dónde cae el golpe fuerte. Palmea el 1.",
        },
      ],
    },
    {
      id: "e4-estructura",
      title: "Estructura de una canción",
      durationMin: 10,
      summary: "Intro, verso, estribillo, puente: el mapa que oyes sin ver la partitura.",
      blocks: [
        {
          type: "p",
          text: "Casi cualquier canción popular se puede dibujar con cuatro o cinco cajas. No hace falta saber teoría para sentirlas: el estribillo es lo que cantas en el coche; el verso cuenta la historia; el puente es «esa parte distinta del medio». Ponerles nombre te ayuda a ensayar, a transcribir y a no perderte en un arreglo.",
        },
        {
          type: "ul",
          items: [
            "Intro: presentación, a menudo instrumental. «Se va a poner en marcha».",
            "Verso (estrofa): letra nueva, música parecida cada vez.",
            "Estribillo (chorus): el gancho, letra y melodía que se repiten.",
            "Puente (bridge): contraste; algo cambia (armonía, ritmo o letra).",
            "Outro: cierre; a veces es un estribillo que se desvanece.",
          ],
        },
        {
          type: "p",
          text: "Un esquema clásico: intro – verso – estribillo – verso – estribillo – puente – estribillo. Hay mil variantes (pre-estribillo, solo de guitarra, nana sin estribillo…). Lo importante es oír el retorno: «esto ya lo he escuchado» suele ser estribillo o el segundo verso.",
        },
        {
          type: "callout",
          tone: "tip",
          title: "Escucha activa en tu catálogo",
          text: "Elige una canción de tu biblioteca en esta misma app, ponla y anota en un papel: 0:00 intro, 0:18 verso, 0:45 estribillo… Ensayar con temas que ya amas fija el concepto mejor que cualquier ejemplo abstracto.",
        },
        {
          type: "interactive",
          kind: "structure-lab",
          title: "Mini-canción guiada",
          text: "Una secuencia corta de acordes con intro, verso, estribillo y puente. Mira cómo se ilumina cada sección mientras suena.",
        },
      ],
    },
    {
      id: "e4-dinamica",
      title: "Dinámica y carácter",
      durationMin: 8,
      summary: "Piano, forte y el arco que hace interesante una frase.",
      blocks: [
        {
          type: "p",
          text: "Si todo sonara al mismo volumen, la música se volvería plana, como hablar sin acentos. La dinámica es el juego de intensidades. En partitura verás abreviaturas italianas bajo o sobre el pentagrama:",
        },
        {
          type: "table",
          headers: ["Signo", "Italiano", "Significado"],
          rows: [
            ["pp", "pianissimo", "Muy suave"],
            ["p", "piano", "Suave"],
            ["mp", "mezzo piano", "Medio suave"],
            ["mf", "mezzo forte", "Medio fuerte"],
            ["f", "forte", "Fuerte"],
            ["ff", "fortissimo", "Muy fuerte"],
          ],
        },
        {
          type: "p",
          text: "El crescendo (un regulador que se abre, o la palabra cresc.) pide ir de menos a más. El diminuendo o decrescendo, al revés. En una canción, el segundo estribillo suele ser más denso o más fuerte que el primero: es dinámica a escala de tema, no solo de un compás.",
        },
        {
          type: "callout",
          tone: "remember",
          title: "Dinámica no es tempo",
          text: "Más fuerte no significa más rápido. Puedes tener un Adagio fortísimo (un coral lento y poderoso) o un Presto pianissimo (notas rápidas en susurro). Son ejes distintos.",
        },
      ],
    },
    {
      id: "e4-quiz",
      title: "Autoevaluación del módulo 4",
      durationMin: 6,
      summary: "Tempo, compás, forma y dinámica.",
      blocks: [
        {
          type: "quiz",
          id: "quiz-e4",
          questions: [
            {
              id: "q1",
              prompt: "120 BPM significa…",
              options: [
                "120 compases por minuto",
                "120 pulsaciones por minuto",
                "120 notas por compás",
                "Un tempo Largo",
              ],
              answer: 1,
              explain: "BPM = beats per minute = pulsos por minuto.",
            },
            {
              id: "q2",
              prompt: "Un vals suele estar en…",
              options: ["4/4", "3/4", "2/4", "5/4"],
              answer: 1,
              explain: "El giro de tres tiempos (1-2-3) es la marca del vals.",
            },
            {
              id: "q3",
              prompt: "La parte de una canción que más se repite y «engancha» suele ser…",
              options: ["La intro", "El verso", "El estribillo", "La armadura"],
              answer: 2,
              explain: "El chorus o estribillo es el gancho memorable.",
            },
            {
              id: "q4",
              prompt: "mf significa…",
              options: ["Muy fuerte", "Medio fuerte", "Muy suave", "Más rápido"],
              answer: 1,
              explain: "Mezzo forte = medio fuerte.",
            },
            {
              id: "q5",
              prompt: "El puente de una canción sirve sobre todo para…",
              options: [
                "Repetir el primer verso",
                "Dar contraste antes del último estribillo",
                "Indicar el tempo",
                "Afinar la guitarra",
              ],
              answer: 1,
              explain: "El bridge cambia algo para que el retorno al estribillo se note.",
            },
          ],
        },
      ],
    },
  ],
};
