/*
 * El taller de prompts de Herramientas: piezas para combinar, la biblioteca
 * donde se guardan con etiquetas y votos, y el enlace con el que un prompt
 * pasa de una persona a otra.
 *
 * No hay servidor detrás: la biblioteca vive en tu navegador y lo que se
 * comparte viaja dentro del propio enlace.
 */

export const ROLES = [
	{ id: 'dev', label: 'Programador senior', line: 'un programador senior que escribe código listo para producción' },
	{ id: 'profe', label: 'Profesor paciente', line: 'un profesor paciente que explica sin dar nada por sabido' },
	{ id: 'editor', label: 'Editor de textos', line: 'un editor que deja los textos claros y cortos' },
	{ id: 'datos', label: 'Analista de datos', line: 'un analista de datos que no se cree un número sin comprobarlo' },
	{ id: 'revisor', label: 'Revisor exigente', line: 'un revisor exigente que busca fallos antes que elogios' },
] as const;

export const TONES = [
	{ id: 'directo', label: 'Directo', line: 'directo, sin rodeos' },
	{ id: 'didactico', label: 'Didáctico', line: 'didáctico, con un ejemplo por idea' },
	{ id: 'formal', label: 'Formal', line: 'formal y preciso' },
	{ id: 'cercano', label: 'Cercano', line: 'cercano, como entre compañeros' },
] as const;

export const FORMATS = [
	{ id: 'lista', label: 'Lista numerada', line: 'una lista numerada' },
	{ id: 'pasos', label: 'Paso a paso', line: 'pasos en orden, uno por línea' },
	{ id: 'tabla', label: 'Tabla', line: 'una tabla con columnas claras' },
	{ id: 'codigo', label: 'Código comentado', line: 'bloques de código con un comentario por decisión' },
	{ id: 'parrafo', label: 'Un párrafo', line: 'un solo párrafo' },
] as const;

export const RULES = [
	{ id: 'relleno', label: 'Sin relleno', line: 'Nada de introducciones ni despedidas.' },
	{ id: 'dudas', label: 'Pregunta si dudas', line: 'Si algo es ambiguo, pregunta antes de responder.' },
	{ id: 'corto', label: 'Máx. 200 palabras', line: 'No pases de 200 palabras.' },
	{ id: 'supuestos', label: 'Di tus supuestos', line: 'Deja escritos los supuestos que hagas.' },
	{ id: 'espanol', label: 'En español', line: 'Responde en español.' },
] as const;

export type RuleId = (typeof RULES)[number]['id'];

export interface Combo {
	role: string;
	tone: string;
	format: string;
	rules: RuleId[];
	goal: string;
}

export interface Entry {
	id: string;
	title: string;
	text: string;
	tags: string[];
	/** Los votos con los que llegó: de la semilla o del enlace compartido. */
	base: number;
	/** Tu voto: -1, 0 o 1. Uno por prompt y navegador. */
	vote: number;
	created: number;
}

export const MAX_TEXT = 2000;
export const MAX_TITLE = 60;
export const MAX_TAGS = 5;
const MAX_TAG = 20;
const MAX_ENTRIES = 100;

export const KEY = 'tuweb:taller-prompts';

/** El parámetro del enlace compartido. */
export const SHARE_PARAM = 'prompt';

function pick<T extends { id: string }>(list: readonly T[], id: string) {
	return list.find((item) => item.id === id);
}

/** Junta las piezas elegidas. Sin objetivo no hay prompt. */
export function buildCombo(combo: Combo): string {
	const goal = combo.goal.trim();
	if (!goal) return '';

	const role = pick(ROLES, combo.role);
	const tone = pick(TONES, combo.tone);
	const format = pick(FORMATS, combo.format);
	const rules = RULES.filter((rule) => combo.rules.includes(rule.id)).map((rule) => `- ${rule.line}`);

	const parts = [
		role ? `Actúa como ${role.line}.` : '',
		goal,
		[tone ? `Tono: ${tone.line}.` : '', format ? `Formato: ${format.line}.` : ''].filter(Boolean).join('\n'),
		rules.length ? `Reglas:\n${rules.join('\n')}` : '',
	];

	return parts.filter(Boolean).join('\n\n');
}

