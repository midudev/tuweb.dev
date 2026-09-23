/*
 * El diseñador de logos y tarjetas de visita. Un logo sencillo —un icono de
 * Tabler, un nombre, un lema, colores y fuente— y una tarjeta que lo lleva
 * dentro junto al nombre, el cargo y el contacto. No hay servidor detrás: el
 * diseño vive en el navegador de quien lo hace, y el dibujo es un SVG en texto
 * que sirve igual para la vista previa, para la descarga en SVG y para el PNG.
 *
 * Los iconos no se importan aquí: llegan como un mapa nombre → cuerpo SVG que
 * arma el componente en el servidor con los de la lista. Así el navegador no
 * carga el paquete entero de Tabler.
 */

import { FONTS, fontOf, safeColor } from './wordcloud';

export { FONTS };

export type Mode = 'logo' | 'tarjeta';
export type LogoLayout = 'lado' | 'arriba';
export type Frame = 'nada' | 'lleno' | 'borde';
export type CardLayout = 'clasica' | 'franja' | 'centrada';

export interface Logo {
	icon: string;
	name: string;
	tagline: string;
	font: string;
	layout: LogoLayout;
	frame: Frame;
	bg: string;
	fg: string;
	accent: string;
	/** Sin fondo, para ponerlo encima de otra cosa. */
	transparent: boolean;
}

export interface Card {
	name: string;
	role: string;
	email: string;
	phone: string;
	web: string;
	place: string;
	font: string;
	layout: CardLayout;
	bg: string;
	fg: string;
	accent: string;
	showLogo: boolean;
}

export interface Design {
	mode: Mode;
	logo: Logo;
	card: Card;
}

export type IconBodies = Record<string, string>;

/** Los iconos que se pueden poner en el logo. Todos de Tabler. */
export const ICONS = [
	'rocket', 'bolt', 'flame', 'leaf', 'heart', 'star', 'coffee', 'code',
	'terminal-2', 'brush', 'palette', 'camera', 'music', 'book', 'briefcase', 'building-store',
	'home', 'planet', 'world', 'sun', 'cloud', 'mountain', 'plant-2', 'paw',
	'diamond', 'crown', 'feather', 'anchor', 'bulb', 'compass', 'cube', 'hexagon',
	'infinity', 'key', 'puzzle', 'shield', 'sparkles', 'target', 'tool', 'flask',
	'device-gamepad-2', 'ghost', 'bike', 'pizza',
] as const;

/** Cada dato de contacto de la tarjeta lleva su icono delante. */
export const CONTACT = [
	{ id: 'email', label: 'Correo', icon: 'mail', placeholder: 'hola@tuweb.dev' },
	{ id: 'phone', label: 'Teléfono', icon: 'phone', placeholder: '+34 600 000 000' },
	{ id: 'web', label: 'Web', icon: 'world-www', placeholder: 'tuweb.dev' },
	{ id: 'place', label: 'Dónde', icon: 'map-pin', placeholder: 'Madrid' },
] as const;

export const LOGO_LAYOUTS = [
	{ id: 'lado', label: 'Al lado', icon: 'layout-columns' },
	{ id: 'arriba', label: 'Encima', icon: 'layout-rows' },
] as const;

export const FRAMES = [
	{ id: 'nada', label: 'Sin marco', icon: 'border-none' },
	{ id: 'lleno', label: 'Lleno', icon: 'square-filled' },
	{ id: 'borde', label: 'Borde', icon: 'square' },
] as const;

export const CARD_LAYOUTS = [
	{ id: 'clasica', label: 'Clásica', icon: 'id' },
	{ id: 'franja', label: 'Franja', icon: 'layout-sidebar' },
	{ id: 'centrada', label: 'Centrada', icon: 'id-badge-2' },
] as const;

export const NAME_MAX = 24;
export const TAGLINE_MAX = 40;
export const FIELD_MAX = 40;

const KEY = 'tuweb:logo';

/** Los colores de la casa, para empezar. */
const HOUSE = { bg: '#fdf6ef', fg: '#3b2d24', accent: '#c2410c' };

export const SAMPLE: Design = {
	mode: 'logo',
	logo: {
		icon: 'rocket',
		name: 'tuweb',
		tagline: 'Hecha por la gente',
		font: 'mono',
		layout: 'lado',
		frame: 'lleno',
		...HOUSE,
		transparent: false,
	},
	card: {
		name: 'Ada Lovelace',
		role: 'Programadora',
		email: 'ada@tuweb.dev',
		phone: '+34 600 000 000',
		web: 'tuweb.dev',
		place: 'Madrid',
		font: 'mono',
		layout: 'clasica',
		...HOUSE,
		showLogo: true,
	},
};

