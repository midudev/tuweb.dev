/*
 * El tema de la web: el naranja de src/styles/global.css, de día sobre papel
 * claro y de noche sobre marrón muy oscuro. Aquí se afina el modo, el color
 * primario y el fondo. Todo vive en dos sitios: en el <html> —atributos y
 * variables CSS, para que el cambio se vea al momento— y en el localStorage de
 * quien lo eligió, para que siga ahí al volver. No sale de este navegador.
 */

import { type Color, parseColor, toHex } from './color';

export type Surface = 'aurora' | 'plano' | 'degradado' | 'trama';

/** Lo que se elige: los dos temas o lo que diga el sistema. */
export type Mode = 'sistema' | 'claro' | 'oscuro';

/** Lo que acaba pintado, ya resuelto el «sistema». */
export type Scheme = 'claro' | 'oscuro';

export interface Theme {
	/** Hex de seis dígitos tal cual se eligió; al pintarlo se ajusta al fondo. */
	accent: string;
	surface: Surface;
	mode: Mode;
}

export const SURFACES: readonly Surface[] = ['aurora', 'plano', 'degradado', 'trama'];

export const MODES: readonly Mode[] = ['sistema', 'claro', 'oscuro'];

/*
 * Lo de fábrica: el naranja quemado, la aurora y el modo que tenga puesto el
 * sistema. Quien no toque nada ve la web tal cual se diseñó, de día o de noche.
 */
export const DEFAULT_THEME: Theme = { accent: '#c2410c', surface: 'aurora', mode: 'sistema' };

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
/* La del modo vuelve con el nombre de siempre: la versión de un tema solo la
 * borraba al entrar, así que ahí no queda nada de antes. */
const MODE_KEY = 'tuweb:modo';

/**
 * Solo hex de seis dígitos: es lo único que guardamos, y así lo que se lee del
 * localStorage nunca acaba siendo una regla CSS cualquiera.
 */
const ACCENT_PATTERN = /^#[0-9a-f]{6}$/;

/*
 * El acento es texto, bordes y foco: tiene que leerse sobre el fondo que toque,
 * aunque quien lo eligió haya pedido otra cosa. Por eso su claridad OKLCH se
 * queda dentro de estos topes. De día el naranja de casa se queda a 4.8:1 y de
 * noche, aclarado, a 7.1:1.
 */
const LIGHTNESS: Record<Scheme, { min: number; max: number }> = {
	claro: { min: 0, max: 0.57 },
	oscuro: { min: 0.72, max: 0.95 },
};

/** El realce es el acento empujado lejos del fondo: al tostado o a la crema. */
const MARK: Record<Scheme, { amount: number; towards: string }> = {
	claro: { amount: 70, towards: '#2b1b10' },
	oscuro: { amount: 65, towards: '#ffeadb' },
};

/** El modo que está pintado ahora mismo; fuera del navegador, el claro. */
export function currentScheme(): Scheme {
	if (typeof document === 'undefined') return 'claro';
	return document.documentElement.dataset.modo === 'oscuro' ? 'oscuro' : 'claro';
}

/** El «sistema» resuelto a lo que pida este navegador. */
export function resolveMode(mode: Mode): Scheme {
	if (mode !== 'sistema') return mode;

	try {
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
	} catch {
		// Navegador sin matchMedia: la web se queda de día.
		return 'claro';
	}
}

/** El hex opaco y legible que le corresponde a un color sobre ese fondo. */
export function accentFor(color: Color, scheme: Scheme = currentScheme()) {
	const { min, max } = LIGHTNESS[scheme];
	return toHex({ l: Math.min(max, Math.max(min, color.l)), c: color.c, h: color.h, alpha: 1 });
}

/** Aviso de que hubo que tocarle la claridad para que se leyera. Vacío si no. */
export function adjustNote(color: Color, scheme: Scheme = currentScheme()) {
	const { min, max } = LIGHTNESS[scheme];
	if (color.l > max) return 'Era muy claro para el fondo: lo hemos oscurecido.';
	if (color.l < min) return 'Era muy oscuro para el fondo: lo hemos aclarado.';
	return '';
}

/** El tema puesto ahora mismo, para quien escuche los cambios. */
export interface ThemeEvent {
	theme: Theme;
	scheme: Scheme;
}

/**
 * La barra del navegador va del color del fondo que haya puesto: en el móvil se
 * pega a la web y con el modo oscuro se nota mucho. En el HTML hay una etiqueta
 * por preferencia del sistema, para el primer pintado; en cuanto se sabe el modo
 * elegido mandan las dos lo mismo y sobra el «media».
 */
function paintBrowserChrome() {
	const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim();
	if (!bg) return;

	document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
		meta.removeAttribute('media');
		meta.setAttribute('content', bg);
	});
}

export function applyTheme(theme: Theme) {
	const root = document.documentElement;
	const scheme = resolveMode(theme.mode);

	root.dataset.fondo = theme.surface;
	// El resuelto lo pinta el CSS; el elegido queda a mano para quien lo mire.
	root.dataset.modo = scheme;
	root.dataset.modoElegido = theme.mode;

	const color = parseColor(theme.accent);
	if (color) {
		const hex = accentFor(color, scheme);
		root.style.setProperty('--color-accent', hex);
		root.style.setProperty(
			'--color-mark',
			`color-mix(in oklab, ${hex} ${MARK[scheme].amount}%, ${MARK[scheme].towards})`,
		);
	}

	paintBrowserChrome();

	const detail: ThemeEvent = { theme, scheme };
	document.dispatchEvent(new CustomEvent('tuweb:tema', { detail }));
}

/**
 * Con el modo en «sistema», si el sistema cambia de día a noche la web cambia
 * con él sin recargar. El tema se relee en cada aviso: manda el localStorage.
 */
export function watchSystemMode(read: () => Theme = readTheme) {
	try {
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
			const theme = read();
			if (theme.mode === 'sistema') applyTheme(theme);
		});
	} catch {
		// Sin matchMedia no hay nada que escuchar.
	}
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
		// Ídem: manda el sistema mientras dure la visita.
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
