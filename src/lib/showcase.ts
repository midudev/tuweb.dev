/*
 * El escaparate: los proyectos terminados de quien pasa por aquí. No hay
 * servidor detrás, así que cada ficha vive en el navegador de quien la publica,
 * igual que el chat o la config. Para que lo vea todo el mundo hay que copiar
 * la ficha y proponerla como idea, que es como se cambia esta web.
 */

export interface Project {
	id: string;
	name: string;
	/** Siempre http o https, ya normalizada. */
	url: string;
	/** De qué va, en una línea. */
	pitch: string;
	tag: string;
	at: number;
}

export const TAGS = ['SaaS', 'App', 'Herramienta', 'Librería', 'Juego', 'Otro'] as const;

export const NAME_MAX = 32;
export const PITCH_MAX = 120;
/** Un escaparate, no un vertedero. */
export const MAX_PROJECTS = 24;

const KEY = 'tuweb:escaparate';

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
 * vale. Lo mismo sirve para lo que se teclea ahora y para lo que se lee del
 * localStorage, que podría venir tocado a mano.
 */
export function toProject(draft: Partial<Record<keyof Project, unknown>>): Project | string {
	const name = oneLine(String(draft.name ?? ''), NAME_MAX);
	if (!name) return 'Ponle nombre al proyecto.';

	const url = cleanUrl(String(draft.url ?? ''));
	if (!url) return 'El enlace tiene que ser una dirección web (https://…).';

	const pitch = oneLine(String(draft.pitch ?? ''), PITCH_MAX);
	if (!pitch) return 'Cuenta en una línea de qué va.';

	const tag = isTag(draft.tag) ? draft.tag : 'Otro';
	const at = typeof draft.at === 'number' && Number.isFinite(draft.at) ? draft.at : Date.now();
	const id = typeof draft.id === 'string' && draft.id ? draft.id.slice(0, 32) : nextId();

	return { id, name, url, pitch, tag, at };
}

export function nextId() {
	return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function readProjects(): Project[] {
	try {
		const saved = localStorage.getItem(KEY);
		if (!saved) return [];

		const parsed = JSON.parse(saved) as unknown;
		if (!Array.isArray(parsed)) return [];

		return parsed
			.map((item) => (item && typeof item === 'object' ? toProject(item as Partial<Project>) : ''))
			.filter((item): item is Project => typeof item !== 'string')
			.slice(0, MAX_PROJECTS);
	} catch {
		// Sin almacenamiento, o con basura dentro: escaparate vacío y a seguir.
		return [];
	}
}

export function saveProjects(projects: Project[]) {
	try {
		if (projects.length === 0) localStorage.removeItem(KEY);
		else localStorage.setItem(KEY, JSON.stringify(projects));
	} catch {
		// Si no deja guardar, las fichas duran lo que dure la visita.
	}
}

/** La misma ficha escrita para pegarla en el formulario de ideas. */
export function pitchOf(project: Project) {
	return `Publicad en el escaparate ${project.name} (${project.url}), ${project.tag.toLowerCase()}: ${project.pitch}`.slice(
		0,
		280,
	);
}
