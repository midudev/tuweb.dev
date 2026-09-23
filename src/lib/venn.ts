/*
 * Los diagramas de Venn: dos o tres conjuntos, con sus elementos repartidos por
 * cada zona y cada cruce. No hay servidor detrás: el diagrama vive en el
 * navegador de quien lo hace, y el dibujo es un SVG en texto que sirve igual
 * para la vista previa, para la descarga en SVG y para pintar el PNG.
 *
 * Las zonas no se miden con el ratón ni con el DOM: un punto está en una zona
 * si cae dentro de sus círculos y fuera de los demás. Con eso se busca el centro
 * de cada zona y el ancho que tiene cada renglón, y el texto se corta contando
 * letras, que las dos fuentes son monoespaciadas.
 */

import { THEMES, fontOf, themeOf } from './timeline';
import { safeColor } from './wordcloud';

export type SetId = 'a' | 'b' | 'c';
export type ZoneId = 'a' | 'b' | 'c' | 'ab' | 'ac' | 'bc' | 'abc';
export type Count = 2 | 3;

export interface VennSet {
	label: string;
	color: string;
}

export interface VennOptions {
	theme: string;
	font: string;
	/** Cuánto se rellena cada círculo, en tanto por ciento. */
	fill: number;
}

export interface Venn {
	title: string;
	count: Count;
	sets: Record<SetId, VennSet>;
	items: Record<ZoneId, string[]>;
	options: VennOptions;
}

export const TITLE_MAX = 60;
export const LABEL_MAX = 24;
export const ITEM_MAX = 40;
/** Por zona. Más no se lee dentro de un círculo. */
export const MAX_ITEMS = 20;
export const FILL = { min: 5, max: 60, step: 5 };

const KEY = 'tuweb:venn';

export const SET_IDS: readonly SetId[] = ['a', 'b', 'c'];

export const COUNTS: readonly { id: string; label: string; icon: string }[] = [
	{ id: '2', label: 'Dos', icon: 'circle-number-2' },
	{ id: '3', label: 'Tres', icon: 'circle-number-3' },
];

/** Las zonas de cada diagrama, en el orden en que salen en el formulario. */
export const ZONES: Record<Count, readonly ZoneId[]> = {
	2: ['a', 'b', 'ab'],
	3: ['a', 'b', 'c', 'ab', 'ac', 'bc', 'abc'],
};

export const ALL_ZONES = ZONES[3];

const DEFAULT_COLORS: Record<SetId, string> = { a: '#c2410c', b: '#1d6fa5', c: '#15803d' };

export const DEFAULT_OPTIONS: VennOptions = { theme: 'casa', font: 'mono', fill: 25 };

export { THEMES };

