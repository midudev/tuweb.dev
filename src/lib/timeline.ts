/*
 * Las líneas de tiempo: eventos con fecha, título y descripción, ordenados y
 * dibujados sobre una línea. No hay servidor detrás: la línea vive en el
 * navegador de quien la escribe, y el dibujo es un SVG en texto que sirve igual
 * para la vista previa, para la descarga en SVG y para pintar el PNG.
 *
 * Las dos fuentes son monoespaciadas, así que el texto se corta contando
 * letras, sin medir nada: sale igual aquí que en el fichero que te llevas.
 */

import { FONTS, type Font, safeColor } from './wordcloud';

export interface TimelineEvent {
	id: string;
	/** AAAA-MM-DD, tal cual lo da un input date. Así se ordena como texto. */
	date: string;
	title: string;
	description: string;
}

export type Layout = 'horizontal' | 'vertical';
export type Spacing = 'igual' | 'tiempo';
export type DateFormat = 'dia' | 'mes' | 'ano';

export interface TimelineOptions {
	layout: Layout;
	spacing: Spacing;
	format: DateFormat;
	theme: string;
	font: string;
	/** Un color propio para la línea y las fechas; vacío es el del tema. */
	accent: string;
}

export interface Timeline {
	title: string;
	events: TimelineEvent[];
	options: TimelineOptions;
}

export const TITLE_MAX = 60;
export const EVENT_TITLE_MAX = 60;
export const DESCRIPTION_MAX = 200;
/** Una línea de tiempo, no una enciclopedia. */
export const MAX_EVENTS = 40;

const KEY = 'tuweb:linea-tiempo';

export const LAYOUTS: readonly { id: Layout; label: string; icon: string }[] = [
	{ id: 'horizontal', label: 'Tumbada', icon: 'layout-columns' },
	{ id: 'vertical', label: 'De pie', icon: 'layout-rows' },
];

export const SPACINGS: readonly { id: Spacing; label: string; icon: string }[] = [
	{ id: 'igual', label: 'Igual', icon: 'arrow-autofit-width' },
	{ id: 'tiempo', label: 'Según el tiempo', icon: 'calendar-event' },
];

export const FORMATS: readonly { id: DateFormat; label: string; icon: string }[] = [
	{ id: 'dia', label: 'Día', icon: 'calendar-event' },
	{ id: 'mes', label: 'Mes', icon: 'calendar-event' },
	{ id: 'ano', label: 'Año', icon: 'calendar-event' },
];

export interface Theme {
	id: string;
	label: string;
	bg: string;
	fg: string;
	muted: string;
	line: string;
	panel: string;
	accent: string;
}

/** Los dos primeros son los de global.css, de día y de noche. */
export const THEMES: readonly Theme[] = [
	{
		id: 'casa',
		label: 'Casa',
		bg: '#fdf6ef',
		fg: '#3b2d24',
		muted: '#7a6152',
		line: '#e8d9c8',
		panel: '#f7ece1',
		accent: '#c2410c',
	},
	{
		id: 'noche',
		label: 'Noche',
		bg: '#17110d',
		fg: '#f3e7db',
		muted: '#ad9483',
		line: '#382b21',
		panel: '#1f1813',
		accent: '#fc784b',
	},
	{
		id: 'mar',
		label: 'Mar',
		bg: '#f4f8fb',
		fg: '#0b2a40',
		muted: '#4a6477',
		line: '#d3e1ea',
		panel: '#e8f0f6',
		accent: '#1d6fa5',
	},
	{
		id: 'tinta',
		label: 'Tinta',
		bg: '#ffffff',
		fg: '#111111',
		muted: '#555555',
		line: '#dddddd',
		panel: '#f4f4f4',
		accent: '#111111',
	},
];

export function themeOf(id: string) {
	return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}

export function fontOf(id: string) {
	return FONTS.find((font) => font.id === id) ?? FONTS[0];
}

/** La pixel solo tiene un peso; la mono va gruesa en fechas y títulos. */
function boldOf(font: Font) {
	return font.id === 'mono' ? 700 : 400;
}

