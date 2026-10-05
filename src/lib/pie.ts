/**
 * El diseñador de tartas: una lista de porciones (etiqueta, valor y color) y
 * unos mandos de forma. Sale un SVG que se sostiene solo, con su fondo y sus
 * colores dentro. Lo pinta el navegador; aquí no se guarda ni se envía nada.
 */
import { MONO, PALETTE, SURFACE, type Theme, esc, fmt, parseNumber } from './chart';

export type Etiquetas = 'porcentaje' | 'valor' | 'nada';
export type Orden = 'libre' | 'mayor';

export interface Porcion {
	label: string;
	value: string;
	color: string;
}

export interface Tarta {
	title: string;
	unit: string;
	/** El hueco del centro, en % del radio: 0 es tarta, más es anillo. */
	hole: number;
	/** Separación entre porciones, en px. */
	gap: number;
	labels: Etiquetas;
	order: Orden;
	showLegend: boolean;
	theme: Theme;
	slices: Porcion[];
}

export const MAX_SLICES = 16;

export const DEFAULT_TARTA: Tarta = {
	title: 'En qué se nos va el día',
	unit: ' h',
	hole: 0,
	gap: 2,
	labels: 'porcentaje',
	order: 'libre',
	showLegend: true,
	theme: 'claro',
	slices: [
		['Dormir', '8'],
		['Trabajar', '8'],
		['Comer', '2'],
		['Moverse', '1,5'],
		['Lo demás', '4,5'],
	].map(([label, value], i) => ({ label, value, color: PALETTE.claro[i] })),
};

const W = 800;
const PAD = 40;
const R = 170;
/** Geist Mono es de ancho fijo: medir un texto es contar letras. */
const CHAR = 0.6;
const PIXEL = 'Geist Pixel, Geist Mono Variable, monospace';

const r1 = (n: number) => Math.round(n * 10) / 10;
const safe = (value: string, fallback: string) => (/^#[0-9a-f]{6}$/i.test(value) ? value : fallback);
const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, Math.max(1, max - 1))}…` : value);
const pct = (frac: number) => `${fmt(Math.round(frac * 1000) / 10)} %`;

function text(x: number, y: number, content: string, size: number, fill: string, anchor = 'start', pixel = false) {
	const extra = `${anchor === 'start' ? '' : ` text-anchor="${anchor}"`}${pixel ? ` font-family="${PIXEL}"` : ''}`;
	return `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" fill="${fill}"${extra}>${esc(content)}</text>`;
}

/** Letra clara u oscura según lo claro que sea el trozo de debajo. */
function tinta(color: string) {
	const [r, g, b] = [1, 3, 5].map((k) => parseInt(color.slice(k, k + 2), 16) / 255);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? '#17110d' : '#ffffff';
}

/** El SVG entero. `fontCss` solo se pasa para el PNG, que no ve las fuentes de la página. */
export function buildPie(d: Tarta, options: { fontCss?: string } = {}) {
	const t = SURFACE[d.theme];
	const out: string[] = [];
	let top = PAD;

	if (d.title.trim()) {
		out.push(text(PAD, top + 24, clip(d.title.trim(), Math.floor((W - PAD * 2) / (28 * CHAR))), 28, t.fg, 'start', true));
		top += 64;
	}

	// `i` es el sitio en la lista, que no cambia al ordenar: con él la porción pinchada encuentra su campo.
	const porciones = d.slices
		.map((s, i) => ({ i, label: s.label.trim() || `Porción ${i + 1}`, value: parseNumber(s.value) ?? 0, color: safe(s.color, t.muted) }))
		.filter((p) => p.value > 0);
	if (d.order === 'mayor') porciones.sort((a, b) => b.value - a.value);

	const total = porciones.reduce((sum, p) => sum + p.value, 0);
	const leyenda = d.showLegend && porciones.length > 0;
	const cx = leyenda ? PAD + R + 10 : W / 2;
	const cy = top + R + 10;
	let H = cy + R + 10 + PAD;

	if (!porciones.length) {
		out.push(text(W / 2, cy, 'Escribe algún valor positivo y sale la tarta.', 15, t.muted, 'middle'));
	} else {
		const hueco = Math.min(80, Math.max(0, d.hole));
		const ri = r1((R * hueco) / 100);
		const sep = Math.min(12, Math.max(0, d.gap));
		const pt = (a: number, radio: number) => `${r1(cx + Math.cos(a) * radio)} ${r1(cy + Math.sin(a) * radio)}`;
		const valor = (v: number) => `${fmt(v)}${d.unit}`;
		let angle = -Math.PI / 2;

		for (const p of porciones) {
			const frac = p.value / total;
			const end = angle + frac * Math.PI * 2;
			const tip = `<title>${esc(`${p.label}: ${valor(p.value)} (${pct(frac)})`)}</title>`;
			const borde = sep && porciones.length > 1 ? ` stroke="${t.bg}" stroke-width="${sep}" stroke-linejoin="round"` : '';
			let forma: string;
			if (porciones.length === 1) {
				// Un trozo solo es el círculo entero; con hueco, dos círculos y evenodd.
				const anillo = ri > 0 ? `M${r1(cx)} ${r1(cy - ri)}a${ri} ${ri} 0 1 0 0.01 0Z` : '';
				forma = `d="M${r1(cx)} ${r1(cy - R)}a${R} ${R} 0 1 0 0.01 0Z${anillo}" fill-rule="evenodd"`;
			} else {
				const large = frac > 0.5 ? 1 : 0;
				const dentro = ri > 0 ? `L${pt(end, ri)}A${ri} ${ri} 0 ${large} 0 ${pt(angle, ri)}` : `L${r1(cx)} ${r1(cy)}`;
				forma = `d="M${pt(angle, R)}A${R} ${R} 0 ${large} 1 ${pt(end, R)}${dentro}Z"`;
			}
			out.push(`<path data-porcion="${p.i}" ${forma} fill="${p.color}"${borde}>${tip}</path>`);

			// La etiqueta va dentro, en mitad del grosor, si el trozo da para ella.
			const etiqueta = d.labels === 'porcentaje' ? pct(frac) : d.labels === 'valor' ? valor(p.value) : '';
			if (etiqueta && frac >= 0.05) {
				const mid = (angle + end) / 2;
				const radio = porciones.length === 1 && !ri ? 0 : (R + ri) / 2;
				out.push(
					text(cx + Math.cos(mid) * radio, cy + Math.sin(mid) * radio + 5, etiqueta, 14, tinta(p.color), 'middle'),
				);
			}
			angle = end;
		}

		// En el anillo, el total va en el hueco si cabe.
		const suma = valor(total);
		if (ri >= 60 && suma.length * 26 * CHAR <= ri * 1.6) {
			out.push(text(cx, cy + 6, suma, 26, t.fg, 'middle', true));
			out.push(text(cx, cy + 28, 'total', 13, t.muted, 'middle'));
		}

		if (leyenda) {
			const x = cx + R + 50;
			const letras = Math.floor((W - PAD - x - 20) / (14 * CHAR));
			const alto = 30;
			// Centrada con la tarta; si es más larga, empieza bajo el título y estira el dibujo.
			let y = Math.max(top, cy - (porciones.length * alto) / 2);
			for (const p of porciones) {
				const linea = clip(`${p.label} · ${pct(p.value / total)}`, letras);
				out.push(`<rect x="${r1(x)}" y="${r1(y + 4)}" width="12" height="12" fill="${p.color}"/>`);
				out.push(text(x + 20, y + 15, linea, 14, t.fg));
				y += alto;
			}
			H = Math.max(H, y + PAD);
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
