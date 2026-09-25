/**
 * Gráficos de dispersión: series de puntos (x, y), cada una con su color, y si
 * se quiere su línea de ajuste por mínimos cuadrados. Sale un SVG que se
 * sostiene solo. Lo pinta el navegador; aquí no se guarda ni se envía nada.
 */
import { MONO, PALETTE, SURFACE, type Theme, esc, fmt, niceScale, parseNumber } from './chart';

export interface SerieXY {
	name: string;
	color: string;
	/** Los puntos tal cual los escribe la gente: uno por línea. */
	points: string;
}

export type Ajuste = 'no' | 'lineal' | 'cuadratica' | 'exponencial' | 'logaritmica' | 'potencia';

export const AJUSTES: Record<Ajuste, string> = {
	no: 'Ninguna',
	lineal: 'Recta',
	cuadratica: 'Parábola',
	exponencial: 'Exponencial',
	logaritmica: 'Logarítmica',
	potencia: 'Potencia',
};

export interface Dispersion {
	title: string;
	xLabel: string;
	yLabel: string;
	size: number;
	fit: Ajuste;
	join: boolean;
	showGrid: boolean;
	theme: Theme;
	series: SerieXY[];
}

export const MAX_SERIES_XY = PALETTE.claro.length;
export const MAX_POINTS = 500;

export const DEFAULT_DISPERSION: Dispersion = {
	title: 'Horas de estudio y nota',
	xLabel: 'Horas',
	yLabel: 'Nota',
	size: 5,
	fit: 'lineal',
	join: false,
	showGrid: true,
	theme: 'claro',
	series: [
		{ name: 'Grupo A', color: PALETTE.claro[0], points: '1; 3,2\n2; 4,1\n3; 4,8\n4; 6\n5; 6,4\n6; 7,5\n7; 7,9\n8; 9,1' },
		{ name: 'Grupo B', color: PALETTE.claro[1], points: '1; 4,5\n2,5; 5\n3; 5,2\n4,5; 5,9\n6; 6,1\n7,5; 6,8' },
	],
};

export interface Punto {
	x: number;
	y: number;
}

/**
 * Una línea, un punto. Vale «2; 3,5», «2 3,5», «2, 3.5», «2,3» o «(2, 3)».
 * Con la coma decimal de aquí, el separador seguro es el punto y coma.
 */
export function parseLine(raw: string): Punto | null {
	const line = raw.trim().replace(/^\(|\)$/g, '').trim();
	if (!line) return null;
	let parts = line.split(/\s*[;\t]\s*/);
	if (parts.length !== 2) parts = line.split(/\s*,\s+|\s+/);
	if (parts.length !== 2) parts = line.split(',');
	if (parts.length !== 2) return null;
	const x = parseNumber(parts[0]);
	const y = parseNumber(parts[1]);
	return x === null || y === null ? null : { x, y };
}

/** Los puntos buenos y los números de línea que no se entienden. */
export function parsePoints(text: string) {
	const puntos: Punto[] = [];
	const malas: number[] = [];
	text.split(/\r?\n/).forEach((line, i) => {
		if (!line.trim()) return;
		const p = parseLine(line);
		if (p && puntos.length < MAX_POINTS) puntos.push(p);
		else if (!p) malas.push(i + 1);
	});
	return { puntos, malas };
}

/** Dónde cae el trazado dentro del SVG y qué valores cubre. */
export interface Marco {
	x0: number;
	x1: number;
	y0: number;
	y1: number;
	xlo: number;
	xhi: number;
	ylo: number;
	yhi: number;
}

/** Recta de mínimos cuadrados. Sin dos x distintas no hay recta. */
export function regression(puntos: Punto[]) {
	const n = puntos.length;
	if (n < 2) return null;
	const mx = puntos.reduce((s, p) => s + p.x, 0) / n;
	const my = puntos.reduce((s, p) => s + p.y, 0) / n;
	let sxx = 0;
	let sxy = 0;
	for (const p of puntos) {
		sxx += (p.x - mx) ** 2;
		sxy += (p.x - mx) * (p.y - my);
	}
	if (sxx === 0) return null;
	const slope = sxy / sxx;
	return { slope, intercept: my - slope * mx };
}

