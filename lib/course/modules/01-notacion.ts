import type { CourseModule } from "../types";

export const moduleNotacion: CourseModule = {
  id: "notacion",
  number: 1,
  title: "Conocimientos teóricos básicos y notación musical",
  description:
    "Las cualidades del sonido, el pentagrama, las notas, las figuras y las alteraciones.",
  lessons: [
    {
      id: "n1-cualidades",
      title: "Las cualidades del sonido",
      durationMin: 8,
      summary: "Altura, duración, intensidad y timbre: lo que oímos aunque no sepamos leer música.",
      blocks: [
        {
          type: "p",
          text: "Antes de llenar un pentagrama de bolitas, merece la pena pararse un segundo: la música está hecha de sonido organizado. Cualquier sonido (una nota de piano, un golpe de caja o tu propia voz) se puede describir con cuatro cualidades. Si las reconoces de oído, el resto del lenguaje musical encaja solo.",
        },
        { type: "h", text: "1. Altura: grave o agudo" },
        {
          type: "p",
          text: "La altura es lo grave o agudo que suena algo. Un contrabajo vive abajo; un flautín, arriba. En el piano, izquierda es grave y derecha es agudo. En el pentagrama, las notas más altas se escriben más arriba. La altura se mide en frecuencia (hercios): el La de referencia, el de la orquesta, vibra a 440 Hz.",
        },
        { type: "h", text: "2. Duración: corto o largo" },
        {
          type: "p",
          text: "Una misma nota puede durar un suspiro o un abrazo. Esa duración se escribe con figuras (negra, blanca, corchea…) y también con silencios, que son tiempo vacío a propósito. Sin duración no hay ritmo.",
        },
        { type: "h", text: "3. Intensidad: suave o fuerte" },
        {
          type: "p",
          text: "No es lo mismo un susurro que un grito. En partitura se indica con matices italianos: p (piano, suave), f (forte, fuerte), y un montón de matices intermedios. Más adelante los oiremos en canciones reales.",
        },
        { type: "h", text: "4. Timbre: el color del sonido" },
        {
          type: "p",
          text: "Si un piano y una guitarra tocan el mismo Do, a la misma altura, duración e intensidad, igual los distingues. Eso es el timbre: la huella sonora de cada instrumento o voz. Por el timbre reconoces a quien te llama por teléfono sin ver la pantalla.",
        },
        {
          type: "callout",
          tone: "remember",
          title: "Para no olvidar",
          text: "Altura = qué nota. Duración = cuánto dura. Intensidad = cuánto volumen. Timbre = qué instrumento o voz la produce.",
        },
        {
          type: "callout",
          tone: "tip",
          title: "Truco de ensayo",
          text: "Coge cualquier canción que te guste y nombra las cuatro cualidades en voz alta: «esta frase sube (altura), las palabras van rápidas (duración), el estribillo entra más fuerte (intensidad) y ahora canta un coro en vez de la voz solista (timbre)».",
        },
      ],
    },
    {
      id: "n1-pentagrama",
      title: "El pentagrama y la clave de sol",
      durationMin: 10,
      summary: "Cinco líneas, cuatro espacios y una clave que nos dice dónde está el Sol.",
      blocks: [
        {
          type: "p",
          text: "El pentagrama es el cuaderno de la música: cinco líneas horizontales y los cuatro espacios que quedan entre ellas. Cada línea y cada espacio corresponde a una nota. Cuanto más arriba escribimos, más aguda suena.",
        },
        {
          type: "p",
          text: "Esas cinco líneas no bastan para todas las notas posibles, así que a veces se añaden líneas pequeñas por encima o por debajo (líneas adicionales). El Do central del piano, por ejemplo, se escribe en una rayita debajo del pentagrama en clave de sol.",
        },
        {
          type: "h",
          text: "La clave de sol",
        },
        {
          type: "p",
          text: "Al principio del pentagrama aparece un dibujo enroscado: la clave de sol. Su espiral se enrolla sobre la segunda línea (contando desde abajo). Esa línea es Sol. A partir de ahí, el resto de notas se colocan subiendo o bajando de una en una: Sol, La, Si, Do… o bajando Fa, Mi, Re, Do.",
        },
        {
          type: "staff",
          notes: [
            { pitch: "G4", duration: "quarter" },
            { pitch: "A4", duration: "quarter" },
            { pitch: "B4", duration: "quarter" },
            { pitch: "C5", duration: "quarter" },
          ],
          timeSignature: [4, 4],
          caption: "La segunda línea es Sol. Encima: La (espacio), Si (línea), Do (espacio).",
        },
        {
          type: "callout",
          tone: "info",
          title: "¿Y la clave de fa?",
          text: "Existe otra clave muy usada, la de fa, que sitúa el Fa en la cuarta línea y se emplea para voces graves, bajo o mano izquierda del piano. En este curso de iniciación nos centramos en la clave de sol, la más habitual para cantar y para la mayoría de melodías.",
        },
        {
          type: "callout",
          tone: "tip",
          title: "Cómo no perderse",
          text: "Memoriza un ancla, no las cinco líneas de golpe: «segunda línea = Sol». El resto se cuenta. Es como saber dónde está el 0 en una regla.",
        },
      ],
    },
    {
      id: "n1-notas",
      title: "Las siete notas",
      durationMin: 12,
      summary: "Do, Re, Mi, Fa, Sol, La, Si… y cómo se escriben en clave de sol.",
      blocks: [
        {
          type: "p",
          text: "En el sistema latino usamos siete nombres: Do, Re, Mi, Fa, Sol, La, Si. Luego el ciclo se repite más agudo o más grave: eso es una octava. El mismo Do «ocho notas más arriba» suena igual de familia, pero más fino; por eso decimos que es el Do de la octava siguiente.",
        },
        {
          type: "p",
          text: "En cifrado americano (el de las canciones pop, jazz y cifrados de guitarra) esas mismas notas se llaman C, D, E, F, G, A, B. No hay H: el Si es B. Conviene ir acostumbrándose a los dos idiomas desde el principio.",
        },
        {
          type: "table",
          headers: ["Latina", "Americana", "En clave de sol (octava media)"],
          rows: [
            ["Do", "C", "Una línea adicional debajo del pentagrama (Do3/C4)"],
            ["Re", "D", "Debajo de la primera línea"],
            ["Mi", "E", "Primera línea"],
            ["Fa", "F", "Primer espacio"],
            ["Sol", "G", "Segunda línea"],
            ["La", "A", "Segundo espacio"],
            ["Si", "B", "Tercera línea"],
          ],
        },
        {
          type: "staff",
          notes: [
            { pitch: "C4", duration: "quarter" },
            { pitch: "D4", duration: "quarter" },
            { pitch: "E4", duration: "quarter" },
            { pitch: "F4", duration: "quarter" },
            { pitch: "G4", duration: "quarter" },
            { pitch: "A4", duration: "quarter" },
            { pitch: "B4", duration: "quarter" },
            { pitch: "C5", duration: "quarter" },
          ],
          caption: "Escala de Do mayor, de Do grave a Do agudo. Pulsa reproducir para oírla.",
        },
        {
          type: "callout",
          tone: "remember",
          title: "Truco de las líneas y los espacios",
          text: "Líneas de abajo arriba: Mi–Sol–Si–Re–Fa. Espacios: Fa–La–Do–Mi. Si te aprendes una de las dos series, la otra es lo que queda en medio.",
        },
        {
          type: "p",
          text: "No hace falta adivinar: cuenta. Si sabes que la segunda línea es Sol, la nota del espacio de encima es La, la línea siguiente Si, y así sucesivamente. Con un poco de práctica deja de ser recuento y se vuelve reconocimiento inmediato, como leer letras.",
        },
      ],
    },
    {
      id: "n1-figuras",
      title: "Figuras rítmicas y silencios",
      durationMin: 12,
      summary: "Redonda, blanca, negra, corchea… y sus silencios equivalentes.",
      blocks: [
        {
          type: "p",
          text: "La figura nos dice cuánto dura una nota. En un compás de 4/4 (el más habitual: cuatro tiempos por compás, cada tiempo vale una negra) las duraciones relativas son estas:",
        },
        {
          type: "table",
          headers: ["Figura", "Duración en 4/4", "Silencio equivalente"],
          rows: [
            ["Redonda", "4 tiempos (todo el compás)", "Silencio de redonda"],
            ["Blanca", "2 tiempos", "Silencio de blanca"],
            ["Negra", "1 tiempo", "Silencio de negra"],
            ["Corchea", "1/2 tiempo (dos por negra)", "Silencio de corchea"],
            ["Semicorchea", "1/4 de tiempo (cuatro por negra)", "Silencio de semicorchea"],
          ],
        },
        {
          type: "staff",
          notes: [
            { pitch: "G4", duration: "whole" },
            { pitch: "G4", duration: "half" },
            { pitch: "G4", duration: "half" },
            { pitch: "G4", duration: "quarter" },
            { pitch: "G4", duration: "quarter" },
            { pitch: "G4", duration: "quarter" },
            { pitch: "G4", duration: "quarter" },
          ],
          timeSignature: [4, 4],
          caption: "Un Sol de redonda; luego dos blancas; luego cuatro negras. Misma nota, distinta duración.",
        },
        {
          type: "p",
          text: "Las figuras «negras» (negra, corchea, semicorchea) van rellenas; las «blancas» (blanca y redonda) van huecas. La corchea lleva un corchete o se agrupa con una barra; la semicorchea, dos. El silencio no es un fallo: es parte del ritmo. Una frase musical respira gracias a ellos.",
        },
        {
          type: "callout",
          tone: "tip",
          title: "Cuenta en voz alta",
          text: "Negra = «1, 2, 3, 4». Corcheas = «1 y 2 y 3 y 4 y». Semicorcheas = «1 e y a, 2 e y a…». Si puedes hablar el ritmo, puedes tocarlo.",
        },
        {
          type: "callout",
          tone: "info",
          title: "El puntillo, adelanto",
          text: "Un punto detrás de la figura suma la mitad de su valor. Negra con puntillo = 1,5 tiempos. Lo usaremos al leer partituras sencillas.",
        },
      ],
    },
    {
      id: "n1-alteraciones",
      title: "Alteraciones: sostenido, bemol y becuadro",
      durationMin: 10,
      summary: "Los semitonos y cómo se escriben las notas que no son «naturales».",
      blocks: [
        {
          type: "p",
          text: "Entre Do y Re no hay un salto único: en el piano hay una tecla negra en medio. Ese paso mínimo se llama semitono. Dos semitonos hacen un tono. Do–Re es un tono; Mi–Fa y Si–Do son semitonos (por eso en el piano no hay tecla negra entre ellos).",
        },
        {
          type: "ul",
          items: [
            "Sostenido (♯): sube la nota un semitono. Fa♯ está un semitono por encima de Fa.",
            "Bemol (♭): baja la nota un semitono. Si♭ está un semitono por debajo de Si.",
            "Becuadro (♮): cancela un sostenido o bemol anterior y devuelve la nota a su altura natural.",
          ],
        },
        {
          type: "staff",
          notes: [
            { pitch: "F4", duration: "quarter" },
            { pitch: "F#4", duration: "quarter" },
            { pitch: "G4", duration: "quarter" },
            { pitch: "Bb4", duration: "quarter" },
          ],
          caption: "Fa, Fa♯, Sol, Si♭. Oye cómo el sostenido empuja hacia arriba y el bemol hacia abajo.",
        },
        {
          type: "p",
          text: "En una partitura, la alteración delante de una nota vale para todo el compás (en esa misma altura), salvo que un becuadro la anule. Si las alteraciones se escriben al principio del pentagrama, junto a la clave, forman la armadura: indican la tonalidad (por ejemplo, un Si♭ al inicio = tonalidad de Fa mayor o Re menor). En iniciación basta con reconocerlas una a una.",
        },
        {
          type: "callout",
          tone: "remember",
          title: "Enarmonía",
          text: "Fa♯ y Sol♭ suenan igual en el piano (misma tecla), pero se escriben distinto según la tonalidad. No te preocupes todavía: lo importante es oír el semitono y saber que ♯ sube y ♭ baja.",
        },
      ],
    },
    {
      id: "n1-quiz",
      title: "Autoevaluación del módulo 1",
      durationMin: 6,
      summary: "Comprueba si te has quedado con lo esencial de la notación.",
      blocks: [
        {
          type: "p",
          text: "Seis preguntas cortas. No hay trampa: si dudas, vuelve a la lección correspondiente. Acierta al menos cuatro para dar el módulo por asentado.",
        },
        {
          type: "quiz",
          id: "quiz-n1",
          questions: [
            {
              id: "q1",
              prompt: "¿Qué cualidad del sonido distingue un violín de una flauta tocando la misma nota?",
              options: ["Altura", "Timbre", "Duración", "Intensidad"],
              answer: 1,
              explain: "Misma altura, duración e intensidad: lo que cambia es el color, el timbre.",
            },
            {
              id: "q2",
              prompt: "En clave de sol, la segunda línea (desde abajo) es…",
              options: ["Do", "Mi", "Sol", "Si"],
              answer: 2,
              explain: "La espiral de la clave de sol se enrolla sobre esa línea: es Sol.",
            },
            {
              id: "q3",
              prompt: "En un compás de 4/4, una blanca dura…",
              options: ["1 tiempo", "2 tiempos", "4 tiempos", "Medio tiempo"],
              answer: 1,
              explain: "La negra vale 1, la blanca vale 2, la redonda vale 4.",
            },
            {
              id: "q4",
              prompt: "El cifrado americano de Si es…",
              options: ["S", "H", "B", "Si"],
              answer: 2,
              explain: "A = La, B = Si. En alemán a veces se usa H, pero en cifrado americano es B.",
            },
            {
              id: "q5",
              prompt: "Un sostenido (♯) hace que la nota…",
              options: ["Baje un tono", "Suba un semitono", "Dure el doble", "Suene más fuerte"],
              answer: 1,
              explain: "♯ sube un semitono; ♭ baja un semitono.",
            },
            {
              id: "q6",
              prompt: "Los espacios del pentagrama en clave de sol, de abajo arriba, son…",
              options: ["Mi Sol Si Re", "Fa La Do Mi", "Do Re Mi Fa", "Sol Si Re Fa"],
              answer: 1,
              explain: "Espacios: Fa–La–Do–Mi. Líneas: Mi–Sol–Si–Re–Fa.",
            },
          ],
        },
      ],
    },
  ],
};
