/*
 * Los retos semanales. Cada lunes el tablero se renueva: tres los pone la casa
 * —del catálogo de aquí abajo, rotando— y los demás los propone la gente desde
 * /api/retos, que es quien dice en qué semana estamos. Lo hecho, los puntos y la
 * racha son de cada uno: eso sí se queda en tu navegador, semana a semana.
 */

/** De qué va el reto. */
export type Tema = 'codigo' | 'diseno' | 'aprender' | 'compartir' | 'orden';

export interface TemaInfo {
	id: Tema;
	label: string;
	/** Un token de global.css, que es de donde salen todos los colores. */
	color: string;
}

export const TEMAS: readonly TemaInfo[] = [
	{ id: 'codigo', label: 'Código', color: 'var(--color-accent)' },
	{ id: 'diseno', label: 'Diseño', color: 'var(--color-mark)' },
	{ id: 'aprender', label: 'Aprender', color: 'var(--color-building)' },
	{ id: 'compartir', label: 'Compartir', color: 'var(--color-heart)' },
	{ id: 'orden', label: 'Orden', color: 'var(--color-ok)' },
];

/** Cuánto cuesta, que es también lo que suma al hacerlo. */
export type Nivel = 'suave' | 'medio' | 'duro';

export const NIVELES: readonly { id: Nivel; label: string; points: number }[] = [
	{ id: 'suave', label: 'Suave', points: 1 },
	{ id: 'medio', label: 'Medio', points: 2 },
	{ id: 'duro', label: 'Duro', points: 3 },
];

export interface Reto {
	id: string;
	title: string;
	/** Qué cuenta como hecho, en una línea. */
	detail: string;
	tema: Tema;
	nivel: Nivel;
	at: number;
	/** Los de la casa no se quitan: solo se hacen. */
	house: boolean;
	/** El login de quien lo propuso. Los de la casa no llevan. */
	author?: string;
	/** Propuesto por ti: es el único que puedes quitar. */
	mine?: boolean;
	/** El id del servidor, para borrarlo. */
	apiId?: number;
}

export const TITLE_MAX = 70;
export const DETAIL_MAX = 140;
/** Un tablero de la semana, no una lista infinita: la casa y la gente, juntos. */
export const MAX_RETOS = 24;
/** Los que puede proponer cada persona en una semana. Lo vigila el servidor. */
export const PER_PERSON = 3;
/** Cuántos pone la casa cada semana. */
export const HOUSE_COUNT = 3;

const DONE_KEY = 'tuweb:retos-hechos';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const WEEK = 7 * DAY;

/** El catálogo de la casa: de aquí salen los tres retos de cada semana. */
export const CATALOGO: readonly Omit<Reto, 'at' | 'house'>[] = [
	{
		id: 'muerto',
		title: 'Borra código muerto',
		detail: 'Busca una función que ya no llama nadie y quítala del proyecto.',
		tema: 'codigo',
		nivel: 'suave',
	},
	{
		id: 'test',
		title: 'Un test para el bug de siempre',
		detail: 'Ese fallo que vuelve cada mes: escríbele la prueba que lo caza.',
		tema: 'codigo',
		nivel: 'medio',
	},
	{
		id: 'perfil',
		title: 'Perfila lo que va lento',
		detail: 'Mide antes, cambia una sola cosa y vuelve a medir. Sin adivinar.',
		tema: 'codigo',
		nivel: 'duro',
	},
	{
		id: 'contraste',
		title: 'Mide el contraste',
		detail: 'Coge los colores de tu web y comprueba que el texto llega a 4.5:1.',
		tema: 'diseno',
		nivel: 'suave',
	},
	{
		id: 'teclado',
		title: 'Navega tu web con el teclado',
		detail: 'Sin ratón, de arriba abajo, y apunta lo que no se puede alcanzar.',
		tema: 'diseno',
		nivel: 'medio',
	},
	{
		id: 'movil',
		title: 'Ábrelo en un móvil de verdad',
		detail: 'No en el simulador: en un teléfono, y arregla lo que chirríe.',
		tema: 'diseno',
		nivel: 'medio',
	},
	{
		id: 'atajos',
		title: 'Aprende tres atajos',
		detail: 'Tres del editor que no uses nunca, y tíralos toda la semana.',
		tema: 'aprender',
		nivel: 'suave',
	},
	{
		id: 'explica',
		title: 'Explica tu proyecto en cinco líneas',
		detail: 'A alguien que no programa. Si no se entiende, el problema no es suyo.',
		tema: 'aprender',
		nivel: 'medio',
	},
	{
		id: 'sinia',
		title: 'Una jornada sin autocompletado',
		detail: 'Apaga la IA un día entero y escribe el código a mano.',
		tema: 'aprender',
		nivel: 'duro',
	},
	{
		id: 'idea',
		title: 'Propón una idea aquí',
		detail: 'Mira qué le falta a esta web y mándalo antes de que cierre la ventana.',
		tema: 'compartir',
		nivel: 'suave',
	},
	{
		id: 'revision',
		title: 'Revisa el código de otra persona',
		detail: 'Una revisión de verdad, con preguntas, no un «lgtm» y a otra cosa.',
		tema: 'compartir',
		nivel: 'medio',
	},
	{
		id: 'ramas',
		title: 'Limpia las ramas viejas',
		detail: 'Borra las que ya están fusionadas: el repositorio no es un archivo.',
		tema: 'orden',
		nivel: 'suave',
	},
];

