/*
 * La nube de palabras: la parte que no toca el DOM. Aquí están el recuento, las
 * palabras vacías, las formas, las paletas y el reparto de las palabras sobre
 * el lienzo.
 *
 * El texto lo pega quien entra y no sale de su navegador: se cuenta aquí, se
 * coloca aquí y de aquí salen el SVG y el PNG. No hay servidor ni nada guardado.
 */

/** Las palabras que salen en cualquier texto y no dicen nada: español e inglés. */
const STOPWORDS = new Set(
	`a al algo algun alguna algunas alguno algunos ante antes aquel aquella aquellas aquello aquellos aqui
	asi aun aunque bajo bien cada casi como con contra cual cuales cuando cuanto de del desde donde dos
	e el ella ellas ello ellos en entre era eran eres es esa esas ese eso esos esta estaba estado estan
	estar estas este esto estos estoy fue fueron ha habia han has hasta hay he la las le les lo los mas
	me mi mia mis mucho muchos muy nada ni no nos nosotros nuestra nuestro o os otra otras otro otros
	para pero poco por porque pues que quien quienes se sea ser si sido siempre sin sobre sois solo son
	soy su sus tambien tan tanto te tenemos tener tengo ti tiene tienen toda todas todo todos tu tus un
	una unas uno unos usted ustedes va vais vamos van vosotros y ya yo él
	about after all also an and any are as at be been but by can could did do does for from had has have
	he her his how i if in into is it its just me more my no not of on one or our out she so some than
	that the their them then there these they this to up us was we were what when which who will with
	would you your`.split(/\s+/),
);

/** Lo que se compara quita tildes: «también» y «tambien» son la misma palabra vacía. */
function plain(word: string) {
	return word.normalize('NFD').replace(/\p{M}/gu, '');
}

export interface Word {
	text: string;
	count: number;
}

export interface CountOptions {
	/** Quitar las palabras vacías. */
	stopwords: boolean;
	/** Las que quien escribe quiere quitar además, separadas por comas o espacios. */
	extra: string;
	/** Largo mínimo de una palabra, en letras. */
	minLength: number;
}

/** Cuenta las palabras del texto, de más a menos veces. */
export function countWords(text: string, options: CountOptions): { words: Word[]; total: number } {
	const extra = new Set(
		options.extra
			.toLowerCase()
			.split(/[\s,;]+/)
			.filter(Boolean)
			.map(plain),
	);
	const counts = new Map<string, number>();
	let total = 0;

	for (const raw of text.toLowerCase().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? []) {
		total += 1;
		const key = plain(raw);
		if ([...raw].length < options.minLength) continue;
		if (/^\d+$/.test(raw)) continue;
		if (options.stopwords && STOPWORDS.has(key)) continue;
		if (extra.has(key)) continue;
		counts.set(raw, (counts.get(raw) ?? 0) + 1);
	}

	const words = [...counts]
		.map(([word, count]) => ({ text: word, count }))
		.sort((a, b) => b.count - a.count || a.text.localeCompare(b.text, 'es'));
	return { words, total };
}

export interface Shape {
	id: string;
	label: string;
	icon: string;
	width: number;
	height: number;
	/** Si un punto, en coordenadas de -1 a 1, cae dentro de la forma. */
	inside: (u: number, v: number) => boolean;
}

