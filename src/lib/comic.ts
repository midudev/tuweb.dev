/*
 * El creador de cómics: la parte que no toca el DOM. Aquí están el modelo de la
 * tira, los fondos, los personajes y el dibujo sobre un lienzo.
 *
 * Los personajes son trazados SVG escritos a mano en una caja de 100 × 150: el
 * mismo dato pinta el botón que los elige (como <svg>) y la viñeta (como
 * Path2D sobre el canvas). No se carga ninguna imagen de fuera.
 */
import { fontOf, fontSpec, wrap } from './meme';

export type Bubble = 'habla' | 'piensa' | 'grita';

export interface Slot {
	/** Uno de los ids de CHARACTERS, o '' si no sale nadie. */
	personaje: string;
	/** Lo que dice o piensa. Vacío, sin bocadillo. */
	texto: string;
	tipo: Bubble;
	/** Dado la vuelta: mira hacia el otro lado. */
	girar: boolean;
}

export interface Panel {
	/** Uno de los ids de BACKGROUNDS. */
	fondo: string;
	/** El cartelito de arriba: «Mientras tanto…». Vacío, sin cartel. */
	rotulo: string;
	/** Dos sitios por viñeta: izquierda y derecha. */
	slots: [Slot, Slot];
}

export interface Comic {
	titulo: string;
	/** Uno de los n de LAYOUTS. */
	vinetas: number;
	/** Siempre MAX_PANELS: las que sobran esperan por si vuelves a subir. */
	paneles: Panel[];
}

export const LAYOUTS: readonly { n: number; cols: number }[] = [
	{ n: 1, cols: 1 },
	{ n: 2, cols: 2 },
	{ n: 3, cols: 3 },
	{ n: 4, cols: 2 },
	{ n: 6, cols: 3 },
];

export const MAX_PANELS = 6;

export const BUBBLES: readonly { id: Bubble; label: string; icon: string }[] = [
	{ id: 'habla', label: 'Habla', icon: 'message' },
	{ id: 'piensa', label: 'Piensa', icon: 'bubble-text' },
	{ id: 'grita', label: 'Grita', icon: 'speakerphone' },
];

export const MAX_TEXT = 120;
export const MAX_TITLE = 60;

const INK = '#17110d';
const PAPER = '#fdf6ef';

/* ---------- Personajes ---------- */

interface Part {
	d: string;
	/** Sin relleno, solo la línea. */
	fill?: string;
	/** Sin contorno: ojos, bocas rellenas. */
	plain?: boolean;
}

interface Character {
	id: string;
	label: string;
	parts: Part[];
}

/** Un círculo en sintaxis de trazado, que Path2D no entiende <circle>. */
const c = (cx: number, cy: number, r: number) =>
	`M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
const r = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}Z`;

const SKIN = '#f2c7a5';

