import type { CourseModule } from "../types";

export const modulePartituras: CourseModule = {
  id: "partituras",
  number: 2,
  title: "Comprensión, lectura y escritura de partituras sencillas",
  description: "Cómo se organiza una partitura, los compases más usados y práctica de lectura.",
  lessons: [
    {
      id: "p2-anatomia",
      title: "Anatomía de una partitura",
      durationMin: 8,
      summary: "De izquierda a derecha: clave, armadura, compás, notas, barras de compás.",
      blocks: [
        {
          type: "p",
          text: "Leer una partitura es como leer un cómic: el orden es de izquierda a derecha y de arriba abajo. En una melodía sencilla el viaje es lineal. Esto es lo que te encuentras, en este orden, al empezar un pentagrama:",
        },
        {
          type: "ul",
          items: [
            "Clave (de sol, casi siempre en este curso): fija el mapa de notas.",
            "Armadura (opcional): sostenidos o bemoles que valen para toda la pieza.",
            "Indicación de compás (4/4, 3/4, 2/4…): cuántos tiempos hay en cada «caja».",
            "Notas y silencios agrupados en compases, separados por barras verticales.",
            "Barra final doble: se acabó la pieza (o la sección).",
          ],
        },
        {
          type: "staff",
          notes: [
            { pitch: "C4", duration: "quarter" },
            { pitch: "E4", duration: "quarter" },
            { pitch: "G4", duration: "quarter" },
            { pitch: "C5", duration: "quarter" },
          ],
          timeSignature: [4, 4],
          caption: "Un compás de 4/4: cuatro negras. La barra vertical (implícita al final) cierra el compás.",
        },
        {
          type: "p",
          text: "Arriba suele ir el título; a la izquierda, el compositor o arreglista; sobre el pentagrama, el tempo (Allegro, 80 BPM…) y a veces la indicación de carácter. Nada de eso cambia las notas: te dice cómo vivirlas.",
        },
        {
          type: "callout",
          tone: "tip",
          title: "Método de lectura lenta",
          text: "No intentes cantar a tempo real el primer día. Primero nombra las notas («Mi, Sol, Sol, La…»), luego marca el pulso con el pie, y solo después junta ambas cosas. Es el mismo truco que leer en voz alta un idioma nuevo.",
        },
      ],
    },
    {
      id: "p2-compases",
      title: "Compases 2/4, 3/4 y 4/4",
      durationMin: 10,
      summary: "El numerador cuenta tiempos; el denominador dice qué figura vale un tiempo.",
      blocks: [
        {
          type: "p",
          text: "La fracción al inicio no es matemáticas hostiles. El número de arriba (numerador) dice cuántos tiempos caben en cada compás. El de abajo (denominador) dice qué figura representa un tiempo: 4 = negra, 8 = corchea. En iniciación trabajamos con denominador 4, o sea, el tiempo es una negra.",
        },
        {
          type: "table",
          headers: ["Compás", "Tiempos", "Sensación habitual", "Ejemplo típico"],
          rows: [
            ["4/4", "4 negras", "Binario amplio, el pop y el rock", "Casi cualquier canción de radio"],
            ["3/4", "3 negras", "Vals: 1-2-3, 1-2-3", "Vals, muchas nanas y boleros"],
            ["2/4", "2 negras", "Marcha, paso ligero", "Pasodobles, algunas polkas"],
          ],
        },
        {
          type: "p",
          text: "Dentro de cada compás hay un acento natural en el primer tiempo. En 4/4 el esquema suele ser fuerte–débil–medio–débil. En 3/4: fuerte–débil–débil. Ese acento es lo que hace que el cuerpo sepa dónde está «el uno» aunque no mires la partitura.",
        },
        {
          type: "staff",
          notes: [
            { pitch: "G4", duration: "quarter" },
            { pitch: "G4", duration: "quarter" },
            { pitch: "G4", duration: "quarter" },
            { pitch: "G4", duration: "quarter" },
            { pitch: "E4", duration: "quarter" },
            { pitch: "E4", duration: "quarter" },
            { pitch: "E4", duration: "quarter" },
          ],
          timeSignature: [4, 4],
          caption: "Primero un compás de cuatro negras (4/4) y luego tres negras (piensa 3/4).",
        },
        {
          type: "callout",
          tone: "remember",
          title: "La suma tiene que cuadrar",
          text: "En 4/4, las figuras de un compás deben sumar 4 tiempos. Cuatro negras, dos blancas, una redonda, o una blanca + dos negras… todo vale, siempre que sume 4. Si suma 5, hay un error de escritura (o un compás distinto).",
        },
      ],
    },
    {
      id: "p2-detalles",
      title: "Puntillo, ligadura y líneas adicionales",
      durationMin: 10,
      summary: "Tres signos que aparecen en cuanto la melodía deja de ser un ejercicio de método.",
      blocks: [
        { type: "h", text: "Puntillo" },
        {
          type: "p",
          text: "Un punto a la derecha de la cabeza de la nota añade la mitad de su valor. Negra con puntillo = 1 + 0,5 = 1,5 tiempos (una negra y una corchea). Blanca con puntillo = 3 tiempos. Es muy habitual en 6/8 y en melodías con aire de vals, pero también en 4/4.",
        },
        { type: "h", text: "Ligadura de unión" },
        {
          type: "p",
          text: "Una línea curva que une dos notas de la misma altura suma sus duraciones. Sirve para alargar un sonido más allá de la barra de compás (una negra al final de un compás ligada a otra negra al inicio del siguiente = 2 tiempos seguidos). No confundir con la ligadura de expresión o fraseo, que une notas distintas y pide tocarlas ligadas, sin articular cada una.",
        },
        { type: "h", text: "Líneas adicionales" },
        {
          type: "p",
          text: "Cuando la melodía se sale del pentagrama, se dibujan rayitas cortas solo donde hace falta. El Do central (C4) en clave de sol lleva una línea adicional debajo. Un Sol agudo (G5) se sienta justo encima de la quinta línea; el La de encima ya pide línea adicional superior.",
        },
        {
          type: "staff",
          notes: [
            { pitch: "C4", duration: "quarter" },
            { pitch: "G4", duration: "quarter" },
            { pitch: "C5", duration: "quarter" },
            { pitch: "G5", duration: "quarter" },
          ],
          caption: "Do grave (línea extra), Sol, Do agudo, Sol agudo. El pentagrama se «estira» solo lo necesario.",
        },
        {
          type: "callout",
          tone: "tip",
          title: "Escribir sin miedo",
          text: "Al copiar una melodía, dibuja primero las cinco líneas, la clave y el compás. Coloca las cabezas de nota (redonditas) en su altura. Después añade plicas, barras de corchea y alteraciones. Si empiezas por los adornos, te lías.",
        },
      ],
    },
    {
      id: "p2-practica",
      title: "Práctica: identifica la nota",
      durationMin: 10,
      summary: "Lee en clave de sol: te mostramos una nota y eliges su nombre.",
      blocks: [
        {
          type: "p",
          text: "Diez notas al azar entre Do grave y Sol agudo. Cuenta desde Sol (segunda línea) o usa las series de líneas y espacios. No hay límite de tiempo: la lectura musical se cocina a fuego lento.",
        },
        {
          type: "interactive",
          kind: "note-identify",
          title: "¿Qué nota es?",
          text: "Observa el pentagrama y pulsa el nombre correcto. Puedes oírla si quieres comprobar.",
        },
      ],
    },
    {
      id: "p2-quiz",
      title: "Autoevaluación del módulo 2",
      durationMin: 6,
      summary: "Lectura, compás y signos de escritura.",
      blocks: [
        {
          type: "quiz",
          id: "quiz-p2",
          questions: [
            {
              id: "q1",
              prompt: "En un 3/4, ¿cuántos tiempos hay en cada compás?",
              options: ["2", "3", "4", "8"],
              answer: 1,
              explain: "El numerador es 3: tres tiempos. El 4 indica que cada tiempo es una negra.",
            },
            {
              id: "q2",
              prompt: "El Do central en clave de sol se escribe…",
              options: [
                "En la tercera línea",
                "En el segundo espacio",
                "En una línea adicional debajo del pentagrama",
                "Encima de la quinta línea",
              ],
              answer: 2,
              explain: "Es la clásica rayita corta bajo el pentagrama.",
            },
            {
              id: "q3",
              prompt: "Una negra con puntillo dura, en 4/4…",
              options: ["1 tiempo", "1,5 tiempos", "2 tiempos", "3 tiempos"],
              answer: 1,
              explain: "El puntillo suma la mitad: 1 + 0,5 = 1,5.",
            },
            {
              id: "q4",
              prompt: "Las barras de compás sirven para…",
              options: [
                "Cambiar de octava",
                "Separar grupos de tiempos según el compás",
                "Indicar el timbre",
                "Subir la intensidad",
              ],
              answer: 1,
              explain: "Cada «caja» entre barras es un compás.",
            },
            {
              id: "q5",
              prompt: "¿Qué combinación es correcta para un compás de 4/4?",
              options: ["Tres negras", "Una blanca y una negra", "Dos blancas", "Cinco corcheas"],
              answer: 2,
              explain: "Dos blancas = 2+2 = 4 tiempos. Las demás opciones no suman 4.",
            },
          ],
        },
      ],
    },
  ],
};
