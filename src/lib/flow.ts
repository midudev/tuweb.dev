/**
 * Diagramas de flujo para la caja de herramientas: nodos, flechas y el SVG que
 * sale de ellos. Se guarda en el navegador de cada uno; aquí no se envía nada.
 */
import { MONO, SURFACE, esc, type Theme } from './chart';

export type Shape = 'terminal' | 'proceso' | 'decision';

/** x e y son el centro del nodo; el tamaño sale del texto. */
export interface Nodo {
	id: string;
	shape: Shape;
	x: number;
	y: number;
	text: string;
	color: string;
}

export interface Flecha {
	id: string;
	from: string;
	to: string;
	text: string;
}

export interface Diagram {
	theme: Theme;
	nodes: Nodo[];
	edges: Flecha[];
}

export type Seleccion = { kind: 'nodo' | 'flecha'; id: string };

export const SHAPES: { id: Shape; label: string; icon: string; text: string }[] = [
	{ id: 'terminal', label: 'Inicio / fin', icon: 'oval', text: 'Inicio' },
	{ id: 'proceso', label: 'Proceso', icon: 'rectangle', text: 'Paso' },
	{ id: 'decision', label: 'Decisión', icon: 'diamond', text: '¿Sí o no?' },
];

/** Los tonos de los gráficos: se leen igual sobre fondo claro que oscuro. */
export const COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#4a3aa7', '#e34948', '#7a6152'];

export const DEFAULT_COLOR: Record<Shape, string> = { terminal: COLORS[2], proceso: COLORS[0], decision: COLORS[3] };

export const WIDTH = 960;
export const HEIGHT = 560;
export const GRID = 8;
export const MAX_NODES = 60;
export const MAX_EDGES = 120;
export const MAX_TEXT = 120;
export const MAX_LABEL = 30;
const MAX_LINES = 6;

const FONT = 13;
const CHAR = 7.8;
const LINE = 17;

const r1 = (n: number) => Math.round(n * 10) / 10;

export const DEFAULT_DIAGRAM: Diagram = {
	theme: 'claro',
	nodes: [
		{ id: 'n1', shape: 'terminal', x: 480, y: 48, text: 'Inicio', color: COLORS[2] },
		{ id: 'n2', shape: 'proceso', x: 480, y: 136, text: 'Entra en tuweb.dev', color: COLORS[0] },
		{ id: 'n3', shape: 'decision', x: 480, y: 256, text: '¿Te gusta\nalguna idea?', color: COLORS[3] },
		{ id: 'n4', shape: 'proceso', x: 256, y: 392, text: 'Vótala', color: COLORS[0] },
		{ id: 'n5', shape: 'proceso', x: 704, y: 392, text: 'Propón la tuya', color: COLORS[1] },
		{ id: 'n6', shape: 'terminal', x: 480, y: 504, text: 'Fin', color: COLORS[2] },
	],
	edges: [
		{ id: 'f1', from: 'n1', to: 'n2', text: '' },
		{ id: 'f2', from: 'n2', to: 'n3', text: '' },
		{ id: 'f3', from: 'n3', to: 'n4', text: 'Sí' },
		{ id: 'f4', from: 'n3', to: 'n5', text: 'No' },
		{ id: 'f5', from: 'n4', to: 'n6', text: '' },
		{ id: 'f6', from: 'n5', to: 'n6', text: '' },
	],
};

export const clampX = (x: number) => Math.min(Math.max(x, 24), WIDTH - 24);
export const clampY = (y: number) => Math.min(Math.max(y, 24), HEIGHT - 24);
const safeColor = (value: unknown) => (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : COLORS[0]);

function lineas(text: string) {
	return text.split('\n').slice(0, MAX_LINES).map((line) => line.trim());
}

/** Ancho y alto de cada forma, con sitio para que el texto quepa dentro. */
export function size(node: Nodo) {
	const ls = lineas(node.text);
	const w0 = Math.max(1, ...ls.map((line) => line.length)) * CHAR;
	const h0 = ls.length * LINE;
	if (node.shape === 'decision') return { w: r1(Math.max(128, 2 * (w0 + 12))), h: r1(Math.max(76, 2 * (h0 + 6))) };
	if (node.shape === 'terminal') return { w: r1(Math.max(104, (w0 + 20) * 1.42)), h: r1(Math.max(44, (h0 + 8) * 1.42)) };
	return { w: r1(Math.max(104, w0 + 32)), h: r1(Math.max(44, h0 + 20)) };
}

