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
		href: '/minijuego',
		title: 'Minijuego',
		icon: 'device-gamepad-2',
		card: 'La serpiente de siempre, para hacer tiempo hasta la siguiente ventana.',
		intro:
			'Una serpiente para hacer tiempo hasta la siguiente ventana. Flechas o WASD, espacio para pausar. En el móvil, desliza sobre el tablero.',
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
		href: '/changelog',
		title: 'Changelog',
		icon: 'history',
		card: 'Cada versión de esta web, con la idea que la pidió.',
		intro: 'Todo lo que se ha construido, ventana a ventana.',
	},
];

export function getSection(href: string) {
	const section = SECTIONS.find((item) => item.href === href);
	if (!section) throw new Error(`Sección desconocida: ${href}`);
	return section;
}
