/*
 * El tema aleatorio y su huevo de pascua. El botón no sale en la pestaña de
 * Tema hasta que alguien encuentra el truco: escribir «midudev» con el teclado
 * en cualquier parte de la web, o darle siete latidos al corazón del pie, el que
 * va junto a su firma. Una vez hecho, el desbloqueo se queda en este navegador.
 *
 * Los colores salen al azar, pero no a lo loco: se tira un tono y un modo y la
 * rampa entera —fondo, paneles, líneas, apagado y texto— se construye en OKLCH
 * con claridades fijas, así que el texto siempre se lee sobre su fondo.
 */

import { toHex } from './color';
import type { Palette } from './palettes';
import { SURFACES, type Scheme } from './theme';

const KEY = 'tuweb:aleatorio';

/** La palabra que abre el cofre y los latidos que hacen falta: sus siete letras. */
export const SECRET = 'midudev';
export const BEATS = SECRET.length;

export function isUnlocked() {
	try {
		return localStorage.getItem(KEY) === 'si';
	} catch {
		return false;
	}
}

/** Lo guarda y avisa: la pestaña de Tema enseña el botón sin recargar. */
export function unlock() {
	if (isUnlocked()) return false;
	try {
		localStorage.setItem(KEY, 'si');
	} catch {
		// Sin localStorage el desbloqueo dura la visita.
	}
	document.dispatchEvent(new CustomEvent('tuweb:aleatorio'));
	return true;
}

/*
 * Las claridades de cada pieza de la rampa. Las del texto y el apagado están
 * lejos del fondo en los dos modos: el contraste no depende del tono que salga.
 */
const RAMPA: Record<Scheme, Record<string, number>> = {
	claro: {
		'--color-bg': 0.975,
		'--color-panel': 0.945,
		'--color-line': 0.885,
		'--color-muted': 0.5,
		'--color-fg': 0.28,
	},
	oscuro: {
		'--color-bg': 0.17,
		'--color-panel': 0.205,
		'--color-line': 0.3,
		'--color-muted': 0.72,
		'--color-fg': 0.93,
	},
};

/** Un número entre dos, con el azar que se le pase (para poder probarlo). */
function entre(min: number, max: number, azar: () => number) {
	return min + (max - min) * azar();
}

/** Una plantilla recién tirada: tono, modo, fondo y acento, todo al azar. */
export function randomPalette(azar: () => number = Math.random): Palette {
	const scheme: Scheme = azar() < 0.5 ? 'claro' : 'oscuro';
	const tono = entre(0, 360, azar);
	// Los fondos llevan una gota de color; el texto, algo más para que tenga carácter.
	const tinte = entre(0.012, 0.04, azar);

	const vars: Record<string, string> = {};
	for (const [name, l] of Object.entries(RAMPA[scheme])) {
		const c = name === '--color-fg' || name === '--color-muted' ? tinte * 1.4 : tinte;
		vars[name] = toHex({ l, c, h: tono, alpha: 1 });
	}

	// El acento va a su aire: otro tono cualquiera, con color de verdad. Al
	// pintarlo se ajusta su claridad al fondo, como con cualquier otro.
	const acento = toHex({
		l: entre(0.5, 0.7, azar),
		c: entre(0.12, 0.2, azar),
		h: (tono + entre(90, 270, azar)) % 360,
		alpha: 1,
	});

	return {
		id: 'aleatorio',
		label: 'Aleatorio',
		vars,
		accent: acento,
		surface: SURFACES[Math.floor(azar() * SURFACES.length)] ?? 'aurora',
		mode: scheme,
	};
}
