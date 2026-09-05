/*
 * Plantillas de colores: un tema entero guardado con nombre —los colores de la
 * interfaz, el acento, el fondo y el modo—. Hay unas cuantas de casa y cada uno
 * puede guardar las suyas. Todo se queda en el navegador de quien las hizo,
 * igual que el resto del tema: no viaja a ningún sitio.
 *
 * Las variables de color van en línea sobre el <html> y mandan sobre los dos
 * temas, así que cada plantilla lleva también su modo: la que es de noche se
 * pone de noche y la que es de día, de día.
 */

import { CONFIG_VARS, type Config, isValid, varOf } from './config';
import {
	MODES,
	type Mode,
	SURFACES,
	type Scheme,
	type Surface,
	type Theme,
	resolveMode,
} from './theme';

export interface Palette {
	id: string;
	label: string;
	/** Variables de color; lo que no venga se queda con lo del repo. */
	vars: Config;
	/** Hex de seis dígitos; al pintarlo se ajusta al fondo, como siempre. */
	accent: string;
	surface: Surface;
	mode: Mode;
}

/** Una plantilla solo lleva color: los tamaños de texto no se tocan. */
export const COLOR_VARS = CONFIG_VARS.filter((item) => item.kind === 'color').map(
	(item) => item.name,
);

/**
 * Las de casa. La primera no toca nada: es la web tal cual está en el repo, de
 * día o de noche según el sistema. Las demás llevan sus cinco colores puestos y
 * están medidas: el texto pasa de 11:1 sobre su fondo y el apagado de 5:1.
 */
export const PALETTES: readonly Palette[] = [
	{
		id: 'casa',
		label: 'De casa',
		vars: {},
		accent: '#c2410c',
		surface: 'aurora',
		mode: 'sistema',
	},
	{
		id: 'papel',
		label: 'Papel',
		vars: {
			'--color-bg': '#fbf9f6',
			'--color-fg': '#33291f',
			'--color-muted': '#6f6154',
			'--color-line': '#e5ded4',
			'--color-panel': '#f4efe8',
		},
		accent: '#a94f36',
		surface: 'plano',
		mode: 'claro',
	},
	{
		id: 'cuaderno',
		label: 'Cuaderno',
		vars: {
			'--color-bg': '#fdfaf3',
			'--color-fg': '#2f2a22',
			'--color-muted': '#6b6154',
			'--color-line': '#e6ddcd',
			'--color-panel': '#f6f1e6',
		},
		accent: '#9a6205',
		surface: 'trama',
		mode: 'claro',
	},
	{
		id: 'tostado',
		label: 'Tostado',
		vars: {
			'--color-bg': '#f5ece0',
			'--color-fg': '#3a2c20',
			'--color-muted': '#75604e',
			'--color-line': '#e0d0bb',
			'--color-panel': '#efe3d3',
		},
		accent: '#7c4a21',
		surface: 'degradado',
		mode: 'claro',
	},
	{
		id: 'noche',
		label: 'Noche',
		vars: {
			'--color-bg': '#17110d',
			'--color-fg': '#f3e7db',
			'--color-muted': '#ad9483',
			'--color-line': '#382b21',
			'--color-panel': '#1f1813',
		},
		accent: '#c2410c',
		surface: 'aurora',
		mode: 'oscuro',
	},
	{
		id: 'terminal',
		label: 'Terminal',
		vars: {
			'--color-bg': '#0e0c0b',
			'--color-fg': '#e8ded2',
			'--color-muted': '#a1907f',
			'--color-line': '#272019',
			'--color-panel': '#15110f',
		},
		accent: '#b5560e',
		surface: 'plano',
		mode: 'oscuro',
	},
];

const KEY = 'tuweb:plantillas';

/** Un nombre corto cabe en el botón y se lee de un vistazo. */
export const NAME_MAX = 24;

/** Tampoco hace falta guardar cien: doce ya son muchas. */
export const OWN_MAX = 12;

/** Solo hex de seis dígitos, como en el resto del tema. */
const HEX = /^#[0-9a-f]{6}$/;

/** El id es nuestro y va en atributos, así que se queda en letras y números. */
const ID = /^[a-z0-9-]{1,40}$/;

/** Nombre de una línea: letras, números y poco más, y recortado. */
export function cleanName(name: string) {
	return name
		.replace(/[^\p{L}\p{N} .,:+_-]/gu, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, NAME_MAX);
}

/** El modo de una plantilla, ya resuelto el «sistema». */
export function schemeOf(palette: Palette): Scheme {
	return resolveMode(palette.mode);
}

