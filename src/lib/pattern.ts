/*
 * El generador de tramas SVG. Todo lo que sale de aquí es una cadena de texto:
 * el mismo SVG sirve para el fondo del previo, para el CSS que se copia y para
 * el fichero que se descarga. No hay imágenes ni peticiones de por medio.
 *
 * La trama se pinta con un <pattern> de userSpaceOnUse: la baldosa mide lo que
 * diga «size» en píxeles reales y se repite sola. Como el <svg> va a 100% y sin
 * viewBox, en un background-image ocupa la caja entera sin escalarse, así que
 * el giro no deja costuras.
 */

export interface Pattern {
	/** Figura de la baldosa; uno de los ids de SHAPES. */
	shape: string;
	/** Lado de la baldosa en píxeles. */
	size: number;
	/** Tamaño de la figura dentro de la baldosa, de 0 a 1. */
	scale: number;
	/** Grosor del borde. En las figuras de línea es lo único que se ve. */
	stroke: number;
	/** Giro de la trama entera, en grados. */
	angle: number;
	/** Opacidad de la figura, de 0 a 1. */
	opacity: number;
	fill: string;
	border: string;
	background: string;
	/** Sin fondo: la trama se queda transparente y deja ver lo que haya debajo. */
	transparent: boolean;
}

interface Shape {
	id: string;
	label: string;
	icon: string;
	/** De línea: no lleva relleno, solo borde. */
	line?: boolean;
	draw: (size: number, scale: number, stroke: number) => string;
}

/** Dos decimales como mucho y sin ceros de más: el SVG se lee mejor. */
function n(value: number) {
	return String(Number(value.toFixed(2)));
}

/** Solo hex de seis dígitos: lo que sale del selector de color y nada más. */
function safeColor(value: string, fallback: string) {
	return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : fallback;
}

export const SHAPES: readonly Shape[] = [
	{
		id: 'puntos',
		label: 'Puntos',
		icon: 'grid-dots',
		draw: (s, f, w) => {
			const r = Math.max(0.5, (f * s) / 2 - w / 2);
			return `<circle cx="${n(s / 2)}" cy="${n(s / 2)}" r="${n(r)}"/>`;
		},
	},
	{
		id: 'cuadros',
		label: 'Cuadros',
		icon: 'square',
		draw: (s, f, w) => {
			const a = Math.max(1, f * s - w);
			return `<rect x="${n((s - a) / 2)}" y="${n((s - a) / 2)}" width="${n(a)}" height="${n(a)}"/>`;
		},
	},
	{
		id: 'damero',
		label: 'Damero',
		icon: 'layout-grid',
		draw: (s, f) => {
			// Con la escala al máximo sale el damero de toda la vida; por debajo,
			// dos hileras de cuadros a contrapié.
			const a = (f * s) / 2;
			const one = `<rect x="${n(s / 4 - a / 2)}" y="${n(s / 4 - a / 2)}" width="${n(a)}" height="${n(a)}"/>`;
			const two = `<rect x="${n((3 * s) / 4 - a / 2)}" y="${n((3 * s) / 4 - a / 2)}" width="${n(a)}" height="${n(a)}"/>`;
			return one + two;
		},
	},
	{
		id: 'rejilla',
		label: 'Rejilla',
		icon: 'grid-4x4',
		line: true,
		draw: (s, f) => {
			// Los trazos van en los cuatro bordes de la baldosa: cada uno se lleva
			// clipada la mitad de su grosor, y la mitad que falta la pone la
			// baldosa de al lado. Con menos escala la cuadrícula queda a rayas.
			const a = f * s;
			const from = (s - a) / 2;
			const d = [
				`M${n(from)} 0 h${n(a)}`,
				`M${n(from)} ${n(s)} h${n(a)}`,
				`M0 ${n(from)} v${n(a)}`,
				`M${n(s)} ${n(from)} v${n(a)}`,
			].join(' ');
			return `<path d="${d}"/>`;
		},
	},
	{
		id: 'diagonales',
		label: 'Diagonales',
		icon: 'line',
		line: true,
		draw: (s, f) => {
			// Un trazo por el centro y otro por las esquinas: son la misma familia
			// de rectas, pero dibujarlos los dos evita el corte en el borde.
			const h = (f * s) / 2;
			const dash = (cx: number, cy: number) =>
				`M${n(cx - h)} ${n(cy + h)} L${n(cx + h)} ${n(cy - h)}`;
			return `<path d="${dash(s / 2, s / 2)} ${dash(0, 0)} ${dash(s, s)}"/>`;
		},
	},
	{
		id: 'cruces',
		label: 'Cruces',
		icon: 'plus',
		line: true,
		draw: (s, f) => {
			const a = f * s;
			return `<path d="M${n(s / 2)} ${n((s - a) / 2)} v${n(a)} M${n((s - a) / 2)} ${n(s / 2)} h${n(a)}"/>`;
		},
	},
	{
		id: 'triangulos',
		label: 'Triángulos',
		icon: 'triangle',
		draw: (s, f, w) => {
			const a = Math.max(1, f * s - w);
			const top = (s - a) / 2;
			return `<path d="M${n(s / 2)} ${n(top)} L${n((s + a) / 2)} ${n(top + a)} L${n((s - a) / 2)} ${n(top + a)} Z"/>`;
		},
	},
	{
		id: 'ondas',
		label: 'Ondas',
		icon: 'wave-sine',
		line: true,
		draw: (s, f) => {
			const amp = (f * s) / 4;
			return `<path d="M0 ${n(s / 2)} q${n(s / 4)} ${n(-amp * 2)} ${n(s / 2)} 0 t${n(s / 2)} 0"/>`;
		},
	},
	{
		id: 'zigzag',
		label: 'Zigzag',
		icon: 'wave-saw-tool',
		line: true,
		draw: (s, f) => {
			const amp = (f * s) / 4;
			return `<path d="M0 ${n(s / 2 + amp)} L${n(s / 2)} ${n(s / 2 - amp)} L${n(s)} ${n(s / 2 + amp)}"/>`;
		},
	},
	{
		id: 'escamas',
		label: 'Escamas',
		icon: 'circle-half',
		line: true,
		draw: (s, f) => {
			// Dos hileras por baldosa, la de en medio desplazada media: así al
			// repetirse quedan como las tejas. La cuarta va en el borde de arriba
			// para que las puntas de la de abajo no salgan cortadas.
			const arc = `a${n(s / 2)} ${n((f * s) / 2)} 0 0 1 ${n(s)} 0`;
			const d = [`M0 ${n(s)} ${arc}`, `M${n(-s / 2)} ${n(s / 2)} ${arc}`, `M${n(s / 2)} ${n(s / 2)} ${arc}`, `M0 0 ${arc}`].join(' ');
			return `<path d="${d}"/>`;
		},
	},
];