function oneLine(text: unknown, max: number) {
	return String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function pick<T extends string>(value: unknown, list: readonly { id: T }[], fallback: T): T {
	return list.find((item) => item.id === value)?.id ?? fallback;
}

function objectOf(value: unknown) {
	return (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
}

/** Lo que se lee del localStorage, o lo que se toca en el formulario, pasado a limpio. */
export function toDesign(raw: unknown): Design {
	const data = objectOf(raw);
	const logo = objectOf(data.logo);
	const card = objectOf(data.card);
	const base = SAMPLE;
	return {
		mode: data.mode === 'tarjeta' ? 'tarjeta' : 'logo',
		logo: {
			icon: (ICONS as readonly string[]).includes(String(logo.icon)) ? String(logo.icon) : base.logo.icon,
			name: oneLine(logo.name ?? base.logo.name, NAME_MAX),
			tagline: oneLine(logo.tagline ?? base.logo.tagline, TAGLINE_MAX),
			font: fontOf(String(logo.font ?? '')).id,
			layout: pick(logo.layout, LOGO_LAYOUTS, base.logo.layout),
			frame: pick(logo.frame, FRAMES, base.logo.frame),
			bg: safeColor(String(logo.bg ?? ''), base.logo.bg),
			fg: safeColor(String(logo.fg ?? ''), base.logo.fg),
			accent: safeColor(String(logo.accent ?? ''), base.logo.accent),
			transparent: logo.transparent === true,
		},
		card: {
			name: oneLine(card.name ?? base.card.name, FIELD_MAX),
			role: oneLine(card.role ?? base.card.role, FIELD_MAX),
			email: oneLine(card.email ?? base.card.email, FIELD_MAX),
			phone: oneLine(card.phone ?? base.card.phone, FIELD_MAX),
			web: oneLine(card.web ?? base.card.web, FIELD_MAX),
			place: oneLine(card.place ?? base.card.place, FIELD_MAX),
			font: fontOf(String(card.font ?? '')).id,
			layout: pick(card.layout, CARD_LAYOUTS, base.card.layout),
			bg: safeColor(String(card.bg ?? ''), base.card.bg),
			fg: safeColor(String(card.fg ?? ''), base.card.fg),
			accent: safeColor(String(card.accent ?? ''), base.card.accent),
			showLogo: card.showLogo !== false,
		},
	};
}

export function loadDesign(): Design | null {
	try {
		const raw = localStorage.getItem(KEY);
		return raw ? toDesign(JSON.parse(raw)) : null;
	} catch {
		return null;
	}
}

export function saveDesign(design: Design) {
	try {
		localStorage.setItem(KEY, JSON.stringify(design));
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

/** Las dos fuentes son monoespaciadas: el ancho sale contando letras. */
const CHAR = 0.6;

function weightOf(font: string) {
	return font === 'mono' ? 700 : 400;
}

function familyOf(font: string) {
	return escapeXml(fontOf(font).family);
}

/** El tamaño de letra más grande, hasta un tope, con el que el texto cabe en ese ancho. */
function fitSize(text: string, max: number, room: number) {
	if (!text) return max;
	return Math.max(10, Math.min(max, Math.floor(room / (text.length * CHAR))));
}

function iconAt(bodies: IconBodies, name: string, x: number, y: number, size: number, color: string) {
	const body = bodies[name];
	if (!body) return '';
	return `<g transform="translate(${x} ${y}) scale(${size / 24})" color="${color}">${body}</g>`;
}

/* Medidas del logo, en píxeles del SVG. */
const ICON = 96;
const GAP = 24;
const NAME_SIZE = 48;
const TAG_SIZE = 16;
const PAD = 40;

interface Mark {
	body: string;
	width: number;
	height: number;
}

/**
 * El logo sin fondo, con su esquina de arriba a la izquierda en 0,0. Los colores
 * se pueden cambiar: en la franja de la tarjeta va sobre el color de acento.
 */
function logoMark(logo: Logo, bodies: IconBodies, colors = { bg: logo.bg, fg: logo.fg, accent: logo.accent }): Mark {
	const bold = weightOf(logo.font);
	const nameW = logo.name.length * NAME_SIZE * CHAR;
	const tagW = logo.tagline.length * TAG_SIZE * CHAR;
	const textW = Math.max(nameW, tagW);
	const hasText = textW > 0;

	let icon = '';
	const frame = (x: number) => {
		if (logo.frame === 'lleno') {
			return `<rect x="${x}" y="0" width="${ICON}" height="${ICON}" fill="${colors.accent}"/>${iconAt(bodies, logo.icon, x + 18, 18, ICON - 36, colors.bg)}`;
		}
		if (logo.frame === 'borde') {
			return `<rect x="${x + 2}" y="2" width="${ICON - 4}" height="${ICON - 4}" fill="none" stroke="${colors.accent}" stroke-width="4"/>${iconAt(bodies, logo.icon, x + 18, 18, ICON - 36, colors.accent)}`;
		}
		return iconAt(bodies, logo.icon, x, 0, ICON, colors.accent);
	};

	const name = (x: number, y: number, anchor: string) =>
		logo.name
			? `<text x="${x}" y="${y}" font-size="${NAME_SIZE}" font-weight="${bold}" fill="${colors.fg}" text-anchor="${anchor}">${escapeXml(logo.name)}</text>`
			: '';
	const tag = (x: number, y: number, anchor: string) =>
		logo.tagline
			? `<text x="${x}" y="${y}" font-size="${TAG_SIZE}" fill="${colors.fg}" fill-opacity="0.7" text-anchor="${anchor}">${escapeXml(logo.tagline)}</text>`
			: '';

	if (logo.layout === 'arriba') {
		const width = Math.ceil(Math.max(ICON, textW));
		const nameY = ICON + 16 + NAME_SIZE * 0.8;
		const tagY = (logo.name ? nameY : ICON + 4) + TAG_SIZE + 12;
		icon = frame((width - ICON) / 2);
		const height = Math.ceil(logo.tagline ? tagY + 4 : logo.name ? nameY + 10 : ICON);
		return { body: icon + name(width / 2, nameY, 'middle') + tag(width / 2, tagY, 'middle'), width, height };
	}

	icon = frame(0);
	const x = ICON + GAP;
	const both = logo.name && logo.tagline;
	const nameY = both ? 56 : ICON / 2 + NAME_SIZE * 0.35;
	const tagY = both ? 84 : ICON / 2 + TAG_SIZE * 0.35;
	const width = Math.ceil(hasText ? x + textW : ICON);
	return { body: icon + name(x, nameY, 'start') + tag(x, tagY, 'start'), width, height: ICON };
}

/** Coloca un logo ya hecho encajado en una caja, sin pasarse de alto ni de ancho. */
function placeMark(mark: Mark, logo: Logo, x: number, y: number, maxW: number, maxH: number, align: 'start' | 'middle') {
	const scale = Math.min(maxH / mark.height, maxW / mark.width, 1);
	const left = align === 'middle' ? x - (mark.width * scale) / 2 : x;
	return `<g transform="translate(${left} ${y}) scale(${scale})" font-family="${familyOf(logo.font)}">${mark.body}</g>`;
}

/** Las fuentes, metidas dentro del SVG para que se vea igual en cualquier sitio. */
function fontFaces(fonts: string[], embedded: Record<string, string> = {}) {
	const faces = [...new Set(fonts)]
		.filter((id) => embedded[id])
		.map((id) => {
			const font = fontOf(id);
			const family = font.family.split(',')[0];
			const weight = id === 'mono' ? '100 900' : '400';
			return `@font-face{font-family:${family};font-weight:${weight};src:url(data:font/woff2;base64,${embedded[id]}) format('woff2');}`;
		});
	return faces.length ? `<style>${faces.join('')}</style>` : '';
}

function wrap(width: number, height: number, background: string, style: string, body: string) {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${style}${background}${body}</svg>`;
}

export function logoSvg(logo: Logo, bodies: IconBodies, embedded?: Record<string, string>) {
	const mark = logoMark(logo, bodies);
	const width = mark.width + PAD * 2;
	const height = mark.height + PAD * 2;
	const background = logo.transparent ? '' : `<rect width="100%" height="100%" fill="${logo.bg}"/>`;
	const body = `<g transform="translate(${PAD} ${PAD})" font-family="${familyOf(logo.font)}">${mark.body}</g>`;
	return wrap(width, height, background, fontFaces([logo.font], embedded), body);
}

/* Medidas de la tarjeta: 85 × 55 mm, a unos 8 píxeles por milímetro. */
const CARD_W = 700;
const CARD_H = 450;
const CARD_PAD = 48;
const BAND = 250;
const LINE = 28;
const CONTACT_SIZE = 15;

export function cardSvg(card: Card, logo: Logo, bodies: IconBodies, embedded?: Record<string, string>) {
	const bold = weightOf(card.font);
	const contacts = CONTACT.map((item) => ({ icon: item.icon, text: card[item.id] })).filter((item) => item.text);
	const withLogo = card.showLogo;

	let body = '';
	let textX = CARD_PAD;
	let anchor: 'start' | 'middle' = 'start';
	let room = CARD_W - CARD_PAD * 2;
	let top = CARD_PAD;

	if (card.layout === 'franja') {
		body += `<rect width="${BAND}" height="${CARD_H}" fill="${card.accent}"/>`;
		if (withLogo) {
			// Sobre la franja, el logo se pinta con los colores de la tarjeta al revés.
			const mark = logoMark({ ...logo, layout: 'arriba' }, bodies, { bg: card.accent, fg: card.bg, accent: card.bg });
			const scale = Math.min((BAND - 60) / mark.width, 200 / mark.height, 1);
			body += placeMark(mark, logo, BAND / 2, (CARD_H - mark.height * scale) / 2, BAND - 60, 200, 'middle');
		}
		textX = BAND + CARD_PAD;
		room = CARD_W - BAND - CARD_PAD * 2;
		top = 150;
	} else if (card.layout === 'centrada') {
		textX = CARD_W / 2;
		anchor = 'middle';
		if (withLogo) body += placeMark(logoMark(logo, bodies), logo, CARD_W / 2, CARD_PAD, room, 80, 'middle');
		top = withLogo ? 190 : 150;
	} else {
		if (withLogo) body += placeMark(logoMark(logo, bodies), logo, CARD_PAD, CARD_PAD, room, 64, 'start');
		body += `<rect x="${CARD_PAD}" y="${CARD_H - CARD_PAD - contacts.length * LINE - 18}" width="40" height="4" fill="${card.accent}"/>`;
		top = withLogo ? 180 : 110;
	}

	const nameSize = fitSize(card.name, 40, room);
	if (card.name) {
		body += `<text x="${textX}" y="${top + nameSize * 0.8}" font-size="${nameSize}" font-weight="${bold}" fill="${card.fg}" text-anchor="${anchor}">${escapeXml(card.name)}</text>`;
	}
	if (card.role) {
		const roleSize = fitSize(card.role, 18, room);
		body += `<text x="${textX}" y="${top + nameSize * 0.8 + 34}" font-size="${roleSize}" fill="${card.accent}" text-anchor="${anchor}">${escapeXml(card.role)}</text>`;
	}

	// El contacto, pegado abajo: cada línea con su icono delante.
	const chars = Math.floor((room - 28) / (CONTACT_SIZE * CHAR));
	contacts.forEach((item, index) => {
		const text = clip(item.text, chars);
		const y = CARD_H - CARD_PAD - (contacts.length - 1 - index) * LINE;
		const lineW = 26 + text.length * CONTACT_SIZE * CHAR;
		const left = anchor === 'middle' ? textX - lineW / 2 : textX;
		body += iconAt(bodies, item.icon, left, y - 14, 18, card.accent);
		body += `<text x="${left + 26}" y="${y}" font-size="${CONTACT_SIZE}" fill="${card.fg}">${escapeXml(text)}</text>`;
	});

	const background = `<rect width="100%" height="100%" fill="${card.bg}"/>`;
	const fonts = withLogo ? [card.font, logo.font] : [card.font];
	return wrap(CARD_W, CARD_H, background, fontFaces(fonts, embedded), `<g font-family="${familyOf(card.font)}">${body}</g>`);
}

/** El dibujo que toca según el modo. */
export function designSvg(design: Design, bodies: IconBodies, embedded?: Record<string, string>) {
	return design.mode === 'tarjeta'
		? cardSvg(design.card, design.logo, bodies, embedded)
		: logoSvg(design.logo, bodies, embedded);
}

/** Las fuentes que hacen falta para el dibujo de ahora. */
export function fontsOf(design: Design) {
	if (design.mode === 'logo') return [design.logo.font];
	return design.card.showLogo ? [design.card.font, design.logo.font] : [design.card.font];
}