/** Los cuatro colores de la muestra: fondo, panel, líneas y acento. */
export function swatches(palette: Palette) {
	const pick = (name: string) => palette.vars[name] ?? varOf(name)?.base ?? '#000000';
	return [
		{ name: '--color-bg', hex: pick('--color-bg') },
		{ name: '--color-panel', hex: pick('--color-panel') },
		{ name: '--color-line', hex: pick('--color-line') },
		{ name: '--color-accent', hex: palette.accent },
	];
}

/** Lo que se lee del localStorage se revisa entero: si algo no cuadra, fuera. */
function sanitize(raw: unknown): Palette | null {
	if (!raw || typeof raw !== 'object') return null;
	const item = raw as Record<string, unknown>;

	if (typeof item.id !== 'string' || !ID.test(item.id)) return null;
	if (typeof item.label !== 'string') return null;
	const label = cleanName(item.label);
	if (!label) return null;

	if (typeof item.accent !== 'string' || !HEX.test(item.accent.toLowerCase())) return null;
	if (typeof item.surface !== 'string' || !SURFACES.includes(item.surface as Surface)) return null;
	if (typeof item.mode !== 'string' || !MODES.includes(item.mode as Mode)) return null;

	const vars: Config = {};
	if (item.vars && typeof item.vars === 'object') {
		for (const [name, value] of Object.entries(item.vars as Record<string, unknown>)) {
			const variable = varOf(name);
			if (!variable || variable.kind !== 'color' || typeof value !== 'string') continue;
			const clean = value.trim().toLowerCase();
			if (isValid(variable, clean)) vars[name] = clean;
		}
	}

	return {
		id: item.id,
		label,
		vars,
		accent: item.accent.toLowerCase(),
		surface: item.surface as Surface,
		mode: item.mode as Mode,
	};
}

/** Las plantillas guardadas aquí, en el orden en que se guardaron. */
export function readOwn(): Palette[] {
	try {
		const saved = localStorage.getItem(KEY);
		if (!saved) return [];

		const parsed = JSON.parse(saved) as unknown;
		if (!Array.isArray(parsed)) return [];

		const list: Palette[] = [];
		for (const raw of parsed.slice(0, OWN_MAX)) {
			const palette = sanitize(raw);
			// Dos plantillas con el mismo id serían el mismo botón: se queda la primera.
			if (palette && !list.some((other) => other.id === palette.id)) list.push(palette);
		}
		return list;
	} catch {
		// Sin localStorage, o con basura dentro: solo las de casa.
		return [];
	}
}

export function saveOwn(list: readonly Palette[]) {
	try {
		if (list.length === 0) localStorage.removeItem(KEY);
		else localStorage.setItem(KEY, JSON.stringify(list.slice(0, OWN_MAX)));
	} catch {
		// Si no deja guardar, la plantilla dura la visita.
	}
}

/** Un id libre, sin chocar con los de casa ni con los ya guardados. */
function newId(list: readonly Palette[]) {
	const taken = new Set([...PALETTES, ...list].map((palette) => palette.id));
	let n = 1;
	while (taken.has(`mia-${n}`)) n += 1;
	return `mia-${n}`;
}

/** La plantilla que sale de lo que hay puesto ahora mismo. Null si no hay nombre. */
export function paletteFrom(
	name: string,
	theme: Theme,
	config: Config,
	list: readonly Palette[],
): Palette | null {
	const label = cleanName(name);
	if (!label) return null;

	const vars: Config = {};
	for (const variable of COLOR_VARS) {
		const value = config[variable];
		if (value) vars[variable] = value;
	}

	return {
		id: newId(list),
		label,
		vars,
		accent: theme.accent.toLowerCase(),
		surface: theme.surface,
		mode: theme.mode,
	};
}

/**
 * Lo que deja puesto una plantilla: su tema y sus colores. Los tamaños de texto
 * que hubiera tocados se quedan como estaban, que eso no es color.
 */
export function paletteState(palette: Palette, config: Config) {
	const next: Config = {};
	for (const [name, value] of Object.entries(config)) {
		if (!COLOR_VARS.includes(name)) next[name] = value;
	}
	Object.assign(next, palette.vars);

	const theme: Theme = { accent: palette.accent, surface: palette.surface, mode: palette.mode };
	return { theme, config: next };
}

/** Si lo que hay puesto es justo esta plantilla, para marcar el botón. */
export function isCurrent(palette: Palette, theme: Theme, config: Config) {
	if (theme.accent.toLowerCase() !== palette.accent.toLowerCase()) return false;
	if (theme.surface !== palette.surface || theme.mode !== palette.mode) return false;

	return COLOR_VARS.every((name) => (config[name] ?? '') === (palette.vars[name] ?? ''));
}
