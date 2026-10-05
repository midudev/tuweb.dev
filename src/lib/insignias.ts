/*
 * Los votos de los retos semanales y las insignias de quien gana. Cada semana
 * tienes unos cuantos votos para repartir entre los retos del tablero; el que
 * más suma va ganando, y a su autor le haces una insignia a tu gusto que queda
 * en tu vitrina. Como lo hecho y las soluciones, todo se queda en tu navegador.
 */
import type { Reto } from './retos';

/** Los votos que reparte cada uno por semana. */
export const VOTOS_SEMANA = 5;
/** Lo que se le puede dar a un solo reto: que no se los lleve uno todos. */
export const VOTOS_RETO = 3;
export const NOMBRE_MAX = 20;
/** Las insignias que guarda la vitrina: un año de semanas. */
const VITRINA_MAX = 52;
const WEEKS_KEPT = 8;

const VOTOS_KEY = 'tuweb:retos-votos';
const VITRINA_KEY = 'tuweb:retos-insignias';

export const ICONOS = [
	'trophy',
	'crown',
	'medal',
	'award',
	'star',
	'flame',
	'bolt',
	'rocket',
	'code',
	'bug',
	'brain',
	'heart',
] as const;

export type Forma = 'escudo' | 'cuadro' | 'rombo' | 'hexagono';

export const FORMAS: readonly { id: Forma; label: string; d: string }[] = [
	{ id: 'escudo', label: 'Escudo', d: 'M20 20H220V170L120 280L20 170Z' },
	{ id: 'cuadro', label: 'Cuadro', d: 'M20 20H220V280H20Z' },
	{ id: 'rombo', label: 'Rombo', d: 'M120 10L230 150L120 290L10 150Z' },
	{ id: 'hexagono', label: 'Hexágono', d: 'M120 10L225 70V230L120 290L15 230V70Z' },
];

/**
 * Los colores salen de global.css. En la página van con su variable, para que
 * sigan al tema; en el fichero que te llevas, con el valor del tema de día.
 */
export const COLORES: readonly { id: string; label: string; hex: string }[] = [
	{ id: 'accent', label: 'Naranja', hex: '#c2410c' },
	{ id: 'mark', label: 'Tostado', hex: '#9a3410' },
	{ id: 'building', label: 'Ámbar', hex: '#8a5a00' },
	{ id: 'ok', label: 'Verde', hex: '#2f7a3b' },
	{ id: 'heart', label: 'Granate', hex: '#b91c3c' },
];

export interface Insignia {
	week: number;
	nombre: string;
	icono: string;
	color: string;
	forma: Forma;
	/** El título del reto que ganó. */
	reto: string;
	/** A quién va: el autor del reto, o la casa. */
	para: string;
	/** «Del 5 al 11 de octubre», escrito cuando se entregó. */
	semana: string;
	at: number;
}

/** Semana → reto → votos. */
export type Votos = Record<string, Record<string, number>>;

