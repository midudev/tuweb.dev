/**
 * Gráficos de datos para la caja de herramientas: de una tabla a un SVG que se
 * sostiene solo, con su fondo, sus letras y sus colores dentro. Lo pinta el
 * navegador; aquí no se guarda ni se envía nada.
 */

export type ChartType = 'barras' | 'lineas' | 'areas' | 'tarta' | 'radial';
export type Template = 'grafico' | 'titular' | 'cifras';
export type Theme = 'claro' | 'oscuro';

export interface Serie {
	name: string;
	color: string;
}

/** Cada fila lleva su color: es el que usa la tarta, donde cada fila es un trozo. */
export interface Fila {
	label: string;
	color: string;
	cells: string[];
}

export interface Chart {
	type: ChartType;
	template: Template;
	theme: Theme;
	title: string;
	subtitle: string;
	note: string;
	showValues: boolean;
	showLegend: boolean;
	labelHeader: string;
	series: Serie[];
	rows: Fila[];
}

export const TYPES: { id: ChartType; label: string; icon: string }[] = [
	{ id: 'barras', label: 'Barras', icon: 'chart-bar' },
	{ id: 'lineas', label: 'Líneas', icon: 'chart-line' },
	{ id: 'areas', label: 'Áreas', icon: 'chart-area' },
	{ id: 'tarta', label: 'Tarta', icon: 'chart-pie' },
	{ id: 'radial', label: 'Radial', icon: 'chart-radar' },
];

export const TEMPLATES: { id: Template; label: string }[] = [
	{ id: 'grafico', label: 'Solo el gráfico' },
	{ id: 'titular', label: 'Titular grande' },
	{ id: 'cifras', label: 'Cifras destacadas' },
];

/*
 * Ocho tonos en un orden fijo, pensado para que dos vecinos se distingan
 * también con daltonismo. El oscuro no es el claro del revés: son los mismos
 * tonos, cada uno en el paso que se lee sobre fondo oscuro. Por eso no hay
 * novena serie: un color inventado ya no cumpliría.
 */
export const PALETTE: Record<Theme, string[]> = {
	claro: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
	oscuro: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
};

/** Los colores de la casa, escritos a mano: el SVG descargado no ve el CSS de la web. */
const SURFACE: Record<Theme, Record<'bg' | 'fg' | 'muted' | 'line' | 'axis' | 'panel' | 'accent', string>> = {
	claro: {
		bg: '#fdf6ef',
		fg: '#3b2d24',
		muted: '#7a6152',
		line: '#e8d9c8',
		axis: '#c9b5a2',
		panel: '#f7ece1',
		accent: '#c2410c',
	},
	oscuro: {
		bg: '#17110d',
		fg: '#f3e7db',
		muted: '#ad9483',
		line: '#382b21',
		axis: '#5a4636',
		panel: '#1f1813',
		accent: '#fc784b',
	},
};

export const MAX_SERIES = PALETTE.claro.length;
export const MAX_ROWS = 60;

export const DEFAULT_CHART: Chart = {
	type: 'barras',
	template: 'titular',
	theme: 'claro',
	title: 'Visitas a tuweb',
	subtitle: 'Primer semestre, en miles',
	note: 'Datos de ejemplo. Cámbialos en la tabla.',
	showValues: true,
	showLegend: true,
	labelHeader: 'Mes',
	series: [
		{ name: '2025', color: PALETTE.claro[0] },
		{ name: '2026', color: PALETTE.claro[1] },
	],
	rows: [
		['Ene', '12', '18'],
		['Feb', '15', '21'],
		['Mar', '14', '26'],
		['Abr', '19', '30'],
		['May', '23', '34'],
		['Jun', '21', '39'],
	].map(([label, ...cells], i) => ({ label, color: PALETTE.claro[i], cells })),
};

const numero = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
const compacto = new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 });

export const fmt = (value: number) => numero.format(value);
const fmtEje = (value: number) => (Math.abs(value) >= 10000 ? compacto.format(value) : numero.format(value));

/**
 * Un número como lo escribe la gente: «1.234,5», «1,5», «12 %» o «-3». Si hay
 * duda entre punto de miles y coma decimal, gana la forma de aquí.
 */