export const CHARACTERS: readonly Character[] = [
	{
		id: 'dev',
		label: 'Dev',
		parts: [
			{ d: r(38, 118, 10, 30) + r(52, 118, 10, 30), fill: '#3b2d24' },
			{ d: 'M32 82L20 112L27 115L36 92ZM68 82L80 112L73 115L64 92Z', fill: '#fc784b' },
			{ d: 'M28 120L32 78Q50 70 68 78L72 120Z', fill: '#fc784b' },
			{ d: c(50, 50, 22), fill: SKIN },
			{ d: 'M28 48Q30 24 50 24Q72 24 72 48Q62 36 50 38Q38 36 28 48Z', fill: '#3b2d24' },
			{ d: r(36, 46, 11, 9) + r(53, 46, 11, 9), fill: '#ffffff' },
			{ d: 'M47 50h6' },
			{ d: c(43.5, 51, 2) + c(60.5, 51, 2), fill: INK, plain: true },
			{ d: 'M42 62Q50 68 58 62' },
		],
	},
	{
		id: 'jefa',
		label: 'Jefa',
		parts: [
			{ d: r(40, 120, 8, 28) + r(52, 120, 8, 28), fill: '#3b2d24' },
			{ d: 'M34 82L22 112L29 115L38 92ZM66 82L78 112L71 115L62 92Z', fill: '#4a6fa5' },
			{ d: 'M30 122L34 78Q50 72 66 78L70 122Z', fill: '#4a6fa5' },
			{ d: c(50, 26, 9), fill: '#6b3b1f' },
			{ d: c(50, 52, 20), fill: '#c98f65' },
			{ d: 'M30 52Q30 30 50 30Q70 30 70 52Q66 40 50 40Q34 40 30 52Z', fill: '#6b3b1f' },
			{ d: c(45, 52, 2) + c(59, 52, 2), fill: INK, plain: true },
			{ d: 'M38 46l8 2M62 46l-8 2' },
			{ d: 'M44 63h12' },
		],
	},
	{
		id: 'robot',
		label: 'Robot',
		parts: [
			{ d: r(36, 122, 10, 26) + r(54, 122, 10, 26), fill: '#8a8f98' },
			{ d: r(14, 84, 10, 30) + r(76, 84, 10, 30), fill: '#8a8f98' },
			{ d: r(26, 80, 48, 44), fill: '#b8bec8' },
			{ d: r(38, 92, 24, 14), fill: '#fc784b' },
			{ d: r(44, 72, 12, 8), fill: '#8a8f98' },
			{ d: 'M50 38V27' },
			{ d: c(50, 23, 4), fill: '#fc784b' },
			{ d: r(30, 38, 40, 34), fill: '#b8bec8' },
			{ d: r(38, 48, 8, 8) + r(54, 48, 8, 8), fill: '#7fdcff' },
			{ d: r(42, 50, 3, 4) + r(58, 50, 3, 4), fill: INK, plain: true },
			{ d: 'M40 62h20' },
		],
	},
	{
		id: 'gata',
		label: 'Gata',
		parts: [
			{ d: 'M68 140Q94 136 86 106' },
			{ d: 'M30 148Q26 100 50 96Q74 100 70 148Z', fill: '#e0a060' },
			{ d: 'M31 70L34 46L46 60ZM69 70L66 46L54 60Z', fill: '#e0a060' },
			{ d: c(50, 78, 22), fill: '#e0a060' },
			{ d: c(44, 76, 3) + c(60, 76, 3), fill: INK, plain: true },
			{ d: 'M47 84h6l-3 4Z', fill: '#f29aa8' },
			{ d: 'M26 84h12M27 91l12-3M74 84H62M73 91l-12-3' },
		],
	},
	{
		id: 'fantasma',
		label: 'Fantasma',
		parts: [
			{
				d: 'M26 148L26 70Q26 40 50 40Q74 40 74 70L74 148L66 140L58 148L50 140L42 148L34 140Z',
				fill: '#ffffff',
			},
			{ d: 'M26 92Q14 98 16 108M74 92Q86 98 84 108' },
			{ d: c(45, 70, 4) + c(61, 70, 4), fill: INK, plain: true },
			{ d: c(50, 86, 5), fill: INK, plain: true },
		],
	},
];

export function characterOf(id: string) {
	return CHARACTERS.find((item) => item.id === id) ?? null;
}

/** El mismo personaje en <svg>, para el botón que lo elige. Los datos son nuestros. */
export function characterSvg(character: Character) {
	const paths = character.parts
		.map(
			(part) =>
				`<path d="${part.d}" fill="${part.fill ?? 'none'}"${part.plain ? '' : ` stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`}/>`,
		)
		.join('');
	return `<svg viewBox="0 0 100 150" aria-hidden="true" class="h-12 w-8">${paths}</svg>`;
}

function drawCharacter(
	ctx: CanvasRenderingContext2D,
	character: Character,
	cx: number,
	bottom: number,
	height: number,
	flip: boolean,
) {
	const s = height / 150;
	ctx.save();
	ctx.translate(cx, bottom - height);
	ctx.scale(flip ? -s : s, s);
	ctx.translate(-50, 0);
	ctx.lineWidth = 3;
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';
	ctx.strokeStyle = INK;
	for (const part of character.parts) {
		const path = new Path2D(part.d);
		if (part.fill) {
			ctx.fillStyle = part.fill;
			ctx.fill(path);
		}
		if (!part.plain) ctx.stroke(path);
	}
	ctx.restore();
}

/* ---------- Fondos ---------- */

