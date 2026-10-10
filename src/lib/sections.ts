/**
 * Las secciones de la web, cada una en su página, repartidas en apartados. Este
 * fichero es la única lista: de aquí salen el índice de la portada, la página
 * de cada apartado, la cabecera de cada sección y el pie de «más secciones». Si
 * algún día entra una sección nueva, se añade aquí con su apartado y aparece
 * sola en todos esos sitios.
 */

/** Los apartados en los que se reparten las secciones. */
export type GroupId = 'herramientas' | 'juegos' | 'curiosidades' | 'canales' | 'proceso';

export interface Group {
	id: GroupId;
	title: string;
	/** Un icono de Tabler para la fila de apartados. */
	icon: string;
	/** Una línea que dice qué hay dentro. */
	card: string;
	/** El párrafo que abre la página del apartado. */
	intro: string;
}

export const GROUPS: Group[] = [
	{
		id: 'herramientas',
		title: 'Herramientas',
		icon: 'tool',
		card: 'Lo que sirve para trabajar: convertir, probar, escribir y ordenar.',
		intro:
			'Lo que se usa para trabajar: convertir un JSON, entender un cron, probar una regex, montar un prompt, escribir código suelto, hacer un meme, montar un cómic, pintar el mural de píxeles del día, sacar la nube de palabras de un texto, dibujar una línea de tiempo, cruzar conjuntos en un diagrama de Venn, hacerte un logo y una tarjeta de visita, diseñar una animación CSS, comparar dos textos, llevarte un consejo de oficio o apuntar lo que toca hoy. Casi todo corre en tu navegador; los consejos que publicas los ve todo el mundo.',
	},
	{
		id: 'juegos',
		title: 'Juegos',
		icon: 'device-gamepad-2',
		card: 'Todo lo que se juega, junto en el mismo sitio.',
		intro:
			'El salón de la casa: todo lo que se juega, junto. La serpiente de siempre, un arcade de cuatro máquinas, el puesto de perritos, el laberinto del build, los retos de Python y el reto diario de JavaScript, algoritmos y optimización, con su clasificación, el golf de código: un algoritmo al día y gana quien use menos líneas, y un lienzo de píxeles compartido que se escribe en ASCII para bajarlo en .txt. Cada uno guarda su récord en tu navegador.',
	},
	{
		id: 'curiosidades',
		title: 'Curiosidades',
		icon: 'sparkles',
		card: 'Lo que está aquí porque sí: chistes, mascota, templo, mosaico y diseño.',
		intro:
			'Lo que no es una herramienta ni un juego y merece estar: chistes contados en voz alta, la mascota de la casa, el templo de midudev, un mosaico ASCII sin bordes que se llena de carácter en carácter, cómo está hecha esta web por dentro y el escaparate de proyectos.',
	},
	{
		id: 'canales',
		title: 'Canales',
		icon: 'messages',
		card: 'Donde se junta la gente: hablar, con nombre o sin él, y el reto de la semana.',
		intro:
			'Donde se junta la gente. Dos chats —con tu nombre de GitHub o con un número—, un mural ASCII que se pasa de mano en mano, un lienzo común de un píxel por hora, un taller para dibujar a la vez con versiones y chat, y los retos semanales: tres de la casa cada lunes, los que propone la gente, un tablón de soluciones para cada uno con la mejor coronada y las más creativas al muro de la portada, votos con insignia para el que gana y tu perfil con las insignias especiales. En los chats sale el reto de la semana, por si quieres hablar de él.',
	},
	{
		id: 'proceso',
		title: 'El proceso',
		icon: 'timeline',
		card: 'Ideas, ranking, logros y todo lo que ha pasado aquí.',
		intro:
			'Cómo se construye esto: las ideas de la ventana abierta, por dónde va la tuya, quién empuja, lo que se ha publicado y todo lo que le ha pasado a esta web.',
	},
];

export interface Section {
	/** La ruta, que es también su identidad. */
	href: string;
	title: string;
	/** Un icono de Tabler, el mismo que lleva la sección por dentro. */
	icon: string;
	/** El apartado en el que vive. */
	group: GroupId;
	/** Una línea para la tarjeta del índice. */
	card: string;
	/** El párrafo que abre la página de la sección. */
	intro: string;
}