/** Parábola de mínimos cuadrados. Con x centradas para no perder decimales por el camino. */
function parabola(puntos: Punto[]) {
	if (new Set(puntos.map((p) => p.x)).size < 3) return null;
	const n = puntos.length;
	const mx = puntos.reduce((s, p) => s + p.x, 0) / n;
	let s1 = 0, s2 = 0, s3 = 0, s4 = 0, sy = 0, s1y = 0, s2y = 0;
	for (const p of puntos) {
		const u = p.x - mx;
		s1 += u;
		s2 += u * u;
		s3 += u ** 3;
		s4 += u ** 4;
		sy += p.y;
		s1y += u * p.y;
		s2y += u * u * p.y;
	}
	const det = (m: number[][]) =>
		m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
	const M = [
		[s4, s3, s2],
		[s3, s2, s1],
		[s2, s1, n],
	];
	const D = det(M);
	if (!D) return null;
	const R = [s2y, s1y, sy];
	const [A, B, C] = [0, 1, 2].map((col) => det(M.map((fila, i) => fila.map((v, j) => (j === col ? R[i] : v)))) / D);
	return { a: A, b: B - 2 * A * mx, c: A * mx * mx - B * mx + C };
}

export interface Curva {
	f: (x: number) => number;
	ecuacion: string;
	r2: number;
}

/** R² contra los puntos de verdad, también cuando el ajuste se hace sobre logaritmos. */
function bondad(puntos: Punto[], f: (x: number) => number) {
	const my = puntos.reduce((s, p) => s + p.y, 0) / puntos.length;
	let res = 0;
	let tot = 0;
	for (const p of puntos) {
		res += (p.y - f(p.x)) ** 2;
		tot += (p.y - my) ** 2;
	}
	return tot === 0 ? 1 : Math.max(0, 1 - res / tot);
}

const mas = (v: number) => (Math.abs(v) < 1e-9 ? '' : ` ${v < 0 ? '−' : '+'} ${fmt(Math.abs(v))}`);

/** La curva de una serie, o por qué no sale. `null` si no se pide ninguna. */
export function ajusta(puntos: Punto[], tipo: Ajuste): Curva | string | null {
	if (tipo === 'no') return null;
	const pocos = 'faltan puntos con x distintas';
	const curva = (f: (x: number) => number, ecuacion: string) => ({ f, ecuacion, r2: bondad(puntos, f) });

	if (tipo === 'cuadratica') {
		const p = parabola(puntos);
		return p ? curva((x) => p.a * x * x + p.b * x + p.c, `y = ${fmt(p.a)}x²${mas(p.b)}x${mas(p.c)}`) : pocos;
	}
	if (tipo === 'lineal') {
		const r = regression(puntos);
		return r ? curva((x) => r.slope * x + r.intercept, `y = ${fmt(r.slope)}x${mas(r.intercept)}`) : pocos;
	}
	if (tipo === 'exponencial') {
		if (puntos.some((p) => p.y <= 0)) return 'la exponencial pide y mayores que 0';
		const r = regression(puntos.map((p) => ({ x: p.x, y: Math.log(p.y) })));
		if (!r) return pocos;
		const a = Math.exp(r.intercept);
		return curva((x) => a * Math.exp(r.slope * x), `y = ${fmt(a)}·e^(${fmt(r.slope)}x)`);
	}
	if (tipo === 'logaritmica') {
		if (puntos.some((p) => p.x <= 0)) return 'la logarítmica pide x mayores que 0';
		const r = regression(puntos.map((p) => ({ x: Math.log(p.x), y: p.y })));
		return r ? curva((x) => r.slope * Math.log(x) + r.intercept, `y = ${fmt(r.slope)}·ln x${mas(r.intercept)}`) : pocos;
	}
	if (puntos.some((p) => p.x <= 0 || p.y <= 0)) return 'la potencia pide x e y mayores que 0';
	const r = regression(puntos.map((p) => ({ x: Math.log(p.x), y: Math.log(p.y) })));
	if (!r) return pocos;
	const a = Math.exp(r.intercept);
	return curva((x) => a * x ** r.slope, `y = ${fmt(a)}·x^${fmt(r.slope)}`);
}