function oneLine(text: string, max: number) {
	return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

export function emptyItems(): Record<ZoneId, string[]> {
	return { a: [], b: [], c: [], ab: [], ac: [], bc: [], abc: [] };
}

export function emptyVenn(): Venn {
	return {
		title: '',
		count: 3,
		sets: {
			a: { label: '', color: DEFAULT_COLORS.a },
			b: { label: '', color: DEFAULT_COLORS.b },
			c: { label: '', color: DEFAULT_COLORS.c },
		},
		items: emptyItems(),
		options: { ...DEFAULT_OPTIONS },
	};
}

/** Lo escrito en una caja, un elemento por línea, limpio y con tope. */
export function parseItems(text: string) {
	return text
		.split('\n')
		.map((line) => oneLine(line, ITEM_MAX))
		.filter(Boolean)
		.slice(0, MAX_ITEMS);
}

/** El nombre de un conjunto, o su letra si no tiene. */
export function labelOf(venn: Venn, id: SetId) {
	return venn.sets[id].label || id.toUpperCase();
}

/** Cómo se llama cada zona en el formulario: «Solo X», «X y Y», «Los tres». */
export function zoneName(venn: Venn, zone: ZoneId) {
	if (zone === 'abc') return 'Los tres';
	const names = [...zone].map((id) => labelOf(venn, id as SetId));
	if (names.length === 1) return `Solo ${names[0]}`;
	return venn.count === 3 ? `Solo ${names[0]} y ${names[1]}` : `${names[0]} y ${names[1]}`;
}

function clampFill(value: unknown) {
	const number = Math.round(Number(value));
	if (!Number.isFinite(number)) return DEFAULT_OPTIONS.fill;
	return Math.min(FILL.max, Math.max(FILL.min, number));
}

/** Lo que se lee del localStorage, que podría venir tocado a mano, pasado a limpio. */
function toVenn(raw: unknown): Venn {
	const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
	const venn = emptyVenn();
	venn.title = oneLine(String(data.title ?? ''), TITLE_MAX);
	venn.count = data.count === 2 ? 2 : 3;
	const sets = (data.sets && typeof data.sets === 'object' ? data.sets : {}) as Record<string, unknown>;
	for (const id of SET_IDS) {
		const set = (sets[id] && typeof sets[id] === 'object' ? sets[id] : {}) as Record<string, unknown>;
		venn.sets[id] = {
			label: oneLine(String(set.label ?? ''), LABEL_MAX),
			color: safeColor(String(set.color ?? ''), DEFAULT_COLORS[id]),
		};
	}
	const items = (data.items && typeof data.items === 'object' ? data.items : {}) as Record<string, unknown>;
	for (const zone of ALL_ZONES) {
		const list = items[zone];
		venn.items[zone] = Array.isArray(list) ? parseItems(list.map(String).join('\n')) : [];
	}
	const options = (data.options && typeof data.options === 'object' ? data.options : {}) as Record<string, unknown>;
	venn.options = {
		theme: themeOf(String(options.theme ?? '')).id,
		font: fontOf(String(options.font ?? '')).id,
		fill: clampFill(options.fill),
	};
	return venn;
}

export function loadVenn(): Venn | null {
	try {
		const raw = localStorage.getItem(KEY);
		return raw ? toVenn(JSON.parse(raw)) : null;
	} catch {
		return null;
	}
}

export function saveVenn(venn: Venn) {
	try {
		localStorage.setItem(KEY, JSON.stringify(venn));
		return true;
	} catch {
		return false;
	}
}

function escapeXml(text: string) {
	return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function clip(text: string, chars: number) {
	return text.length <= chars ? text : `${text.slice(0, Math.max(1, chars - 1))}…`;
}

/* Medidas del dibujo, en píxeles del SVG. */
const R = 160;
/** Distancia entre centros: algo más que el radio, para que los cruces tengan sitio. */
const D = R * 1.1;
const PAD = 40;
const HEADER = 56;
const LABEL_SIZE = 17;
const LABEL_ROOM = 36;
const TEXT_SIZE = 13;
const TEXT_LH = 17;
const CHAR = 0.6;
/** Lo que se aparta el texto del borde de los círculos. */
const MARGIN = 6;

interface Circle {
	id: SetId;
	x: number;
	y: number;
}

function circlesOf(count: Count): Circle[] {
	if (count === 2) {
		return [
			{ id: 'a', x: -D / 2, y: 0 },
			{ id: 'b', x: D / 2, y: 0 },
		];
	}
	const h = (D * Math.sqrt(3)) / 2;
	return [
		{ id: 'a', x: -D / 2, y: -h / 3 },
		{ id: 'b', x: D / 2, y: -h / 3 },
		{ id: 'c', x: 0, y: (2 * h) / 3 },
	];
}

/** Si un punto cae en la zona: dentro de sus círculos y fuera del resto, con margen. */
function inZone(zone: ZoneId, circles: Circle[], x: number, y: number) {
	return circles.every((circle) => {
		const distance = Math.hypot(x - circle.x, y - circle.y);
		return zone.includes(circle.id) ? distance < R - MARGIN : distance > R + MARGIN;
	});
}

/** El centro de la zona, sacado de una rejilla de puntos. */
function centerOf(zone: ZoneId, circles: Circle[]) {
	const xs = circles.map((c) => c.x);
	const ys = circles.map((c) => c.y);
	let sx = 0;
	let sy = 0;
	let n = 0;
	for (let x = Math.min(...xs) - R; x <= Math.max(...xs) + R; x += 4) {
		for (let y = Math.min(...ys) - R; y <= Math.max(...ys) + R; y += 4) {
			if (!inZone(zone, circles, x, y)) continue;
			sx += x;
			sy += y;
			n++;
		}
	}
	return n ? { x: sx / n, y: sy / n } : null;
}

/** El tramo de la zona a una altura, partiendo de una x que tiene que estar dentro. */
function spanAt(zone: ZoneId, circles: Circle[], x: number, y: number) {
	if (!inZone(zone, circles, x, y)) return null;
	let left = x;
	let right = x;
	while (inZone(zone, circles, left - 2, y)) left -= 2;
	while (inZone(zone, circles, right + 2, y)) right += 2;
	return { left, right };
}

interface Row {
	x: number;
	y: number;
	text: string;
}

/**
 * Los renglones de una zona, centrados en ella. Si no caben todos, se quitan
 * por abajo y el último dice cuántos faltan.
 */
function fitZone(zone: ZoneId, circles: Circle[], items: string[]): { rows: Row[]; shown: number } {
	const none = { rows: [], shown: 0 };
	if (!items.length) return none;
	const center = centerOf(zone, circles);
	if (!center) return none;
	for (let n = items.length; n >= 0; n--) {
		const shown = n === items.length ? items : [...items.slice(0, n), `+${items.length - n} más`];
		const top = center.y - ((shown.length - 1) * TEXT_LH) / 2;
		const rows: Row[] = [];
		for (let i = 0; i < shown.length; i++) {
			const y = top + i * TEXT_LH;
			const up = spanAt(zone, circles, center.x, y - TEXT_SIZE / 2);
			const down = spanAt(zone, circles, center.x, y + TEXT_SIZE / 2);
			if (!up || !down) break;
			const left = Math.max(up.left, down.left);
			const right = Math.min(up.right, down.right);
			const chars = Math.floor((right - left - 4) / (TEXT_SIZE * CHAR));
			if (chars < 3) break;
			rows.push({ x: (left + right) / 2, y: y + TEXT_SIZE * 0.35, text: clip(shown[i], chars) });
		}
		if (rows.length === shown.length) return { rows, shown: n };
	}
	return none;
}

/**
 * El diagrama como SVG, en texto. Si llega la fuente en base64 va dentro, para
 * que se vea igual en un ordenador que no la tenga.
 */
export function vennSvg(venn: Venn, embedded?: string) {
	const theme = themeOf(venn.options.theme);
	const font = fontOf(venn.options.font);
	const bold = font.id === 'mono' ? 700 : 400;
	const circles = circlesOf(venn.count);

	const minX = Math.min(...circles.map((c) => c.x)) - R;
	const maxX = Math.max(...circles.map((c) => c.x)) + R;
	const minY = Math.min(...circles.map((c) => c.y)) - R;
	const maxY = Math.max(...circles.map((c) => c.y)) + R;
	const width = Math.ceil(Math.max(560, maxX - minX + PAD * 2));
	const ox = width / 2 - (minX + maxX) / 2;
	const oy = PAD + (venn.title ? HEADER : 0) + LABEL_ROOM - minY;
	const height = Math.ceil(oy + maxY + (venn.count === 3 ? LABEL_ROOM : 0) + PAD);

	let body = '';
	if (venn.title) {
		const size = Math.min(26, Math.floor((width - PAD * 2) / (venn.title.length * CHAR)));
		body += `<text x="${width / 2}" y="${PAD + 24}" font-size="${size}" font-weight="${bold}" fill="${theme.fg}" text-anchor="middle">${escapeXml(venn.title)}</text>`;
	}

	const opacity = clampFill(venn.options.fill) / 100;
	for (const circle of circles) {
		const color = safeColor(venn.sets[circle.id].color, DEFAULT_COLORS[circle.id]);
		body += `<circle cx="${circle.x + ox}" cy="${circle.y + oy}" r="${R}" fill="${color}" fill-opacity="${opacity}" stroke="${color}" stroke-width="3"/>`;
	}

	// Los nombres van fuera: arriba los de A y B, abajo el de C.
	for (const circle of circles) {
		const below = circle.id === 'c';
		const room = below ? R * 2 : D;
		const text = clip(labelOf(venn, circle.id), Math.floor((room - 12) / (LABEL_SIZE * CHAR)));
		const y = below ? circle.y + oy + R + 26 : circle.y + oy - R - 14;
		const color = safeColor(venn.sets[circle.id].color, DEFAULT_COLORS[circle.id]);
		body += `<text x="${circle.x + ox}" y="${y}" font-size="${LABEL_SIZE}" font-weight="${bold}" fill="${color}" text-anchor="middle">${escapeXml(text)}</text>`;
	}

	for (const zone of ZONES[venn.count]) {
		for (const row of fitZone(zone, circles, venn.items[zone]).rows) {
			body += `<text x="${row.x + ox}" y="${row.y + oy}" font-size="${TEXT_SIZE}" fill="${theme.fg}" text-anchor="middle">${escapeXml(row.text)}</text>`;
		}
	}

	const family = font.family.split(',')[0];
	const fontFace = embedded
		? `<style>@font-face{font-family:${family};font-weight:${font.id === 'mono' ? '100 900' : '400'};src:url(data:font/woff2;base64,${embedded}) format('woff2');}</style>`
		: '';
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${fontFace}<rect width="100%" height="100%" fill="${theme.bg}"/><g font-family="${escapeXml(font.family)}">${body}</g></svg>`;
}

/** Cuántos elementos hay en las zonas que se ven y cuántos no caben en el dibujo. */
export function countItems(venn: Venn) {
	const circles = circlesOf(venn.count);
	let total = 0;
	let hidden = 0;
	for (const zone of ZONES[venn.count]) {
		const items = venn.items[zone];
		total += items.length;
		hidden += items.length - fitZone(zone, circles, items).shown;
	}
	return { total, hidden };
}

export const SAMPLE: Venn = {
	title: 'Quién hace qué en una web',
	count: 3,
	sets: {
		a: { label: 'Frontend', color: DEFAULT_COLORS.a },
		b: { label: 'Backend', color: DEFAULT_COLORS.b },
		c: { label: 'DevOps', color: DEFAULT_COLORS.c },
	},
	items: {
		a: ['CSS', 'Accesibilidad', 'Animaciones'],
		b: ['SQL', 'Colas', 'Caché'],
		c: ['Terraform', 'Alertas'],
		ab: ['TypeScript', 'APIs'],
		ac: ['CDN', 'Builds'],
		bc: ['Docker', 'Logs'],
		abc: ['Git', 'Tests'],
	},
	options: { ...DEFAULT_OPTIONS },
};