export const DEFAULT_PATTERN: Pattern = {
	shape: 'puntos',
	size: 28,
	scale: 0.3,
	stroke: 0,
	angle: 0,
	opacity: 1,
	fill: '#c2410c',
	border: '#e8d9c8',
	background: '#fdf6ef',
	transparent: false,
};

/** Recetas para arrancar con algo puesto en vez de con la baldosa vacía. */
export const RECIPES: readonly { label: string; pattern: Pattern }[] = [
	{ label: 'Topos', pattern: DEFAULT_PATTERN },
	{
		label: 'Cuadrícula',
		pattern: { ...DEFAULT_PATTERN, shape: 'rejilla', size: 34, scale: 1, stroke: 1, border: '#e8d9c8' },
	},
	{
		label: 'Papel',
		pattern: {
			...DEFAULT_PATTERN,
			shape: 'cruces',
			size: 40,
			scale: 0.25,
			stroke: 1,
			border: '#7a6152',
			opacity: 0.5,
		},
	},
	{
		label: 'Rayas',
		pattern: { ...DEFAULT_PATTERN, shape: 'diagonales', size: 20, scale: 1, stroke: 4, border: '#e8d9c8' },
	},
	{
		label: 'Tejado',
		pattern: {
			...DEFAULT_PATTERN,
			shape: 'escamas',
			size: 44,
			scale: 1,
			stroke: 1.5,
			border: '#c2410c',
			opacity: 0.6,
		},
	},
	{
		label: 'Marea',
		pattern: { ...DEFAULT_PATTERN, shape: 'ondas', size: 52, scale: 0.8, stroke: 2, border: '#a75f2b', angle: 12 },
	},
];

export function shapeOf(id: string) {
	return SHAPES.find((shape) => shape.id === id) ?? SHAPES[0];
}

/**
 * El SVG entero. Sin medidas sale a 100%, que es lo que quiere un
 * background-image; con medidas sale un fichero de ese tamaño para descargar.
 */
export function buildSvg(pattern: Pattern, box?: { width: number; height: number }) {
	const shape = shapeOf(pattern.shape);
	const size = Math.max(4, pattern.size);
	const stroke = Math.max(0, pattern.stroke);
	const fill = safeColor(pattern.fill, DEFAULT_PATTERN.fill);
	const border = safeColor(pattern.border, DEFAULT_PATTERN.border);
	const background = safeColor(pattern.background, DEFAULT_PATTERN.background);

	const paint = [
		shape.line ? 'fill="none"' : `fill="${fill}"`,
		stroke > 0 ? `stroke="${border}" stroke-width="${n(stroke)}" stroke-linecap="round"` : '',
		pattern.opacity < 1 ? `opacity="${n(pattern.opacity)}"` : '',
	]
		.filter(Boolean)
		.join(' ');

	const angle = ((pattern.angle % 360) + 360) % 360;
	const turn = angle ? ` patternTransform="rotate(${n(angle)})"` : '';
	const tile = `<g ${paint}>${shape.draw(size, pattern.scale, stroke)}</g>`;
	const measures = box ? `width="${box.width}" height="${box.height}"` : 'width="100%" height="100%"';
	const floor = pattern.transparent ? '' : `\n\t<rect width="100%" height="100%" fill="${background}"/>`;

	return `<svg xmlns="http://www.w3.org/2000/svg" ${measures}>
\t<defs>
\t\t<pattern id="trama" width="${n(size)}" height="${n(size)}" patternUnits="userSpaceOnUse"${turn}>
\t\t\t${tile}
\t\t</pattern>
\t</defs>${floor}
\t<rect width="100%" height="100%" fill="url(#trama)"/>
</svg>`;
}

/**
 * El SVG metido en una URL de datos. Se escapa a mano lo justo —y no con
 * encodeURIComponent— para que el CSS que se copia siga siendo legible.
 */
export function toDataUri(svg: string) {
	const flat = svg.replace(/\s+/g, ' ').trim();
	const escaped = flat.replace(
		/[<>#%"{}|\\^`[\]]/g,
		(char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
	);
	return `data:image/svg+xml,${escaped}`;
}

/** Las dos líneas de CSS que hay que pegar para tener el fondo puesto. */
export function toCss(pattern: Pattern, svg: string) {
	const color = pattern.transparent
		? ''
		: `background-color: ${safeColor(pattern.background, DEFAULT_PATTERN.background)};\n`;
	return `${color}background-image: url("${toDataUri(svg)}");`;
}
