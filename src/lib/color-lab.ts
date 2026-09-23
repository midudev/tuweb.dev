/*
 * El laboratorio de color: un color base con ajustes, sus armonías y paletas
 * que se comparan en una maqueta. Aquí se trabaja en sRGB y HSL, que es lo que
 * la gente reconoce; la lectura de formatos es la de src/lib/color.ts. Las
 * paletas viven en el localStorage de este navegador y no salen de ahí.
 */

import { type Rgb, hslToRgb, parseColor, rgbToHsl, toRgb } from './color';

export interface Rgba extends Rgb {
	/** Opacidad, de 0 a 1. */
	a: number;
}

export interface Ajustes {
	/** De -100 a 100: cuánto se acerca al gris o al color puro. */
	saturacion: number;
	/** De -100 a 100: cuánto se acerca al negro o al blanco. */
	brillo: number;
	/** De -100 a 100: cuánto se separan los canales del gris medio. */
	contraste: number;
	/** De 0 a 100. */
	opacidad: number;
}

export const SIN_AJUSTES: Ajustes = { saturacion: 0, brillo: 0, contraste: 0, opacidad: 100 };

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/** Empuja un valor de 0 a 1 hacia el tope o hacia cero, en proporción. */
const empuja = (value: number, cuanto: number) =>
	cuanto >= 0 ? value + (1 - value) * (cuanto / 100) : value * (1 + cuanto / 100);

/** Cualquier cosa que entienda src/lib/color.ts, ya en sRGB. */
export function leeColor(texto: string): Rgba | null {
	const color = parseColor(texto);
	if (!color) return null;
	return { ...toRgb(color), a: color.alpha };
}

export function ajusta(base: Rgba, ajustes: Ajustes): Rgba {
	const hsl = rgbToHsl(base);
	const rgb = hslToRgb(hsl.h, clamp(empuja(hsl.s, ajustes.saturacion)), clamp(empuja(hsl.l, ajustes.brillo)));
	const factor = ajustes.contraste >= 0 ? 1 + ajustes.contraste / 50 : 1 + ajustes.contraste / 100;
	const canal = (value: number) => clamp((value - 0.5) * factor + 0.5);
	return { r: canal(rgb.r), g: canal(rgb.g), b: canal(rgb.b), a: clamp(base.a * (ajustes.opacidad / 100)) };
}

const hex2 = (value: number) =>
	Math.round(clamp(value) * 255)
		.toString(16)
		.padStart(2, '0');

const opaco = (a: number) => a >= 0.9995;

/** Hex de seis dígitos, u ocho si hay transparencia y se pide. */
export function hexDe(color: Rgba, conAlfa = true) {
	const base = `#${hex2(color.r)}${hex2(color.g)}${hex2(color.b)}`;
	return conAlfa && !opaco(color.a) ? `${base}${hex2(color.a)}` : base;
}

const redondea = (value: number, decimales = 0) => {
	const factor = 10 ** decimales;
	return Math.round(value * factor) / factor + 0;
};

