/*
 * El tema de la web: un solo esquema, el claro naranja de src/styles/global.css.
 * Aquí no se elige entre temas; lo único que se puede afinar es el color
 * primario y el fondo, y eso vive en dos sitios: en el <html> —atributos y
 * variables CSS, para que el cambio se vea al momento— y en el localStorage de
 * quien lo eligió, para que siga ahí al volver. No sale de este navegador.
 */

import { type Color, parseColor, toHex } from './color';

export type Surface = 'aurora' | 'plano' | 'degradado' | 'trama';

export interface Theme {
	/** Hex de seis dígitos tal cual se eligió; al pintarlo se ajusta al fondo. */
	accent: string;
	surface: Surface;
}

export const SURFACES: readonly Surface[] = ['aurora', 'plano', 'degradado', 'trama'];

/*
 * Lo de fábrica: el naranja quemado y la aurora de src/styles/global.css. Quien
 * no toque nada ve la web tal cual se diseñó.
 */
export const DEFAULT_THEME: Theme = { accent: '#c2410c', surface: 'aurora' };

/** Los colores del selector rápido: la familia cálida. El primero es el de casa. */
export const PRESETS = [
	{ label: 'Naranja', hex: '#c2410c' },
	{ label: 'Calabaza', hex: '#b5560e' },
	{ label: 'Ámbar', hex: '#9a6205' },
	{ label: 'Cobre', hex: '#a75f2b' },
	{ label: 'Terracota', hex: '#a94f36' },
	{ label: 'Ladrillo', hex: '#9c3a26' },
	{ label: 'Guinda', hex: '#91303f' },
	{ label: 'Tostado', hex: '#7c4a21' },
] as const;

/*
 * La clave del acento lleva sufijo: lo guardado antes era del tema morado
 * oscuro, y sobre el papel claro no se leería. Con el nombre nuevo, quien
 * vuelve entra con el naranja de casa.
 */
const ACCENT_KEY = 'tuweb:acento';
const SURFACE_KEY = 'tuweb:fondo';

/**
 * Solo hex de seis dígitos: es lo único que guardamos, y así lo que se lee del
 * localStorage nunca acaba siendo una regla CSS cualquiera.
 */
const ACCENT_PATTERN = /^#[0-9a-f]{6}$/;

/*
 * El acento es texto, bordes y foco: tiene que leerse sobre el papel. Por eso
 * no puede pasar de esta claridad OKLCH, aunque quien lo eligió haya pedido
 * otra cosa. El tope lo marca el naranja de casa, que es 4.8:1 sobre el fondo.
 */
const MAX_LIGHTNESS = 0.57;

/** El realce es el acento llevado al extremo contrario del fondo: el tostado. */
const MARK = { amount: 70, towards: '#2b1b10' };

/** El fondo de la página, el mismo que pinta global.css. */
const PAGE_BG = '#fdf6ef';

/** El hex opaco y legible que le corresponde a un color sobre el papel. */
export function accentFor(color: Color) {
	return toHex({ l: Math.min(MAX_LIGHTNESS, color.l), c: color.c, h: color.h, alpha: 1 });
}

/** Aviso de que hubo que tocarle la claridad para que se leyera. Vacío si no. */
export function adjustNote(color: Color) {
	if (color.l > MAX_LIGHTNESS) return 'Era muy claro para el fondo: lo hemos oscurecido.';
	return '';
}

/** El tema puesto ahora mismo, para quien escuche los cambios. */
export interface ThemeEvent {
	theme: Theme;
}

export function applyTheme(theme: Theme) {
	const root = document.documentElement;

	root.dataset.fondo = theme.surface;

	const color = parseColor(theme.accent);
	if (color) {
		const hex = accentFor(color);
		root.style.setProperty('--color-accent', hex);
		root.style.setProperty(
			'--color-mark',
			`color-mix(in oklab, ${hex} ${MARK.amount}%, ${MARK.towards})`,
		);
	}

	// La barra del navegador en el móvil, del color del papel.
	document.querySelector('meta[name="theme-color"]')?.setAttribute('content', PAGE_BG);

	const detail: ThemeEvent = { theme };
	document.dispatchEvent(new CustomEvent('tuweb:tema', { detail }));
}

export function readTheme(): Theme {
	let accent = DEFAULT_THEME.accent;
	try {
		const saved = localStorage.getItem(ACCENT_KEY);
		if (saved && ACCENT_PATTERN.test(saved)) accent = saved;
	} catch {
		// Sin localStorage (modo privado o permisos): el tema dura la visita.
	}

	let surface = DEFAULT_THEME.surface;
	try {
		const saved = localStorage.getItem(SURFACE_KEY) as Surface | null;
		if (saved && SURFACES.includes(saved)) surface = saved;
	} catch {
		// Ídem: se queda el de siempre.
	}

	return { accent, surface };
}

/** Lo que es igual a lo de fábrica no se guarda: así el localStorage queda limpio. */
function write(key: string, value: string, fallback: string) {
	try {
		if (value === fallback) localStorage.removeItem(key);
		else localStorage.setItem(key, value);
	} catch {
		// Si no deja guardar, no pasa nada: el tema dura la visita.
	}
}

export function saveTheme(theme: Theme) {
	write(ACCENT_KEY, theme.accent.toLowerCase(), DEFAULT_THEME.accent);
	write(SURFACE_KEY, theme.surface, DEFAULT_THEME.surface);
}
