/*
 * El escaparate: los proyectos terminados de quien pasa por aquí. Las fichas
 * viven en /api/escaparate y las ve todo el mundo, con el nombre de GitHub de
 * quien las publicó. Aquí están las cribas, que también usa el servidor.
 */

export interface Project {
	/** El id del servidor, que es también con el que se borra. */
	id: number;
	name: string;
	/** Siempre http o https, ya normalizada. Vacía si el servidor mandó otra cosa. */
	url: string;
	/** De qué va, en una línea. */
	pitch: string;
	tag: string;
	at: number;
	/** El login de quien la publicó. */
	author: string;
	/** Publicada por ti: es la única que puedes quitar. */
	mine: boolean;
}

/** Lo que sale del formulario, antes de que el servidor le ponga id y firma. */
export type ProjectDraft = Pick<Project, 'name' | 'url' | 'pitch' | 'tag'>;

export const TAGS = ['SaaS', 'App', 'Herramienta', 'Librería', 'Juego', 'Otro'] as const;

export const NAME_MAX = 32;
export const PITCH_MAX = 120;
/** Las fichas que puede tener cada persona. Lo vigila el servidor. */
export const PER_PERSON = 3;

/** Espacios de más fuera y nada de saltos de línea: cada campo es una línea. */
function oneLine(text: string, max: number) {
	return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

/**
 * Solo entran enlaces web. Sin esquema se asume https, y cualquier otra cosa
 * (javascript:, data:, un texto suelto) se queda fuera: de aquí sale un href.
 */
export function cleanUrl(raw: string) {
	const text = raw.trim();
	if (!text || /\s/.test(text)) return '';

	try {
		const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
		if (!url.hostname.includes('.')) return '';
		return url.href;
	} catch {
		return '';
	}
}

/** El dominio pelado, que es lo que se enseña debajo del nombre. */
export function hostOf(url: string) {
	try {
		return new URL(url).host.replace(/^www\./, '');
	} catch {
		return url;
	}
}

export function isTag(value: unknown): value is (typeof TAGS)[number] {
	return typeof value === 'string' && (TAGS as readonly string[]).includes(value);
}

/**
 * Una ficha a partir de lo escrito en el formulario, o el motivo por el que no
 * vale. Es la primera criba: la que manda es la del servidor.
 */
export function toProject(draft: Partial<Record<keyof ProjectDraft, unknown>>): ProjectDraft | string {
	const name = oneLine(String(draft.name ?? ''), NAME_MAX);
	if (!name) return 'Ponle nombre al proyecto.';

	const url = cleanUrl(String(draft.url ?? ''));
	if (!url) return 'El enlace tiene que ser una dirección web (https://…).';
	// El mismo tope que pone el servidor.
	if (url.length > 200) return 'El enlace es demasiado largo.';

	const pitch = oneLine(String(draft.pitch ?? ''), PITCH_MAX);
	if (!pitch) return 'Cuenta en una línea de qué va.';

	const tag = isTag(draft.tag) ? draft.tag : 'Otro';

	return { name, url, pitch, tag };
}

/**
 * Una ficha tal como llega de /api/escaparate, o null si viene rara. El enlace
 * se vuelve a cribar aquí: de él sale un href, y solo vale http o https.
 */
export function fromApi(raw: unknown): Project | null {
	if (!raw || typeof raw !== 'object') return null;
	const item = raw as Record<string, unknown>;

	if (typeof item.id !== 'number' || !Number.isInteger(item.id)) return null;
	if (typeof item.name !== 'string' || !item.name) return null;

	return {
		id: item.id,
		name: item.name,
		url: typeof item.url === 'string' && /^https?:\/\//i.test(item.url) ? cleanUrl(item.url) : '',
		pitch: typeof item.pitch === 'string' ? item.pitch : '',
		tag: isTag(item.tag) ? item.tag : 'Otro',
		at: typeof item.at === 'number' ? item.at : 0,
		author: typeof item.author === 'string' ? item.author : '',
		mine: item.mine === true,
	};
}
