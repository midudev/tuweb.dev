/**
 * Las secciones de la web, cada una en su página. Este fichero es la única
 * lista: de aquí salen el grid de la portada, la cabecera de cada página y el
 * pie de «otras secciones». Si algún día entra una sección nueva, se añade
 * aquí y aparece sola en los tres sitios.
 */

export interface Section {
	/** La ruta, que es también su identidad. */
	href: string;
	title: string;
	/** Un icono de Tabler, el mismo que lleva la sección por dentro. */
	icon: string;
	/** Una línea para la tarjeta de la portada. */
	card: string;
	/** El párrafo que abre la página de la sección. */
	intro: string;
}

export const SECTIONS: Section[] = [
	{
		href: '/herramientas',
		title: 'Caja de herramientas',
		icon: 'adjustments',
		card: 'JSON a YAML, cron en cristiano, regex, Base64, HTML a PHP, colores, tramas, tema y config.',
		intro:
			'Lo que salió de ideas ganadoras: JSON a YAML, cron en cristiano, probador de regex, Base64 en los dos sentidos, HTML a PHP, colores, tramas SVG, tema y config. Cada pestaña tiene su propio enlace para compartirla.',
	},
	{
		href: '/playground',
		title: 'Playground',
		icon: 'code',
		card: 'Tres editores —HTML, CSS y JS— y la vista previa al lado, en vivo.',
		intro:
			'Para probar una idea suelta sin abrir nada: escribe HTML, CSS y JavaScript en los tres editores y la vista previa se repinta según escribes. Los console.log y los errores salen en la consola de al lado. Se ejecuta en tu navegador, dentro de un marco aislado, y lo que escribes se queda ahí: no se envía nada.',
	},
	{
		href: '/prompts',
		title: 'Generador de prompts',
		icon: 'prompt',
		card: 'Dices lo que quieres en una línea y sale el prompt técnico entero.',
		intro:
			'Escribe la petición como te salga —«un login que aguante intentos repetidos»— y sale un prompt de verdad: rol, contexto, lo que se espera punto por punto, restricciones y formato de respuesta. Sirve para desarrollo, debugging, refactor, testing, SQL, APIs, arquitectura, DevOps y seguridad, con el lenguaje o el framework que uses. No hay ninguna IA detrás: la plantilla se arma en tu navegador y lo que escribes se queda ahí.',
	},
	{
		href: '/tareas',
		title: 'Tareas',
		icon: 'checklist',
		card: 'Lo que tienes que hacer, por nivel, y cuánto le falta a cada cosa.',
		intro:
			'Apunta lo que hay que hacer con su nivel —de leve a urgente— y la hora a la que toca. Cada tarea lleva su cuenta atrás: cuánto le falta, y cuánto lleva vencida si se te pasó. Filtra por estado o por nivel, y si quieres que el navegador avise al vencer, dale a los avisos. No hay servidor: la lista se queda en tu navegador.',
	},
	{
		href: '/diseno',
		title: 'Diseño',
		icon: 'palette',
		card: 'Cómo está hecha esta web: colores, tipos, piezas y la portada en maqueta.',
		intro:
			'El diseño de esta web, recreado pieza a pieza: los siete colores y los dos tipos que salen de global.css, y los trozos con los que está montada. Arriba, la portada en maqueta: cámbiale el montaje, las columnas y el espaciado para ver cómo quedaría. La maqueta no toca nada; cuando des con algo mejor, cópialo como idea y proponlo.',
	},
	{
		href: '/minijuego',
		title: 'Minijuego',
		icon: 'device-gamepad-2',
		card: 'La serpiente de siempre, con o sin paredes, y su ranking.',
		intro:
			'Una serpiente para hacer tiempo hasta la siguiente ventana. Flechas o WASD, espacio para pausar. En el móvil, desliza sobre el tablero. Elige si las paredes matan y a qué ritmo va. Al perder puedes firmar la marca con tu nombre: cada combinación guarda su récord y su ranking en tu navegador.',
	},
	{
		href: '/perritos',
		title: 'Hot Dog midudev',
		icon: 'sausage',
		card: 'El puesto de perritos: salchichas a la parrilla y clientes con prisa.',
		intro:
			'midudev atiende un puesto de perritos y la cola no espera. Pon salchichas en la parrilla, cógelas cuando estén hechas —ni crudas ni quemadas—, ponles las salsas que piden y sirve antes de que se cansen. Tres fallos y cierra el puesto. Cada día que aguantas llega más gente y con más prisa. El récord se queda en tu navegador.',
	},
	{
		href: '/escape',
		title: 'Midudev Escape',
		icon: 'run',
		card: 'midudev atrapado en el build: coge los commits y sal antes que los bugs.',
		intro:
			'midudev se ha quedado dentro del build y hay que sacarlo. Cada planta es un laberinto: recoge todos los commits sueltos, que son los que abren la salida, y llega a la puerta sin que te pillen los bugs, que van detrás de ti. Tres bugs encima y se acabó. Cada planta que sales llega con más bugs y con más prisa. El récord se queda en tu navegador.',
	},
	{
		href: '/mascota',
		title: 'Mascota',
		icon: 'ghost',
		card: 'Un bicho de píxeles que vive aquí y se despierta con las ideas.',
		intro:
			'La mascota de la casa. No la manda nadie: su ánimo sale de las ideas que hay en la ventana abierta y crece con las versiones publicadas. Ponle nombre y ponle piezas —antenas, alas, una bufanda— del tono que quieras. Lo que le pongas se queda en tu navegador: cópialo y proponlo para que lo lleve para todos.',
	},
	{
		href: '/santuario',
		title: 'Santuario',
		icon: 'building-monument',
		card: 'Un templo para devs, con midudev de piedra en el centro.',
		intro:
			'Un templo para devs. En el centro, midudev tallado en píxeles sobre su peana, y en la inscripción lo que lleva esta web: versiones, gente y ventanas. Déjale una ofrenda a los pies, enciende una vela y pídele consejo. Lo que dejes se queda en tu navegador: cópialo y proponlo para que quede en la peana de todos.',
	},
	{
		href: '/escaparate',
		title: 'Escaparate',
		icon: 'rocket',
		card: 'Tu SaaS, tu app, ese proyecto que ya está en pie.',
		intro:
			'Lo que ya está terminado y en pie: tu SaaS, tu app, esa herramienta que usa medio mundo. Aquí no hay servidor: la ficha se queda en tu navegador. Cuando la tengas, cópiala y proponla como idea; así entra para todos.',
	},
	{
		href: '/chat',
		title: 'Chat',
		icon: 'message-2',
		card: 'Un canal como los de antes, con claude dentro. Sin servidor.',
		intro:
			'Un canal como los de antes. Sin servidor: lo que escribes se queda en tu navegador y se ve al momento en el resto de pestañas que tengas abiertas. En el canal está claude, que es quien escribe el código; pregúntale lo que quieras. Escribe /help para los comandos.',
	},
	{
		href: '/anonimo',
		title: 'Chat anónimo',
		icon: 'eye-off',
		card: 'El mismo canal sin nombre. Cada mensaje se borra solo a los diez minutos.',
		intro:
			'Sin nombre y sin memoria. Tu alias es un número que puedes cambiar cuando quieras, cada mensaje se borra solo a los diez minutos y nada se guarda: ni en un servidor, ni en tu navegador. Lo que escribes se ve al momento en el resto de pestañas que tengas abiertas.',
	},
	{
		href: '/ideas',
		title: 'Ideas',
		icon: 'bulb',
		card: 'Las ideas que han entrado en esta ventana y las que descartó la IA.',
		intro: 'Todas las ideas de esta ventana.',
	},
	{
		href: '/mi-idea',
		title: 'Tu idea',
		icon: 'route',
		card: 'Por dónde va cada idea que has mandado: filtro, grupo, ventana y versión.',
		intro:
			'Tu panel: qué ha sido de cada idea que has mandado. Una idea se envía, la IA la repasa al cerrar la ventana, se junta con las que piden lo mismo, gana o no, y si gana acaba publicada en una versión. Aquí sale por dónde va la de esta ventana y dónde se paró cada una de las anteriores. Hay que entrar con GitHub: son tuyas.',
	},
	{
		href: '/ranking',
		title: 'Ranking',
		icon: 'trophy',
		card: 'Quién empuja esta web y las ideas que más gente pidió.',
		intro:
			'El ranking se hace solo con lo que ya hay guardado: cada idea que pasa el filtro suma, ganar la ventana suma más y acabar publicada suma todavía más. Debajo, las ideas que más gente repitió.',
	},
	{
		href: '/logros',
		title: 'Logros',
		icon: 'award',
		card: 'Lo que se gana con cada idea aprobada e implementada.',
		intro:
			'Los logros salen solos de lo que ya está guardado: uno por mandar la primera idea, otros por las que pasan el filtro, por ganar la ventana y por acabar implementadas en una versión. No hay nada que apuntar ni ningún botón que dar. Debajo, quién lleva más y lo raro que es cada uno.',
	},
	{
		href: '/creditos',
		title: 'Créditos',
		icon: 'users',
		card: 'Toda la gente que ha aportado algo, y quién firma cada versión.',
		intro:
			'Esta web la escribe una IA, pero no decide nada: lo que se construye lo pide la gente. Aquí está toda, por orden de llegada y sin cortar por arriba, ganase su idea o no. Debajo, quién firma cada versión publicada.',
	},
	{
		href: '/changelog',
		title: 'Changelog',
		icon: 'history',
		card: 'El historial de cambios: cada versión, con la idea que la pidió.',
		intro:
			'El historial de cambios de esta web, mes a mes. Cada versión es una ventana de ideas que cerró y una IA implementó: aquí sale la idea, cuándo salió, cuánto tardó desde la anterior y el commit que la trajo. Busca por texto o enlaza una versión suelta.',
	},
	{
		href: '/historial',
		title: 'Historial',
		icon: 'timeline',
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
