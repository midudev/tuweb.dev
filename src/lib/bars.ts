/**
 * El diseñador de barras: una lista de barras (etiqueta, valor y color) y unos
 * cuantos mandos de forma. Sale un SVG que se sostiene solo, con su fondo y sus
 * colores dentro. Lo pinta el navegador; aquí no se guarda ni se envía nada.
 */
import { MONO, PALETTE, SURFACE, type Theme, esc, fmt, niceScale, parseNumber } from './chart';

export type Orientation = 'vertical' | 'horizontal';
export type Order = 'libre' | 'mayor' | 'menor';

export interface Barra {
	label: string;
	value: string;
	color: string;
}

export interface Diseno {
	title: string;
	unit: string;
	orientation: Orientation;
	order: Order;
	/** Hueco entre barras, en % del sitio de cada una. */
	gap: number;
	showValues: boolean;
	showGrid: boolean;
	theme: Theme;
	bars: Barra[];
}

export const MAX_BARS = 24;

export const DEFAULT_DISENO: Diseno = {
	title: 'Lenguajes que más usamos',
	unit: ' %',
	orientation: 'vertical',
	order: 'libre',
	gap: 30,
	showValues: true,
	showGrid: true,
	theme: 'claro',
	bars: [
		['TypeScript', '38'],
		['Python', '27'],
		['Rust', '12'],
		['Go', '10'],
		['PHP', '8'],
	].map(([label, value], i) => ({ label, value, color: PALETTE.claro[i] })),
};

const W = 800;
const PAD = 40;
/** Geist Mono es de ancho fijo: medir un texto es contar letras. */
const CHAR = 0.6;
const PIXEL = 'Geist Pixel, Geist Mono Variable, monospace';

const r1 = (n: number) => Math.round(n * 10) / 10;
const safe = (value: string, fallback: string) => (/^#[0-9a-f]{6}$/i.test(value) ? value : fallback);
const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, Math.max(1, max - 1))}…` : value);

function text(x: number, y: number, content: string, size: number, fill: string, anchor = 'start', pixel = false) {
	const extra = `${anchor === 'start' ? '' : ` text-anchor="${anchor}"`}${pixel ? ` font-family="${PIXEL}"` : ''}`;
	return `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" fill="${fill}"${extra}>${esc(content)}</text>`;
}

