/*
 * Conversión de colores a mano. El estado vive en OKLCH porque es el espacio
 * más cómodo para tocar claridad, saturación y tono por separado; el resto de
 * formatos se derivan de ahí. Los canales sRGB van de 0 a 1 hasta el último
 * momento, que es cuando se redondean.
 */

export interface Rgb {
	r: number;
	g: number;
	b: number;
}

export interface Color {
	/** Claridad OKLCH, de 0 a 1. */
	l: number;
	/** Croma OKLCH; en sRGB no pasa de ~0.37. */
	c: number;
	/** Tono en grados, de 0 a 360. */
	h: number;
	alpha: number;
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function srgbToLinear(value: number) {
	return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value: number) {
	return value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
}

function rgbToOklab({ r, g, b }: Rgb) {
	const lr = srgbToLinear(r);
	const lg = srgbToLinear(g);
	const lb = srgbToLinear(b);

	const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
	const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
	const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

	return {
		L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
	};
}

function oklabToRgb(L: number, A: number, B: number): Rgb {
	const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
	const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
	const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;

	return {
		r: linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
		g: linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
		b: linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
	};
}

export function toOklab(color: Color) {
	const radians = (color.h * Math.PI) / 180;
	return { L: color.l, a: color.c * Math.cos(radians), b: color.c * Math.sin(radians) };
}

/** Puede salirse de 0..1: eso significa que el color no cabe en sRGB. */
export function toRgbRaw(color: Color): Rgb {
	const { L, a, b } = toOklab(color);
	return oklabToRgb(L, a, b);
}

export function toRgb(color: Color): Rgb {
	const raw = toRgbRaw(color);
	return { r: clamp(raw.r), g: clamp(raw.g), b: clamp(raw.b) };
}

export function outOfGamut(color: Color) {
	const raw = toRgbRaw(color);
	return [raw.r, raw.g, raw.b].some((value) => value < -0.001 || value > 1.001);
}

export function fromRgb(rgb: Rgb, alpha = 1): Color {
	const { L, a, b } = rgbToOklab(rgb);
	const c = Math.sqrt(a * a + b * b);
	const h = c < 1e-6 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
	return { l: L, c, h, alpha };
}

function rgbToHsl({ r, g, b }: Rgb) {
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const delta = max - min;
	const l = (max + min) / 2;

	let h = 0;
	if (delta > 0) {
		if (max === r) h = ((g - b) / delta) % 6;
		else if (max === g) h = (b - r) / delta + 2;
		else h = (r - g) / delta + 4;
		h = (h * 60 + 360) % 360;
	}

	const s = delta === 0 || l === 0 || l === 1 ? 0 : delta / (1 - Math.abs(2 * l - 1));
	return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): Rgb {
	const hue = ((h % 360) + 360) % 360;
	const chroma = (1 - Math.abs(2 * l - 1)) * s;
	const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
	const m = l - chroma / 2;
	const [r, g, b] = (
		hue < 60 ? [chroma, x, 0]
		: hue < 120 ? [x, chroma, 0]
		: hue < 180 ? [0, chroma, x]
		: hue < 240 ? [0, x, chroma]
		: hue < 300 ? [x, 0, chroma]
		: [chroma, 0, x]
	) as [number, number, number];
	return { r: r + m, g: g + m, b: b + m };
}

function hwbToRgb(h: number, w: number, b: number): Rgb {
	if (w + b >= 1) {
		const gray = w / (w + b);
		return { r: gray, g: gray, b: gray };
	}
	const base = hslToRgb(h, 1, 0.5);
	const mix = (value: number) => value * (1 - w - b) + w;
	return { r: mix(base.r), g: mix(base.g), b: mix(base.b) };
}

function round(value: number, decimals = 0) {
	const factor = 10 ** decimals;
	// El +0 evita que salga «-0» en los formatos.
	return Math.round(value * factor) / factor + 0;
}

const hex2 = (value: number) =>
	Math.round(clamp(value) * 255)
		.toString(16)
		.padStart(2, '0');

/** Por debajo de esto el alfa ya no se pinta como opaco al redondear. */
const opaque = (alpha: number) => alpha >= 0.9995;

export function toHex(color: Color) {
	const { r, g, b } = toRgb(color);
	const base = `#${hex2(r)}${hex2(g)}${hex2(b)}`;
	return opaque(color.alpha) ? base : `${base}${hex2(color.alpha)}`;
}

export interface Format {
	id: string;
	label: string;
	value: string;
}

export function formats(color: Color): Format[] {
	const rgb = toRgb(color);
	const hsl = rgbToHsl(rgb);
	const max = Math.max(rgb.r, rgb.g, rgb.b);
	const white = Math.min(rgb.r, rgb.g, rgb.b);
	const oklab = toOklab(color);
	const tail = opaque(color.alpha) ? '' : ` / ${round(color.alpha, 3)}`;
	const k = 1 - max;
	const ink = (value: number) => (max === 0 ? 0 : ((max - value) / max) * 100);

	return [
		{ id: 'hex', label: 'HEX', value: toHex(color) },
		{
			id: 'rgb',
			label: 'RGB',
			value: `rgb(${round(rgb.r * 255)} ${round(rgb.g * 255)} ${round(rgb.b * 255)}${tail})`,
		},
		{
			id: 'hsl',
			label: 'HSL',
			value: `hsl(${round(hsl.h, 1)} ${round(hsl.s * 100, 1)}% ${round(hsl.l * 100, 1)}%${tail})`,
		},
		{
			id: 'hwb',
			label: 'HWB',
			value: `hwb(${round(hsl.h, 1)} ${round(white * 100, 1)}% ${round(k * 100, 1)}%${tail})`,
		},
		{
			id: 'oklch',
			label: 'OKLCH',
			value: `oklch(${round(color.l * 100, 2)}% ${round(color.c, 4)} ${round(color.h, 2)}${tail})`,
		},
		{
			id: 'oklab',
			label: 'OKLAB',
			value: `oklab(${round(oklab.L * 100, 2)}% ${round(oklab.a, 4)} ${round(oklab.b, 4)}${tail})`,
		},
		{
			id: 'cmyk',
			label: 'CMYK',
			value: `cmyk(${round(ink(rgb.r), 1)}% ${round(ink(rgb.g), 1)}% ${round(ink(rgb.b), 1)}% ${round(k * 100, 1)}%)`,
		},
	];
}

const NUMBER = String.raw`[+-]?(?:\d+\.?\d*|\.\d+)`;

/** Número suelto o porcentaje del máximo indicado. */
function num(token: string | undefined, scale = 1): number | null {
	if (token === undefined) return null;
	if (token === 'none') return 0;
	const match = token.match(new RegExp(`^(${NUMBER})(%?)$`));
	if (!match) return null;
	const value = Number(match[1]);
	return match[2] ? (value / 100) * scale : value;
}

/** En HSL y compañía un número sin unidad ya cuenta como porcentaje. */
function pct(token: string | undefined): number | null {
	if (token === undefined) return null;
	if (token === 'none') return 0;
	const match = token.match(new RegExp(`^(${NUMBER})%?$`));
	return match ? Number(match[1]) / 100 : null;
}

function angle(token: string | undefined): number | null {
	if (token === undefined) return null;
	if (token === 'none') return 0;
	const match = token.match(new RegExp(`^(${NUMBER})(deg|rad|grad|turn)?$`));
	if (!match) return null;
	const value = Number(match[1]);
	if (match[2] === 'rad') return (value * 180) / Math.PI;
	if (match[2] === 'grad') return value * 0.9;
	if (match[2] === 'turn') return value * 360;
	return value;
}

function splitArgs(body: string) {
	const [main, afterSlash] = body.split('/');
	const parts = main.trim().split(/[\s,]+/).filter(Boolean);
	let alphaToken = afterSlash?.trim();
	if (alphaToken === undefined && parts.length === 4) alphaToken = parts.pop();
	const alpha = alphaToken === undefined ? 1 : num(alphaToken, 1);
	return { parts, alpha };
}

function parseHex(text: string): Color | null {
	const match = text.match(/^#([0-9a-f]{3,8})$/);
	if (!match) return null;
	const digits = match[1];
	if (![3, 4, 6, 8].includes(digits.length)) return null;

	const short = digits.length < 6;
	const size = short ? 1 : 2;
	const channel = (index: number) => {
		const chunk = digits.slice(index * size, index * size + size);
		return parseInt(short ? chunk + chunk : chunk, 16) / 255;
	};

	const hasAlpha = digits.length === 4 || digits.length === 8;
	return fromRgb({ r: channel(0), g: channel(1), b: channel(2) }, hasAlpha ? channel(3) : 1);
}

/**
 * Acepta lo que la gente escribe: hex, rgb(), hsl(), hwb(), oklch(), oklab() y
 * color(srgb ...), con sintaxis de comas o de espacios. Devuelve null si no lo
 * entiende, y ahí ya decide quien llama si prueba otra cosa.
 */
export function parseColor(input: string): Color | null {
	const text = input.trim().toLowerCase();
	if (!text) return null;

	const hex = parseHex(text.startsWith('#') ? text : `#${text}`);
	if (hex) return hex;

	const call = text.match(/^([a-z]+)\(([^()]*)\)$/);
	if (!call) return null;

	const [, name, body] = call;
	const { parts, alpha } = splitArgs(name === 'color' ? body.replace(/^srgb\s+/, '') : body);
	if (alpha === null || parts.length < 3) return null;
	const a = clamp(alpha);

	if (name === 'rgb' || name === 'rgba') {
		const values = parts.slice(0, 3).map((part) => num(part, 255));
		if (values.some((value) => value === null)) return null;
		const [r, g, b] = values as number[];
		return fromRgb({ r: clamp(r / 255), g: clamp(g / 255), b: clamp(b / 255) }, a);
	}

	if (name === 'color') {
		if (!/^srgb\b/.test(body.trim())) return null;
		const values = parts.slice(0, 3).map((part) => num(part, 1));
		if (values.some((value) => value === null)) return null;
		const [r, g, b] = values as number[];
		return fromRgb({ r: clamp(r), g: clamp(g), b: clamp(b) }, a);
	}

	if (name === 'hsl' || name === 'hsla' || name === 'hwb') {
		const h = angle(parts[0]);
		const second = pct(parts[1]);
		const third = pct(parts[2]);
		if (h === null || second === null || third === null) return null;
		const rgb =
			name === 'hwb' ?
				hwbToRgb(h, clamp(second), clamp(third))
			:	hslToRgb(h, clamp(second), clamp(third));
		return fromRgb({ r: clamp(rgb.r), g: clamp(rgb.g), b: clamp(rgb.b) }, a);
	}

	if (name === 'oklch') {
		const l = num(parts[0], 1);
		const c = num(parts[1], 0.4);
		const h = angle(parts[2]);
		if (l === null || c === null || h === null) return null;
		return { l: clamp(l), c: Math.max(0, c), h: ((h % 360) + 360) % 360, alpha: a };
	}

	if (name === 'oklab') {
		const l = num(parts[0], 1);
		const A = num(parts[1], 0.4);
		const B = num(parts[2], 0.4);
		if (l === null || A === null || B === null) return null;
		const c = Math.sqrt(A * A + B * B);
		const h = c < 1e-6 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
		return { l: clamp(l), c, h, alpha: a };
	}

	return null;
}
