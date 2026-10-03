/**
 * El diseñador de líneas: unas etiquetas para el eje, varias series con sus
 * valores, su color y su trazo, y la tendencia de cada una por mínimos
 * cuadrados. Sale un SVG que se sostiene solo. Lo pinta el navegador; aquí no
 * se guarda ni se envía nada.
 */
import { MONO, PALETTE, SURFACE, type Theme, esc, fmt, niceScale, parseNumber } from './chart';

export type Dash = 'solida' | 'discontinua' | 'puntos';

export interface SerieLinea {
	name: string;
	color: string;
	/** Los valores tal cual se escriben: separados por espacios o punto y coma. */
	values: string;
	dash: Dash;
}

export interface DisenoLineas {
	title: string;
	unit: string;
	/** Las etiquetas del eje, separadas por comas. */
	labels: string;
	smooth: boolean;
	stroke: number;
	showPoints: boolean;
	showGrid: boolean;
	showTrend: boolean;
	fillArea: boolean;
	showLegend: boolean;
	theme: Theme;
	series: SerieLinea[];
}

export const MAX_LINEAS = PALETTE.claro.length;
export const MAX_PUNTOS = 60;

export const DASHES: { id: Dash; label: string }[] = [
	{ id: 'solida', label: 'Sólida' },
	{ id: 'discontinua', label: 'Discontinua' },
	{ id: 'puntos', label: 'Puntos' },
];

export const DEFAULT_LINEAS: DisenoLineas = {
	title: 'Usuarios activos',
	unit: '',
	labels: 'Ene, Feb, Mar, Abr, May, Jun, Jul, Ago',
	smooth: true,
	stroke: 3,
	showPoints: true,
	showGrid: true,
	showTrend: false,
	fillArea: false,
	showLegend: true,
	theme: 'claro',
	series: [
		{ name: 'Web', values: '120 135 128 150 172 168 190 210', dash: 'solida' },
		{ name: 'App', values: '80 92 110 105 124 140 138 160', dash: 'solida' },
		{ name: 'API', values: '60 58 64 61 70 66 72 75', dash: 'discontinua' },
	].map((s, i) => ({ ...s, color: PALETTE.claro[i] })),
};

const W = 800;
const PAD = 40;
/** Geist Mono es de ancho fijo: medir un texto es contar letras. */
const CHAR = 0.6;
const PIXEL = 'Geist Pixel, Geist Mono Variable, monospace';
const TRAZOS: Record<Dash, string> = { solida: '', discontinua: '10 7', puntos: '1 7' };

const r1 = (n: number) => Math.round(n * 10) / 10;
const safe = (value: string, fallback: string) => (/^#[0-9a-f]{6}$/i.test(value) ? value : fallback);
const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, Math.max(1, max - 1))}…` : value);

function text(x: number, y: number, content: string, size: number, fill: string, anchor = 'start', pixel = false) {
	const extra = `${anchor === 'start' ? '' : ` text-anchor="${anchor}"`}${pixel ? ` font-family="${PIXEL}"` : ''}`;
	return `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" fill="${fill}"${extra}>${esc(content)}</text>`;
}

/** Los valores de una serie. Lo que no es número es un hueco: la línea se corta ahí. */
export function valoresDe(raw: string) {
	return raw
		.split(/[;\s]+/)
		.filter(Boolean)
		.slice(0, MAX_PUNTOS)
		.map(parseNumber);
}

export function etiquetasDe(raw: string) {
	return raw
		.split(',')
		.map((l) => l.trim())
		.slice(0, MAX_PUNTOS);
}

/** La recta que mejor se ajusta a los puntos: cuánto sube por paso y dónde empieza. */
export function tendencia(valores: (number | null)[]) {
	const p = valores.flatMap((v, i) => (v === null ? [] : [[i, v] as const]));
	if (p.length < 2) return null;
	const mx = p.reduce((s, [x]) => s + x, 0) / p.length;
	const my = p.reduce((s, [, y]) => s + y, 0) / p.length;
	const num = p.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0);
	const den = p.reduce((s, [x]) => s + (x - mx) ** 2, 0);
	const pendiente = den ? num / den : 0;
	return { pendiente, origen: my - pendiente * mx, desde: p[0][0], hasta: p[p.length - 1][0] };
}

