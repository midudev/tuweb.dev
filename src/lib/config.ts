/*
 * Las variables de esta web: los mismos tokens que están escritos en
 * src/styles/global.css. El panel de Config las deja tocar en caliente y las
 * guarda en el navegador de quien las tocó; el repo no se entera. Sirve para
 * probar un cambio antes de proponerlo, que aquí decide la gente.
 */

import type { Scheme } from './theme';

export type VarKind = 'color' | 'size';

export interface ConfigVar {
	/** El nombre tal cual sale en global.css. */
	name: string;
	label: string;
	kind: VarKind;
	group: string;
	/** Lo de fábrica en oscuro, que es el tema de casa. */
	base: string;
	/** Lo de fábrica en claro, cuando no es el mismo valor. */
	light?: string;
}

export const GROUPS = ['Colores', 'Tipografía'] as const;

export const CONFIG_VARS: readonly ConfigVar[] = [
	{ name: '--color-bg', label: 'Fondo', kind: 'color', group: 'Colores', base: '#0a0a0a', light: '#fbfbfa' },
	{ name: '--color-fg', label: 'Texto', kind: 'color', group: 'Colores', base: '#ececec', light: '#17171a' },
	{ name: '--color-muted', label: 'Texto apagado', kind: 'color', group: 'Colores', base: '#8a8a8a', light: '#5f5f66' },
	{ name: '--color-line', label: 'Líneas', kind: 'color', group: 'Colores', base: '#222222', light: '#dcdcd6' },
	{ name: '--color-panel', label: 'Paneles', kind: 'color', group: 'Colores', base: '#111111', light: '#f2f2ee' },
	{ name: '--text-xs', label: 'Texto pequeño', kind: 'size', group: 'Tipografía', base: '13px' },
	{ name: '--text-sm', label: 'Texto normal', kind: 'size', group: 'Tipografía', base: '15px' },
	{ name: '--text-base', label: 'Texto de cuerpo', kind: 'size', group: 'Tipografía', base: '16px' },
	{ name: '--text-lg', label: 'Texto grande', kind: 'size', group: 'Tipografía', base: '18px' },
];

/** Los tamaños se quedan en un rango que se sigue leyendo y no rompe la caja. */
export const SIZE_MIN = 11;
export const SIZE_MAX = 28;

const KEY = 'tuweb:config';

const HEX = /^#[0-9a-f]{6}$/;
const SIZE = /^(\d{1,3})px$/;

export type Config = Record<string, string>;

export function varOf(name: string) {
	return CONFIG_VARS.find((item) => item.name === name);
}

/** Lo de fábrica depende del esquema: el claro repisa la mitad de los colores. */
export function defaultOf(item: ConfigVar, scheme: Scheme) {
	return scheme === 'claro' && item.light ? item.light : item.base;
}

/**
 * Solo entran valores de la forma que esperamos: un hex de seis dígitos o unos
 * píxeles dentro de rango. Así lo que se lee del localStorage nunca acaba
 * siendo una regla CSS cualquiera.
 */
export function isValid(item: ConfigVar, value: string) {
	if (item.kind === 'color') return HEX.test(value);

	const size = value.match(SIZE);
	if (!size) return false;

	const px = Number(size[1]);
	return px >= SIZE_MIN && px <= SIZE_MAX;
}

export function readConfig(): Config {
	const config: Config = {};

	try {
		const saved = localStorage.getItem(KEY);
		if (!saved) return config;

		const parsed = JSON.parse(saved) as unknown;
		if (!parsed || typeof parsed !== 'object') return config;

		for (const [name, value] of Object.entries(parsed as Record<string, unknown>)) {
			const item = varOf(name);
			if (!item || typeof value !== 'string') continue;
			const clean = value.trim().toLowerCase();
			if (isValid(item, clean)) config[name] = clean;
		}
	} catch {
		// Sin localStorage, o con basura dentro: la web de siempre.
	}

	return config;
}

export function saveConfig(config: Config) {
	try {
		if (Object.keys(config).length === 0) localStorage.removeItem(KEY);
		else localStorage.setItem(KEY, JSON.stringify(config));
	} catch {
		// Si no deja guardar, no pasa nada: el cambio dura la visita.
	}
}

/**
 * Las variables van en línea sobre el <html>: así ganan a global.css sin tener
 * que reescribir ninguna hoja de estilos. Lo que no está cambiado se quita,
 * para que vuelva a mandar el CSS del repo.
 */
export function applyConfig(config: Config) {
	const root = document.documentElement;

	for (const item of CONFIG_VARS) {
		const value = config[item.name];
		if (value) root.style.setProperty(item.name, value);
		else root.style.removeProperty(item.name);
	}
}

/** El mismo cambio, escrito para pegarlo en global.css y proponerlo. */
export function configCss(entries: [string, string][], scheme: Scheme) {
	if (entries.length === 0) return '';

	// Los colores del esquema claro no viven en @theme, sino en el bloque del
	// esquema; los tamaños son los mismos en los dos y siempre van en @theme.
	const scoped = scheme === 'claro' ? entries.filter(([name]) => name.startsWith('--color-')) : [];
	const base = entries.filter((entry) => !scoped.includes(entry));

	const block = (selector: string, list: [string, string][]) =>
		list.length === 0
			? ''
			: `${selector} {\n${list.map(([name, value]) => `\t${name}: ${value};`).join('\n')}\n}`;

	return ['/* src/styles/global.css */', block('@theme', base), block("html[data-tema='claro']", scoped)]
		.filter(Boolean)
		.join('\n');
}