/** Etiquetas en minúscula, sin almohadilla ni repetidas, cortas y pocas. */
export function cleanTags(raw: string | unknown[]): string[] {
	const list = Array.isArray(raw) ? raw.map(String) : raw.split(',');
	const tags = list
		.map((tag) => tag.trim().replace(/^#+/, '').replace(/\s+/g, '-').toLocaleLowerCase('es').slice(0, MAX_TAG))
		.filter(Boolean);
	return [...new Set(tags)].slice(0, MAX_TAGS);
}

export function score(entry: Entry) {
	return entry.base + entry.vote;
}

function newId() {
	return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function makeEntry(title: string, text: string, tags: string[], base = 0): Entry {
	return {
		id: newId(),
		title: title.trim().replace(/\s+/g, ' ').slice(0, MAX_TITLE) || 'Sin título',
		text: text.trim().slice(0, MAX_TEXT),
		tags: cleanTags(tags),
		base: Math.max(0, Math.min(999, Math.round(base) || 0)),
		vote: 0,
		created: Date.now(),
	};
}

/** Lo que trae la biblioteca la primera vez, para no empezar en blanco. */
const SEEDS: [string, string, string[], number][] = [
	[
		'Revisión de código sin piedad',
		'Actúa como un revisor exigente que busca fallos antes que elogios.\n\nRevisa este código y dime qué se rompe, qué es lento y qué cuesta leer.\n\nFormato: una lista numerada, de lo más grave a lo menos.\n\nReglas:\n- Nada de introducciones ni despedidas.\n- Deja escritos los supuestos que hagas.',
		['código', 'revisión'],
		12,
	],
	[
		'Explícamelo como si empezara hoy',
		'Actúa como un profesor paciente que explica sin dar nada por sabido.\n\nExplícame qué es y para qué sirve: [tema].\n\nTono: didáctico, con un ejemplo por idea.\nFormato: pasos en orden, uno por línea.',
		['aprender'],
		9,
	],
	[
		'Commit con buen mensaje',
		'Escribe el mensaje de commit para este diff: una primera línea de menos de 60 caracteres en imperativo y, debajo, el porqué del cambio en dos o tres líneas.\n\nReglas:\n- Nada de introducciones ni despedidas.',
		['git', 'código'],
		7,
	],
	[
		'Recorta este texto a la mitad',
		'Actúa como un editor que deja los textos claros y cortos.\n\nDeja este texto en la mitad de palabras sin perder ninguna idea.\n\nFormato: un solo párrafo.',
		['escritura'],
		5,
	],
];

function seeds(): Entry[] {
	return SEEDS.map(([title, text, tags, base], index) => ({
		...makeEntry(title, text, tags, base),
		id: `semilla-${index}`,
		created: index,
	}));
}

/** Una entrada leída de fuera (almacenamiento o enlace): se revisa campo a campo. */
function parseEntry(value: unknown): Entry | null {
	if (!value || typeof value !== 'object') return null;
	const raw = value as Record<string, unknown>;
	if (typeof raw.text !== 'string' || !raw.text.trim()) return null;

	const entry = makeEntry(
		typeof raw.title === 'string' ? raw.title : '',
		raw.text,
		Array.isArray(raw.tags) ? cleanTags(raw.tags) : [],
		typeof raw.base === 'number' ? raw.base : 0,
	);
	if (typeof raw.id === 'string' && /^[\w-]{1,40}$/.test(raw.id)) entry.id = raw.id;
	if (raw.vote === 1 || raw.vote === -1) entry.vote = raw.vote;
	if (typeof raw.created === 'number' && Number.isFinite(raw.created)) entry.created = raw.created;
	return entry;
}

export function readLibrary(): Entry[] {
	try {
		const saved = localStorage.getItem(KEY);
		if (!saved) return seeds();
		const parsed = JSON.parse(saved);
		if (!Array.isArray(parsed)) return seeds();
		return parsed
			.map(parseEntry)
			.filter((entry): entry is Entry => entry !== null)
			.slice(0, MAX_ENTRIES);
	} catch {
		// Sin almacenamiento, o con basura dentro: se empieza con las semillas.
		return seeds();
	}
}

export function saveLibrary(entries: Entry[]) {
	try {
		localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
		return true;
	} catch {
		return false;
	}
}

/* El enlace: el prompt en JSON, pasado a UTF-8 y a Base64 apto para URL. */

export function encodeShare(entry: Entry) {
	const json = JSON.stringify({ title: entry.title, text: entry.text, tags: entry.tags, base: score(entry) });
	const bytes = new TextEncoder().encode(json);
	let raw = '';
	bytes.forEach((byte) => {
		raw += String.fromCharCode(byte);
	});
	return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeShare(code: string): Entry | null {
	try {
		const body = code.replace(/-/g, '+').replace(/_/g, '/');
		if (!/^[A-Za-z0-9+/]+$/.test(body) || body.length > MAX_TEXT * 3) return null;
		const raw = atob(body + '='.repeat((4 - (body.length % 4)) % 4));
		const json = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(raw, (c) => c.charCodeAt(0)));
		const entry = parseEntry(JSON.parse(json));
		// Llega como nuevo: ni con el id ni con el voto de quien lo mandó.
		return entry ? { ...entry, id: newId(), vote: 0, created: Date.now() } : null;
	} catch {
		return null;
	}
}