interface Background {
	id: string;
	label: string;
	icon: string;
	draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

/** Siempre las mismas estrellas y ventanas: sin azar, la tira no cambia al repintar. */
function seeded(n: number) {
	let seed = 7;
	return Array.from({ length: n }, () => {
		seed = (seed * 9301 + 49297) % 233280;
		return seed / 233280;
	});
}

function ground(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, at = 0.78) {
	ctx.fillStyle = color;
	ctx.fillRect(0, h * at, w, h * (1 - at));
	ctx.strokeStyle = INK;
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.moveTo(0, h * at);
	ctx.lineTo(w, h * at);
	ctx.stroke();
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
	ctx.fillStyle = '#ffffff';
	ctx.beginPath();
	ctx.arc(x, y, 18 * s, 0, Math.PI * 2);
	ctx.arc(x + 22 * s, y - 8 * s, 22 * s, 0, Math.PI * 2);
	ctx.arc(x + 44 * s, y, 18 * s, 0, Math.PI * 2);
	ctx.fill();
}

export const BACKGROUNDS: readonly Background[] = [
	{
		id: 'liso',
		label: 'Liso',
		icon: 'square',
		draw(ctx, w, h) {
			ctx.fillStyle = PAPER;
			ctx.fillRect(0, 0, w, h);
		},
	},
	{
		id: 'campo',
		label: 'Campo',
		icon: 'sun',
		draw(ctx, w, h) {
			ctx.fillStyle = '#9fd6f5';
			ctx.fillRect(0, 0, w, h);
			ctx.fillStyle = '#ffd24a';
			ctx.beginPath();
			ctx.arc(w * 0.84, h * 0.2, w * 0.07, 0, Math.PI * 2);
			ctx.fill();
			cloud(ctx, w * 0.12, h * 0.3, w / 480);
			cloud(ctx, w * 0.5, h * 0.18, (w / 480) * 0.8);
			ground(ctx, w, h, '#7cc46b');
		},
	},
	{
		id: 'oficina',
		label: 'Oficina',
		icon: 'building',
		draw(ctx, w, h) {
			ctx.fillStyle = '#efe4d2';
			ctx.fillRect(0, 0, w, h);
			ctx.strokeStyle = INK;
			ctx.lineWidth = 3;
			ctx.fillStyle = '#bfe3f5';
			ctx.fillRect(w * 0.34, h * 0.12, w * 0.32, h * 0.3);
			ctx.strokeRect(w * 0.34, h * 0.12, w * 0.32, h * 0.3);
			ctx.beginPath();
			ctx.moveTo(w * 0.5, h * 0.12);
			ctx.lineTo(w * 0.5, h * 0.42);
			ctx.stroke();
			ground(ctx, w, h, '#b08968', 0.8);
			ctx.fillStyle = '#6b4f3a';
			ctx.fillRect(w * 0.02, h * 0.62, w * 0.96, h * 0.05);
			ctx.strokeRect(w * 0.02, h * 0.62, w * 0.96, h * 0.05);
			ctx.fillStyle = '#3b2d24';
			ctx.fillRect(w * 0.42, h * 0.5, w * 0.16, h * 0.1);
			ctx.strokeRect(w * 0.42, h * 0.5, w * 0.16, h * 0.1);
			ctx.fillRect(w * 0.49, h * 0.6, w * 0.02, h * 0.02);
		},
	},
	{
		id: 'noche',
		label: 'Noche',
		icon: 'moon',
		draw(ctx, w, h) {
			ctx.fillStyle = '#1d2346';
			ctx.fillRect(0, 0, w, h);
			const azar = seeded(60);
			ctx.fillStyle = '#fdf6ef';
			for (let i = 0; i < 30; i++) {
				ctx.fillRect(azar[i * 2] * w, azar[i * 2 + 1] * h * 0.7, 3, 3);
			}
			ctx.fillStyle = '#f5f0c8';
			ctx.beginPath();
			ctx.arc(w * 0.8, h * 0.18, w * 0.07, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = '#1d2346';
			ctx.beginPath();
			ctx.arc(w * 0.83, h * 0.16, w * 0.06, 0, Math.PI * 2);
			ctx.fill();
			ground(ctx, w, h, '#2f3a2a');
		},
	},
	{
		id: 'playa',
		label: 'Playa',
		icon: 'beach',
		draw(ctx, w, h) {
			ctx.fillStyle = '#bfe7fb';
			ctx.fillRect(0, 0, w, h);
			cloud(ctx, w * 0.62, h * 0.18, w / 480);
			ctx.fillStyle = '#3b8fd1';
			ctx.fillRect(0, h * 0.5, w, h * 0.2);
			ground(ctx, w, h, '#f1d9a0', 0.7);
		},
	},
	{
		id: 'ciudad',
		label: 'Ciudad',
		icon: 'building-skyscraper',
		draw(ctx, w, h) {
			ctx.fillStyle = '#f7c59f';
			ctx.fillRect(0, 0, w, h);
			const azar = seeded(24);
			ctx.strokeStyle = INK;
			ctx.lineWidth = 3;
			let x = -10;
			let i = 0;
			while (x < w) {
				const bw = w * (0.12 + azar[i % 24] * 0.1);
				const bh = h * (0.3 + azar[(i + 7) % 24] * 0.35);
				const top = h * 0.8 - bh;
				ctx.fillStyle = i % 2 ? '#6d6875' : '#8d8a99';
				ctx.fillRect(x, top, bw, bh);
				ctx.strokeRect(x, top, bw, bh);
				ctx.fillStyle = '#ffd24a';
				for (let wy = top + 14; wy < h * 0.8 - 20; wy += 26) {
					for (let wx = x + 10; wx < x + bw - 16; wx += 22) ctx.fillRect(wx, wy, 8, 10);
				}
				x += bw;
				i++;
			}
			ground(ctx, w, h, '#9a9a9a', 0.8);
		},
	},
];

export function backgroundOf(id: string) {
	return BACKGROUNDS.find((item) => item.id === id) ?? BACKGROUNDS[0];
}

/* ---------- La tira de ejemplo y su limpieza ---------- */

const EMPTY_SLOT: Slot = { personaje: '', texto: '', tipo: 'habla', girar: false };

function slot(personaje: string, texto = '', tipo: Bubble = 'habla', girar = false): Slot {
	return { personaje, texto, tipo, girar };
}

function blankPanel(): Panel {
	return { fondo: 'liso', rotulo: '', slots: [{ ...EMPTY_SLOT }, { ...EMPTY_SLOT }] };
}

export function defaultComic(): Comic {
	const paneles: Panel[] = [
		{
			fondo: 'oficina',
			rotulo: 'Lunes, 9:00',
			slots: [slot('dev', '¿Quién subió a producción el viernes?'), slot('robot', 'Yo no tengo manos.')],
		},
		{
			fondo: 'oficina',
			rotulo: '',
			slots: [slot('dev', 'Pero sí tiene acceso a git...', 'piensa'), slot('robot')],
		},
		{
			fondo: 'noche',
			rotulo: 'Esa noche',
			slots: [slot(''), slot('robot', 'git push --force', 'grita', true)],
		},
	];
	while (paneles.length < MAX_PANELS) paneles.push(blankPanel());
	return { titulo: 'El viernes', vinetas: 3, paneles };
}

function text(value: unknown, max: number) {
	return typeof value === 'string' ? value.slice(0, max) : '';
}

function cleanSlot(value: unknown): Slot {
	const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
	const personaje = typeof raw.personaje === 'string' && characterOf(raw.personaje) ? raw.personaje : '';
	const tipo = BUBBLES.find((b) => b.id === raw.tipo)?.id ?? 'habla';
	return { personaje, texto: text(raw.texto, MAX_TEXT), tipo, girar: raw.girar === true };
}

/** Lo que vuelve del almacenamiento del navegador se revisa entero: puede venir de otra versión. */
export function cleanComic(value: unknown): Comic {
	if (!value || typeof value !== 'object') return defaultComic();
	const raw = value as Record<string, unknown>;
	const lista = Array.isArray(raw.paneles) ? raw.paneles : [];
	const paneles = Array.from({ length: MAX_PANELS }, (_, i) => {
		const p = (lista[i] && typeof lista[i] === 'object' ? lista[i] : {}) as Record<string, unknown>;
		const slots = Array.isArray(p.slots) ? p.slots : [];
		return {
			fondo: backgroundOf(text(p.fondo, 20)).id,
			rotulo: text(p.rotulo, MAX_TEXT),
			slots: [cleanSlot(slots[0]), cleanSlot(slots[1])] as [Slot, Slot],
		};
	});
	const vinetas = LAYOUTS.find((l) => l.n === raw.vinetas)?.n ?? 3;
	return { titulo: text(raw.titulo, MAX_TITLE), vinetas, paneles };
}

/* ---------- El dibujo ---------- */

const PANEL = 480;
const GAP = 24;
const TITLE_H = 76;
const BORDER = 5;
const CHAR_H = 264;
const FLOOR = 16;
const SLOT_X = [0.27, 0.73];

const MONO = fontOf('mono');
const PIXEL = fontOf('pixel');

export function layoutOf(n: number) {
	return LAYOUTS.find((l) => l.n === n) ?? LAYOUTS[2];
}

export function comicSize(comic: Comic) {
	const { n, cols } = layoutOf(comic.vinetas);
	const rows = Math.ceil(n / cols);
	const titulo = comic.titulo.trim() ? TITLE_H : 0;
	return {
		width: cols * PANEL + (cols + 1) * GAP,
		height: rows * PANEL + (rows + 1) * GAP + titulo,
	};
}

function drawCaption(ctx: CanvasRenderingContext2D, rotulo: string) {
	const texto = rotulo.trim();
	if (!texto) return 0;
	const size = 18;
	ctx.font = fontSpec(MONO, size);
	const lines = wrap(ctx, texto, PANEL - 60).slice(0, 3);
	const ancho = Math.max(...lines.map((line) => ctx.measureText(line).width)) + 24;
	const alto = lines.length * size * 1.3 + 16;
	ctx.fillStyle = '#fff3b0';
	ctx.strokeStyle = INK;
	ctx.lineWidth = 3;
	ctx.fillRect(12, 12, ancho, alto);
	ctx.strokeRect(12, 12, ancho, alto);
	ctx.fillStyle = INK;
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	lines.forEach((line, i) => ctx.fillText(line, 24, 20 + i * size * 1.3));
	return 12 + alto;
}

/** El borde a dientes de sierra del grito, alrededor de la caja. */
function jagged(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
	const paso = 18;
	const pico = 9;
	// Cada lado va de esquina a esquina: [origen, dirección, hacia fuera, largo].
	const lados: [number, number, number, number, number, number, number][] = [
		[x, y, 1, 0, 0, -1, w],
		[x + w, y, 0, 1, 1, 0, h],
		[x + w, y + h, -1, 0, 0, 1, w],
		[x, y + h, 0, -1, -1, 0, h],
	];
	ctx.beginPath();
	ctx.moveTo(x, y);
	for (const [ox, oy, dx, dy, fx, fy, largo] of lados) {
		for (let i = paso; i <= largo; i += paso) {
			const medio = i - paso / 2;
			ctx.lineTo(ox + dx * medio + fx * pico, oy + dy * medio + fy * pico);
			ctx.lineTo(ox + dx * i, oy + dy * i);
		}
		ctx.lineTo(ox + dx * largo, oy + dy * largo);
	}
	ctx.closePath();
}

function drawBubble(
	ctx: CanvasRenderingContext2D,
	slotData: Slot,
	lado: number,
	top: number,
	anchoMax: number,
) {
	const texto = slotData.texto.trim();
	if (!texto) return;

	const cx = PANEL * SLOT_X[lado];
	const hayCola = Boolean(characterOf(slotData.personaje));
	const punta = PANEL - FLOOR - CHAR_H + 8;
	const altoMax = Math.max(60, (hayCola ? punta - 30 : PANEL - 40) - top);
	const pad = 12;

	// Se busca el cuerpo más grande con el que el texto cabe en su hueco.
	let size = 24;
	let lines: string[] = [];
	for (; size >= 13; size -= 1) {
		ctx.font = fontSpec(MONO, size);
		lines = wrap(ctx, texto, anchoMax - pad * 2);
		if (lines.length * size * 1.25 + pad * 2 <= altoMax) break;
	}
	if (size < 13) {
		size = 13;
		ctx.font = fontSpec(MONO, size);
		lines = wrap(ctx, texto, anchoMax - pad * 2);
	}

	const w = Math.max(...lines.map((line) => ctx.measureText(line).width)) + pad * 2;
	const h = lines.length * size * 1.25 + pad * 2;
	const x = Math.min(Math.max(cx - w / 2, 14), PANEL - 14 - w);
	const y = top;
	const base = Math.min(Math.max(cx, x + 18), x + w - 18);
	const tipX = cx + (lado === 0 ? 8 : -8);

	ctx.strokeStyle = INK;
	ctx.lineWidth = 3;
	ctx.lineJoin = 'round';
	ctx.fillStyle = '#ffffff';

	if (slotData.tipo === 'piensa') {
		ctx.fillRect(x, y, w, h);
		ctx.setLineDash([8, 6]);
		ctx.strokeRect(x, y, w, h);
		ctx.setLineDash([]);
		if (hayCola && punta > y + h + 12) {
			// Tres cuadraditos que bajan hacia la cabeza.
			[0.25, 0.55, 0.85].forEach((t, i) => {
				const lado2 = 10 - i * 3;
				const px = base + (tipX - base) * t - lado2 / 2;
				const py = y + h + (punta - y - h) * t - lado2 / 2;
				ctx.fillRect(px, py, lado2, lado2);
				ctx.strokeRect(px, py, lado2, lado2);
			});
		}
	} else {
		const cola = hayCola && punta > y + h + 6;
		if (cola) {
			ctx.beginPath();
			ctx.moveTo(base - 12, y + h);
			ctx.lineTo(tipX, punta);
			ctx.lineTo(base + 12, y + h);
			ctx.fill();
			ctx.stroke();
		}
		if (slotData.tipo === 'grita') {
			jagged(ctx, x, y, w, h);
			ctx.fillStyle = '#fff3b0';
			ctx.fill();
			ctx.stroke();
		} else {
			ctx.fillRect(x, y, w, h);
			ctx.strokeRect(x, y, w, h);
			if (cola) {
				// Se tapa el trozo de borde que cruza la cola.
				ctx.fillRect(base - 10, y + h - 3, 20, 6);
			}
		}
	}

	ctx.fillStyle = INK;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'top';
	lines.forEach((line, i) => ctx.fillText(line, x + w / 2, y + pad + i * size * 1.25));
}

function drawPanel(ctx: CanvasRenderingContext2D, panel: Panel) {
	ctx.save();
	backgroundOf(panel.fondo).draw(ctx, PANEL, PANEL);
	ctx.restore();

	panel.slots.forEach((s, lado) => {
		const character = characterOf(s.personaje);
		if (!character) return;
		// Por defecto se miran: el de la derecha va dado la vuelta.
		const flip = lado === 1 ? !s.girar : s.girar;
		drawCharacter(ctx, character, PANEL * SLOT_X[lado], PANEL - FLOOR, CHAR_H, flip);
	});

	const top = drawCaption(ctx, panel.rotulo) + 14;
	const conTexto = panel.slots.filter((s) => s.texto.trim()).length;
	const anchoMax = conTexto > 1 ? PANEL / 2 - 20 : PANEL * 0.78;
	panel.slots.forEach((s, lado) => drawBubble(ctx, s, lado, top, anchoMax));
}

/** Pinta la tira entera: el papel, el título y cada viñeta con su marco. */
export function drawComic(ctx: CanvasRenderingContext2D, comic: Comic) {
	const { width, height } = comicSize(comic);
	const { n, cols } = layoutOf(comic.vinetas);
	const titulo = comic.titulo.trim();

	ctx.clearRect(0, 0, width, height);
	ctx.fillStyle = PAPER;
	ctx.fillRect(0, 0, width, height);

	if (titulo) {
		ctx.fillStyle = INK;
		ctx.font = fontSpec(PIXEL, 40);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(titulo, width / 2, GAP + TITLE_H / 2 - 4, width - GAP * 2);
	}
	const arriba = titulo ? TITLE_H : 0;

	for (let i = 0; i < n; i++) {
		const x = GAP + (i % cols) * (PANEL + GAP);
		const y = arriba + GAP + Math.floor(i / cols) * (PANEL + GAP);
		ctx.save();
		ctx.translate(x, y);
		ctx.beginPath();
		ctx.rect(0, 0, PANEL, PANEL);
		ctx.clip();
		drawPanel(ctx, comic.paneles[i]);
		ctx.restore();

		ctx.strokeStyle = INK;
		ctx.lineWidth = BORDER;
		ctx.strokeRect(x, y, PANEL, PANEL);
	}
}

/** Lo que tiene que estar cargado antes de pintar: las dos fuentes de la casa. */
export const FONT_SPECS = [fontSpec(MONO, 24), fontSpec(PIXEL, 40)];