/** El SVG entero. `fontCss` solo se pasa para el PNG, que no ve las fuentes de la página. */
export function buildBars(d: Diseno, options: { fontCss?: string } = {}) {
	const t = SURFACE[d.theme];
	const out: string[] = [];
	let top = PAD;

	if (d.title.trim()) {
		out.push(text(PAD, top + 24, clip(d.title.trim(), Math.floor((W - PAD * 2) / (28 * CHAR))), 28, t.fg, 'start', true));
		top += 56;
	}

	const barras = d.bars.map((b, i) => ({
		label: b.label.trim() || `Barra ${i + 1}`,
		value: parseNumber(b.value),
		color: safe(b.color, t.muted),
	}));
	if (d.order !== 'libre') {
		const signo = d.order === 'mayor' ? -1 : 1;
		barras.sort((a, b) => signo * ((a.value ?? 0) - (b.value ?? 0)));
	}

	const numeros = barras.map((b) => b.value).filter((v): v is number => v !== null);
	const horizontal = d.orientation === 'horizontal';
	const n = barras.length;
	let H = horizontal ? top + n * 40 + 30 + PAD : 480;

	if (!n || !numeros.length) {
		H = top + 200 + PAD;
		out.push(text(W / 2, top + 100, 'Escribe algún valor y sale el gráfico.', 15, t.muted, 'middle'));
	} else {
		const { lo, hi, ticks } = niceScale(Math.min(0, ...numeros), Math.max(0, ...numeros));
		const valor = (v: number) => `${fmt(v)}${d.unit}`;
		const hueco = Math.min(90, Math.max(0, d.gap)) / 100;
		const tip = (b: (typeof barras)[number], v: number) => `<title>${esc(`${b.label}: ${valor(v)}`)}</title>`;

		if (horizontal) {
			const labelW = Math.min(200, Math.max(...barras.map((b) => b.label.length)) * 13 * CHAR) + 12;
			const valueW = d.showValues ? Math.max(...numeros.map((v) => valor(v).length)) * 12 * CHAR + 10 : 0;
			const x0 = PAD + labelW;
			const x1 = W - PAD - valueW;
			const y1 = top + n * 40;
			const X = (v: number) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);

			ticks.forEach((tick) => {
				const tx = r1(X(tick));
				if (d.showGrid || tick === 0) {
					out.push(`<line x1="${tx}" x2="${tx}" y1="${r1(top)}" y2="${r1(y1)}" stroke="${tick === 0 ? t.axis : t.line}"/>`);
				}
				out.push(text(tx, y1 + 20, fmt(tick), 12, t.muted, 'middle'));
			});

			const alto = 40 * (1 - hueco);
			barras.forEach((b, i) => {
				const cy = top + 40 * (i + 0.5);
				out.push(text(x0 - 10, cy + 4, clip(b.label, Math.floor((labelW - 12) / (13 * CHAR))), 13, t.fg, 'end'));
				if (b.value === null) return;
				const left = X(Math.min(b.value, 0));
				const right = X(Math.max(b.value, 0));
				out.push(
					`<rect x="${r1(left)}" y="${r1(cy - alto / 2)}" width="${r1(right - left)}" height="${r1(Math.max(alto, 1))}" fill="${b.color}">${tip(b, b.value)}</rect>`,
				);
				if (d.showValues) {
					const negativo = b.value < 0;
					out.push(text(negativo ? left - 6 : right + 6, cy + 4, valor(b.value), 12, t.fg, negativo ? 'end' : 'start'));
				}
			});
		} else {
			const axisW = Math.max(...ticks.map((v) => fmt(v).length)) * 12 * CHAR + 12;
			const x0 = PAD + axisW;
			const x1 = W - PAD;
			const y0 = top + (d.showValues ? 20 : 0);
			const y1 = H - PAD - 28;
			const Y = (v: number) => y1 - ((v - lo) / (hi - lo)) * (y1 - y0);

			ticks.forEach((tick) => {
				const ty = r1(Y(tick));
				if (d.showGrid || tick === 0) {
					out.push(`<line x1="${r1(x0)}" x2="${r1(x1)}" y1="${ty}" y2="${ty}" stroke="${tick === 0 ? t.axis : t.line}"/>`);
				}
				out.push(text(x0 - 10, ty + 4, fmt(tick), 12, t.muted, 'end'));
			});

			const band = (x1 - x0) / n;
			const ancho = Math.max(band * (1 - hueco), 1);
			const letras = Math.max(3, Math.floor((band - 4) / (13 * CHAR)));
			barras.forEach((b, i) => {
				const cx = x0 + band * (i + 0.5);
				out.push(text(cx, y1 + 22, clip(b.label, letras), 13, t.muted, 'middle'));
				if (b.value === null) return;
				const arriba = Y(Math.max(b.value, 0));
				const abajo = Y(Math.min(b.value, 0));
				out.push(
					`<rect x="${r1(cx - ancho / 2)}" y="${r1(arriba)}" width="${r1(ancho)}" height="${r1(abajo - arriba)}" fill="${b.color}">${tip(b, b.value)}</rect>`,
				);
				const etiqueta = valor(b.value);
				// Si el número no cabe encima de su barra, mejor no ponerlo que pisar a la vecina.
				if (d.showValues && etiqueta.length * 12 * CHAR <= band) {
					out.push(text(cx, b.value >= 0 ? arriba - 6 : abajo + 15, etiqueta, 12, t.fg, 'middle'));
				}
			});
		}
	}

	H = Math.round(H);
	const titulo = d.title.trim() ? `<title>${esc(d.title.trim())}</title>` : '';
	const estilo = options.fontCss ? `<defs><style>${options.fontCss}</style></defs>` : '';
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${MONO}" role="img">` +
		`${titulo}${estilo}<rect width="${W}" height="${H}" fill="${t.bg}"/>${out.join('')}</svg>`;
	return { svg, width: W, height: H };
}