export const SECTIONS: Section[] = [
	{
		href: '/herramientas',
		title: 'Caja de herramientas',
		icon: 'adjustments',
		group: 'herramientas',
		card: 'JSON a YAML, cron en cristiano, regex, Base64, HTML a PHP, colores, gradientes, sombras, efectos hover, transiciones, secuencias de animación, animaciones de carga, animaciones SVG, parallax, maquetador, diseño responsivo, sitios estáticos desde plantillas, análisis y paletas de imagen, superposición de capturas, patrones de fondo con textura, flechas CSS, favicon píxel a píxel, gráficos, barras, líneas con tendencia, dispersión, diagramas, infografías, currículum en PDF, ASCII art, tema y config.',
		intro:
			'Lo que salió de ideas ganadoras: JSON a YAML, cron en cristiano, probador de regex, Base64 en los dos sentidos, HTML a PHP, colores, gradientes —lineales o radiales, con su ángulo, para copiar el CSS o bajar en PNG—, sombras —box-shadow de varias capas, también por dentro, sobre un cuadro de prueba—, efectos hover —eliges un botón, un enlace, una tarjeta, una imagen, un icono o una etiqueta y qué le pasa al pasar el cursor: colores, escala, giro, subida, sombra y opacidad, para verlo en vivo y copiar el CSS—, transiciones —qué cambia al pasar el ratón: color, tamaño, giro, escala, opacidad, sombra o desenfoque; cuánto dura y con qué curva cubic-bezier, que se edita arrastrando sus puntos, vista con el ratón encima o en bucle—, secuencias CSS —pasos en fila, cada uno con su efecto, su duración, su intensidad y su curva, moviéndose al momento en una línea de tiempo, para copiar un solo @keyframes—, animaciones de carga —anillo, puntos, barras, pulso, progreso, rejilla o volteo, con sus colores, su tamaño, su duración y su curva, moviéndose al momento, para copiar el HTML y el CSS—, animaciones SVG —una figura que se mueve, gira, crece o cambia de color, con su duración y su curva, para bajar el .svg animado—, parallax —capas de formas o imágenes tuyas, cada una a su velocidad, probadas con scroll en marcos de móvil, tablet y escritorio, con el HTML, el CSS y el JS para copiar—, maquetador —cajas, textos e imágenes que se arrastran y se estiran sobre una cuadrícula, con plantillas, márgenes y colores, para bajar como .html con su CSS—, responsivo —una página de ejemplo en móvil, tablet, escritorio o el ancho que marques, con sus columnas, huecos, letra, barra lateral y menú para cada tramo y el CSS con sus media queries—, sitios estáticos —una plantilla de portada, portfolio, artículo o enlaces con tus textos, colores y letra, vista al momento en escritorio o móvil, para bajar el index.html con su estilos.css—, análisis de imagen —histograma, brillo, contraste y la paleta de la foto: dominante, viva, clara u oscura, para bajar en CSS o en PNG, sin que la imagen salga de tu navegador—, superposición —dos capturas de una web, una encima de otra, con opacidad, cortinilla o modo diferencia para ver qué cambia—, patrones de fondo —una figura en trama con sus colores y su opacidad, quieta o animada, y encima una textura de grano, papel, fibras o nubes—, flechas CSS —un fondo de flechas con su forma, dirección, tamaño y color, para copiar el CSS—, favicon —una cuadrícula de 16 × 16 que se pinta píxel a píxel, con lápiz, goma, cubo y cuentagotas, para bajar en PNG al tamaño que haga falta—, gráficos de datos —de una tabla o un CSV a SVG y PNG—, líneas —varias series con su color y su trazo, curvas o rectas, con área y línea de tendencia, para ver hacia dónde va cada una y bajarlo en SVG o PNG—, diagramas de flujo —nodos que se arrastran y se unen con flechas, guardados en tu navegador—, infografías —plantillas con cifras, textos, pasos y barras, con sus iconos, sus colores y su letra, para bajar en PNG, PDF o SVG—, currículum —plantilla clásica, lateral o compacta, tus datos y las secciones que quieras, con sus colores y su letra, visto al momento en una hoja A4 para bajar en PDF—, ASCII art —tu texto en letras grandes, en varios estilos, para copiar o bajar como .txt—, tema —claro u oscuro, con plantillas de color— y config. Cada pestaña tiene su propio enlace para compartirla.',
	},
	{
		href: '/playground',
		title: 'Playground',
		icon: 'code',
		group: 'herramientas',
		card: 'Tres editores —HTML, CSS y JS— y la vista previa al lado, en vivo, con marcos de móvil, tablet y escritorio.',
		intro:
			'Para probar una idea suelta sin abrir nada: escribe HTML, CSS y JavaScript en los tres editores y la vista previa se repinta según escribes. Con los marcos de móvil, tablet y escritorio ves cómo se adapta tu CSS. Los console.log y los errores salen en la consola de al lado. Se ejecuta en tu navegador, dentro de un marco aislado, y lo que escribes se queda ahí: no se envía nada.',
	},
	{
		href: '/prompts',
		title: 'Generador de prompts',
		icon: 'prompt',
		group: 'herramientas',
		card: 'Dices lo que quieres en una línea y sale el prompt técnico entero.',
		intro:
			'Escribe la petición como te salga —«un login que aguante intentos repetidos»— y sale un prompt de verdad: rol, contexto, lo que se espera punto por punto, restricciones y formato de respuesta. Sirve para desarrollo, debugging, refactor, testing, SQL, APIs, arquitectura, DevOps y seguridad, con el lenguaje o el framework que uses. No hay ninguna IA detrás: la plantilla se arma en tu navegador y lo que escribes se queda ahí.',
	},
	{
		href: '/memes',
		title: 'Generador de memes',
		icon: 'photo-edit',
		group: 'herramientas',
		card: 'Tu imagen o una plantilla, un texto arriba, otro abajo y a descargar.',
		intro:
			'Pon tu imagen —súbela, arrástrala o pégala con Ctrl+V— o parte de una de las plantillas de la casa, escribe el texto de arriba y el de abajo y ajusta la fuente, el cuerpo, los colores y el contorno. Cuando esté, te lo llevas en PNG o JPEG o lo copias al portapapeles. Se pinta todo en tu navegador: la imagen no se sube a ninguna parte y no se guarda nada.',
	},
	{
		href: '/comics',
		title: 'Creador de cómics',
		icon: 'bubble-text',
		group: 'herramientas',
		card: 'Una tira cómica sin dibujar: viñetas, fondos, personajes y bocadillos.',
		intro:
			'Monta una tira sin saber dibujar. Elige cuántas viñetas, y en cada una el fondo, quién sale a cada lado —dev, jefa, robot, gata o fantasma— y qué dice: hablando, pensando o a gritos. Ponle un rótulo y un título, y te la llevas en PNG o la copias al portapapeles. Se pinta en tu navegador y lo que llevas se queda en él para seguir otro día.',
	},
	{
		href: '/mural',
		title: 'Mural de píxeles',
		icon: 'grid-pattern',
		group: 'herramientas',
		card: 'Un lienzo de 32 × 32, dieciséis colores y un tema nuevo cada día.',
		intro:
			'Cada día, un tema y un lienzo de 32 × 32 para pintarlo con una paleta de dieciséis colores: lápiz, goma, cubo y cuentagotas, con deshacer y rejilla. Te lo llevas en PNG. Lo que pintas se guarda en tu navegador, un dibujo por día, y los de días anteriores quedan a mano para bajarlos.',
	},
	{
		href: '/nube',
		title: 'Nube de palabras',
		icon: 'cloud',
		group: 'herramientas',
		card: 'Pegas un texto y salen sus palabras, más grandes cuanto más se repiten.',
		intro:
			'Pega un texto y sale su nube al momento: cada palabra, más grande cuanto más se repite, sin las palabras vacías que no dicen nada. Elige la forma, los colores, la fuente y si van tumbadas o de pie, quita las que sobren y te la llevas en SVG o en PNG. Se cuenta y se pinta en tu navegador: el texto no se envía ni se guarda.',
	},
	{
		href: '/lineas',
		title: 'Líneas de tiempo',
		icon: 'timeline-event',
		group: 'herramientas',
		card: 'Eventos con fecha, título y descripción, ordenados sobre una línea.',
		intro:
			'Apunta lo que pasó y cuándo: cada evento lleva su fecha, un título y una descripción, y sale en su sitio de la línea, ordenado solo. Tumbada o de pie, a paso fijo o separada según el tiempo que pasa entre uno y otro, con los colores y la fuente que elijas. Te la llevas en SVG o en PNG. Se dibuja en tu navegador y lo que apuntas se queda en él para seguir otro día.',
	},
	{
		href: '/venn',
		title: 'Diagramas de Venn',
		icon: 'circles-relation',
		group: 'herramientas',
		card: 'Dos o tres conjuntos, lo que va en cada uno y lo que comparten.',
		intro:
			'Cruza dos o tres conjuntos y apunta lo que va en cada zona: lo que es solo de uno, lo que comparten dos y lo que tienen los tres. Ponle nombre y color a cada círculo, elige el fondo, la fuente y cuánto se rellenan, y te lo llevas en SVG o en PNG. Se dibuja en tu navegador y lo que apuntas se queda en él para seguir otro día.',
	},
	{
		href: '/logos',
		title: 'Logos y tarjetas',
		icon: 'id-badge-2',
		group: 'herramientas',
		card: 'Un logo sencillo y tu tarjeta de visita con él dentro, en SVG o PNG.',
		intro:
			'Dos cosas en una. El logo: un icono, el nombre, un lema, los colores y la fuente, con el icono suelto, lleno o con borde. La tarjeta de visita: nombre, cargo, correo, teléfono, web y dónde estás, en tres diseños y con tu logo dentro si quieres. La vista previa cambia según tocas y te lo llevas en SVG o en PNG. Se dibuja en tu navegador y lo que haces se queda en él para seguir otro día.',
	},
	{
		href: '/animaciones',
		title: 'Laboratorio de animaciones',
		icon: 'keyframes',
		group: 'herramientas',
		card: 'Un efecto, sus tiempos y la vista previa en vivo. Te llevas el CSS.',
		intro:
			'Diseña una animación CSS mirándola moverse. Elige el efecto —desvanecer, deslizar, rotar, escalar, rebotar, latir o sacudir— y afina la duración, el retraso, las repeticiones, la dirección y la función de tiempo: la caja de prueba lo repite al momento. Cuando esté, copias el CSS entero, con sus @keyframes y su animation. Corre en tu navegador y los ajustes se quedan en él.',
	},
	{
		href: '/paletas',
		title: 'Paletas y fondos',
		icon: 'color-swatch',
		group: 'herramientas',
		card: 'Una paleta a partir de un color, sus HEX y un fondo abstracto para tu pantalla.',
		intro:
			'Elige un color y una armonía —análoga, monocromática, complementaria, triádica o tetrádica— y sale la paleta de cinco, con su saturación y su brillo a mano y el HEX de cada uno a un clic. Con esos colores se pinta un fondo abstracto: ondas, burbujas, polígonos o bloques, en el tamaño de tu escritorio o de tu móvil, y te lo llevas en PNG. Se pinta en tu navegador y los ajustes se quedan en él.',
	},
	{
		href: '/comparador',
		title: 'Comparador de textos',
		icon: 'git-compare',
		group: 'herramientas',
		card: 'Dos textos enfrentados y en qué se diferencian, línea a línea.',
		intro:
			'Pega dos versiones de lo mismo —un texto, un correo, un JSON— y sale en qué se diferencian: lo que se queda, lo que se quita y lo que se pone. Compara por líneas, por palabras o por caracteres, míralos enfrentados o seguidos, y di si te dan igual las mayúsculas, los espacios o las líneas en blanco. Se compara en tu navegador: los dos textos no salen de esa pestaña.',
	},
	{
		href: '/guia-ia',
		title: 'Guía de IA y SDD',
		icon: 'robot',
		group: 'herramientas',
		card: 'Cómo trabajar con IA sin perder el foco: el ciclo, los prompts y lo que revisas tú.',
		intro:
			'Trabajar con IA sin que se te vaya de las manos. El ciclo de Spec Driven Development en cinco fases —especificar, planificar, trocear, implementar y revisar—, con el prompt de cada una listo para copiar, la plantilla de spec, unos cuantos prompts sueltos y la checklist de la revisión manual, que es la parte que no se delega. No hay ninguna IA detrás: se copia y se pega donde la uses, y lo que marcas se queda en tu navegador.',
	},
	{
		href: '/consejos',
		title: 'Consejos de desarrollo',
		icon: 'bulb',
		group: 'herramientas',
		card: 'Lo que se aprende a base de golpes: código, git, bugs, tests, rendimiento y equipo.',
		intro:
			'Consejos de oficio, de los que se aprenden a base de golpes: código, git, depuración, pruebas, rendimiento y equipo. Arriba sale uno al azar; debajo están todos, con buscador, filtro por tema y una estrella para quedarte con los que te sirvan. Y apunta el tuyo con tu cuenta de GitHub: lo lee todo el mundo. Lo que guardas se queda en tu navegador.',
	},
	{
		href: '/tareas',
		title: 'Tareas',
		icon: 'checklist',
		group: 'herramientas',
		card: 'Lo que tienes que hacer, por nivel, y cuánto le falta a cada cosa.',
		intro:
			'Apunta lo que hay que hacer con su nivel —de leve a urgente— y la hora a la que toca. Cada tarea lleva su cuenta atrás: cuánto le falta, y cuánto lleva vencida si se te pasó. Filtra por estado o por nivel, y si quieres que el navegador avise al vencer, dale a los avisos. No hay servidor: la lista se queda en tu navegador.',
	},
	{
		href: '/minijuego',
		title: 'Minijuego',
		icon: 'device-gamepad-2',
		group: 'juegos',
		card: 'La serpiente de siempre, con o sin paredes, y su ranking.',
		intro:
			'Una serpiente para hacer tiempo hasta la siguiente ventana. Flechas o WASD, espacio para pausar. En el móvil, desliza sobre el tablero. Elige si las paredes matan y a qué ritmo va. Al perder puedes firmar la marca con tu nombre: cada combinación guarda su récord y su ranking en tu navegador.',
	},
	{
		href: '/arcade',
		title: 'Mini Arcade',
		icon: 'device-gamepad',
		group: 'juegos',
		card: 'Cuatro máquinas en un salón: esquiva, memoria, trivia y reacción.',
		intro:
			'Un salón recreativo con cuatro máquinas. Esquiva lo que cae, destapa las ocho parejas, responde seis preguntas con el reloj corriendo o pulsa en cuanto se encienda el panel. Elige en el menú y vuelve cuando quieras: cada juego lleva su récord y se queda en tu navegador.',
	},
	{
		href: '/perritos',
		title: 'Hot Dog midudev',
		icon: 'sausage',
		group: 'juegos',
		card: 'El puesto de perritos: salchichas a la parrilla y clientes con prisa.',
		intro:
			'midudev atiende un puesto de perritos y la cola no espera. Pon salchichas en la parrilla, cógelas cuando estén hechas —ni crudas ni quemadas—, ponles las salsas que piden y sirve antes de que se cansen. Tres fallos y cierra el puesto. Cada día que aguantas llega más gente y con más prisa. El récord se queda en tu navegador.',
	},
	{
		href: '/escape',
		title: 'Midudev Escape',
		icon: 'run',
		group: 'juegos',
		card: 'midudev atrapado en el build: coge los commits y sal antes que los bugs.',
		intro:
			'midudev se ha quedado dentro del build y hay que sacarlo. Cada planta es un laberinto: recoge todos los commits sueltos, que son los que abren la salida, y llega a la puerta sin que te pillen los bugs, que van detrás de ti. Tres bugs encima y se acabó. Cada planta que sales llega con más bugs y con más prisa. El récord se queda en tu navegador.',
	},
	{
		href: '/python',
		title: 'Aprende Python',
		icon: 'brand-python',
		group: 'juegos',
		card: 'Cuatro niveles de retos: qué imprime, qué falta y qué línea revienta.',
		intro:
			'Un juego para aprender Python sin instalar nada. Cuatro niveles —lo básico, listas y bucles, funciones, y diccionarios y clases— con retos de tres tipos: adivinar qué imprime el código, rellenar el hueco que falta o señalar la línea que revienta. Tres vidas por nivel, racha que multiplica y una pista si te atascas, que cuesta la mitad de los puntos. Aquí no se ejecuta Python: las respuestas están escritas a mano y se comprueban en tu navegador. Lo que avanzas se queda en él.',
	},
	{
		href: '/reto-diario',
		title: 'Reto diario',
		icon: 'calendar-code',
		group: 'juegos',
		card: 'Un reto al día de JavaScript, algoritmos y optimización, contra el reloj. Racha, insignias y ranking mensual.',
		intro:
			'Cada día, un fragmento de código y una pregunta: qué sale por consola. Unos días van de las rarezas de JavaScript, otros de lógica y algoritmos —búsquedas, recursión, pilas, programación dinámica— y otros de optimización: cuántas vueltas da, cuántas llamadas ahorra la memoria, qué gana una ventana deslizante o dos punteros. Le das a empezar y corre el reloj: acertar rápido da puntos extra. Dos intentos, y el segundo vale la mitad. Acierta días seguidos para llevar la racha, suma puntos para subir de nivel, gana insignias y compara tu marca en el ranking del mes o en el de siempre con códigos. Aquí no se ejecuta nada: las respuestas están escritas a mano y lo que llevas se queda en tu navegador.',
	},
	{
		href: '/golf',
		title: 'Golf de código',
		icon: 'golf',
		group: 'juegos',
		card: 'Un algoritmo al día y gana quien lo resuelve en menos líneas, con su clasificación en vivo.',
		intro:
			'Cada día, un hoyo: un problema de algoritmos con su coste pedido —una pasada, una pila, una criba— y unas pruebas. Escribe la función en las menos líneas que puedas: se cuentan según escribes, sin vacías ni comentarios, y una línea de más de 80 caracteres cuenta por cada 80. El par es una solución limpia de la casa. Pásala en el playground, márcala y entras en la clasificación del día, que se ordena por líneas y luego por caracteres y se mueve en vivo con los códigos que te pasen. Aquí no se ejecuta nada y lo que escribes se queda en tu navegador.',
	},
	{
		href: '/pixeles-ascii',
		title: 'Píxeles ASCII',
		icon: 'pencil',
		group: 'juegos',
		card: 'Un lienzo de píxeles compartido que se escribe solo en ASCII, listo para bajar en .txt.',
		intro:
			'Dibuja a píxeles sobre un lienzo de 48 × 24 y míralo convertirse en ASCII según pintas: cada tono es un carácter, de . a @. Arrastra para pintar, cambia de tono o borra, y al lado sale el texto tal cual se descarga, en vivo. Se comparte en directo con todas las pestañas que tengas abiertas, y para sumar a más gente pasa el enlace: quien lo abre junta el dibujo con el suyo, sigue pintando y lo pasa otra vez. Te lo llevas en .txt. No hay servidor: se guarda en tu navegador y solo viaja en el enlace que tú pases.',
	},
	{
		href: '/chistes',
		title: 'Chistes',
		icon: 'mood-smile',
		group: 'curiosidades',
		card: 'Un chiste, un botón y una voz que te lo cuenta con su pausa.',
		intro:
			'Le das al botón y sale un chiste: de programadores, malos, de animales, de oficina, de colegio o de bar. El remate viene tapado; lo destapas tú o deja que te lo cuenten. Si le das a la voz, el navegador lee el planteamiento, hace la pausa y remata. Elige voz, velocidad y tono, y guarda los que te hagan gracia. No hay servidor: lee tu navegador y lo que guardas se queda en él.',
	},
	{
		href: '/diseno',
		title: 'Diseño',
		icon: 'palette',
		group: 'curiosidades',
		card: 'Cómo está hecha esta web: colores, tipos, piezas y la portada en maqueta.',
		intro:
			'El diseño de esta web, recreado pieza a pieza: los siete colores y los dos tipos que salen de global.css, y los trozos con los que está montada. Arriba, la portada en maqueta: cámbiale el montaje, las columnas y el espaciado para ver cómo quedaría. La maqueta no toca nada; cuando des con algo mejor, cópialo como idea y proponlo.',
	},
	{
		href: '/mascota',
		title: 'Mascota',
		icon: 'ghost',
		group: 'curiosidades',
		card: 'Un bicho de píxeles que vive aquí y se despierta con las ideas.',
		intro:
			'La mascota de la casa. No la manda nadie: su ánimo sale de las ideas que hay en la ventana abierta y crece con las versiones publicadas. Ponle nombre y ponle piezas —antenas, alas, una bufanda— del tono que quieras. Lo que le pongas se queda en tu navegador: cópialo y proponlo para que lo lleve para todos.',
	},
	{
		href: '/santuario',
		title: 'Santuario',
		icon: 'building-monument',
		group: 'curiosidades',
		card: 'Un templo para devs, con midudev de piedra en el centro.',
		intro:
			'Un templo para devs. En el centro, midudev tallado en píxeles sobre su peana, y en la inscripción lo que lleva esta web: versiones, gente y ventanas. Déjale una ofrenda a los pies, enciende una vela y pídele consejo. Lo que dejes se queda en tu navegador: cópialo y proponlo para que quede en la peana de todos.',
	},
	{
		href: '/mosaico',
		title: 'Mosaico ASCII',
		icon: 'layout-grid',
		group: 'curiosidades',
		card: 'Un lienzo de letras sin bordes: cada cual pone un carácter y entre todos sale el mosaico.',
		intro:
			'Un lienzo de letras que no se acaba: arrastra o usa las flechas para moverte por él, elige una casilla y pon tu carácter —cualquier letra, número o signo—. Uno por minuto, con tu firma, y no se puede deshacer: el mosaico sale de lo que va dejando cada cual. Se ve en directo en todas las pestañas que tengas abiertas, y para sumar a más gente pasa el enlace: quien lo abre junta ese mosaico con el suyo, pone su carácter y lo pasa otra vez. No hay servidor: se guarda en tu navegador y solo viaja en el enlace que tú pases.',
	},
	{
		href: '/escaparate',
		title: 'Escaparate',
		icon: 'rocket',
		group: 'curiosidades',
		card: 'Tu SaaS, tu app, ese proyecto que ya está en pie.',
		intro:
			'Lo que ya está terminado y en pie: tu SaaS, tu app, esa herramienta que usa medio mundo. Entra con GitHub y publica la ficha: la ve todo el mundo, con tu nombre. Hasta tres por persona.',
	},
	{
		href: '/chat',
		title: 'Chat',
		icon: 'message-2',
		group: 'canales',
		card: 'Un canal como los de antes. Se lee sin cuenta; para hablar, entra con GitHub.',
		intro:
			'Un canal como los de antes. Cualquiera puede leerlo; para escribir, entra con GitHub y tu nick será el tuyo. Lo que se dice lo ve todo el canal y se guarda un día. Escribe /help para los comandos.',
	},
	{
		href: '/anonimo',
		title: 'Chat anónimo',
		icon: 'eye-off',
		group: 'canales',
		card: 'El mismo canal sin nombre. Cada mensaje se borra solo a los diez minutos.',
		intro:
			'Sin nombre y sin memoria. Tu alias es un número que puedes cambiar cuando quieras y no se guarda en tu navegador. Lo que escribes lo ve quien esté aquí y el servidor lo borra solo a los diez minutos.',
	},
	{
		href: '/ascii',
		title: 'Mural ASCII',
		icon: 'typography',
		group: 'canales',
		card: 'Un lienzo de letras que se pinta entre varios, a mano o con comandos: en directo y pasándose el enlace.',
		intro:
			'Un lienzo de 64 × 28 celdas que se pinta con letras: lápiz con el carácter que elijas, píxel que oscurece la celda un tono a cada pasada —de . a @—, goma y texto para escribir encima. O desde la terminal de debajo, con comandos sencillos —linea, caja, circulo, texto— para levantar un mural en cuatro órdenes; escribe ayuda para verlos. Se ve en directo en todas las pestañas que tengas abiertas. Para pintarlo entre varios, pasa el enlace: el mural va dentro, con la firma de quien ha pasado por él, y quien lo abre sigue donde lo dejaste. Te lo llevas en .txt. No hay servidor: se guarda en tu navegador y solo viaja en el enlace que tú pases.',
	},
	{
		href: '/lienzo',
		title: 'Lienzo común',
		icon: 'grid-dots',
		group: 'canales',
		card: 'Un mural de píxeles entre todos: un píxel por persona y por hora, que pasa de mano en mano.',
		intro:
			'Un lienzo de 32 × 32 que se llena entre todos, de píxel en píxel. Eliges casilla y color de la paleta de dieciséis y lo pones; el siguiente, dentro de una hora. Cada píxel lleva tu firma y sale en la lista de los últimos. Se ve en directo en todas las pestañas que tengas abiertas, y para sumar a más gente pasa el enlace: quien lo abre junta ese lienzo con el suyo, pone su píxel y lo pasa otra vez. Te lo llevas en PNG. No hay servidor: se guarda en tu navegador y solo viaja en el enlace que tú pases.',
	},
	{
		href: '/taller',
		title: 'Taller de píxeles',
		icon: 'brush',
		group: 'canales',
		card: 'Un lienzo para dibujar entre varios a la vez, con versiones a las que volver y chat al lado.',
		intro:
			'Un lienzo de 32 × 32 para dibujar entre varios, sin turnos: lápiz, goma y cubo con la paleta de dieciséis, y deshacer. Cada trazo sale al momento en todas las pestañas que tengas abiertas. Guarda versiones con nombre y vuelve a la que quieras, y habla del dibujo en el chat de al lado. Para sumar a más gente pasa el enlace: lleva el dibujo, las últimas versiones y la charla. Te lo llevas en PNG. No hay servidor: se guarda en tu navegador y solo viaja en el enlace que tú pases.',
	},
	{
		href: '/retos',
		title: 'Retos semanales',
		icon: 'target-arrow',
		group: 'canales',
		card: 'Un problema algorítmico con su editor y su ranking, tres retos de la casa cada lunes, los que propone la gente, las soluciones más creativas al muro e insignias para el que gana.',
		intro:
			'Cada lunes, un problema algorítmico con su entrada, la misma para todo el mundo: lo resuelves en tu máquina, con el lenguaje que quieras, y pegas el número. Si aciertas a la primera en las primeras 48 horas, la insignia destacada sale en tu perfil. Tienes un editor para escribir la solución aquí mismo, con números de línea, sangría y un borrador por semana; no ejecuta nada, lo copias o lo bajas y lo corres tú. Al lado, el ranking: pega los enlaces de perfil que te pasen y la tabla os ordena por medallas, contigo dentro. Debajo, un tablero que se renueva cada lunes. Tres retos los pone la casa —del catálogo, rotando— y los demás los propone la gente con su cuenta de GitHub: título, qué cuenta como hecho, tema y nivel. Marca lo que vayas cerrando y arriba llevas la cuenta, los puntos y la racha de semanas. Reparte cinco votos entre los retos y al que va ganando hazle una insignia —nombre, icono, color y forma— que queda en tu vitrina y te llevas en SVG o PNG. En cada reto, vota las soluciones más creativas y corona la mejor: salen en el muro de la portada, y quien firma la coronada se lleva la insignia especial en su perfil. Lo que marcas, votas y entregas se queda en tu navegador, y el lunes el tablero vuelve a empezar.',
	},
	{
		href: '/perfil',
		title: 'Tu perfil',
		icon: 'user-circle',
		group: 'canales',
		card: 'Tu firma, tu racha de retos, los problemas resueltos y las insignias destacadas.',
		intro:
			'Quién eres en los retos semanales. Tu firma —o tu login de GitHub, si entras— es la que reconoce tus soluciones, y cada vez que una sale coronada como la mejor de su reto, aquí aparece su insignia especial para bajarla en SVG. Los problemas de la semana que resuelves salen con su medalla, y la destacada va junto a tu nombre. Debajo, tu racha, lo que llevas hecho y las que has coronado tú. Todo se lee de tu navegador.',
	},
	{
		href: '/ideas',
		title: 'Ideas',
		icon: 'bulb',
		group: 'proceso',
		card: 'Las ideas de esta ventana, con votación, y las que descartó la IA.',
		intro:
			'Todas las ideas de esta ventana. Vota hasta tres: las votadas suben arriba para que veas tu apuesta de un vistazo. El voto se queda en tu navegador y se borra al cerrar la ventana; quien decide sigue siendo lo que más gente repite.',
	},
	{
		href: '/destacadas',
		title: 'Ideas destacadas',
		icon: 'star',
		group: 'proceso',
		card: 'Las ideas que ganaron y se construyeron: vótalas y coméntalas.',
		intro:
			'Las mejores ideas de la comunidad no las elige nadie: son las que ganaron su ventana y acabaron publicadas, una por versión. Aquí están todas, con buscador y tres órdenes. Vota las que te gusten y di lo que te parecen: para escribir entras con GitHub, pero lo que se enseña es un alias que cambias cuando quieras. Los votos y los comentarios se guardan y los ve todo el mundo.',
	},
	{
		href: '/mi-idea',
		title: 'Tu idea',
		icon: 'route',
		group: 'proceso',
		card: 'Por dónde va cada idea que has mandado: filtro, grupo, ventana y versión.',
		intro:
			'Tu panel: qué ha sido de cada idea que has mandado. Una idea se envía, la IA la repasa al cerrar la ventana, se junta con las que piden lo mismo, gana o no, y si gana acaba publicada en una versión. Aquí sale por dónde va la de esta ventana y dónde se paró cada una de las anteriores. Hay que entrar con GitHub: son tuyas.',
	},
	{
		href: '/ranking',
		title: 'Ranking',
		icon: 'trophy',
		group: 'proceso',
		card: 'Quién empuja esta web y las ideas que más gente pidió.',
		intro:
			'El ranking se hace solo con lo que ya hay guardado: cada idea que pasa el filtro suma, ganar la ventana suma más y acabar publicada suma todavía más. Debajo, las ideas que más gente repitió.',
	},
	{
		href: '/logros',
		title: 'Logros',
		icon: 'award',
		group: 'proceso',
		card: 'Lo que se gana con cada idea aprobada e implementada.',
		intro:
			'Los logros salen solos de lo que ya está guardado: uno por mandar la primera idea, otros por las que pasan el filtro, por ganar la ventana y por acabar implementadas en una versión. No hay nada que apuntar ni ningún botón que dar. Debajo, quién lleva más y lo raro que es cada uno.',
	},
	{
		href: '/creditos',
		title: 'Créditos',
		icon: 'users',
		group: 'proceso',
		card: 'Toda la gente que ha aportado algo, y quién firma cada versión.',
		intro:
			'Esta web la escribe una IA, pero no decide nada: lo que se construye lo pide la gente. Aquí está toda, por orden de llegada y sin cortar por arriba, ganase su idea o no. Debajo, quién firma cada versión publicada.',
	},
	{
		href: '/changelog',
		title: 'Changelog',
		icon: 'history',
		group: 'proceso',
		card: 'El historial de cambios: cada versión, con la idea que la pidió.',
		intro:
			'El historial de cambios de esta web, mes a mes. Cada versión es una ventana de ideas que cerró y una IA implementó: aquí sale la idea, cuándo salió, cuánto tardó desde la anterior y el commit que la trajo. Busca por texto o enlaza una versión suelta.',
	},
	{
		href: '/historial',
		title: 'Historial',
		icon: 'timeline',
		group: 'proceso',
		card: 'Cada movimiento de la web: lo que salió bien y lo que no.',
		intro:
			'Todo lo que le ha pasado a esta web, en orden. La ventana que cerró, la idea que ganó, lo que se publicó y lo que hubo que revertir. El changelog cuenta las versiones; aquí no se esconde nada.',
	},
];

export function getSection(href: string) {
	const section = SECTIONS.find((item) => item.href === href);
	if (!section) throw new Error(`Sección desconocida: ${href}`);
	return section;
}

/** El apartado que se pide por la URL, o nada si no existe: /categoria/loquesea. */
export function findGroup(id: string | undefined) {
	return GROUPS.find((group) => group.id === id) ?? null;
}

export function getGroup(id: GroupId) {
	const group = findGroup(id);
	if (!group) throw new Error(`Apartado desconocido: ${id}`);
	return group;
}

/** Las secciones de un apartado, en el orden en que están escritas arriba. */
export function sectionsOf(id: GroupId) {
	return SECTIONS.filter((section) => section.group === id);
}

/** La página de un apartado. Las secciones cuelgan de la raíz; los apartados, de aquí. */
export function groupHref(id: GroupId) {
	return `/categoria/${id}`;
}
