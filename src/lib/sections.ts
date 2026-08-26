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
		card: 'JSON a YAML, cron en cristiano, regex, colores, tramas, tema y config.',
		intro:
			'Lo que salió de ideas ganadoras: JSON a YAML, cron en cristiano, probador de regex, colores, tramas SVG, tema y config. Cada pestaña tiene su propio enlace para compartirla.',
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
		href: '/ranking',
		title: 'Ranking',
		icon: 'trophy',
		card: 'Quién empuja esta web y las ideas que más gente pidió.',
		intro:
			'El ranking se hace solo con lo que ya hay guardado: cada idea que pasa el filtro suma, ganar la ventana suma más y acabar publicada suma todavía más. Debajo, las ideas que más gente repitió.',
	},
	{
		href: '/changelog',
		title: 'Changelog',
		icon: 'history',
		card: 'Cada versión de esta web, con la idea que la pidió.',
		intro: 'Todo lo que se ha construido, ventana a ventana.',
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
