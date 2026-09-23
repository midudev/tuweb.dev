/**
 * Generador de calendarios: un mes o un año entero en SVG, con festivos,
 * notas por día y los colores que se elijan. Todo se pinta en el navegador.
 */
import { MONO, SURFACE, esc } from './chart';

export type Vista = 'mes' | 'anio';
export type Tema = 'claro' | 'oscuro';
export type ColorId = 'cabecera' | 'festivo' | 'nota';

export interface Calendario {
	vista: Vista;
	year: number;
	month: number;
	title: string;
	theme: Tema;
	finde: boolean;
	colores: Record<ColorId, string>;
	festivos: string[];
	notas: Record<string, string>;
}

export const MESES = [
	'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
	'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const INICIALES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export const TITLE_MAX = 60;
export const NOTA_MAX = 80;
export const YEAR_MIN = 1900;
export const YEAR_MAX = 2200;

export const COLORES: { id: ColorId; label: string }[] = [
	{ id: 'cabecera', label: 'Cabecera' },
	{ id: 'festivo', label: 'Festivos' },
	{ id: 'nota', label: 'Notas' },
];

/** Los de serie de cada fondo. Al cambiar de fondo, el que siga en el de serie pasa al del otro. */
export const COLORES_BASE: Record<Tema, Record<ColorId, string>> = {
	claro: { cabecera: '#c2410c', festivo: '#e34948', nota: '#2a78d6' },
	oscuro: { cabecera: '#fc784b', festivo: '#e66767', nota: '#3987e5' },
};

export function nuevo(hoy = new Date(), theme: Tema = 'claro'): Calendario {
	return {
		vista: 'mes',
		year: hoy.getFullYear(),
		month: hoy.getMonth(),
		title: '',
		theme,
		finde: true,
		colores: { ...COLORES_BASE[theme] },
		festivos: [],
		notas: {},
	};
}

const HEX = /^#[0-9a-f]{6}$/i;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Lo que venga de localStorage se revisa campo a campo: si algo no cuadra, va el de serie. */
export function sanea(raw: unknown, base: Calendario): Calendario {
	if (!raw || typeof raw !== 'object') return base;
	const r = raw as Partial<Calendario>;
	const year = Number(r.year);
	const month = Number(r.month);
	const theme: Tema = r.theme === 'oscuro' ? 'oscuro' : r.theme === 'claro' ? 'claro' : base.theme;
	const colores = { ...COLORES_BASE[theme] };
	for (const { id } of COLORES) {
		const valor = r.colores?.[id];
		if (typeof valor === 'string' && HEX.test(valor)) colores[id] = valor;
	}
	const notas: Record<string, string> = {};
	if (r.notas && typeof r.notas === 'object') {
		for (const [dia, texto] of Object.entries(r.notas)) {
			if (FECHA.test(dia) && typeof texto === 'string' && texto.trim()) notas[dia] = texto.slice(0, NOTA_MAX);
		}
	}
	return {
		vista: r.vista === 'anio' ? 'anio' : 'mes',
		year: Number.isInteger(year) && year >= YEAR_MIN && year <= YEAR_MAX ? year : base.year,
		month: Number.isInteger(month) && month >= 0 && month <= 11 ? month : base.month,
		title: typeof r.title === 'string' ? r.title.slice(0, TITLE_MAX) : '',
		theme,
		finde: typeof r.finde === 'boolean' ? r.finde : base.finde,
		colores,
		festivos: Array.isArray(r.festivos) ? [...new Set(r.festivos.filter((d) => typeof d === 'string' && FECHA.test(d)))] : [],
		notas,
	};
}

const dos = (n: number) => String(n).padStart(2, '0');
export const clave = (year: number, month: number, day: number) => `${year}-${dos(month + 1)}-${dos(day)}`;
const diasDe = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
/** Lunes = 0: la semana empieza en lunes, como en los calendarios de aquí. */
const primero = (year: number, month: number) => (new Date(year, month, 1).getDay() + 6) % 7;

/** Domingo de Pascua (algoritmo anónimo gregoriano). */
function pascua(year: number) {
	const a = year % 19;
	const b = Math.floor(year / 100);
	const c = year % 100;
	const d = Math.floor(b / 4);
	const e = b % 4;
	const f = Math.floor((b + 8) / 25);
	const g = Math.floor((b - f + 1) / 3);
	const h = (19 * a + b - d - g + 15) % 30;
	const i = Math.floor(c / 4);
	const k = c % 4;
	const l = (32 + 2 * e + 2 * i - h - k) % 7;
	const m = Math.floor((a + 11 * h + 22 * l) / 451);
	const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
	const day = ((h + l - 7 * m + 114) % 31) + 1;
	return new Date(year, month, day);
}

/** Los festivos nacionales de España de ese año. Los autonómicos y locales, a mano. */
export function festivosEspana(year: number): [string, string][] {
	const viernes = pascua(year);
	viernes.setDate(viernes.getDate() - 2);
	return [
		[clave(year, 0, 1), 'Año Nuevo'],
		[clave(year, 0, 6), 'Reyes'],
		[clave(year, viernes.getMonth(), viernes.getDate()), 'Viernes Santo'],
		[clave(year, 4, 1), 'Día del Trabajo'],
		[clave(year, 7, 15), 'Asunción'],
		[clave(year, 9, 12), 'Fiesta Nacional'],
		[clave(year, 10, 1), 'Todos los Santos'],
		[clave(year, 11, 6), 'Constitución'],
		[clave(year, 11, 8), 'Inmaculada'],
		[clave(year, 11, 25), 'Navidad'],
	];
}

const PIXEL = 'Geist Pixel, Geist Mono Variable, monospace';
const W = 960;
const PAD = 48;
/** Letra de ancho fijo: medir un texto es contar. */
const CHAR = 0.6;
const r1 = (n: number) => Math.round(n * 10) / 10;

function texto(
	x: number,
	y: number,
	contenido: string,
	{ size = 14, fill, anchor = 'start', pixel = false, peso = 0 }: { size?: number; fill: string; anchor?: string; pixel?: boolean; peso?: number },
) {
	const extra = `${anchor === 'start' ? '' : ` text-anchor="${anchor}"`}${pixel ? ` font-family="${PIXEL}"` : ''}${peso ? ` font-weight="${peso}"` : ''}`;
	return `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" fill="${fill}"${extra}>${esc(contenido)}</text>`;
}

function corta(valor: string, max: number) {
	return valor.length > max ? `${valor.slice(0, Math.max(1, max - 1))}…` : valor;
}

/** Parte en líneas de `max` caracteres; si no cabe todo, la última acaba en puntos. */
function trocea(valor: string, max: number, lineas: number) {
	const salida: string[] = [];
	let actual = '';
	for (const palabra of valor.trim().split(/\s+/)) {
		const junta = actual ? `${actual} ${palabra}` : palabra;
		if (junta.length <= max) actual = junta;
		else {
			if (actual) salida.push(actual);
			actual = palabra.length > max ? corta(palabra, max) : palabra;
		}
	}
	if (actual) salida.push(actual);
	if (salida.length <= lineas) return salida;
	const recorte = salida.slice(0, lineas);
	recorte[lineas - 1] = corta(`${recorte[lineas - 1]} ${salida[lineas]}`, max);
	if (!recorte[lineas - 1].endsWith('…')) recorte[lineas - 1] = `${recorte[lineas - 1].slice(0, max - 1)}…`;
	return recorte;
}

interface Opciones {
	/** Para la vista previa: cada día lleva su fecha para poder tocarlo, y el elegido va marcado. */
	editable?: boolean;
	seleccionado?: string;
	fontCss?: string;
}

function contexto(cal: Calendario) {
	const s = SURFACE[cal.theme];
	const c = {
		cabecera: HEX.test(cal.colores.cabecera) ? cal.colores.cabecera : COLORES_BASE[cal.theme].cabecera,
		festivo: HEX.test(cal.colores.festivo) ? cal.colores.festivo : COLORES_BASE[cal.theme].festivo,
		nota: HEX.test(cal.colores.nota) ? cal.colores.nota : COLORES_BASE[cal.theme].nota,
	};
	return { s, c, festivos: new Set(cal.festivos) };
}

/** Un mes grande, con las notas escritas dentro de cada día. */
function mes(cal: Calendario, o: Opciones) {
	const { s, c, festivos } = contexto(cal);
	const partes: string[] = [];
	let y = PAD;

	if (cal.title.trim()) {
		partes.push(texto(PAD, y + 16, corta(cal.title.trim(), 70), { size: 18, fill: s.muted }));
		y += 34;
	}
	partes.push(texto(PAD, y + 44, MESES[cal.month], { size: 48, fill: c.cabecera, pixel: true }));
	partes.push(texto(W - PAD, y + 44, String(cal.year), { size: 48, fill: s.muted, pixel: true, anchor: 'end' }));
	y += 76;

	const cw = (W - PAD * 2) / 7;
	const ch = 112;
	SEMANA.forEach((nombre, i) => {
		const finde = i >= 5 && cal.finde;
		partes.push(texto(PAD + cw * i + 10, y + 14, nombre, { size: 14, fill: finde ? c.cabecera : s.muted }));
	});
	y += 28;

	const inicio = primero(cal.year, cal.month);
	const dias = diasDe(cal.year, cal.month);
	const filas = Math.ceil((inicio + dias) / 7);
	const maxChars = Math.floor((cw - 20) / (12 * CHAR));
	let marca = '';

	for (let celda = 0; celda < filas * 7; celda++) {
		const x = PAD + (celda % 7) * cw;
		const top = y + Math.floor(celda / 7) * ch;
		const dia = celda - inicio + 1;
		const dentro = dia >= 1 && dia <= dias;
		const finde = celda % 7 >= 5 && cal.finde;
		const k = dentro ? clave(cal.year, cal.month, dia) : '';
		const festivo = dentro && festivos.has(k);

		const fondo = finde ? s.panel : s.bg;
		const caja = `<rect x="${r1(x)}" y="${r1(top)}" width="${r1(cw)}" height="${ch}" fill="${fondo}" stroke="${s.line}"/>`;
		if (!dentro) {
			partes.push(caja);
			continue;
		}
		const dentroG: string[] = [caja];
		if (festivo) {
			dentroG.push(`<rect x="${r1(x)}" y="${r1(top)}" width="${r1(cw)}" height="${ch}" fill="${c.festivo}" fill-opacity="0.16"/>`);
			dentroG.push(`<rect x="${r1(x)}" y="${r1(top)}" width="4" height="${ch}" fill="${c.festivo}"/>`);
		}
		dentroG.push(texto(x + 12, top + 26, String(dia), { size: 20, fill: festivo ? c.festivo : s.fg, pixel: true }));
		const nota = cal.notas[k];
		if (nota) {
			trocea(nota, maxChars, 5).forEach((linea, i) => {
				dentroG.push(texto(x + 12, top + 50 + i * 14, linea, { size: 12, fill: c.nota }));
			});
		}
		if (o.editable && k === o.seleccionado) {
			marca = `<rect x="${r1(x + 1.5)}" y="${r1(top + 1.5)}" width="${r1(cw - 3)}" height="${ch - 3}" fill="none" stroke="${s.accent}" stroke-width="3"/>`;
		}
		partes.push(o.editable ? `<g data-dia="${k}" style="cursor:pointer">${dentroG.join('')}</g>` : dentroG.join(''));
	}
	partes.push(marca);
	return { partes, alto: y + filas * ch + PAD };
}

/** Los doce meses en pequeño y, debajo, la lista de notas del año. */
function anio(cal: Calendario, o: Opciones) {
	const { s, c, festivos } = contexto(cal);
	const partes: string[] = [];
	let y = PAD;

	if (cal.title.trim()) {
		partes.push(texto(PAD, y + 16, corta(cal.title.trim(), 70), { size: 18, fill: s.muted }));
		y += 34;
	}
	partes.push(texto(PAD, y + 52, String(cal.year), { size: 60, fill: c.cabecera, pixel: true }));
	y += 84;

	const hueco = 28;
	const colW = (W - PAD * 2 - hueco * 3) / 4;
	const cw = colW / 7;
	const rh = 24;
	const bloque = 22 + 8 + 20 + rh * 6;
	let marca = '';

	for (let m = 0; m < 12; m++) {
		const bx = PAD + (m % 4) * (colW + hueco);
		const by = y + Math.floor(m / 4) * (bloque + hueco);
		partes.push(texto(bx, by + 16, MESES[m], { size: 16, fill: c.cabecera, pixel: true }));
		INICIALES.forEach((letra, i) => {
			const finde = i >= 5 && cal.finde;
			partes.push(texto(bx + cw * i + cw / 2, by + 44, letra, { size: 11, fill: finde ? c.cabecera : s.muted, anchor: 'middle' }));
		});
		const inicio = primero(cal.year, m);
		const dias = diasDe(cal.year, m);
		for (let dia = 1; dia <= dias; dia++) {
			const celda = inicio + dia - 1;
			const x = bx + (celda % 7) * cw;
			const top = by + 50 + Math.floor(celda / 7) * rh;
			const k = clave(cal.year, m, dia);
			const festivo = festivos.has(k);
			const finde = celda % 7 >= 5 && cal.finde;
			const g: string[] = [];
			const fondo = festivo ? c.festivo : finde ? s.panel : null;
			g.push(
				fondo
					? `<rect x="${r1(x + 1)}" y="${r1(top + 1)}" width="${r1(cw - 2)}" height="${rh - 2}" fill="${fondo}"/>`
					: `<rect x="${r1(x + 1)}" y="${r1(top + 1)}" width="${r1(cw - 2)}" height="${rh - 2}" fill="#000" fill-opacity="0"/>`,
			);
			g.push(texto(x + cw / 2, top + 16, String(dia), { size: 12, fill: festivo ? s.bg : s.fg, anchor: 'middle', peso: festivo ? 700 : 0 }));
			if (cal.notas[k]) {
				g.push(`<rect x="${r1(x + cw / 2 - 6)}" y="${r1(top + rh - 5)}" width="12" height="2" fill="${festivo ? s.bg : c.nota}"/>`);
			}
			if (o.editable && k === o.seleccionado) {
				marca = `<rect x="${r1(x + 0.5)}" y="${r1(top + 0.5)}" width="${r1(cw - 1)}" height="${rh - 1}" fill="none" stroke="${s.accent}" stroke-width="2"/>`;
			}
			partes.push(o.editable ? `<g data-dia="${k}" style="cursor:pointer">${g.join('')}</g>` : g.join(''));
		}
	}
	partes.push(marca);
	y += bloque * 3 + hueco * 2 + 12;

	const notas = Object.entries(cal.notas)
		.filter(([dia]) => dia.startsWith(`${cal.year}-`))
		.sort(([a], [b]) => a.localeCompare(b));
	if (notas.length) {
		y += 20;
		partes.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="${s.line}"/>`);
		y += 30;
		partes.push(texto(PAD, y, 'Notas', { size: 14, fill: s.muted }));
		y += 12;
		const tope = 40;
		const mitad = Math.ceil(Math.min(notas.length, tope) / 2);
		const colNota = (W - PAD * 2 - hueco) / 2;
		const maxChars = Math.floor((colNota - 72) / (13 * CHAR));
		notas.slice(0, tope).forEach(([dia, nota], i) => {
			const [, mm, dd] = dia.split('-').map(Number);
			const x = PAD + (i < mitad ? 0 : colNota + hueco);
			const ly = y + 22 * ((i % mitad) + 1);
			const festivo = festivos.has(dia);
			partes.push(texto(x, ly, `${dd} ${MESES[mm - 1].slice(0, 3).toLowerCase()}`, { size: 13, fill: festivo ? c.festivo : s.muted }));
			partes.push(texto(x + 72, ly, corta(nota.replace(/\s+/g, ' ').trim(), maxChars), { size: 13, fill: c.nota }));
		});
		y += 22 * mitad;
		if (notas.length > tope) {
			y += 26;
			partes.push(texto(PAD, y, `Y ${notas.length - tope} notas más que no caben.`, { size: 13, fill: s.muted }));
		}
		y += 8;
	}
	return { partes, alto: y + PAD };
}

/** 960 de ancho y el alto que pida. `fontCss` solo para el PNG: la imagen no ve las fuentes de la página. */
export function buildCalendar(cal: Calendario, o: Opciones = {}) {
	const s = SURFACE[cal.theme];
	const { partes, alto } = cal.vista === 'anio' ? anio(cal, o) : mes(cal, o);
	const nombre = cal.vista === 'anio' ? `Calendario de ${cal.year}` : `Calendario de ${MESES[cal.month].toLowerCase()} de ${cal.year}`;
	const estilo = o.fontCss ? `<defs><style>${o.fontCss}</style></defs>` : '';
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${alto}" viewBox="0 0 ${W} ${alto}" font-family="${MONO}" role="img" aria-label="${esc(cal.title.trim() || nombre)}">` +
		`${estilo}<rect width="${W}" height="${alto}" fill="${s.bg}"/>${partes.join('')}</svg>`;
	return { svg, width: W, height: alto };
}
