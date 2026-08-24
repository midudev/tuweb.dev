/*
 * El tema de la web: modo (claro, oscuro o el del sistema), color primario y
 * fondo. Vive en dos sitios: en el <html> —atributos y variables CSS, para que
 * el cambio se vea al momento— y en el localStorage de quien lo eligió, para
 * que siga ahí al volver. No sale de este navegador.
 */

import { type Color, parseColor, toHex } from './color';

/** Lo que se elige. «auto» es lo que pida el sistema en cada momento. */
export type Mode = 'auto' | 'claro' | 'oscuro';
/** Lo que acaba pintado: «auto» ya resuelto a uno de los dos. */
export type Scheme = 'claro' | 'oscuro';
export type Surface = 'aurora' | 'plano' | 'degradado' | 'trama';

export interface Theme {
	mode: Mode;
	/** Hex de seis dígitos tal cual se eligió; al pintarlo se ajusta al esquema. */
	accent: string;
	surface: Surface;
}

export const MODES: readonly Mode[] = ['auto', 'claro', 'oscuro'];
export const SURFACES: readonly Surface[] = ['aurora', 'plano', 'degradado', 'trama'];

/*
 * Lo de fábrica: el morado, el negro y la aurora de src/styles/global.css.
 * Quien no toque nada ve la web tal cual se diseñó; el modo del sistema está
 * ahí, pero hay que pedirlo.
 */
export const DEFAULT_THEME: Theme = { mode: 'oscuro', accent: '#a78bfa', surface: 'aurora' };

/** Los colores del selector rápido. El primero es el de la casa. */
export const PRESETS = [
	{ label: 'Violeta', hex: '#a78bfa' },
	{ label: 'Orquídea', hex: '#d18bfa' },
	{ label: 'Índigo', hex: '#8a9dff' },
	{ label: 'Azul', hex: '#00c2ff' },
	{ label: 'Menta', hex: '#2fd3a5' },
	{ label: 'Ámbar', hex: '#f5a524' },
	{ label: 'Rosa', hex: '#ff7ac6' },
	{ label: 'Grafito', hex: '#b6bcc4' },
] as const;

const MODE_KEY = 'tuweb:modo';
/** El de antes, cuando el tema era solo el color: lo que ya haya guardado vale. */
const ACCENT_KEY = 'tuweb:accent';
const SURFACE_KEY = 'tuweb:fondo';

/**
 * Solo hex de seis dígitos: es lo único que guardamos, y así lo que se lee del
 * localStorage nunca acaba siendo una regla CSS cualquiera.
 */
const ACCENT_PATTERN = /^#[0-9a-f]{6}$/;

/*
 * El acento es texto, bordes y foco: tiene que leerse sobre el fondo. Sobre el
 * oscuro no puede bajar de esta claridad OKLCH; sobre el claro no puede
 * pasarla, aunque quien lo eligió haya pedido otra cosa.
 */
const LIMITS: Record<Scheme, { min: number; max: number }> = {
	oscuro: { min: 0.62, max: 1 },
	claro: { min: 0, max: 0.54 },
};

/** El realce (mark) es el acento llevado al extremo contrario del fondo. */
const MARK: Record<Scheme, { amount: number; towards: string }> = {
	oscuro: { amount: 62, towards: '#ffffff' },
	claro: { amount: 70, towards: '#000000' },
};

/** El fondo de cada esquema, el mismo que pinta global.css. */
const PAGE_BG: Record<Scheme, string> = { oscuro: '#07060c', claro: '#faf9fd' };

/** El hex opaco y legible que le corresponde a un color en este esquema. */
export function accentFor(color: Color, scheme: Scheme) {
	const { min, max } = LIMITS[scheme];
	return toHex({ l: Math.min(max, Math.max(min, color.l)), c: color.c, h: color.h, alpha: 1 });
}

/** Aviso de que hubo que tocarle la claridad para que se leyera. Vacío si no. */
export function adjustNote(color: Color, scheme: Scheme) {
	if (color.l < LIMITS[scheme].min) return 'Era muy oscuro para el fondo: lo hemos aclarado.';
	if (color.l > LIMITS[scheme].max) return 'Era muy claro para el fondo: lo hemos oscurecido.';
	return '';
}

export function schemeOf(mode: Mode): Scheme {
	if (mode !== 'auto') return mode;
	return window.matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'oscuro';
}

/** El tema puesto ahora mismo, para quien escuche los cambios. */
export interface ThemeEvent {
	theme: Theme;
	scheme: Scheme;
}

export function applyTheme(theme: Theme) {
	const scheme = schemeOf(theme.mode);
	const root = document.documentElement;

	root.dataset.modo = theme.mode;
	root.dataset.tema = scheme;
	root.dataset.fondo = theme.surface;

	const color = parseColor(theme.accent);
	if (color) {
		const hex = accentFor(color, scheme);
		const { amount, towards } = MARK[scheme];
		root.style.setProperty('--color-accent', hex);
		root.style.setProperty('--color-mark', `color-mix(in oklab, ${hex} ${amount}%, ${towards})`);
	}

	// La barra del navegador en el móvil, del color del fondo que toca.
	document.querySelector('meta[name="theme-color"]')?.setAttribute('content', PAGE_BG[scheme]);

	const detail: ThemeEvent = { theme, scheme };
	document.dispatchEvent(new CustomEvent('tuweb:tema', { detail }));
}

function readOption<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
	try {
		const saved = localStorage.getItem(key) as T | null;
		return saved && allowed.includes(saved) ? saved : fallback;
	} catch {
		// Sin localStorage (modo privado o permisos): el tema dura la visita.
		return fallback;
	}
}

export function readTheme(): Theme {
	let accent = DEFAULT_THEME.accent;
	try {
		const saved = localStorage.getItem(ACCENT_KEY);
		if (saved && ACCENT_PATTERN.test(saved)) accent = saved;
	} catch {
		// Ídem: se queda el de siempre.
	}

	return {
		mode: readOption(MODE_KEY, MODES, DEFAULT_THEME.mode),
		accent,
		surface: readOption(SURFACE_KEY, SURFACES, DEFAULT_THEME.surface),
	};
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
	write(MODE_KEY, theme.mode, DEFAULT_THEME.mode);
	write(ACCENT_KEY, theme.accent.toLowerCase(), DEFAULT_THEME.accent);
	write(SURFACE_KEY, theme.surface, DEFAULT_THEME.surface);
}
