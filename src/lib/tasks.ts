/*
 * Las tareas: lo que hay que hacer, con su nivel y su hora. Como el escaparate
 * o el chat, no hay servidor detrás: la lista vive en el navegador de quien la
 * escribe y no sale de ahí. El aviso de cuánto falta se calcula en cada vuelta
 * del reloj, así que nada se guarda ya cocinado.
 */

/** De lo que puede esperar a lo que no. El orden es el de la lista. */
export type Level = 'leve' | 'normal' | 'importante' | 'urgente';

export interface LevelInfo {
	id: Level;
	label: string;
	/** Cuánto pesa al ordenar dos tareas que vencen a la vez. */
	rank: number;
	/** Un token de global.css, que es de donde salen todos los colores. */
	color: string;
}

export const LEVELS: readonly LevelInfo[] = [
	{ id: 'leve', label: 'Leve', rank: 0, color: 'var(--color-muted)' },
	{ id: 'normal', label: 'Normal', rank: 1, color: 'var(--color-accent)' },
	{ id: 'importante', label: 'Importante', rank: 2, color: 'var(--color-building)' },
	{ id: 'urgente', label: 'Urgente', rank: 3, color: 'var(--color-heart)' },
];

export interface Task {
	id: string;
	title: string;
	/** Un detalle corto, si hace falta. */
	note: string;
	level: Level;
	/** Cuándo toca, en milisegundos. Sin fecha no hay cuenta atrás. */
	due: number | null;
	done: boolean;
	at: number;
	/** Si ya se avisó de que venció, para no repetir el aviso cada segundo. */
	alerted: boolean;
}

export const TITLE_MAX = 80;
export const NOTE_MAX = 140;
/** Una lista de tareas, no un archivo histórico. */
export const MAX_TASKS = 60;

const KEY = 'tuweb:tareas';
const ALERTS_KEY = 'tuweb:tareas-avisos';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Espacios de más fuera y nada de saltos de línea: cada campo es una línea. */
function oneLine(text: string, max: number) {
	return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

export function isLevel(value: unknown): value is Level {
	return typeof value === 'string' && LEVELS.some((item) => item.id === value);
}

export function levelOf(level: Level) {
	return LEVELS.find((item) => item.id === level) ?? LEVELS[1];
}

export function nextId() {
	return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Una tarea a partir de lo escrito en el formulario, o el motivo por el que no
 * vale. Lo mismo sirve para lo que se teclea ahora y para lo que se lee del
 * localStorage, que podría venir tocado a mano.
 */
export function toTask(draft: Partial<Record<keyof Task, unknown>>): Task | string {
	const title = oneLine(String(draft.title ?? ''), TITLE_MAX);
	if (!title) return 'Escribe qué hay que hacer.';

	const note = oneLine(String(draft.note ?? ''), NOTE_MAX);
	const level = isLevel(draft.level) ? draft.level : 'normal';

	const due =
		typeof draft.due === 'number' && Number.isFinite(draft.due) ? Math.trunc(draft.due) : null;

	const at = typeof draft.at === 'number' && Number.isFinite(draft.at) ? draft.at : Date.now();
	const id = typeof draft.id === 'string' && draft.id ? draft.id.slice(0, 32) : nextId();

	return {
		id,
		title,
		note,
		level,
		due,
		done: draft.done === true,
		at,
		alerted: draft.alerted === true,
	};
}

/**
 * Lo que escupe un input datetime-local es hora local sin zona, y así lo lee
 * Date. Vacío o ilegible es «sin fecha», que también vale.
 */
export function parseDue(raw: string): number | null {
	const text = raw.trim();
	if (!text) return null;

	const ms = new Date(text).getTime();
	return Number.isFinite(ms) ? ms : null;
}

export function formatDue(due: number) {
	return new Date(due).toLocaleString('es-ES', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	});
}

/** Cómo de cerca está la hora, que es lo que decide el color del recordatorio. */
export type Urgency = 'sin-fecha' | 'vencida' | 'ahora' | 'pronto' | 'lejos';

export function urgencyOf(task: Task, now: number): Urgency {
	if (task.due === null) return 'sin-fecha';

	const left = task.due - now;
	if (left <= 0) return 'vencida';
	if (left < HOUR) return 'ahora';
	if (left < DAY) return 'pronto';
	return 'lejos';
}

/** Un hueco de tiempo en dos unidades como mucho: «3 d 4 h», «12 min». */
export function spanText(ms: number) {
	const total = Math.max(0, Math.round(ms / MINUTE));
	if (total < 1) return 'menos de un minuto';

	const days = Math.floor(total / 1440);
	const hours = Math.floor((total % 1440) / 60);
	const minutes = total % 60;

	if (days > 0) return hours > 0 ? `${days} d ${hours} h` : `${days} d`;
	if (hours > 0) return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
	return `${minutes} min`;
}

/** El recordatorio: cuánto le falta, o cuánto lleva pasada. */
export function reminderText(task: Task, now: number) {
	if (task.due === null) return 'Sin fecha';

	const left = task.due - now;
	return left <= 0 ? `Vencida hace ${spanText(-left)}` : `En ${spanText(left)}`;
}

/**
 * Lo que vence antes, arriba; las que no tienen hora, al final; y entre dos que
 * vencen a la vez manda el nivel. Lo hecho se va abajo del todo.
 */
export function sortTasks(tasks: Task[]) {
	return [...tasks].sort((a, b) => {
		if (a.done !== b.done) return a.done ? 1 : -1;
		if ((a.due === null) !== (b.due === null)) return a.due === null ? 1 : -1;
		if (a.due !== null && b.due !== null && a.due !== b.due) return a.due - b.due;

		const rank = levelOf(b.level).rank - levelOf(a.level).rank;
		return rank !== 0 ? rank : b.at - a.at;
	});
}

export function readTasks(): Task[] {
	try {
		const saved = localStorage.getItem(KEY);
		if (!saved) return [];

		const parsed = JSON.parse(saved) as unknown;
		if (!Array.isArray(parsed)) return [];

		return parsed
			.map((item) => (item && typeof item === 'object' ? toTask(item as Partial<Task>) : ''))
			.filter((item): item is Task => typeof item !== 'string')
			.slice(0, MAX_TASKS);
	} catch {
		// Sin almacenamiento, o con basura dentro: lista vacía y a seguir.
		return [];
	}
}

export function saveTasks(tasks: Task[]) {
	try {
		if (tasks.length === 0) localStorage.removeItem(KEY);
		else localStorage.setItem(KEY, JSON.stringify(tasks));
	} catch {
		// Si no deja guardar, la lista dura lo que dure la visita.
	}
}

/** Si se pidió que el navegador avise cuando una tarea vence. */
export function readAlerts() {
	try {
		return localStorage.getItem(ALERTS_KEY) === 'si';
	} catch {
		return false;
	}
}

export function saveAlerts(on: boolean) {
	try {
		if (on) localStorage.setItem(ALERTS_KEY, 'si');
		else localStorage.removeItem(ALERTS_KEY);
	} catch {
		// Igual que arriba: sin almacenamiento se queda en esta visita.
	}
}