const W = 800;
const PAD = 40;
const PLOT_H = 380;
/** Geist Mono es de ancho fijo: medir un texto es contar letras. */
const CHAR = 0.6;
const PIXEL = 'Geist Pixel, Geist Mono Variable, monospace';

const r1 = (n: number) => Math.round(n * 10) / 10;
const safe = (value: string, fallback: string) => (/^#[0-9a-f]{6}$/i.test(value) ? value : fallback);
const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, Math.max(1, max - 1))}…` : value);

function text(x: number, y: number, content: string, size: number, fill: string, anchor = 'start', extra = '') {
	const a = anchor === 'start' ? '' : ` text-anchor="${anchor}"`;
	return `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" fill="${fill}"${a}${extra}>${esc(content)}</text>`;
}

/** Un poco de aire alrededor de los datos para que ningún punto quede pegado al borde. */
function escala(min: number, max: number) {
	const margen = min === max ? Math.abs(min) || 1 : (max - min) * 0.05;
	return niceScale(min - margen, max + margen);
}

/**
 * El SVG entero. Devuelve también el marco del trazado, para que un clic en la
 * vista previa se pueda convertir en un punto. `fontCss` solo va en el PNG.
 */
export function buildScatter(d: Dispersion, options: { fontCss?: string } = {}) {
	const t = SURFACE[d.theme];
	const out: string[] = [];
	let top = PAD;

	if (d.title.trim()) {
		out.push(text(PAD, top + 24, clip(d.title.trim(), Math.floor((W - PAD * 2) / (28 * CHAR))), 28, t.fg, 'start', ` font-family="${PIXEL}"`));
		top += 56;
	}

	const series = d.series.map((s, i) => ({
		name: s.name.trim() || `Serie ${i + 1}`,
		color: safe(s.color, t.muted),
		puntos: parsePoints(s.points).puntos,
	}));

	if (series.length > 1) {
		let x = PAD;
		for (const s of series) {
			const name = clip(s.name, 24);
			const w = 20 + name.length * 13 * CHAR;
			if (x > PAD && x + w > W - PAD) {
				x = PAD;
				top += 22;
			}
			out.push(`<circle cx="${r1(x + 6)}" cy="${r1(top + 7)}" r="6" fill="${s.color}"/>`);
			out.push(text(x + 18, top + 12, name, 13, t.fg));
			x += w + 24;
		}
		top += 36;
	}

	const todos = series.flatMap((s) => s.puntos);
	let frame: Marco;
	const lineas: string[] = [];

	if (!todos.length) {
		out.push(text(W / 2, top + PLOT_H / 2, 'Escribe algún punto o haz clic aquí.', 15, t.muted, 'middle'));
		frame = { x0: PAD, x1: W - PAD, y0: top, y1: top + PLOT_H, xlo: 0, xhi: 10, ylo: 0, yhi: 10 };
	} else {
		const xs = escala(Math.min(...todos.map((p) => p.x)), Math.max(...todos.map((p) => p.x)));
		const ys = escala(Math.min(...todos.map((p) => p.y)), Math.max(...todos.map((p) => p.y)));
		const conY = d.yLabel.trim() ? 24 : 0;
		const axisW = Math.max(...ys.ticks.map((v) => fmt(v).length)) * 12 * CHAR + 12;
		const x0 = PAD + conY + axisW;
		const x1 = W - PAD;
		const y0 = top;
		const y1 = top + PLOT_H;
		const X = (v: number) => x0 + ((v - xs.lo) / (xs.hi - xs.lo)) * (x1 - x0);
		const Y = (v: number) => y1 - ((v - ys.lo) / (ys.hi - ys.lo)) * (y1 - y0);
		frame = { x0, x1, y0, y1, xlo: xs.lo, xhi: xs.hi, ylo: ys.lo, yhi: ys.hi };

		ys.ticks.forEach((tick) => {
			const ty = r1(Y(tick));
			if (d.showGrid || tick === ys.lo) {
				out.push(`<line x1="${r1(x0)}" x2="${r1(x1)}" y1="${ty}" y2="${ty}" stroke="${tick === ys.lo || tick === 0 ? t.axis : t.line}"/>`);
			}
			out.push(text(x0 - 10, ty + 4, fmt(tick), 12, t.muted, 'end'));
		});
		xs.ticks.forEach((tick) => {
			const tx = r1(X(tick));
			if (d.showGrid || tick === xs.lo) {
				out.push(`<line x1="${tx}" x2="${tx}" y1="${r1(y0)}" y2="${r1(y1)}" stroke="${tick === xs.lo || tick === 0 ? t.axis : t.line}"/>`);
			}
			out.push(text(tx, y1 + 20, fmt(tick), 12, t.muted, 'middle'));
		});

		if (d.xLabel.trim()) out.push(text((x0 + x1) / 2, y1 + 44, clip(d.xLabel.trim(), 60), 13, t.fg, 'middle'));
		if (d.yLabel.trim()) {
			const cy = (y0 + y1) / 2;
			out.push(text(PAD + 10, cy, clip(d.yLabel.trim(), 40), 13, t.fg, 'middle', ` transform="rotate(-90 ${PAD + 10} ${r1(cy)})"`));
		}

		// La curva puede salirse por arriba o por abajo: se recorta al marco.
		out.push(`<clipPath id="dispersion-marco"><rect x="${r1(x0)}" y="${r1(y0)}" width="${r1(x1 - x0)}" height="${r1(y1 - y0)}"/></clipPath>`);
		const dentro: string[] = [];

		for (const s of series) {
			if (d.join && s.puntos.length > 1) {
				const orden = [...s.puntos].sort((a, b) => a.x - b.x);
				const trazo = orden.map((p, k) => `${k ? 'L' : 'M'}${r1(X(p.x))} ${r1(Y(p.y))}`).join('');
				dentro.push(`<path d="${trazo}" fill="none" stroke="${s.color}" stroke-width="1.5" stroke-opacity="0.6" stroke-linejoin="round"/>`);
			}
			const curva = ajusta(s.puntos, d.fit);
			if (curva && typeof curva !== 'string') {
				const lo = Math.min(...s.puntos.map((p) => p.x));
				const hi = Math.max(...s.puntos.map((p) => p.x));
				// La recta se pinta con dos puntos; las curvas, a tramos cortos. Lo que se dispara se corta.
				const pasos = d.fit === 'lineal' ? 1 : 120;
				let trazo = '';
				let sigue = false;
				for (let k = 0; k <= pasos; k++) {
					const x = lo + ((hi - lo) * k) / pasos;
					const py = Y(curva.f(x));
					if (!Number.isFinite(py) || py < y0 - 2000 || py > y1 + 2000) {
						sigue = false;
						continue;
					}
					trazo += `${sigue ? 'L' : 'M'}${r1(X(x))} ${r1(py)}`;
					sigue = true;
				}
				if (trazo) {
					dentro.push(`<path d="${trazo}" fill="none" stroke="${s.color}" stroke-width="2" stroke-dasharray="8 5" stroke-linejoin="round"/>`);
				}
				lineas.push(`${s.name}: ${curva.ecuacion} · R² = ${fmt(curva.r2)}`);
			}
		}
		for (const s of series) {
			for (const p of s.puntos) {
				dentro.push(
					`<circle cx="${r1(X(p.x))}" cy="${r1(Y(p.y))}" r="${d.size}" fill="${s.color}" fill-opacity="0.85" stroke="${t.bg}" stroke-width="1.5"><title>${esc(`${s.name}: (${fmt(p.x)}; ${fmt(p.y)})`)}</title></circle>`,
				);
			}
		}
		out.push(`<g clip-path="url(#dispersion-marco)">${dentro.join('')}</g>`);
	}

	let H = top + PLOT_H + 28 + (d.xLabel.trim() ? 24 : 0);
	lineas.forEach((linea) => {
		H += 22;
		out.push(text(PAD, H, clip(linea, Math.floor((W - PAD * 2) / (13 * CHAR))), 13, t.muted));
	});
	H = Math.round(H + PAD);

	const titulo = d.title.trim() ? `<title>${esc(d.title.trim())}</title>` : '';
	const estilo = options.fontCss ? `<defs><style>${options.fontCss}</style></defs>` : '';
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${MONO}" role="img">` +
		`${titulo}${estilo}<rect width="${W}" height="${H}" fill="${t.bg}"/>${out.join('')}</svg>`;
	return { svg, width: W, height: H, frame };
}
