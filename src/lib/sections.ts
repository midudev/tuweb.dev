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
			'Lo que se usa para trabajar: convertir un JSON, entender un cron, probar una regex, montar un prompt, escribir código suelto o apuntar lo que toca hoy. Todo corre en tu navegador.',
	},
	{
		id: 'juegos',
		title: 'Juegos',
		icon: 'device-gamepad-2',
		card: 'Todo lo que se juega, junto en el mismo sitio.',
		intro:
			'El salón de la casa: todo lo que se juega, junto. La serpiente de siempre, un arcade de cuatro máquinas, el puesto de perritos, el laberinto del build y los retos de Python. Cada uno guarda su récord en tu navegador.',
	},
	{
		id: 'curiosidades',
		title: 'Curiosidades',
		icon: 'sparkles',
		card: 'Lo que está aquí porque sí: chistes, mascota, templo y diseño.',
		intro:
			'Lo que no es una herramienta ni un juego y merece estar: chistes contados en voz alta, la mascota de la casa, el templo de midudev, cómo está hecha esta web por dentro y el escaparate de proyectos.',
	},
	{
		id: 'canales',
		title: 'Canales',
		icon: 'messages',
		card: 'Hablar: con nombre o sin él, y sin servidor.',
		intro:
			'Los dos canales de la web. No hay servidor: lo que escribes se queda en tu navegador y se ve al momento en el resto de pestañas que tengas abiertas.',
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
		card: 'JSON a YAML, cron en cristiano, regex, Base64, HTML a PHP, colores, tramas, tema y config.',
		intro:
			'Lo que salió de ideas ganadoras: JSON a YAML, cron en cristiano, probador de regex, Base64 en los dos sentidos, HTML a PHP, colores, tramas SVG, tema —claro u oscuro, con plantillas de color— y config. Cada pestaña tiene su propio enlace para compartirla.',
	},
	{
		href: '/playground',
		title: 'Playground',
		icon: 'code',
		group: 'herramientas',
		card: 'Tres editores —HTML, CSS y JS— y la vista previa al lado, en vivo.',
		intro:
			'Para probar una idea suelta sin abrir nada: escribe HTML, CSS y JavaScript en los tres editores y la vista previa se repinta según escribes. Los console.log y los errores salen en la consola de al lado. Se ejecuta en tu navegador, dentro de un marco aislado, y lo que escribes se queda ahí: no se envía nada.',
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
		href: '/guia-ia',
		title: 'Guía de IA y SDD',
		icon: 'robot',
		group: 'herramientas',
		card: 'Cómo trabajar con IA sin perder el foco: el ciclo, los prompts y lo que revisas tú.',
		intro:
			'Trabajar con IA sin que se te vaya de las manos. El ciclo de Spec Driven Development en cinco fases —especificar, planificar, trocear, implementar y revisar—, con el prompt de cada una listo para copiar, la plantilla de spec, unos cuantos prompts sueltos y la checklist de la revisión manual, que es la parte que no se delega. No hay ninguna IA detrás: se copia y se pega donde la uses, y lo que marcas se queda en tu navegador.',
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
		href: '/escaparate',
		title: 'Escaparate',
		icon: 'rocket',
		group: 'curiosidades',
		card: 'Tu SaaS, tu app, ese proyecto que ya está en pie.',
		intro:
			'Lo que ya está terminado y en pie: tu SaaS, tu app, esa herramienta que usa medio mundo. Aquí no hay servidor: la ficha se queda en tu navegador. Cuando la tengas, cópiala y proponla como idea; así entra para todos.',
	},
	{
		href: '/chat',
		title: 'Chat',
		icon: 'message-2',
		group: 'canales',
		card: 'Un canal como los de antes, con claude dentro. Sin servidor.',
		intro:
			'Un canal como los de antes. Sin servidor: lo que escribes se queda en tu navegador y se ve al momento en el resto de pestañas que tengas abiertas. En el canal está claude, que es quien escribe el código; pregúntale lo que quieras. Escribe /help para los comandos.',
	},
	{
		href: '/anonimo',
		title: 'Chat anónimo',
		icon: 'eye-off',
		group: 'canales',
		card: 'El mismo canal sin nombre. Cada mensaje se borra solo a los diez minutos.',
		intro:
			'Sin nombre y sin memoria. Tu alias es un número que puedes cambiar cuando quieras, cada mensaje se borra solo a los diez minutos y nada se guarda: ni en un servidor, ni en tu navegador. Lo que escribes se ve al momento en el resto de pestañas que tengas abiertas.',
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