/** Una curva que pasa por todos los puntos (Catmull-Rom pasada a Bézier). */
function trazo(p: [number, number][], suave: boolean) {
	const recta = () => p.map(([x, y], k) => `${k ? 'L' : 'M'}${r1(x)} ${r1(y)}`).join('');
	if (!suave || p.length < 3) return recta();
	let d = `M${r1(p[0][0])} ${r1(p[0][1])}`;
	for (let k = 0; k < p.length - 1; k++) {
		const [x0, y0] = p[k - 1] ?? p[k];
		const [x1, y1] = p[k];
		const [x2, y2] = p[k + 1];
		const [x3, y3] = p[k + 2] ?? p[k + 1];
		d += `C${r1(x1 + (x2 - x0) / 6)} ${r1(y1 + (y2 - y0) / 6)} ${r1(x2 - (x3 - x1) / 6)} ${r1(y2 - (y3 - y1) / 6)} ${r1(x2)} ${r1(y2)}`;
	}
	return d;
}

/** El SVG entero. `fontCss` solo se pasa para el PNG, que no ve las fuentes de la página. */
export function buildLines(d: DisenoLineas, options: { fontCss?: string } = {}) {
	const t = SURFACE[d.theme];
	const out: string[] = [];
	const grosor = Number.isFinite(d.stroke) ? Math.min(8, Math.max(1, d.stroke)) : 2;
	let top = PAD;

	if (d.title.trim()) {
		out.push(text(PAD, top + 24, clip(d.title.trim(), Math.floor((W - PAD * 2) / (28 * CHAR))), 28, t.fg, 'start', true));
		top += 52;
	}

	const series = d.series.map((s, j) => ({
		j,
		name: s.name.trim() || `Serie ${j + 1}`,
		color: safe(s.color, t.muted),
		dash: TRAZOS[s.dash] ?? '',
		valores: valoresDe(s.values),
	}));

	if (d.showLegend && series.length > 1) {
		let x = PAD;
		for (const s of series) {
			const name = clip(s.name, 24);
			const w = 30 + name.length * 13 * CHAR;
			if (x > PAD && x + w > W - PAD) {
				x = PAD;
				top += 22;
			}
			const dash = s.dash ? ` stroke-dasharray="${s.dash}"` : '';
			out.push(`<line x1="${r1(x)}" x2="${r1(x + 20)}" y1="${r1(top + 8)}" y2="${r1(top + 8)}" stroke="${s.color}" stroke-width="3" stroke-linecap="round"${dash}/>`);
			out.push(text(x + 28, top + 13, name, 13, t.fg));
			x += w + 20;
		}
		top += 34;
	}

	const etiquetas = etiquetasDe(d.labels);
	const n = Math.max(etiquetas.filter(Boolean).length, ...series.map((s) => s.valores.length), 0);
	const numeros = series.flatMap((s) => s.valores).filter((v): v is number => v !== null);
	const H = top + 340 + PAD;

	if (!n || !numeros.length) {
		out.push(text(W / 2, top + 150, 'Escribe los valores de alguna serie y sale la línea.', 15, t.muted, 'middle'));
	} else {
		const tendencias = d.showTrend ? series.map((s) => tendencia(s.valores)) : [];
		const extremos = [...numeros];
		tendencias.forEach((tr) => tr && extremos.push(tr.origen + tr.pendiente * tr.desde, tr.origen + tr.pendiente * tr.hasta));
		const { lo, hi, ticks } = niceScale(Math.min(...extremos), Math.max(...extremos));
		const valor = (v: number) => `${fmt(v)}${d.unit}`;
		const axisW = Math.max(...ticks.map((v) => fmt(v).length)) * 12 * CHAR + 12;
		const x0 = PAD + axisW + 8;
		const x1 = W - PAD - 8;
		const y0 = top + 8;
		const y1 = H - PAD - 28;
		const X = (i: number) => (n === 1 ? (x0 + x1) / 2 : x0 + (i / (n - 1)) * (x1 - x0));
		const Y = (v: number) => y1 - ((v - lo) / (hi - lo)) * (y1 - y0);
		const base = Y(Math.min(Math.max(0, lo), hi));

		ticks.forEach((tick) => {
			const ty = r1(Y(tick));
			if (d.showGrid || tick === 0 || tick === lo) {
				out.push(`<line x1="${r1(x0 - 8)}" x2="${r1(x1 + 8)}" y1="${ty}" y2="${ty}" stroke="${tick === 0 || tick === lo ? t.axis : t.line}"/>`);
			}
			out.push(text(x0 - 16, ty + 4, fmt(tick), 12, t.muted, 'end'));
		});

		// Con muchos puntos no caben todas las etiquetas: se salta de n en n.
		const paso = n > 1 ? (x1 - x0) / (n - 1) : x1 - x0;
		const cada = Math.max(1, Math.ceil(52 / paso));
		const letras = Math.max(3, Math.floor((paso * cada - 6) / (12 * CHAR)));
		const nombreDe = (i: number) => etiquetas[i] || String(i + 1);
		for (let i = 0; i < n; i += cada) out.push(text(X(i), y1 + 22, clip(nombreDe(i), letras), 12, t.muted, 'middle'));

		const tramosDe = (valores: (number | null)[]) => {
			const lista: [number, number][][] = [];
			let tramo: [number, number][] = [];
			valores.forEach((v, i) => {
				if (v === null) {
					if (tramo.length) lista.push(tramo);
					tramo = [];
				} else tramo.push([X(i), Y(v)]);
			});
			if (tramo.length) lista.push(tramo);
			return lista;
		};

		if (d.fillArea) {
			for (const s of series) {
				for (const p of tramosDe(s.valores)) {
					const cierre = `L${r1(p[p.length - 1][0])} ${r1(base)}L${r1(p[0][0])} ${r1(base)}Z`;
					out.push(`<path d="${trazo(p, d.smooth)}${cierre}" fill="${s.color}" fill-opacity="0.14"/>`);
				}
			}
		}

		series.forEach((s, k) => {
			const tr = tendencias[k];
			if (!tr) return;
			const ya = tr.origen + tr.pendiente * tr.desde;
			const yb = tr.origen + tr.pendiente * tr.hasta;
			out.push(
				`<line x1="${r1(X(tr.desde))}" y1="${r1(Y(ya))}" x2="${r1(X(tr.hasta))}" y2="${r1(Y(yb))}" stroke="${s.color}" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.7"><title>${esc(`Tendencia de ${s.name}: ${tr.pendiente >= 0 ? '+' : ''}${valor(tr.pendiente)} por paso`)}</title></line>`,
			);
		});

		for (const s of series) {
			const dash = s.dash ? ` stroke-dasharray="${s.dash}"` : '';
			for (const p of tramosDe(s.valores)) {
				out.push(
					`<path d="${trazo(p, d.smooth)}" fill="none" stroke="${s.color}" stroke-width="${grosor}" stroke-linejoin="round" stroke-linecap="round"${dash}/>`,
				);
			}
		}

		// Los puntos van siempre, aunque no se vean: son los que dicen el valor al pasar.
		for (const s of series) {
			s.valores.forEach((v, i) => {
				if (v === null) return;
				const r = d.showPoints ? grosor + 2 : grosor + 4;
				const look = d.showPoints ? `fill="${s.color}" stroke="${t.bg}" stroke-width="2"` : 'fill="transparent"';
				out.push(
					`<circle data-punto="${s.j}" cx="${r1(X(i))}" cy="${r1(Y(v))}" r="${r1(r)}" ${look}><title>${esc(`${s.name} · ${nombreDe(i)}: ${valor(v)}`)}</title></circle>`,
				);
			});
		}
	}

	const titulo = d.title.trim() ? `<title>${esc(d.title.trim())}</title>` : '';
	const estilo = options.fontCss ? `<defs><style>${options.fontCss}</style></defs>` : '';
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${MONO}" role="img">` +
		`${titulo}${estilo}<rect width="${W}" height="${H}" fill="${t.bg}"/>${out.join('')}</svg>`;
	return { svg, width: W, height: Math.round(H) };
}