export const SHAPES: readonly Shape[] = [
	{
		id: 'nube',
		label: 'Nube',
		icon: 'cloud',
		width: 1200,
		height: 780,
		inside: (u, v) => u * u + v * v <= 1,
	},
	{
		id: 'circulo',
		label: 'Círculo',
		icon: 'circle',
		width: 1000,
		height: 1000,
		inside: (u, v) => u * u + v * v <= 1,
	},
	{
		id: 'cuadrado',
		label: 'Cuadrado',
		icon: 'square',
		width: 1000,
		height: 1000,
		inside: (u, v) => Math.abs(u) <= 1 && Math.abs(v) <= 1,
	},
	{
		id: 'rombo',
		label: 'Rombo',
		icon: 'diamond',
		width: 1000,
		height: 1000,
		inside: (u, v) => Math.abs(u) + Math.abs(v) <= 1,
	},
	{
		id: 'corazon',
		label: 'Corazón',
		icon: 'heart',
		width: 1000,
		height: 1000,
		// La curva de siempre, (x² + y² − 1)³ − x²y³ ≤ 0, con la punta abajo.
		inside: (u, v) => {
			const x = u * 1.14;
			const y = 0.12 - v * 1.14;
			const r = x * x + y * y - 1;
			return r * r * r - x * x * y * y * y <= 0;
		},
	},
];

export function shapeOf(id: string) {
	return SHAPES.find((shape) => shape.id === id) ?? SHAPES[0];
}

export interface Palette {
	id: string;
	label: string;
	colors: string[];
	/** El fondo que le va; se puede cambiar luego. */
	background: string;
}

export const PALETTES: readonly Palette[] = [
	{
		id: 'casa',
		label: 'Casa',
		colors: ['#c2410c', '#3b2d24', '#7a6152', '#e0662f', '#8a5a00'],
		background: '#fdf6ef',
	},
	{
		id: 'noche',
		label: 'Noche',
		colors: ['#fc784b', '#f3e7db', '#ad9483', '#d9a441', '#6fbf7d'],
		background: '#17110d',
	},
	{
		id: 'mar',
		label: 'Mar',
		colors: ['#0b3c5d', '#1d6fa5', '#328cc1', '#0f766e', '#5eaaa8'],
		background: '#f4f8fb',
	},
	{
		id: 'bosque',
		label: 'Bosque',
		colors: ['#14532d', '#2f7a3b', '#4d7c0f', '#8a5a00', '#65a30d'],
		background: '#f6f7ef',
	},
	{
		id: 'neon',
		label: 'Neón',
		colors: ['#ff3cac', '#ffd23f', '#3bf4fb', '#caff8a', '#b388ff'],
		background: '#111111',
	},
	{
		id: 'tinta',
		label: 'Tinta',
		colors: ['#111111'],
		background: '#ffffff',
	},
];

export function paletteOf(id: string) {
	return PALETTES.find((palette) => palette.id === id) ?? PALETTES[0];
}

export interface Font {
	id: string;
	label: string;
	/** La familia tal cual la entienden el canvas y el SVG. Las dos las servimos nosotros. */
	family: string;
	weight: number;
	/** El fichero de la fuente, para meterla dentro del SVG que te llevas. */
	file: string;
}

export const FONTS: readonly Font[] = [
	{
		id: 'mono',
		label: 'Geist Mono',
		family: '"Geist Mono Variable", monospace',
		weight: 700,
		file: '/fonts/geist-mono-latin-wght-normal.woff2',
	},
	{
		id: 'pixel',
		label: 'Geist Pixel',
		family: '"Geist Pixel", monospace',
		weight: 400,
		file: '/fonts/geist-pixel-latin-400-normal.woff2',
	},
];

export function fontOf(id: string) {
	return FONTS.find((font) => font.id === id) ?? FONTS[0];
}

export function fontSpec(font: Font, size: number) {
	return `${font.weight} ${Math.round(size * 10) / 10}px ${font.family}`;
}

export const ORIENTATIONS: readonly { id: string; label: string; icon: string; vertical: number }[] = [
	{ id: 'horizontal', label: 'Tumbadas', icon: 'arrows-horizontal', vertical: 0 },
	{ id: 'mixta', label: 'Mezcla', icon: 'arrows-shuffle', vertical: 0.35 },
	{ id: 'vertical', label: 'De pie', icon: 'arrows-vertical', vertical: 1 },
];

export function orientationOf(id: string) {
	return ORIENTATIONS.find((item) => item.id === id) ?? ORIENTATIONS[0];
}