export const DEFAULT_OPTIONS: TimelineOptions = {
	layout: 'horizontal',
	spacing: 'igual',
	format: 'dia',
	theme: 'casa',
	font: 'mono',
	accent: '',
};

export function nextId() {
	return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function oneLine(text: string, max: number) {
	return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Una fecha de verdad en AAAA-MM-DD, o nada. El 31 de febrero no cuela. */
export function parseDate(raw: string) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
	if (!match) return null;
	const [year, month, day] = match.slice(1).map(Number);
	if (month < 1 || month > 12 || day < 1) return null;
	const days = new Date(Date.UTC(2000, month, 0)).getUTCDate();
	if (day > (month === 2 ? (isLeap(year) ? 29 : 28) : days)) return null;
	return { year, month, day };
}

function isLeap(year: number) {
	return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Un evento a partir de lo escrito en el formulario, o el motivo por el que no
 * vale. Sirve también para lo que se lee del localStorage, que podría venir
 * tocado a mano.
 */
export function toEvent(draft: Partial<Record<keyof TimelineEvent, unknown>>): TimelineEvent | string {
	const date = String(draft.date ?? '').trim();
	if (!parseDate(date)) return 'Pon una fecha.';
	const title = oneLine(String(draft.title ?? ''), EVENT_TITLE_MAX);
	if (!title) return 'Ponle un título.';
	const description = oneLine(String(draft.description ?? ''), DESCRIPTION_MAX);
	const id = typeof draft.id === 'string' && draft.id ? draft.id.slice(0, 32) : nextId();
	return { id, date, title, description };
}

/** Por fecha y, si coinciden, en el orden en que se apuntaron. */
export function sortEvents(events: TimelineEvent[]) {
	return events
		.map((event, index) => ({ event, index }))
		.sort((a, b) => a.event.date.localeCompare(b.event.date) || a.index - b.index)
		.map(({ event }) => event);
}

function pick<T extends string>(value: unknown, options: readonly { id: T }[], fallback: T): T {
	return options.some((option) => option.id === value) ? (value as T) : fallback;
}

function toOptions(raw: unknown): TimelineOptions {
	const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
	return {
		layout: pick(data.layout, LAYOUTS, DEFAULT_OPTIONS.layout),
		spacing: pick(data.spacing, SPACINGS, DEFAULT_OPTIONS.spacing),
		format: pick(data.format, FORMATS, DEFAULT_OPTIONS.format),
		theme: themeOf(String(data.theme ?? '')).id,
		font: fontOf(String(data.font ?? '')).id,
		accent: safeColor(String(data.accent ?? ''), ''),
	};
}

export function loadTimeline(): Timeline | null {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return null;
		const data = JSON.parse(raw) as Record<string, unknown>;
		const events = Array.isArray(data.events)
			? data.events
					.map((item) => toEvent(item && typeof item === 'object' ? item : {}))
					.filter((item): item is TimelineEvent => typeof item !== 'string')
					.slice(0, MAX_EVENTS)
			: [];
		return {
			title: oneLine(String(data.title ?? ''), TITLE_MAX),
			events: sortEvents(events),
			options: toOptions(data.options),
		};
	} catch {
		return null;
	}
}

export function saveTimeline(timeline: Timeline) {
	try {
		localStorage.setItem(KEY, JSON.stringify(timeline));
		return true;
	} catch {
		return false;
	}
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatDate(raw: string, format: DateFormat) {
	const date = parseDate(raw);
	if (!date) return raw;
	if (format === 'ano') return String(date.year);
	if (format === 'mes') return `${MONTHS[date.month - 1]} ${date.year}`;
	return `${date.day} ${MONTHS[date.month - 1]} ${date.year}`;
}

/** Días desde 1970, para separar los eventos según el tiempo que pasa entre ellos. */
function dayNumber(raw: string) {
	const date = parseDate(raw);
	if (!date) return 0;
	const utc = new Date(0);
	utc.setUTCFullYear(date.year, date.month - 1, date.day);
	return Math.round(utc.getTime() / 86_400_000);
}

/** El texto partido en líneas de como mucho `width` letras, y `lines` líneas. */
export function wrap(text: string, width: number, lines: number) {
	const out: string[] = [];
	let current = '';
	for (let word of text.split(' ').filter(Boolean)) {
		while (word.length > width) {
			if (current) {
				out.push(current);
				current = '';
			}
			out.push(word.slice(0, width));
			word = word.slice(width);
		}
		if (!current) current = word;
		else if (current.length + 1 + word.length <= width) current += ` ${word}`;
		else {
			out.push(current);
			current = word;
		}
	}
	if (current) out.push(current);
	if (out.length <= lines) return out;
	const cut = out.slice(0, lines);
	const last = cut[lines - 1];
	cut[lines - 1] = `${last.length >= width ? last.slice(0, width - 1) : last}…`;
	return cut;
}

function escapeXml(text: string) {
	return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/* Medidas del dibujo, en píxeles del SVG. */
const PAD = 40;
const CHAR = 0.6;
const DATE_SIZE = 13;
const TITLE_SIZE = 15;
const TEXT_SIZE = 12;
const DATE_LH = 20;
const TITLE_LH = 20;
const TEXT_LH = 17;
const INNER = 12;
const HEADER = 64;

function charsFor(width: number, size: number) {
	return Math.max(4, Math.floor((width - INNER * 2) / (size * CHAR)));
}

interface Card {
	event: TimelineEvent;
	date: string;
	title: string[];
	text: string[];
	height: number;
}

function cardOf(event: TimelineEvent, width: number, format: DateFormat, withDate: boolean): Card {
	const title = wrap(event.title, charsFor(width, TITLE_SIZE), 2);
	const text = wrap(event.description, charsFor(width, TEXT_SIZE), 5);
	const height =
		INNER * 2 + (withDate ? DATE_LH : 0) + title.length * TITLE_LH + (text.length ? 6 + text.length * TEXT_LH : 0);
	return { event, date: formatDate(event.date, format), title, text, height };
}

/**
 * Los puntos de cada evento a lo largo de la línea. Con «igual» van a paso fijo;
 * con «según el tiempo», a la distancia que les toca, pero empujados lo justo
 * para que no se pisen.
 */
function positions(events: TimelineEvent[], spacing: Spacing, gaps: number[], total: number) {
	const out: number[] = [];
	const days = events.map((event) => dayNumber(event.date));
	const span = days[days.length - 1] - days[0];
	events.forEach((_, i) => {
		const wanted = spacing === 'tiempo' && span > 0 ? ((days[i] - days[0]) / span) * total : 0;
		if (i === 0) out.push(0);
		else out.push(Math.max(spacing === 'tiempo' ? wanted : 0, out[i - 1] + gaps[i]));
	});
	return out;
}

interface Palette {
	bg: string;
	fg: string;
	muted: string;
	line: string;
	panel: string;
	accent: string;
}

function paletteFor(options: TimelineOptions): Palette {
	const theme = themeOf(options.theme);
	return { ...theme, accent: safeColor(options.accent, theme.accent) };
}

function textLines(lines: string[], x: number, y: number, lh: number, attrs: string) {
	return lines
		.map((line, i) => `<text x="${x}" y="${y + i * lh}"${attrs}>${escapeXml(line)}</text>`)
		.join('');
}

/** El cuerpo de una tarjeta: fecha si toca, título y descripción. */
function cardBody(card: Card, x: number, y: number, width: number, c: Palette, bold: number, withDate: boolean) {
	let out = `<rect x="${x}" y="${y}" width="${width}" height="${card.height}" fill="${c.panel}" stroke="${c.line}"/>`;
	out += `<rect x="${x}" y="${y}" width="${width}" height="3" fill="${c.accent}"/>`;
	let cursor = y + INNER + 14;
	if (withDate) {
		out += `<text x="${x + INNER}" y="${cursor}" font-size="${DATE_SIZE}" font-weight="${bold}" fill="${c.accent}">${escapeXml(card.date)}</text>`;
		cursor += DATE_LH;
	}
	out += textLines(card.title, x + INNER, cursor, TITLE_LH, ` font-size="${TITLE_SIZE}" font-weight="${bold}" fill="${c.fg}"`);
	cursor += card.title.length * TITLE_LH;
	if (card.text.length) {
		out += textLines(card.text, x + INNER, cursor + 4, TEXT_LH, ` font-size="${TEXT_SIZE}" fill="${c.muted}"`);
	}
	return out;
}

/** El título arriba, encogido lo justo para que quepa en el ancho que hay. */
function header(title: string, width: number, c: Palette, bold: number) {
	if (!title) return '';
	const size = Math.min(26, Math.floor((width - PAD * 2) / (title.length * CHAR)));
	return `<text x="${PAD}" y="${PAD + 24}" font-size="${size}" font-weight="${bold}" fill="${c.fg}">${escapeXml(title)}</text>`;
}

function square(x: number, y: number, c: Palette) {
	return `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" fill="${c.accent}" stroke="${c.bg}" stroke-width="2"/>`;
}

const H_CARD = 200;
const H_STEM = 32;

function drawHorizontal(timeline: Timeline, c: Palette, bold: number) {
	const { events, options } = timeline;
	const cards = events.map((event) => cardOf(event, H_CARD, options.format, true));
	// Van alternando arriba y abajo: dos seguidas pueden acercarse, dos del mismo
	// lado no pueden pisarse.
	const gaps = cards.map(() => H_CARD / 2 + 24);
	let xs = positions(events, options.spacing, gaps, Math.max(1, events.length - 1) * (H_CARD / 2 + 24) * 1.6);
	for (let i = 2; i < xs.length; i++) {
		const push = xs[i - 2] + H_CARD + 24 - xs[i];
		if (push > 0) for (let j = i; j < xs.length; j++) xs[j] += push;
	}
	const left = PAD + H_CARD / 2;
	xs = xs.map((x) => x + left);

	const top = PAD + (timeline.title ? HEADER : 0);
	const above = cards.filter((_, i) => i % 2 === 0).reduce((max, card) => Math.max(max, card.height), 0);
	const below = cards.filter((_, i) => i % 2 === 1).reduce((max, card) => Math.max(max, card.height), 0);
	const lineY = top + above + H_STEM;
	const width = Math.max(640, Math.ceil(xs[xs.length - 1] + H_CARD / 2 + PAD));
	const height = Math.ceil(lineY + H_STEM + Math.max(below, 8) + PAD);

	let body = header(timeline.title, width, c, bold);
	body += `<line x1="${PAD}" y1="${lineY}" x2="${width - PAD}" y2="${lineY}" stroke="${c.accent}" stroke-width="2"/>`;
	cards.forEach((card, i) => {
		const x = xs[i];
		const up = i % 2 === 0;
		const cardY = up ? lineY - H_STEM - card.height : lineY + H_STEM;
		const stemEnd = up ? cardY + card.height : cardY;
		body += `<line x1="${x}" y1="${lineY}" x2="${x}" y2="${stemEnd}" stroke="${c.line}" stroke-width="2"/>`;
		body += cardBody(card, x - H_CARD / 2, cardY, H_CARD, c, bold, true);
		body += square(x, lineY, c);
	});
	return { width, height, body };
}

const V_WIDTH = 760;
const V_DATE = 150;

function drawVertical(timeline: Timeline, c: Palette, bold: number) {
	const { events, options } = timeline;
	const lineX = PAD + V_DATE + 20;
	const cardX = lineX + 28;
	const cardW = V_WIDTH - PAD - cardX;
	const cards = events.map((event) => cardOf(event, cardW, options.format, false));
	const gaps = cards.map((_, i) => (i ? cards[i - 1].height + 18 : 0));
	const natural = gaps.reduce((sum, gap) => sum + gap, 0);
	const top = PAD + (timeline.title ? HEADER : 0) + 12;
	const ys = positions(events, options.spacing, gaps, natural * 1.6).map((y) => y + top);
	const last = cards.length - 1;
	const height = Math.ceil(ys[last] + cards[last].height + PAD + 12);

	let body = header(timeline.title, V_WIDTH, c, bold);
	body += `<line x1="${lineX}" y1="${top - 12}" x2="${lineX}" y2="${height - PAD}" stroke="${c.accent}" stroke-width="2"/>`;
	cards.forEach((card, i) => {
		const y = ys[i];
		const dotY = y + INNER + 10;
		body += `<text x="${lineX - 20}" y="${dotY + 5}" font-size="${DATE_SIZE}" font-weight="${bold}" fill="${c.accent}" text-anchor="end">${escapeXml(card.date)}</text>`;
		body += `<line x1="${lineX}" y1="${dotY}" x2="${cardX}" y2="${dotY}" stroke="${c.line}" stroke-width="2"/>`;
		body += cardBody(card, cardX, y, cardW, c, bold, false);
		body += square(lineX, dotY, c);
	});
	return { width: V_WIDTH, height, body };
}

/**
 * La línea de tiempo como SVG, en texto. Si llega la fuente en base64 va dentro,
 * para que se vea igual en un ordenador que no la tenga.
 */
export function timelineSvg(timeline: Timeline, embedded?: string) {
	const c = paletteFor(timeline.options);
	const font = fontOf(timeline.options.font);
	const bold = boldOf(font);
	const events = sortEvents(timeline.events);

	let drawing: { width: number; height: number; body: string };
	if (!events.length) {
		drawing = {
			width: 640,
			height: 200,
			body:
				header(timeline.title, 640, c, bold) +
				`<line x1="${PAD}" y1="140" x2="${600}" y2="140" stroke="${c.line}" stroke-width="2"/>` +
				`<text x="320" y="120" font-size="14" fill="${c.muted}" text-anchor="middle">Añade el primer evento.</text>`,
		};
	} else {
		const sorted = { ...timeline, events };
		drawing = timeline.options.layout === 'vertical' ? drawVertical(sorted, c, bold) : drawHorizontal(sorted, c, bold);
	}

	const family = font.family.split(',')[0];
	const fontFace = embedded
		? `<style>@font-face{font-family:${family};font-weight:${font.id === 'mono' ? '100 900' : '400'};src:url(data:font/woff2;base64,${embedded}) format('woff2');}</style>`
		: '';
	const { width, height, body } = drawing;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${fontFace}<rect width="100%" height="100%" fill="${c.bg}"/><g font-family="${escapeXml(font.family)}">${body}</g></svg>`;
}

export const SAMPLE: Timeline = {
	title: 'La web, a grandes rasgos',
	events: [
		{
			id: 'w1',
			date: '1991-08-06',
			title: 'La primera web',
			description: 'Tim Berners-Lee publica en el CERN la página que explica qué es la World Wide Web.',
		},
		{
			id: 'w2',
			date: '1995-12-04',
			title: 'Llega JavaScript',
			description: 'Netscape y Sun anuncian el lenguaje que acabaría corriendo en todos los navegadores.',
		},
		{
			id: 'w3',
			date: '1996-12-17',
			title: 'CSS1',
			description: 'El W3C publica la primera versión de las hojas de estilo.',
		},
		{
			id: 'w4',
			date: '2008-09-02',
			title: 'Sale Chrome',
			description: 'Google lanza su navegador y, con él, un motor de JavaScript mucho más rápido.',
		},
		{
			id: 'w5',
			date: '2009-05-27',
			title: 'Node.js',
			description: 'JavaScript sale del navegador y se pone a hacer de servidor.',
		},
		{
			id: 'w6',
			date: '2014-10-28',
			title: 'HTML5',
			description: 'El W3C da por buena la quinta versión de HTML.',
		},
	],
	options: { ...DEFAULT_OPTIONS },
};
