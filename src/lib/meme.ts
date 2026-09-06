/*
 * El generador de memes: la parte que no toca el DOM. Aquí están los ajustes,
 * los estilos de fábrica y el dibujo sobre un lienzo.
 *
 * La imagen la pone quien entra —de su disco, arrastrada o pegada— y no sale de
 * su navegador: se pinta en un <canvas> y de ahí salen la descarga y la copia.
 * No hay servidor, ni petición, ni nada guardado.
 */

export interface Meme {
	/** El texto de arriba. Los saltos de línea escritos se respetan. */
	arriba: string;
	/** El de abajo. */
	abajo: string;
	/** Una de las fuentes de la casa; uno de los ids de FONTS. */
	fuente: string;
	/** Cuerpo de letra, en porcentaje del ancho del lienzo. */
	tamano: number;
	color: string;
	contorno: string;
	/** Grosor del contorno, en porcentaje del cuerpo de letra. */
	grosor: number;
	mayusculas: boolean;
	/** Color del lienzo mientras no hay imagen. */
	fondo: string;
}

export const DEFAULT_MEME: Meme = {
	arriba: 'CUANDO EL BUILD PASA',
	abajo: 'A LA PRIMERA',
	fuente: 'mono',
	tamano: 8,
	color: '#ffffff',
	contorno: '#000000',
	grosor: 16,
	mayusculas: true,
	fondo: '#fdf6ef',
};

interface Font {
	id: string;
	label: string;
	/** La familia tal cual la entiende el canvas. Las dos las servimos nosotros. */
	family: string;
	weight: number;
}

export const FONTS: readonly Font[] = [
	{ id: 'mono', label: 'Geist Mono', family: '"Geist Mono Variable", monospace', weight: 700 },
	{ id: 'pixel', label: 'Geist Pixel', family: '"Geist Pixel", monospace', weight: 400 },
];

export function fontOf(id: string) {
	return FONTS.find((font) => font.id === id) ?? FONTS[0];
}

/** Lo que le pide el canvas: peso, cuerpo y familia, en ese orden. */
export function fontSpec(font: Font, size: number) {
	return `${font.weight} ${Math.round(size)}px ${font.family}`;
}

/** Tres puntos de partida, para no empezar con el folio en blanco. */
export const STYLES: readonly { label: string; icon: string; meme: Partial<Meme> }[] = [
	{
		label: 'Clásico',
		icon: 'letter-case',
		meme: { fuente: 'mono', color: '#ffffff', contorno: '#000000', grosor: 16, mayusculas: true },
	},
	{
		label: 'Píxel',
		icon: 'sticker',
		meme: { fuente: 'pixel', color: '#fc784b', contorno: '#17110d', grosor: 20, mayusculas: true },
	},
	{
		label: 'Papel',
		icon: 'typography',
		meme: { fuente: 'mono', color: '#3b2d24', contorno: '#fdf6ef', grosor: 22, mayusculas: false },
	},
];

/** Nada baja de aquí ni sube de allá: el lienzo se queda en medidas sanas. */
export const SIZE = { min: 4, max: 16, step: 0.5 };
export const STROKE = { min: 0, max: 30, step: 1 };

/** El lado largo del lienzo. Una foto de móvil entera no hace falta para un meme. */
const MAX_SIDE = 1400;
/** Sin imagen se dibuja un cuadrado liso, que también vale de meme. */
const BLANK = { width: 1000, height: 1000 };

/** Las medidas del lienzo: las de la imagen, encogidas si se pasan de largo. */
export function canvasSize(image: { width: number; height: number } | null) {
	if (!image || !image.width || !image.height) return { ...BLANK };
	const factor = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
	return {
		width: Math.max(1, Math.round(image.width * factor)),
		height: Math.max(1, Math.round(image.height * factor)),
	};
}

/** Solo hex de seis dígitos: lo que sale del selector de color y nada más. */
function safeColor(value: string, fallback: string) {
	return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : fallback;
}

function clamp(value: number, min: number, max: number) {
	if (!Number.isFinite(value)) return min;
	return Math.min(max, Math.max(min, value));
}

/** Una palabra que no cabe entera se parte por letras antes que salirse. */
function chunks(ctx: CanvasRenderingContext2D, word: string, maxWidth: number) {
	if (ctx.measureText(word).width <= maxWidth) return [word];

	const out: string[] = [];
	let trozo = '';
	for (const letra of word) {
		if (trozo && ctx.measureText(trozo + letra).width > maxWidth) {
			out.push(trozo);
			trozo = letra;
			continue;
		}
		trozo += letra;
	}
	if (trozo) out.push(trozo);
	return out;
}

/**
 * Reparte el texto en líneas que quepan. Los saltos que escribe la gente mandan;
 * dentro de cada uno se corta por palabras.
 */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
	const lines: string[] = [];

	for (const paragraph of text.split('\n')) {
		let line = '';

		for (const word of paragraph.split(/\s+/).filter(Boolean)) {
			for (const trozo of chunks(ctx, word, maxWidth)) {
				const probe = line ? `${line} ${trozo}` : trozo;
				if (!line || ctx.measureText(probe).width <= maxWidth) {
					line = probe;
					continue;
				}
				lines.push(line);
				line = trozo;
			}
		}

		if (line) lines.push(line);
	}

	return lines;
}

function drawBlock(
	ctx: CanvasRenderingContext2D,
	text: string,
	meme: Meme,
	width: number,
	height: number,
	arriba: boolean,
) {
	const limpio = (meme.mayusculas ? text.toUpperCase() : text).trim();
	if (!limpio) return;

	const size = clamp((width * meme.tamano) / 100, 8, width);
	const margen = Math.round(width * 0.035);
	ctx.font = fontSpec(fontOf(meme.fuente), size);
	ctx.textAlign = 'center';
	ctx.textBaseline = 'top';

	const lines = wrap(ctx, limpio, width - margen * 2);
	const alto = size * 1.18;
	const inicio = arriba ? margen : height - margen - lines.length * alto;

	ctx.lineWidth = (size * clamp(meme.grosor, STROKE.min, STROKE.max)) / 100;
	ctx.lineJoin = 'round';
	ctx.miterLimit = 2;
	ctx.strokeStyle = safeColor(meme.contorno, DEFAULT_MEME.contorno);
	ctx.fillStyle = safeColor(meme.color, DEFAULT_MEME.color);

	lines.forEach((line, index) => {
		const y = inicio + index * alto;
		if (ctx.lineWidth > 0) ctx.strokeText(line, width / 2, y);
		ctx.fillText(line, width / 2, y);
	});
}

/** Pinta el meme entero: primero la imagen —o el fondo liso— y encima los textos. */
export function drawMeme(
	ctx: CanvasRenderingContext2D,
	image: CanvasImageSource | null,
	meme: Meme,
	width: number,
	height: number,
) {
	ctx.clearRect(0, 0, width, height);
	ctx.fillStyle = safeColor(meme.fondo, DEFAULT_MEME.fondo);
	ctx.fillRect(0, 0, width, height);
	if (image) ctx.drawImage(image, 0, 0, width, height);

	drawBlock(ctx, meme.arriba, meme, width, height, true);
	drawBlock(ctx, meme.abajo, meme, width, height, false);
}