/** Tope de palabras en la nube: más no cabe ni se lee. */
export const MAX_WORDS = { min: 10, max: 200, step: 5 };

export interface Placed {
	text: string;
	count: number;
	/** El centro de la palabra. */
	x: number;
	y: number;
	size: number;
	vertical: boolean;
	color: string;
}

export interface CloudOptions {
	shape: Shape;
	font: Font;
	colors: string[];
	/** Qué parte de las palabras va de pie, de 0 a 1. */
	vertical: number;
	/** La semilla del azar: la misma semilla, la misma nube. */
	seed: number;
}

/** Un azar con semilla (mulberry32), para que «Barajar» sea lo único que cambia el sitio. */
function random(seed: number) {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

interface Box {
	x0: number;
	y0: number;
	x1: number;
	y1: number;
}

function overlaps(a: Box, b: Box) {
	return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

/** El alto que se reserva por palabra, en cuerpos de letra. */
const LINE = 0.92;
const GAP = 3;

/** Un intento de reparto con un cuerpo máximo dado. */
function tryLayout(
	ctx: CanvasRenderingContext2D,
	words: Word[],
	options: CloudOptions,
	maxSize: number,
) {
	const { shape, font, colors } = options;
	const rand = random(options.seed);
	const { width, height } = shape;
	const cx = width / 2;
	const cy = height / 2;
	const rx = cx * 0.96;
	const ry = cy * 0.96;
	const minSize = Math.max(10, maxSize / 9);
	const top = words[0]?.count ?? 1;
	const bottom = words.at(-1)?.count ?? 1;
	const placed: Placed[] = [];
	const boxes: Box[] = [];
	let lastHit = 0;

	const fits = (box: Box) => {
		const xs = [box.x0, (box.x0 + box.x1) / 2, box.x1];
		const ys = [box.y0, (box.y0 + box.y1) / 2, box.y1];
		for (const x of xs) {
			for (const y of ys) {
				if (!shape.inside((x - cx) / rx, (y - cy) / ry)) return false;
			}
		}
		// Se mira primero la que chocó la última vez: suele volver a chocar.
		if (boxes[lastHit] && overlaps(box, boxes[lastHit])) return false;
		for (let i = 0; i < boxes.length; i++) {
			if (overlaps(box, boxes[i])) {
				lastHit = i;
				return false;
			}
		}
		return true;
	};

	for (const word of words) {
		const ratio = top === bottom ? 1 : (word.count - bottom) / (top - bottom);
		const size = minSize + (maxSize - minSize) * Math.sqrt(ratio);
		ctx.font = fontSpec(font, size);
		const w = ctx.measureText(word.text).width + GAP * 2;
		const h = size * LINE + GAP * 2;
		const vertical = rand() < options.vertical;
		const bw = vertical ? h : w;
		const bh = vertical ? w : h;
		const color = colors[Math.floor(rand() * colors.length)] ?? '#000000';

		// Espiral de Arquímedes desde el centro, estirada con la forma.
		const start = rand() * Math.PI * 2;
		const stretch = width / height;
		const limit = Math.hypot(cx, cy);
		for (let t = 0; ; t += 0.12) {
			const r = 2.2 * t;
			if (r > limit) break;
			const x = cx + r * stretch * Math.cos(t + start);
			const y = cy + r * Math.sin(t + start);
			const box = { x0: x - bw / 2, y0: y - bh / 2, x1: x + bw / 2, y1: y + bh / 2 };
			if (!fits(box)) continue;
			boxes.push(box);
			placed.push({ text: word.text, count: word.count, x, y, size, vertical, color });
			break;
		}
	}

	return placed;
}

/**
 * Reparte las palabras dentro de la forma, las gordas primero y cerca del
 * centro. Si se quedan muchas fuera, vuelve a probar con letra más pequeña.
 */
export function layoutCloud(ctx: CanvasRenderingContext2D, words: Word[], options: CloudOptions) {
	if (!words.length) return [];
	const { shape, font } = options;
	const base = Math.min(shape.width, shape.height);

	// La más repetida no puede pasar de un buen trozo del ancho.
	let maxSize = base * 0.16;
	ctx.font = fontSpec(font, maxSize);
	const first = ctx.measureText(words[0].text).width;
	if (first > shape.width * 0.6) maxSize *= (shape.width * 0.6) / first;

	let best: Placed[] = [];
	for (let round = 0; round < 4; round++) {
		const placed = tryLayout(ctx, words, options, maxSize);
		if (placed.length > best.length) best = placed;
		if (placed.length >= words.length * 0.95) break;
		maxSize *= 0.82;
	}
	return best;
}

/** Solo hex de seis dígitos: lo que sale del selector de color y nada más. */
export function safeColor(value: string, fallback: string) {
	return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : fallback;
}

function escapeXml(text: string) {
	return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * La nube como SVG, en texto. Si llega la fuente en base64 va dentro, para que
 * se vea igual en un ordenador que no la tenga.
 */
export function cloudSvg(
	placed: Placed[],
	shape: Shape,
	font: Font,
	background: string | null,
	embedded?: string,
) {
	const fontFace = embedded
		? `<style>@font-face{font-family:${font.family.split(',')[0]};font-weight:${font.weight};src:url(data:font/woff2;base64,${embedded}) format('woff2');}</style>`
		: '';
	const fondo = background
		? `<rect width="100%" height="100%" fill="${safeColor(background, '#ffffff')}"/>`
		: '';
	const words = placed
		.map((word) => {
			const x = word.x.toFixed(1);
			const y = word.y.toFixed(1);
			const rotate = word.vertical ? ` transform="rotate(-90 ${x} ${y})"` : '';
			return `<text x="${x}" y="${y}" font-size="${word.size.toFixed(1)}" fill="${safeColor(word.color, '#000000')}"${rotate}>${escapeXml(word.text)}</text>`;
		})
		.join('');
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${shape.width} ${shape.height}" width="${shape.width}" height="${shape.height}">${fontFace}${fondo}<g font-family="${escapeXml(font.family)}" font-weight="${font.weight}" text-anchor="middle" dominant-baseline="central">${words}</g></svg>`;
}

/** La nube pintada en un lienzo, para el PNG. */
export function drawCloud(
	ctx: CanvasRenderingContext2D,
	placed: Placed[],
	shape: Shape,
	font: Font,
	background: string | null,
	scale: number,
) {
	ctx.save();
	ctx.setTransform(scale, 0, 0, scale, 0, 0);
	ctx.clearRect(0, 0, shape.width, shape.height);
	if (background) {
		ctx.fillStyle = safeColor(background, '#ffffff');
		ctx.fillRect(0, 0, shape.width, shape.height);
	}
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	for (const word of placed) {
		ctx.save();
		ctx.translate(word.x, word.y);
		if (word.vertical) ctx.rotate(-Math.PI / 2);
		ctx.font = fontSpec(font, word.size);
		ctx.fillStyle = safeColor(word.color, '#000000');
		ctx.fillText(word.text, 0, 0);
		ctx.restore();
	}
	ctx.restore();
}

export const SAMPLE = `Esta web la cambia la gente. Cada ventana se abren las ideas, la gente propone, la gente vota y la idea que más se repite gana. Luego una IA escribe el código de la idea ganadora y la web cambia sola. Ideas pequeñas, ideas raras, ideas útiles: herramientas, juegos, memes, cómics, chistes y ahora una nube de palabras. La nube cuenta cada palabra del texto, quita las palabras vacías y pinta más grande la palabra que más se repite. Pega tu texto, cambia la forma, los colores y la fuente, y llévate la nube en SVG o en PNG. Todo pasa en tu navegador: el texto no se guarda en ningún servidor.`;
