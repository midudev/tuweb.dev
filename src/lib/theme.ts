/*
 * El color primario de la web. Vive en dos sitios: en las variables CSS del
 * <html> (para que el cambio se vea al momento) y en el localStorage de quien
 * lo eligió (para que siga ahí al volver). No sale de este navegador.
 */

import { type Color, toHex } from './color';

const ACCENT_KEY = 'tuweb:accent';

/** Cuánto acento lleva la mezcla con blanco que da el color de realce (mark). */
const MARK_MIX = 62;

/**
 * Solo hex de seis dígitos: es lo único que guardamos, y así lo que se lee del
 * localStorage nunca acaba siendo una regla CSS cualquiera.
 */
const ACCENT_PATTERN = /^#[0-9a-f]{6}$/;

/** El de siempre, el de src/styles/global.css. */
export const DEFAULT_ACCENT = '#00c2ff';

/*
 * Sobre el fondo #0a0a0a un acento oscuro no se lee: es texto, bordes y foco.
 * Por debajo de esta claridad OKLCH lo subimos, aunque quien lo eligió haya
 * pedido otra cosa.
 */
const MIN_L = 0.62;

/** El hex opaco y legible que le corresponde a un color del selector. */
export function accentFrom(color: Color) {
	return toHex({ l: Math.max(color.l, MIN_L), c: color.c, h: color.h, alpha: 1 });
}

/** True si hubo que aclararlo para que se leyera. */
export function wasLifted(color: Color) {
	return color.l < MIN_L;
}

function markColor(hex: string) {
	return `color-mix(in oklab, ${hex} ${MARK_MIX}%, #ffffff)`;
}

export function applyAccent(hex: string) {
	const root = document.documentElement.style;
	root.setProperty('--color-accent', hex);
	root.setProperty('--color-mark', markColor(hex));
}

export function readAccent(): string | null {
	try {
		const saved = localStorage.getItem(ACCENT_KEY);
		return saved && ACCENT_PATTERN.test(saved) ? saved : null;
	} catch {
		// Sin localStorage (modo privado o permisos): el color dura la visita.
		return null;
	}
}

export function saveAccent(hex: string) {
	try {
		if (hex === DEFAULT_ACCENT) localStorage.removeItem(ACCENT_KEY);
		else localStorage.setItem(ACCENT_KEY, hex);
	} catch {
		// Ídem: si no deja guardar, no pasa nada.
	}
}