export function rgbDe(color: Rgba) {
	const [r, g, b] = [color.r, color.g, color.b].map((value) => Math.round(value * 255));
	return opaco(color.a) ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${redondea(color.a, 2)})`;
}

export function hslDe(color: Rgba) {
	const { h, s, l } = rgbToHsl(color);
	const partes = `${redondea(h)}, ${redondea(s * 100)}%, ${redondea(l * 100)}%`;
	return opaco(color.a) ? `hsl(${partes})` : `hsla(${partes}, ${redondea(color.a, 2)})`;
}

/** Luminancia relativa de WCAG 2. */
function luminancia(hex: string) {
	const [r, g, b] = [1, 3, 5].map((i) => {
		const c = parseInt(hex.slice(i, i + 2), 16) / 255;
		return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contraste WCAG entre dos hex opacos, de 1 a 21. */
export function contraste(uno: string, otro: string) {
	const [claro, oscuro] = [luminancia(uno), luminancia(otro)].sort((a, b) => b - a);
	return (claro + 0.05) / (oscuro + 0.05);
}

export interface Nivel {
	etiqueta: string;
	/** Si vale para texto normal (4.5:1). */
	ok: boolean;
}

export function nivelDe(ratio: number): Nivel {
	if (ratio >= 7) return { etiqueta: 'AAA', ok: true };
	if (ratio >= 4.5) return { etiqueta: 'AA', ok: true };
	if (ratio >= 3) return { etiqueta: 'Solo texto grande', ok: false };
	return { etiqueta: 'No se lee', ok: false };
}

/** Negro o blanco, el que más se lea encima de ese color. */
export function tinta(hex: string) {
	return contraste(hex, '#000000') >= contraste(hex, '#ffffff') ? '#000000' : '#ffffff';
}

function gira(color: Rgba, grados: number, luz?: number) {
	const { h, s, l } = rgbToHsl(color);
	return hexDe({ ...hslToRgb(h + grados, s, luz ?? l), a: 1 });
}

export interface Armonia {
	id: string;
	etiqueta: string;
	colores: string[];
}

/** Las armonías clásicas del círculo cromático, con el color de partida delante. */
export function armonias(color: Rgba): Armonia[] {
	return [
		{ id: 'analogos', etiqueta: 'Análogos', colores: [-60, -30, 0, 30, 60].map((g) => gira(color, g)) },
		{ id: 'complementario', etiqueta: 'Complementario', colores: [0, 180].map((g) => gira(color, g)) },
		{
			id: 'dividido',
			etiqueta: 'Complementario dividido',
			colores: [0, 150, 210].map((g) => gira(color, g)),
		},
		{ id: 'triada', etiqueta: 'Tríada', colores: [0, 120, 240].map((g) => gira(color, g)) },
	];
}

/** El mismo tono de más claro a más oscuro. */
export function variaciones(color: Rgba) {
	return [0.95, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25, 0.15].map((luz) => gira(color, 0, luz));
}

/* Paletas */

export interface Paleta {
	nombre: string;
	colores: string[];
}

export const MAX_PALETAS = 4;
export const MAX_COLORES = 8;
export const NOMBRES = ['A', 'B', 'C', 'D'];

/** Lo que pinta cada color en la maqueta, por orden. */
export const PAPELES = ['fondo', 'texto', 'acento', 'superficie', 'secundario'] as const;

export type Papel = (typeof PAPELES)[number];

export function papelDe(indice: number) {
	return PAPELES[indice] ?? `color-${indice + 1}`;
}

/** Los papeles de la maqueta; si faltan colores, se tira de los que hay. */
export function papeles(colores: string[]): Record<Papel, string> {
	const fondo = colores[0] ?? '#ffffff';
	const texto = colores[1] ?? tinta(fondo);
	const acento = colores[2] ?? texto;
	return {
		fondo,
		texto,
		acento,
		superficie: colores[3] ?? fondo,
		secundario: colores[4] ?? acento,
	};
}

export interface Chequeo {
	que: string;
	ratio: number;
	nivel: Nivel;
}

/** Las parejas de la maqueta que llevan texto encima, con su contraste. */
export function chequeos(colores: string[]): Chequeo[] {
	const p = papeles(colores);
	const parejas: [string, string, string][] = [
		['Texto sobre fondo', p.texto, p.fondo],
		['Texto sobre superficie', p.texto, p.superficie],
		['Enlace sobre fondo', p.acento, p.fondo],
		['Botón', tinta(p.acento), p.acento],
		['Etiqueta sobre superficie', p.secundario, p.superficie],
	];
	return parejas.map(([que, uno, otro]) => {
		const ratio = contraste(uno, otro);
		return { que, ratio, nivel: nivelDe(ratio) };
	});
}

export function cssDe(paleta: Paleta) {
	const lineas = paleta.colores.map((hex, i) => `  --${papelDe(i)}: ${hex};`);
	return `/* Paleta ${paleta.nombre} · tuweb.dev */\n:root {\n${lineas.join('\n')}\n}\n`;
}

const CLAVE = 'tuweb:laboratorio';
const HEX = /^#[0-9a-f]{6}$/;

/** La de casa, para empezar con algo que ya se lee. Nueva cada vez: se edita en sitio. */
const inicial = (): Paleta[] => [
	{ nombre: 'A', colores: ['#fdf6ef', '#3b2d24', '#c2410c', '#f7ece1', '#2f7a3b'] },
];

/** Solo se acepta lo que la propia herramienta guarda: hex de seis dígitos. */
export function leePaletas(): Paleta[] {
	try {
		const datos = JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
		if (!Array.isArray(datos)) return inicial();
		const paletas = datos.slice(0, MAX_PALETAS).map((colores: unknown, i: number) => ({
			nombre: NOMBRES[i],
			colores:
				Array.isArray(colores) ?
					colores.filter((hex): hex is string => typeof hex === 'string' && HEX.test(hex)).slice(0, MAX_COLORES)
				:	[],
		}));
		return paletas.length ? paletas : inicial();
	} catch {
		return inicial();
	}
}

export function guardaPaletas(paletas: Paleta[]) {
	try {
		localStorage.setItem(CLAVE, JSON.stringify(paletas.map((paleta) => paleta.colores)));
	} catch {
		// Modo privado: las paletas duran la visita.
	}
}