export function parseNumber(raw: string): number | null {
	let text = raw.trim().replace(/[\s%€$£]/g, '').replace(/−/g, '-');
	if (!text) return null;
	if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(text)) text = text.replace(/\./g, '').replace(',', '.');
	else if (/^-?\d{1,3}(,\d{3}){2,}(\.\d+)?$|^-?\d{1,3}(,\d{3})+\.\d+$/.test(text)) text = text.replace(/,/g, '');
	else text = text.replace(',', '.');
	const value = Number(text);
	return Number.isFinite(value) ? value : null;
}

/** CSV con coma, punto y coma o tabulador: se queda el que más sale en la cabecera. */
export function parseCsv(text: string): string[][] {
	const first = text.split(/\r?\n/, 1)[0] ?? '';
	const delim = ['\t', ';', ','].reduce((best, d) => (first.split(d).length > first.split(best).length ? d : best), ',');

	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let quoted = false;

	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (quoted) {
			if (c !== '"') field += c;
			else if (text[i + 1] === '"') {
				field += '"';
				i++;
			} else quoted = false;
		} else if (c === '"' && field === '') quoted = true;
		else if (c === delim) {
			row.push(field);
			field = '';
		} else if (c === '\n' || c === '\r') {
			if (c === '\r' && text[i + 1] === '\n') i++;
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
		} else field += c;
	}
	if (field || row.length) {
		row.push(field);
		rows.push(row);
	}

	return rows.map((r) => r.map((f) => f.trim())).filter((r) => r.some((f) => f !== ''));
}

export function toCsv(chart: Chart) {
	const quote = (value: string) => (/[",;\t\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
	return [[chart.labelHeader, ...chart.series.map((s) => s.name)], ...chart.rows.map((r) => [r.label, ...r.cells])]
		.map((r) => r.map(quote).join(','))
		.join('\n');
}

/** Del CSV a la tabla. Los colores que ya había se quedan en su sitio. */
export function fromCsv(text: string, chart: Chart): { chart: Chart; aviso: string } | { error: string } {
	const table = parseCsv(text);
	if (table.length < 2) return { error: 'Hace falta una fila de cabecera y al menos una de datos.' };

	const [header, ...body] = table;
	const width = table.reduce((max, r) => Math.max(max, r.length), 0);
	if (width < 2) return { error: 'Hace falta al menos una columna de números, además de la de etiquetas.' };

	const avisos: string[] = [];
	if (width - 1 > MAX_SERIES) avisos.push(`Solo entran ${MAX_SERIES} series; el resto se queda fuera.`);
	if (body.length > MAX_ROWS) avisos.push(`Solo entran ${MAX_ROWS} filas.`);

	const total = Math.min(width - 1, MAX_SERIES);
	const palette = PALETTE[chart.theme];
	const corta = (value: string | undefined) => (value ?? '').slice(0, 80);

	return {
		aviso: avisos.join(' '),
		chart: {
			...chart,
			labelHeader: corta(header[0]) || 'Etiqueta',
			series: Array.from({ length: total }, (_, j) => ({
				name: corta(header[j + 1]) || `Serie ${j + 1}`,
				color: chart.series[j]?.color ?? palette[j],
			})),
			rows: body.slice(0, MAX_ROWS).map((r, i) => ({
				label: corta(r[0]),
				color: chart.rows[i]?.color ?? palette[i % palette.length],
				cells: Array.from({ length: total }, (_, j) => corta(r[j + 1])),
			})),
		},
	};
}

/** Un eje con pasos redondos (1, 2, 2,5 o 5 por potencia de diez) que siempre incluye el cero. */
function niceScale(min: number, max: number, count = 5) {
	if (min === max) max = min + 1;
	const raw = (max - min) / count;
	const mag = 10 ** Math.floor(Math.log10(raw));
	const norm = raw / mag;
	const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
	const lo = Math.floor(min / step) * step;
	const hi = Math.ceil(max / step) * step;
	const ticks: number[] = [];
	for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(10)));
	return { lo, hi, ticks };
}

const MONO = 'Geist Mono Variable, ui-monospace, monospace';
const PIXEL = 'Geist Pixel, Geist Mono Variable, monospace';
const W = 960;
const PAD = 48;
/** Las dos letras son de ancho fijo, así que medir un texto es contar. */
const CHAR = 0.6;

