/*
 * El tema de la web: el naranja de src/styles/global.css, de día o de noche.
 * Aquí se elige el modo —claro u oscuro— y se afinan el color primario y el
 * fondo. Todo vive en dos sitios: en el <html> —atributos y variables CSS, para
 * que el cambio se vea al momento— y en el localStorage de quien lo eligió,
 * para que siga ahí al volver. No sale de este navegador.
 */

import { type Color, parseColor, toHex } from './color';

export type Surface = 'aurora' | 'plano' | 'degradado' | 'trama';

/** Los dos modos de la web. El de casa es el claro. */
export type Mode = 'claro' | 'oscuro';

export interface Theme {
	/** Hex de seis dígitos tal cual se eligió; al pintarlo se ajusta al fondo. */
	accent: string;
	surface: Surface;
	mode: Mode;
}

export const SURFACES: readonly Surface[] = ['aurora', 'plano', 'degradado', 'trama'];
export const MODES: readonly Mode[] = ['claro', 'oscuro'];

/*
 * Lo de fábrica: el naranja quemado, la aurora y el papel claro de
 * src/styles/global.css. Quien no toque nada ve la web tal cual se diseñó.
 */
export const DEFAULT_THEME: Theme = { accent: '#c2410c', surface: 'aurora', mode: 'claro' };

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
/** La misma clave que lee public/tema.js antes de pintar. Si cambia, cambia allí. */
const MODE_KEY = 'tuweb:modo';

/**
 * Solo hex de seis dígitos: es lo único que guardamos, y así lo que se lee del
 * localStorage nunca acaba siendo una regla CSS cualquiera.
 */
const ACCENT_PATTERN = /^#[0-9a-f]{6}$/;

/*
 * El acento es texto, bordes y foco: tiene que leerse sobre el fondo que toque,
 * aunque quien lo eligió haya pedido otra cosa. Sobre el papel claro no puede
 * pasar de esta claridad OKLCH; sobre la tierra oscura no puede bajar de la
 * suya. Los topes los marcan los naranjas de casa, que quedan a 4.8:1 y 6.5:1.
 */
const LIGHTNESS: Record<Mode, { min: number; max: number }> = {
	claro: { min: 0, max: 0.57 },
	oscuro: { min: 0.7, max: 1 },
};

/** El realce es el acento llevado al extremo contrario del fondo de cada modo. */
const MARK: Record<Mode, { amount: number; towards: string }> = {
	claro: { amount: 70, towards: '#2b1b10' },
	oscuro: { amount: 70, towards: '#ffe6d3' },
};

/** El fondo de la página en cada modo, el mismo que pinta global.css. */
const PAGE_BG: Record<Mode, string> = { claro: '#fdf6ef', oscuro: '#191410' };

/** El modo que está puesto ahora mismo en la página. */
export function currentMode(): Mode {
	return document.documentElement.dataset.tema === 'oscuro' ? 'oscuro' : 'claro';
}

/** El hex opaco y legible que le corresponde a un color sobre el fondo del modo. */
export function accentFor(color: Color, mode: Mode = currentMode()) {
	const { min, max } = LIGHTNESS[mode];
	return toHex({ l: Math.min(max, Math.max(min, color.l)), c: color.c, h: color.h, alpha: 1 });
}

/** Aviso de que hubo que tocarle la claridad para que se leyera. Vacío si no. */
export function adjustNote(color: Color, mode: Mode = currentMode()) {
	const { min, max } = LIGHTNESS[mode];
	if (color.l > max) return 'Era muy claro para el fondo: lo hemos oscurecido.';
	if (color.l < min) return 'Era muy oscuro para el fondo: lo hemos aclarado.';
	return '';
}

/** El tema puesto ahora mismo, para quien escuche los cambios. */
export interface ThemeEvent {
	theme: Theme;
}

export function applyTheme(theme: Theme) {
	const root = document.documentElement;

	// El modo va antes que nada: de él dependen el acento y el realce.
	root.dataset.tema = theme.mode;
	root.dataset.fondo = theme.surface;

	const color = parseColor(theme.accent);
	if (color) {
		const hex = accentFor(color, theme.mode);
		const mark = MARK[theme.mode];
		root.style.setProperty('--color-accent', hex);
		root.style.setProperty(
			'--color-mark',
			`color-mix(in oklab, ${hex} ${mark.amount}%, ${mark.towards})`,
		);
	}

	// La barra del navegador en el móvil, del color del fondo que toque.
	document.querySelector('meta[name="theme-color"]')?.setAttribute('content', PAGE_BG[theme.mode]);

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

	let mode = DEFAULT_THEME.mode;
	try {
		const saved = localStorage.getItem(MODE_KEY) as Mode | null;
		if (saved && MODES.includes(saved)) mode = saved;
	} catch {
		// Ídem: se queda el claro.
	}

	return { accent, surface, mode };
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
	write(MODE_KEY, theme.mode, DEFAULT_THEME.mode);
}