/** Cuánto hay desde el centro hasta el borde de la forma, en la dirección (ux, uy). */
function borde(node: Nodo, ux: number, uy: number) {
	const { w, h } = size(node);
	const a = w / 2;
	const b = h / 2;
	const ax = Math.abs(ux);
	const ay = Math.abs(uy);
	if (node.shape === 'decision') return 1 / (ax / a + ay / b);
	if (node.shape === 'terminal') return 1 / Math.hypot(ux / a, uy / b);
	return Math.min(ax ? a / ax : Infinity, ay ? b / ay : Infinity);
}

/** El siguiente id libre: n7, f12… */
export function nextId(list: { id: string }[], prefix: 'n' | 'f') {
	const max = list.reduce((acc, item) => Math.max(acc, Number(item.id.slice(1)) || 0), 0);
	return `${prefix}${max + 1}`;
}

/** Lo guardado en el navegador se revisa entero: puede venir de otra versión o tocado a mano. */
export function sanitize(raw: unknown): Diagram | null {
	if (!raw || typeof raw !== 'object') return null;
	const data = raw as Record<string, unknown>;
	if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) return null;

	const nodes: Nodo[] = [];
	const ids = new Set<string>();
	for (const item of data.nodes.slice(0, MAX_NODES)) {
		if (!item || typeof item !== 'object') continue;
		const { id, shape, x, y, text, color } = item as Record<string, unknown>;
		if (typeof id !== 'string' || !/^n\d{1,6}$/.test(id) || ids.has(id)) continue;
		if (!SHAPES.some((s) => s.id === shape)) continue;
		ids.add(id);
		nodes.push({
			id,
			shape: shape as Shape,
			x: Number.isFinite(x) ? clampX(Number(x)) : WIDTH / 2,
			y: Number.isFinite(y) ? clampY(Number(y)) : HEIGHT / 2,
			text: typeof text === 'string' ? text.slice(0, MAX_TEXT) : '',
			color: safeColor(color),
		});
	}

	const edges: Flecha[] = [];
	const edgeIds = new Set<string>();
	const pares = new Set<string>();
	for (const item of data.edges.slice(0, MAX_EDGES)) {
		if (!item || typeof item !== 'object') continue;
		const { id, from, to, text } = item as Record<string, unknown>;
		if (typeof id !== 'string' || !/^f\d{1,6}$/.test(id) || edgeIds.has(id)) continue;
		if (typeof from !== 'string' || typeof to !== 'string' || from === to) continue;
		if (!ids.has(from) || !ids.has(to) || pares.has(`${from}>${to}`)) continue;
		edgeIds.add(id);
		pares.add(`${from}>${to}`);
		edges.push({ id, from, to, text: typeof text === 'string' ? text.slice(0, MAX_LABEL) : '' });
	}

	return { theme: data.theme === 'oscuro' ? 'oscuro' : 'claro', nodes, edges };
}

function forma(node: Nodo, attrs: string, extra = 0) {
	const { w, h } = size(node);
	const a = w / 2 + extra;
	const b = h / 2 + extra;
	const { x, y } = node;
	if (node.shape === 'terminal') return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(a)}" ry="${r1(b)}" ${attrs}/>`;
	if (node.shape === 'decision') {
		const puntos = [`${r1(x)},${r1(y - b)}`, `${r1(x + a)},${r1(y)}`, `${r1(x)},${r1(y + b)}`, `${r1(x - a)},${r1(y)}`];
		return `<polygon points="${puntos.join(' ')}" ${attrs}/>`;
	}
	return `<rect x="${r1(x - a)}" y="${r1(y - b)}" width="${r1(2 * a)}" height="${r1(2 * b)}" ${attrs}/>`;
}