type Colores = (typeof SURFACE)[Theme];
interface Caja {
	x: number;
	y: number;
	w: number;
	h: number;
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const safe = (value: string, fallback: string) => (/^#[0-9a-f]{6}$/i.test(value) ? value : fallback);

const ENTIDADES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Todo lo que escribe la gente pasa por aquí antes de entrar en el SVG. */
function esc(value: string) {
	return value.replace(/[&<>"']/g, (c) => ENTIDADES[c] ?? c);
}

function text(
	x: number,
	y: number,
	content: string,
	{ size = 14, fill, anchor = 'start', pixel = false }: { size?: number; fill: string; anchor?: string; pixel?: boolean },
) {
	const extra = `${anchor === 'start' ? '' : ` text-anchor="${anchor}"`}${pixel ? ` font-family="${PIXEL}"` : ''}`;
	return `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" fill="${fill}"${extra}>${esc(content)}</text>`;
}

function clip(value: string, max: number) {
	return value.length > max ? `${value.slice(0, Math.max(1, max - 1))}…` : value;
}

function wrap(value: string, max: number) {
	const lines: string[] = [];
	let line = '';
	for (let word of value.split(/\s+/).filter(Boolean)) {
		while (word.length > max) {
			if (line) lines.push(line);
			line = '';
			lines.push(word.slice(0, max));
			word = word.slice(max);
		}
		if (!line) line = word;
		else if (line.length + 1 + word.length <= max) line += ` ${word}`;
		else {
			lines.push(line);
			line = word;
		}
	}
	if (line) lines.push(line);
	return lines;
}

function vacio(box: Caja, mensaje: string, t: Colores) {
	return [text(box.x + box.w / 2, box.y + box.h / 2, mensaje, { size: 15, fill: t.muted, anchor: 'middle' })];
}

const pct = (frac: number) => `${numero.format(Math.round(frac * 1000) / 10)} %`;

interface Porcion {
	label: string;
	value: number;
	color: string;
}

/** La tarta sale de la primera serie. Pasadas ocho porciones, lo pequeño va a «Otros». */
function porciones(chart: Chart, valores: (number | null)[][], t: Colores): Porcion[] {
	const todas = chart.rows
		.map((row, i) => ({ label: row.label || `Fila ${i + 1}`, value: valores[i][0] ?? 0, color: safe(row.color, t.muted) }))
		.filter((p) => p.value > 0);
	if (todas.length <= 8) return todas;
	const resto = todas.slice(7).reduce((sum, p) => sum + p.value, 0);
	return [...todas.slice(0, 7), { label: 'Otros', value: resto, color: t.muted }];
}

function drawCartesian(chart: Chart, valores: (number | null)[][], box: Caja, t: Colores) {
	const n = chart.rows.length;
	const s = chart.series.length;
	const todos = valores.flat().filter((v): v is number => v !== null);
	if (!n || !s || !todos.length) return vacio(box, 'Mete algún número en la tabla y sale el gráfico.', t);

	const out: string[] = [];
	const { lo, hi, ticks } = niceScale(Math.min(0, ...todos), Math.max(0, ...todos));
	const tickLabels = ticks.map(fmtEje);
	const axisW = Math.max(...tickLabels.map((l) => l.length)) * 13 * CHAR + 12;
	const px = box.x + axisW;
	const pw = box.w - axisW;
	const py = box.y;
	const ph = box.h - 30;
	const Y = (v: number) => py + ph - ((v - lo) / (hi - lo)) * ph;
	const base = Y(0);

	ticks.forEach((tick, i) => {
		const ty = r1(Y(tick));
		out.push(`<line x1="${r1(px)}" x2="${r1(px + pw)}" y1="${ty}" y2="${ty}" stroke="${tick === 0 ? t.axis : t.line}"/>`);
		out.push(text(px - 10, ty + 4, tickLabels[i], { size: 13, fill: t.muted, anchor: 'end' }));
	});

	// Con muchas filas no caben todas las etiquetas: se salta de n en n.
	const band = pw / n;
	const every = Math.max(1, Math.ceil(56 / band));
	const maxChars = Math.max(3, Math.floor((band * every - 8) / (13 * CHAR)));
	const cx = (i: number) => px + band * (i + 0.5);
	chart.rows.forEach((row, i) => {
		if (i % every === 0) out.push(text(cx(i), py + ph + 22, clip(row.label, maxChars), { size: 13, fill: t.muted, anchor: 'middle' }));
	});

	const tip = (i: number, j: number, v: number) => `<title>${esc(`${chart.rows[i].label} · ${chart.series[j].name}: ${fmt(v)}`)}</title>`;

	if (chart.type === 'barras') {
		const groupW = band * 0.72;
		// Dos píxeles de fondo entre barras vecinas, para que no se fundan.
		const gap = s > 1 ? Math.min(2, groupW / s / 4) : 0;
		const barW = (groupW - gap * (s - 1)) / s;
		chart.series.forEach((serie, j) => {
			const fill = safe(serie.color, t.muted);
			chart.rows.forEach((_, i) => {
				const v = valores[i][j];
				if (v === null) return;
				const x = cx(i) - groupW / 2 + j * (barW + gap);
				const top = Y(Math.max(v, 0));
				const bottom = Y(Math.min(v, 0));
				out.push(
					`<rect x="${r1(x)}" y="${r1(top)}" width="${r1(barW)}" height="${r1(bottom - top)}" fill="${fill}">${tip(i, j, v)}</rect>`,
				);
				const label = fmtEje(v);
				if (chart.showValues && label.length * 12 * CHAR <= barW + 6) {
					out.push(text(x + barW / 2, v >= 0 ? top - 6 : bottom + 15, label, { size: 12, fill: t.fg, anchor: 'middle' }));
				}
			});
		});
		return out;
	}

	// Líneas y áreas: un hueco en la tabla corta la línea en vez de inventarse un cero.
	const tramos = chart.series.map((_, j) => {
		const lista: [number, number][][] = [];
		let tramo: [number, number][] = [];
		chart.rows.forEach((__, i) => {
			const v = valores[i][j];
			if (v === null) {
				if (tramo.length) lista.push(tramo);
				tramo = [];
			} else tramo.push([cx(i), Y(v)]);
		});
		if (tramo.length) lista.push(tramo);
		return lista;
	});
	const trazo = (p: [number, number][]) => p.map(([x, y], k) => `${k ? 'L' : 'M'}${r1(x)} ${r1(y)}`).join('');

	if (chart.type === 'areas') {
		tramos.forEach((lista, j) => {
			const fill = safe(chart.series[j].color, t.muted);
			for (const p of lista) {
				const cierre = `L${r1(p[p.length - 1][0])} ${r1(base)}L${r1(p[0][0])} ${r1(base)}Z`;
				out.push(`<path d="${trazo(p)}${cierre}" fill="${fill}" fill-opacity="0.18"/>`);
			}
		});
	}
	tramos.forEach((lista, j) => {
		const stroke = safe(chart.series[j].color, t.muted);
		for (const p of lista) {
			out.push(`<path d="${trazo(p)}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`);
		}
	});
	chart.series.forEach((serie, j) => {
		const fill = safe(serie.color, t.muted);
		const ultimo = valores.reduce((last, row, i) => (row[j] !== null ? i : last), -1);
		chart.rows.forEach((_, i) => {
			const v = valores[i][j];
			if (v === null) return;
			if (n <= 31) {
				out.push(`<circle cx="${r1(cx(i))}" cy="${r1(Y(v))}" r="4" fill="${fill}" stroke="${t.bg}" stroke-width="2">${tip(i, j, v)}</circle>`);
			}
			// Con pocas filas, todos los valores; con muchas, solo el último de cada serie.
			if (chart.showValues && (n <= 12 || i === ultimo)) {
				out.push(text(cx(i), Y(v) - 10, fmtEje(v), { size: 12, fill: t.fg, anchor: 'middle' }));
			}
		});
	});
	return out;
}

function drawPie(chart: Chart, slices: Porcion[], box: Caja, t: Colores) {
	if (!slices.length) return vacio(box, 'La tarta sale de la primera serie: pon ahí números positivos.', t);

	const out: string[] = [];
	const total = slices.reduce((sum, p) => sum + p.value, 0);
	const cx = box.x + box.w / 2;
	const cy = box.y + box.h / 2;
	const r = box.h / 2 - 28;
	const pt = (a: number, radio = r) => [r1(cx + Math.cos(a) * radio), r1(cy + Math.sin(a) * radio)];
	let angle = -Math.PI / 2;

	for (const p of slices) {
		const frac = p.value / total;
		const end = angle + frac * Math.PI * 2;
		const tip = `<title>${esc(`${p.label}: ${fmt(p.value)} (${pct(frac)})`)}</title>`;
		if (slices.length === 1) {
			out.push(`<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r}" fill="${p.color}">${tip}</circle>`);
		} else {
			const [x0, y0] = pt(angle);
			const [x1, y1] = pt(end);
			out.push(
				`<path d="M${r1(cx)} ${r1(cy)}L${x0} ${y0}A${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${x1} ${y1}Z" fill="${p.color}" stroke="${t.bg}" stroke-width="2" stroke-linejoin="bevel">${tip}</path>`,
			);
		}
		if (chart.showValues && frac >= 0.03) {
			const mid = (angle + end) / 2;
			const [lx, ly] = pt(mid, r + 16);
			const cos = Math.cos(mid);
			out.push(text(lx, ly + 5, pct(frac), { size: 13, fill: t.fg, anchor: cos > 0.2 ? 'start' : cos < -0.2 ? 'end' : 'middle' }));
		}
		angle = end;
	}
	return out;
}

function drawRadar(chart: Chart, valores: (number | null)[][], box: Caja, t: Colores) {
	const n = chart.rows.length;
	const todos = valores.flat().filter((v): v is number => v !== null);
	if (n < 3) return vacio(box, 'El radial pide al menos tres filas.', t);
	if (!chart.series.length || !todos.length) return vacio(box, 'Mete algún número en la tabla y sale el gráfico.', t);

	const out: string[] = [];
	const { hi, ticks } = niceScale(0, Math.max(0, ...todos), 4);
	const cx = box.x + box.w / 2;
	const cy = box.y + box.h / 2;
	const R = box.h / 2 - 36;
	const ang = (i: number) => -Math.PI / 2 + (i / n) * Math.PI * 2;
	const pt = (i: number, v: number) => [r1(cx + (Math.cos(ang(i)) * R * v) / hi), r1(cy + (Math.sin(ang(i)) * R * v) / hi)];
	const puntos = (fn: (i: number) => number) => chart.rows.map((_, i) => pt(i, fn(i)).join(',')).join(' ');

	for (const tick of ticks.filter((v) => v > 0)) {
		out.push(`<polygon points="${puntos(() => tick)}" fill="none" stroke="${t.line}"/>`);
		out.push(text(cx + 4, cy - (R * tick) / hi - 4, fmtEje(tick), { size: 12, fill: t.muted }));
	}
	chart.rows.forEach((row, i) => {
		const [x, y] = pt(i, hi);
		out.push(`<line x1="${r1(cx)}" y1="${r1(cy)}" x2="${x}" y2="${y}" stroke="${t.line}"/>`);
		const cos = Math.cos(ang(i));
		const sin = Math.sin(ang(i));
		const lx = cx + cos * (R + 14);
		const ly = cy + sin * (R + 14) + 5 + (sin > 0.5 ? 8 : sin < -0.5 ? -4 : 0);
		out.push(text(lx, ly, clip(row.label, 16), { size: 13, fill: t.muted, anchor: cos > 0.2 ? 'start' : cos < -0.2 ? 'end' : 'middle' }));
	});

	chart.series.forEach((serie, j) => {
		const color = safe(serie.color, t.muted);
		const valor = (i: number) => Math.max(0, valores[i][j] ?? 0);
		out.push(
			`<polygon points="${puntos(valor)}" fill="${color}" fill-opacity="0.14" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`,
		);
		chart.rows.forEach((row, i) => {
			const v = valores[i][j];
			if (v === null) return;
			const [x, y] = pt(i, valor(i));
			out.push(
				`<circle cx="${x}" cy="${y}" r="3.5" fill="${color}" stroke="${t.bg}" stroke-width="2"><title>${esc(`${row.label} · ${serie.name}: ${fmt(v)}`)}</title></circle>`,
			);
			if (chart.showValues && chart.series.length === 1) {
				out.push(text(x + Math.cos(ang(i)) * 14, y + Math.sin(ang(i)) * 14 + 4, fmtEje(v), { size: 12, fill: t.fg, anchor: 'middle' }));
			}
		});
	});
	return out;
}

/**
 * El gráfico entero —cabecera, cifras, leyenda, trazado y nota— como un SVG de
 * 960 de ancho. El alto sale de lo que haya que meter. `fontCss` solo se pasa
 * para el PNG, que no ve las fuentes de la página y las necesita dentro.
 */
export function buildSvg(chart: Chart, options: { fontCss?: string } = {}) {
	const t = SURFACE[chart.theme];
	const valores = chart.rows.map((r) => chart.series.map((_, j) => parseNumber(r.cells[j] ?? '')));
	const out: string[] = [];
	const cw = W - PAD * 2;
	const big = chart.template !== 'grafico';
	let y = PAD;

	if (big) out.push(`<rect width="${W}" height="8" fill="${t.accent}"/>`);

	const titleSize = big ? 44 : 26;
	if (chart.title.trim()) {
		for (const line of wrap(chart.title, Math.floor(cw / (titleSize * CHAR))).slice(0, 3)) {
			out.push(text(PAD, y + titleSize * 0.85, line, { size: titleSize, fill: t.fg, pixel: true }));
			y += titleSize * 1.15;
		}
		y += 6;
	}
	const subSize = big ? 18 : 15;
	if (chart.subtitle.trim()) {
		for (const line of wrap(chart.subtitle, Math.floor(cw / (subSize * CHAR))).slice(0, 3)) {
			out.push(text(PAD, y + subSize, line, { size: subSize, fill: t.muted }));
			y += subSize * 1.5;
		}
	}
	if (y > PAD) y += 24;

	if (chart.template === 'cifras') {
		let total = 0;
		let cuenta = 0;
		let maxI = -1;
		valores.forEach((row, i) => {
			const v = row[0];
			if (v === null || v === undefined) return;
			total += v;
			cuenta++;
			if (maxI < 0 || v > (valores[maxI][0] ?? -Infinity)) maxI = i;
		});
		const tiles = [
			{ value: cuenta ? fmt(total) : '—', label: 'Total' },
			{ value: maxI >= 0 ? fmt(valores[maxI][0] ?? 0) : '—', label: maxI >= 0 ? `Máximo · ${chart.rows[maxI].label}` : 'Máximo' },
			{ value: cuenta ? fmt(total / cuenta) : '—', label: 'Media' },
		];
		const gap = 16;
		const tw = (cw - gap * 2) / 3;
		tiles.forEach((tile, i) => {
			const x = PAD + i * (tw + gap);
			out.push(`<rect x="${r1(x)}" y="${r1(y)}" width="${r1(tw)}" height="112" fill="${t.panel}" stroke="${t.line}"/>`);
			out.push(text(x + 20, y + 58, clip(tile.value, Math.floor((tw - 40) / (36 * CHAR))), { size: 36, fill: t.accent, pixel: true }));
			out.push(text(x + 20, y + 90, clip(tile.label, Math.floor((tw - 40) / (14 * CHAR))), { size: 14, fill: t.muted }));
		});
		y += 112;
		if (chart.series[0]) {
			out.push(text(PAD, y + 26, clip(`Cifras de «${chart.series[0].name}».`, Math.floor(cw / (13 * CHAR))), { size: 13, fill: t.muted }));
			y += 34;
		}
		y += 24;
	}

	const pie = chart.type === 'tarta';
	const slices = pie ? porciones(chart, valores, t) : [];
	const items = pie ? slices.map((p) => ({ name: p.label, color: p.color })) : chart.series.map((s) => ({ name: s.name, color: safe(s.color, t.muted) }));
	// Con una sola serie no hace falta leyenda: ya la nombra el título.
	if (chart.showLegend && items.length && (pie || items.length > 1)) {
		let x = PAD;
		for (const item of items) {
			const name = clip(item.name || '—', 28);
			const w = 20 + name.length * 14 * CHAR;
			if (x > PAD && x + w > W - PAD) {
				x = PAD;
				y += 24;
			}
			out.push(`<rect x="${r1(x)}" y="${r1(y + 3)}" width="12" height="12" fill="${item.color}"/>`);
			out.push(text(x + 20, y + 14, name, { size: 14, fill: t.fg }));
			x += w + 24;
		}
		y += 24 + 16;
	}

	const box = { x: PAD, y, w: cw, h: big ? 400 : 380 };
	if (pie) out.push(...drawPie(chart, slices, box, t));
	else if (chart.type === 'radial') out.push(...drawRadar(chart, valores, box, t));
	else out.push(...drawCartesian(chart, valores, box, t));
	y += box.h;

	if (chart.note.trim()) {
		y += 16;
		for (const line of wrap(chart.note, Math.floor(cw / (13 * CHAR))).slice(0, 4)) {
			out.push(text(PAD, y + 13, line, { size: 13, fill: t.muted }));
			y += 20;
		}
	}

	const H = Math.round(y + PAD);
	const titulo = chart.title.trim() ? `<title>${esc(chart.title)}</title>` : '';
	const estilo = options.fontCss ? `<defs><style>${options.fontCss}</style></defs>` : '';
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${MONO}" role="img">` +
		`${titulo}${estilo}<rect width="${W}" height="${H}" fill="${t.bg}"/>${out.join('')}</svg>`;
	return { svg, width: W, height: H };
}