function oneLine(text: unknown, max: number) {
	return typeof text === 'string' ? text.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function leer(key: string): unknown {
	try {
		const saved = localStorage.getItem(key);
		return saved ? (JSON.parse(saved) as unknown) : null;
	} catch {
		return null;
	}
}

function escribir(key: string, value: unknown, vacio: boolean) {
	try {
		if (vacio) localStorage.removeItem(key);
		else localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Sin almacenamiento, dura lo que dura la visita.
	}
}

// --- Votos ---

export function readVotos(): Votos {
	const parsed = leer(VOTOS_KEY);
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

	const votos: Votos = {};
	for (const [week, retos] of Object.entries(parsed as Record<string, unknown>)) {
		if (!/^-?\d+$/.test(week) || !retos || typeof retos !== 'object') continue;
		const semana: Record<string, number> = {};
		let total = 0;
		for (const [id, n] of Object.entries(retos as Record<string, unknown>)) {
			if (!Number.isInteger(n) || (n as number) < 1) continue;
			const cuantos = Math.min(VOTOS_RETO, n as number, VOTOS_SEMANA - total);
			if (cuantos < 1) break;
			semana[id.slice(0, 48)] = cuantos;
			total += cuantos;
		}
		if (total > 0) votos[week] = semana;
	}
	return votos;
}

export function saveVotos(votos: Votos, week: number) {
	const podados: Votos = {};
	for (const [key, semana] of Object.entries(votos)) {
		if (Number(key) > week - WEEKS_KEPT) podados[key] = semana;
	}
	escribir(VOTOS_KEY, podados, Object.keys(podados).length === 0);
}

export function votosDe(votos: Votos, week: number, id: string) {
	return votos[String(week)]?.[id] ?? 0;
}

export function usadosOf(votos: Votos, week: number) {
	return Object.values(votos[String(week)] ?? {}).reduce((suma, n) => suma + n, 0);
}

/** Pone o quita un voto. Devuelve el motivo cuando no se puede. */
export function votar(votos: Votos, week: number, id: string, cambio: 1 | -1): Votos | string {
	const key = String(week);
	const actual = votosDe(votos, week, id);
	if (cambio > 0 && usadosOf(votos, week) >= VOTOS_SEMANA)
		return `Ya has repartido tus ${VOTOS_SEMANA} votos. Quita alguno para moverlo.`;
	if (cambio > 0 && actual >= VOTOS_RETO) return `A un reto le caben ${VOTOS_RETO} votos como mucho.`;
	if (cambio < 0 && actual === 0) return votos;

	const semana = { ...(votos[key] ?? {}) };
	if (actual + cambio === 0) delete semana[id];
	else semana[id] = actual + cambio;

	const copia = { ...votos };
	if (Object.keys(semana).length === 0) delete copia[key];
	else copia[key] = semana;
	return copia;
}

/** Quita los votos de retos que ya no están: se los devuelve a quien votó. */
export function soloVivos(votos: Votos, week: number, ids: string[]): Votos {
	const semana = votos[String(week)];
	if (!semana) return votos;
	const vivos = Object.fromEntries(Object.entries(semana).filter(([id]) => ids.includes(id)));
	if (Object.keys(vivos).length === Object.keys(semana).length) return votos;
	const copia = { ...votos };
	if (Object.keys(vivos).length === 0) delete copia[String(week)];
	else copia[String(week)] = vivos;
	return copia;
}

/** El que más votos suma. A igualdad, el que lleva más tiempo en el tablero. */
export function ganadorOf(votos: Votos, week: number, tablero: Reto[]): Reto | null {
	let ganador: Reto | null = null;
	let mejor = 0;
	for (const reto of [...tablero].sort((a, b) => a.at - b.at)) {
		const n = votosDe(votos, week, reto.id);
		if (n > mejor) {
			mejor = n;
			ganador = reto;
		}
	}
	return ganador;
}

// --- Vitrina ---

function toInsignia(raw: unknown): Insignia | null {
	if (!raw || typeof raw !== 'object') return null;
	const item = raw as Record<string, unknown>;
	if (!Number.isInteger(item.week)) return null;
	const nombre = oneLine(item.nombre, NOMBRE_MAX);
	if (!nombre) return null;

	return {
		week: item.week as number,
		nombre,
		icono: ICONOS.find((icono) => icono === item.icono) ?? ICONOS[0],
		color: COLORES.find((color) => color.id === item.color)?.id ?? COLORES[0].id,
		forma: FORMAS.find((forma) => forma.id === item.forma)?.id ?? 'escudo',
		reto: oneLine(item.reto, 70),
		para: oneLine(item.para, 40),
		semana: oneLine(item.semana, 40),
		at: typeof item.at === 'number' && Number.isFinite(item.at) ? item.at : 0,
	};
}

export function readVitrina(): Insignia[] {
	const parsed = leer(VITRINA_KEY);
	if (!Array.isArray(parsed)) return [];
	return parsed
		.map(toInsignia)
		.filter((item): item is Insignia => item !== null)
		.slice(0, VITRINA_MAX);
}

export function saveVitrina(vitrina: Insignia[]) {
	escribir(VITRINA_KEY, vitrina, vitrina.length === 0);
}

/** Una insignia por semana: entregar otra la cambia. Las nuevas, primero. */
export function entregar(vitrina: Insignia[], draft: Partial<Insignia>): Insignia[] | string {
	const insignia = toInsignia({ ...draft, at: Date.now() });
	if (!insignia) return 'Ponle nombre a la insignia.';
	return [insignia, ...vitrina.filter((item) => item.week !== insignia.week)]
		.sort((a, b) => b.week - a.week)
		.slice(0, VITRINA_MAX);
}

export function quitarInsignia(vitrina: Insignia[], week: number) {
	return vitrina.filter((item) => item.week !== week);
}

// --- El dibujo ---

function escapar(text: string) {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function corto(text: string, max: number) {
	return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export interface Tinta {
	fondo: string;
	texto: string;
	apagado: string;
	color: string;
}

/** La tinta del fichero que te llevas: la del tema de día, con valores fijos. */
export function tintaFija(color: string): Tinta {
	const hex = COLORES.find((item) => item.id === color)?.hex ?? COLORES[0].hex;
	return { fondo: '#fdf6ef', texto: '#3b2d24', apagado: '#7a6152', color: hex };
}

/** La tinta de la página: las variables de global.css, que siguen al tema. */
export function tintaViva(color: string): Tinta {
	const id = COLORES.find((item) => item.id === color)?.id ?? COLORES[0].id;
	return {
		fondo: 'var(--color-bg)',
		texto: 'var(--color-fg)',
		apagado: 'var(--color-muted)',
		color: `var(--color-${id})`,
	};
}

/**
 * La insignia en SVG. El icono es el cuerpo de Tabler tal cual, que pinta con
 * currentColor; todo lo que escribe la gente pasa por escapar().
 */
export function insigniaSvg(insignia: Omit<Insignia, 'week' | 'at'>, icono: string, tinta: Tinta) {
	const forma = FORMAS.find((item) => item.id === insignia.forma) ?? FORMAS[0];
	const mono = "'Geist Mono Variable', ui-monospace, monospace";
	// Los colores van en style: así valen tanto los valores fijos como las variables del tema.
	const texto = (y: number, size: number, fill: string, value: string, font = mono) =>
		`<text x="120" y="${y}" text-anchor="middle" font-family="${font}" font-size="${size}" style="fill:${fill}">${escapar(value)}</text>`;

	return [
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 300" width="240" height="300">',
		`<path d="${forma.d}" stroke-width="5" stroke-linejoin="miter" style="fill:${tinta.fondo};stroke:${tinta.color}"/>`,
		`<g transform="translate(90 52) scale(2.5)" style="color:${tinta.color}">${icono}</g>`,
		texto(140, 15, tinta.color, corto(insignia.nombre.toUpperCase(), NOMBRE_MAX), "'Geist Pixel', ui-monospace, monospace"),
		texto(160, 9, tinta.texto, corto(insignia.reto, 26)),
		texto(178, 9, tinta.apagado, corto(`Para ${insignia.para}`, 26)),
		texto(196, 8, tinta.apagado, corto(insignia.semana, 28)),
		'</svg>',
	].join('');
}