/** Espacios de más fuera y nada de saltos de línea: cada campo es una línea. */
function oneLine(text: string, max: number) {
	return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

export function isTema(value: unknown): value is Tema {
	return typeof value === 'string' && TEMAS.some((item) => item.id === value);
}

export function isNivel(value: unknown): value is Nivel {
	return typeof value === 'string' && NIVELES.some((item) => item.id === value);
}

export function temaOf(tema: Tema) {
	return TEMAS.find((item) => item.id === tema) ?? TEMAS[0];
}

export function nivelOf(nivel: Nivel) {
	return NIVELES.find((item) => item.id === nivel) ?? NIVELES[1];
}

export function nextId() {
	return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** El lunes de esa fecha, a las cero horas de aquí: la semana es la de tu calendario. */
export function weekStart(now: number) {
	const date = new Date(now);
	date.setHours(0, 0, 0, 0);
	// getDay pone el domingo primero; aquí la semana empieza el lunes.
	date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
	return date.getTime();
}

/** El lunes siguiente. Se salta ocho días para que el cambio de hora no descuadre. */
export function nextWeekStart(start: number) {
	return weekStart(start + 8 * DAY);
}

/** El número de la semana: su identidad y lo que rota los retos de la casa. */
export function weekIndex(start: number) {
	// El 5 de enero de 1970 fue lunes. El redondeo se come el cambio de hora.
	return Math.round((start - Date.UTC(1970, 0, 5)) / WEEK);
}

/** «Del 7 al 13 de septiembre», que es como se dice una semana. */
export function weekLabel(start: number) {
	const inicio = new Date(start);
	const fin = new Date(nextWeekStart(start) - DAY);

	// Dentro del mismo mes, el mes se dice una sola vez y al final.
	const desde =
		inicio.getMonth() === fin.getMonth()
			? inicio.toLocaleDateString('es-ES', { day: 'numeric' })
			: inicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });

	return `Del ${desde} al ${fin.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`;
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

/** Los tres de la casa de una semana: el catálogo entero, rotando sin repetir. */
export function houseRetos(week: number): Reto[] {
	const total = CATALOGO.length;
	// El módulo de una semana negativa saldría negativo: se le da la vuelta.
	const offset = (((week * HOUSE_COUNT) % total) + total) % total;

	return Array.from({ length: HOUSE_COUNT }, (_, index) => {
		const item = CATALOGO[(offset + index) % total];
		return { ...item, id: `casa-${item.id}`, at: 0, house: true };
	});
}

/**
 * Un reto a partir de lo escrito en el formulario, o el motivo por el que no
 * vale. Es la primera criba: la que manda es la del servidor.
 */
export function toReto(draft: Partial<Record<keyof Reto, unknown>>): Reto | string {
	const title = oneLine(String(draft.title ?? ''), TITLE_MAX);
	if (!title) return 'Ponle título al reto.';

	const detail = oneLine(String(draft.detail ?? ''), DETAIL_MAX);
	if (!detail) return 'Cuenta en una línea qué cuenta como hecho.';

	const tema = isTema(draft.tema) ? draft.tema : 'codigo';
	const nivel = isNivel(draft.nivel) ? draft.nivel : 'medio';
	const at = typeof draft.at === 'number' && Number.isFinite(draft.at) ? draft.at : Date.now();
	const id = typeof draft.id === 'string' && draft.id ? draft.id.slice(0, 32) : nextId();

	// Lo de la casa lo pone el catálogo, no el formulario: aquí nunca entra.
	return { id, title, detail, tema, nivel, at, house: false };
}

/**
 * Un reto tal como llega de /api/retos, o null si viene raro. El id se prefija
 * con «gente-» para que lo hecho no choque con los de la casa, que van con
 * «casa-».
 */
export function fromApi(raw: unknown): Reto | null {
	if (!raw || typeof raw !== 'object') return null;
	const item = raw as Record<string, unknown>;

	if (typeof item.id !== 'number' || !Number.isInteger(item.id)) return null;
	if (typeof item.title !== 'string' || !item.title) return null;
	if (!isTema(item.tema) || !isNivel(item.nivel)) return null;

	return {
		id: `gente-${item.id}`,
		apiId: item.id,
		title: item.title,
		detail: typeof item.detail === 'string' ? item.detail : '',
		tema: item.tema,
		nivel: item.nivel,
		at: typeof item.at === 'number' ? item.at : 0,
		house: false,
		author: typeof item.author === 'string' ? item.author : '',
		mine: item.mine === true,
	};
}

/** Lo hecho, semana a semana: la clave es el número de semana. */
export type Done = Record<string, string[]>;

export function readDone(): Done {
	try {
		const saved = localStorage.getItem(DONE_KEY);
		if (!saved) return {};

		const parsed = JSON.parse(saved) as unknown;
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

		const done: Done = {};
		for (const [week, ids] of Object.entries(parsed as Record<string, unknown>)) {
			if (!/^-?\d+$/.test(week) || !Array.isArray(ids)) continue;
			const limpias = ids.filter((id): id is string => typeof id === 'string').slice(0, MAX_RETOS);
			if (limpias.length > 0) done[week] = limpias;
		}
		return done;
	} catch {
		return {};
	}
}

export function saveDone(done: Done) {
	try {
		if (Object.keys(done).length === 0) localStorage.removeItem(DONE_KEY);
		else localStorage.setItem(DONE_KEY, JSON.stringify(done));
	} catch {
		// Igual que el tablero: sin almacenamiento se queda en esta visita.
	}
}

export function isDone(done: Done, week: number, id: string) {
	return (done[String(week)] ?? []).includes(id);
}

/** Marca o desmarca un reto de una semana y devuelve el mapa nuevo. */
export function toggleDone(done: Done, week: number, id: string): Done {
	const key = String(week);
	const ids = done[key] ?? [];
	const next = ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];

	const copia = { ...done };
	if (next.length === 0) delete copia[key];
	else copia[key] = next;
	return copia;
}

/** Los puntos de una semana, contando solo los retos que siguen en el tablero. */
export function pointsOf(retos: Reto[], done: Done, week: number) {
	return retos
		.filter((reto) => isDone(done, week, reto.id))
		.reduce((suma, reto) => suma + nivelOf(reto.nivel).points, 0);
}

/**
 * La racha: semanas seguidas con al menos un reto hecho. La de ahora no la
 * rompe aunque siga vacía, que todavía no ha terminado.
 */
export function streakOf(done: Done, week: number) {
	let racha = 0;
	let cursor = (done[String(week)]?.length ?? 0) > 0 ? week : week - 1;

	while ((done[String(cursor)]?.length ?? 0) > 0) {
		racha += 1;
		cursor -= 1;
	}
	return racha;
}