export function buildSvg(
	diagram: Diagram,
	options: { editor?: boolean; selected?: Seleccion | null; linkFrom?: string | null } = {},
) {
	const t = SURFACE[diagram.theme];
	const { editor = false, selected = null, linkFrom = null } = options;
	const porId = new Map(diagram.nodes.map((node) => [node.id, node]));
	const pares = new Set(diagram.edges.map((edge) => `${edge.from}>${edge.to}`));

	// Al bajarlo, el lienzo se recorta a lo dibujado con un margen alrededor.
	let [vx, vy, W, H] = [0, 0, WIDTH, HEIGHT];
	if (!editor && diagram.nodes.length) {
		const cajas = diagram.nodes.map((node) => ({ node, ...size(node) }));
		const minX = Math.min(...cajas.map((c) => c.node.x - c.w / 2));
		const minY = Math.min(...cajas.map((c) => c.node.y - c.h / 2));
		const maxX = Math.max(...cajas.map((c) => c.node.x + c.w / 2));
		const maxY = Math.max(...cajas.map((c) => c.node.y + c.h / 2));
		[vx, vy] = [Math.floor(minX - 32), Math.floor(minY - 32)];
		[W, H] = [Math.ceil(maxX + 32) - vx, Math.ceil(maxY + 32) - vy];
	}

	const punta = (id: string, fill: string) =>
		`<marker id="${id}" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L10 5L0 10z" fill="${fill}"/></marker>`;
	let defs = punta('fl-punta', t.fg);
	if (editor) {
		defs +=
			punta('fl-punta-sel', t.accent) +
			`<pattern id="fl-rejilla" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill="${t.axis}"/></pattern>`;
	}

	let fondo = `<rect x="${vx}" y="${vy}" width="${W}" height="${H}" fill="${t.bg}"/>`;
	if (editor) fondo += `<rect width="${W}" height="${H}" fill="url(#fl-rejilla)" data-fondo=""/>`;

	const flechas = diagram.edges.map((edge) => {
		const a = porId.get(edge.from);
		const b = porId.get(edge.to);
		if (!a || !b) return '';
		const d = Math.hypot(b.x - a.x, b.y - a.y);
		if (d < 1) return '';
		const ux = (b.x - a.x) / d;
		const uy = (b.y - a.y) / d;
		const ta = borde(a, ux, uy);
		const tb = borde(b, ux, uy);
		if (ta + tb + 6 >= d) return '';
		// Si hay otra de vuelta, cada una se aparta a su lado para que no se pisen.
		const lado = pares.has(`${edge.to}>${edge.from}`) ? 7 : 0;
		const [px, py] = [-uy * lado, ux * lado];
		const [x1, y1] = [r1(a.x + ux * ta + px), r1(a.y + uy * ta + py)];
		const [x2, y2] = [r1(b.x - ux * (tb + 1) + px), r1(b.y - uy * (tb + 1) + py)];
		const elegida = editor && selected?.kind === 'flecha' && selected.id === edge.id;
		const color = elegida ? t.accent : t.fg;
		let svg = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${elegida ? 2.5 : 1.5}" marker-end="url(#${elegida ? 'fl-punta-sel' : 'fl-punta'})"/>`;
		const etiqueta = edge.text.trim();
		if (etiqueta) {
			const [mx, my] = [r1((x1 + x2) / 2), r1((y1 + y2) / 2)];
			const ancho = r1(etiqueta.length * 7.2 + 12);
			svg +=
				`<rect x="${r1(mx - ancho / 2)}" y="${r1(my - 10)}" width="${ancho}" height="20" fill="${t.bg}" stroke="${t.line}"/>` +
				`<text x="${mx}" y="${r1(my + 4)}" font-size="12" fill="${color}" text-anchor="middle">${esc(etiqueta)}</text>`;
		}
		if (!editor) return svg;
		const nombre = `Flecha de ${a.text.trim() || 'un nodo'} a ${b.text.trim() || 'otro nodo'}`;
		return (
			`<g data-flecha="${edge.id}" tabindex="0" role="button" aria-label="${esc(nombre)}" style="cursor:pointer;outline:none">` +
			`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="transparent" stroke-width="16"/>${svg}</g>`
		);
	});

	const nodos = diagram.nodes.map((node) => {
		const ls = lineas(node.text);
		const arriba = node.y - ((ls.length - 1) * LINE) / 2;
		const texto = ls
			.map((line, i) => `<tspan x="${r1(node.x)}" y="${r1(arriba + i * LINE + FONT * 0.35)}">${esc(line)}</tspan>`)
			.join('');
		let svg =
			forma(node, `fill="${t.bg}"`) +
			forma(node, `fill="${node.color}" fill-opacity="0.16" stroke="${node.color}" stroke-width="2"`) +
			`<text font-size="${FONT}" fill="${t.fg}" text-anchor="middle">${texto}</text>`;
		if (!editor) return svg;
		if (linkFrom === node.id) svg += forma(node, `fill="none" stroke="${t.accent}" stroke-width="2"`, 6);
		else if (selected?.kind === 'nodo' && selected.id === node.id) {
			svg += forma(node, `fill="none" stroke="${t.accent}" stroke-width="1.5" stroke-dasharray="4 3"`, 6);
		}
		const tipo = SHAPES.find((s) => s.id === node.shape)?.label ?? '';
		return `<g data-nodo="${node.id}" tabindex="0" role="button" aria-label="${esc(`${tipo}: ${node.text.trim()}`)}" style="cursor:move;outline:none">${svg}</g>`;
	});

	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${vx} ${vy} ${W} ${H}" font-family="${MONO}"${editor ? '' : ' role="img"'}>` +
		`<title>Diagrama de flujo</title><defs>${defs}</defs>${fondo}${flechas.join('')}${nodos.join('')}</svg>`;
	return { svg, width: W, height: H };
}
