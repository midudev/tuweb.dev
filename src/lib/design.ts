/*
 * El diseño de esta web, contado una sola vez: los tokens que están escritos en
 * src/styles/global.css, los montajes que puede tener la portada y el espaciado
 * con el que se pinta. De aquí sale la página /diseno. Esto no cambia la web:
 * la maqueta es una maqueta, y lo que salga de ahí se propone como idea.
 */

export interface Token {
	/** La variable tal cual sale en global.css. */
	name: string;
	label: string;
	note: string;
}

export const TOKENS: readonly Token[] = [
	{ name: '--color-bg', label: 'Fondo', note: 'El papel cálido sobre el que va todo.' },
	{ name: '--color-fg', label: 'Texto', note: 'Lo que se lee. Nunca negro puro.' },
	{ name: '--color-muted', label: 'Apagado', note: 'Lo secundario. Pasa AA sobre el fondo.' },
	{ name: '--color-line', label: 'Línea', note: 'Todos los bordes. Un píxel, sin curvas.' },
	{ name: '--color-panel', label: 'Panel', note: 'Las cajas, medio paso por encima del fondo.' },
	{ name: '--color-accent', label: 'Acento', note: 'El naranja de casa: enlaces, iconos y botones.' },
	{ name: '--color-mark', label: 'Realce', note: 'El acento llevado al extremo del fondo.' },
];

export interface LayoutOption {
	id: string;
	label: string;
	icon: string;
	note: string;
	/** Cómo se dice en la idea que se copia. */
	idea: string;
}

/** Los tres montajes de la portada. El primero es el que está puesto. */
export const LAYOUTS: readonly LayoutOption[] = [
	{
		id: 'rail',
		label: 'Raíl',
		icon: 'layout-sidebar',
		note: 'El de ahora: el estado a la izquierda y el contenido al lado.',
		idea: 'el raíl del estado a la izquierda',
	},
	{
		id: 'cabecera',
		label: 'Cabecera',
		icon: 'layout-navbar',
		note: 'El estado cruza arriba a lo ancho y el contenido gana sitio.',
		idea: 'el estado en una cabecera de lado a lado',
	},
	{
		id: 'foco',
		label: 'Foco',
		icon: 'layout-rows',
		note: 'Sin raíl: una sola columna centrada y estrecha.',
		idea: 'sin raíl, todo en una columna centrada',
	},
];

export const COLUMNS: readonly number[] = [2, 3];

export interface DensityOption {
	id: string;
	label: string;
	note: string;
	idea: string;
}

export const DENSITIES: readonly DensityOption[] = [
	{ id: 'comoda', label: 'Cómoda', note: 'Aire entre las piezas.', idea: 'ancho' },
	{ id: 'compacta', label: 'Compacta', note: 'Cabe más sin bajar.', idea: 'apretado' },
];

export interface DesignChoice {
	layout: string;
	columns: number;
	density: string;
}

export const DEFAULT_DESIGN: DesignChoice = { layout: 'rail', columns: 3, density: 'comoda' };

export function layoutOf(id: string) {
	return LAYOUTS.find((item) => item.id === id) ?? LAYOUTS[0];
}

export function densityOf(id: string) {
	return DENSITIES.find((item) => item.id === id) ?? DENSITIES[0];
}

/** La maqueta, escrita como idea para pegarla en el formulario de la portada. */
export function ideaFor(choice: DesignChoice) {
	const layout = layoutOf(choice.layout);
	const density = densityOf(choice.density);
	return `Cambia el diseño de la portada: ${layout.idea}, la rejilla de secciones a ${choice.columns} columnas y el espaciado ${density.idea}.`;
}
