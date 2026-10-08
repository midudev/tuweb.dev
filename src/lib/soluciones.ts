/*
 * Las soluciones a los retos semanales y sus votos. Como lo hecho, se quedan en
 * tu navegador, semana a semana: cada reto tiene su tablón de soluciones y las
 * que votas suben arriba como destacadas. El lunes, tablón nuevo.
 */

export interface Solucion {
	id: string;
	/** Cómo lo resolviste, en pocas líneas. */
	text: string;
	/** Quién firma. Vacío, anónima. */
	firma: string;
	at: number;
	votada: boolean;
	/** La mejor del reto: solo una por reto y semana, y su firma se lleva la insignia especial. */
	mejor: boolean;
	/** El título del reto al publicarla, para que el muro de la portada sepa a qué responde. */
	reto: string;
}

/** Semana → reto → soluciones. */
export type Soluciones = Record<string, Record<string, Solucion[]>>;

export const TEXT_MAX = 400;
export const FIRMA_MAX = 30;
/** Un tablón por reto, no un foro. */
export const PER_RETO = 20;
/** Las semanas que se guardan: más atrás ya no se ven. */
const WEEKS_KEPT = 8;

const KEY = 'tuweb:retos-soluciones';
const FIRMA_KEY = 'tuweb:retos-firma';

/** La firma con la que publicas: la misma con la que tu perfil reconoce tus insignias. */
export function readFirma() {
	try {
		return clean(localStorage.getItem(FIRMA_KEY) ?? '', FIRMA_MAX).replace(/\n/g, ' ');
	} catch {
		return '';
	}
}

export function saveFirma(firma: string) {
	const limpia = clean(firma, FIRMA_MAX).replace(/\n/g, ' ');
	try {
		if (limpia) localStorage.setItem(FIRMA_KEY, limpia);
		else localStorage.removeItem(FIRMA_KEY);
	} catch {
		// Sin almacenamiento, la firma se escribe cada vez.
	}
	return limpia;
}

function nextId() {
	return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Espacios de más fuera, pero los saltos de línea se respetan (dos como mucho). */
function clean(text: string, max: number) {
	return text
		.replace(/[^\S\n]+/g, ' ')
		.replace(/ *\n */g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim()
		.slice(0, max);
}

function toSolucion(raw: unknown): Solucion | null {
	if (!raw || typeof raw !== 'object') return null;
	const item = raw as Record<string, unknown>;
	if (typeof item.id !== 'string' || !item.id) return null;
	if (typeof item.text !== 'string' || !item.text) return null;

	return {
		id: item.id.slice(0, 32),
		text: clean(item.text, TEXT_MAX),
		firma: typeof item.firma === 'string' ? clean(item.firma, FIRMA_MAX).replace(/\n/g, ' ') : '',
		at: typeof item.at === 'number' && Number.isFinite(item.at) ? item.at : 0,
		votada: item.votada === true,
		mejor: item.mejor === true,
		reto: typeof item.reto === 'string' ? clean(item.reto, 80).replace(/\n/g, ' ') : '',
	};
}

export function readSoluciones(): Soluciones {
	try {
		const saved = localStorage.getItem(KEY);
		if (!saved) return {};

		const parsed = JSON.parse(saved) as unknown;
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

		const todas: Soluciones = {};
		for (const [week, retos] of Object.entries(parsed as Record<string, unknown>)) {
			if (!/^-?\d+$/.test(week) || !retos || typeof retos !== 'object') continue;

			const semana: Record<string, Solucion[]> = {};
			for (const [reto, lista] of Object.entries(retos as Record<string, unknown>)) {
				if (!Array.isArray(lista)) continue;
				const limpias = lista
					.map(toSolucion)
					.filter((item): item is Solucion => item !== null)
					.slice(0, PER_RETO);
				if (limpias.length > 0) semana[reto.slice(0, 48)] = limpias;
			}
			if (Object.keys(semana).length > 0) todas[week] = semana;
		}
		return todas;
	} catch {
		return {};
	}
}

export function saveSoluciones(todas: Soluciones, week: number) {
	// Lo de hace más de WEEKS_KEPT semanas ya no se enseña: fuera.
	const podadas: Soluciones = {};
	for (const [key, semana] of Object.entries(todas)) {
		if (Number(key) > week - WEEKS_KEPT) podadas[key] = semana;
	}

	try {
		if (Object.keys(podadas).length === 0) localStorage.removeItem(KEY);
		else localStorage.setItem(KEY, JSON.stringify(podadas));
	} catch {
		// Sin almacenamiento, las soluciones duran lo que dura la visita.
	}
}

/** Las de un reto: la mejor primero, luego las votadas y, dentro de cada grupo, las nuevas. */
export function solucionesOf(todas: Soluciones, week: number, reto: string): Solucion[] {
	return [...(todas[String(week)]?.[reto] ?? [])].sort((a, b) => {
		if (a.mejor !== b.mejor) return a.mejor ? -1 : 1;
		if (a.votada !== b.votada) return a.votada ? -1 : 1;
		return b.at - a.at;
	});
}

/** Cambia la lista de un reto y devuelve el mapa nuevo, sin tocar el de antes. */
function withLista(todas: Soluciones, week: number, reto: string, lista: Solucion[]): Soluciones {
	const key = String(week);
	const semana = { ...(todas[key] ?? {}) };
	if (lista.length === 0) delete semana[reto];
	else semana[reto] = lista;

	const copia = { ...todas };
	if (Object.keys(semana).length === 0) delete copia[key];
	else copia[key] = semana;
	return copia;
}

/** Publica una solución, o devuelve el motivo por el que no vale. */
export function addSolucion(
	todas: Soluciones,
	week: number,
	reto: string,
	draft: { text?: string; firma?: string; reto?: string },
): Soluciones | string {
	const text = clean(String(draft.text ?? ''), TEXT_MAX);
	if (!text) return 'Cuenta cómo lo resolviste.';

	const lista = todas[String(week)]?.[reto] ?? [];
	if (lista.length >= PER_RETO) return `Este reto ya tiene ${PER_RETO} soluciones. Quita alguna.`;
	if (lista.some((item) => item.text.toLowerCase() === text.toLowerCase()))
		return 'Esa solución ya está publicada.';

	const firma = clean(String(draft.firma ?? ''), FIRMA_MAX).replace(/\n/g, ' ');
	const titulo = clean(String(draft.reto ?? ''), 80).replace(/\n/g, ' ');
	const nueva: Solucion = {
		id: nextId(),
		text,
		firma,
		at: Date.now(),
		votada: false,
		mejor: false,
		reto: titulo,
	};
	return withLista(todas, week, reto, [nueva, ...lista]);
}

export function removeSolucion(todas: Soluciones, week: number, reto: string, id: string) {
	const lista = todas[String(week)]?.[reto] ?? [];
	return withLista(
		todas,
		week,
		reto,
		lista.filter((item) => item.id !== id),
	);
}

export function toggleVoto(todas: Soluciones, week: number, reto: string, id: string) {
	const lista = todas[String(week)]?.[reto] ?? [];
	return withLista(
		todas,
		week,
		reto,
		lista.map((item) => (item.id === id ? { ...item, votada: !item.votada } : item)),
	);
}

/** Elige la mejor de un reto, que quita la corona a la que la tuviera. Otra vez, la quita. */
export function elegirMejor(todas: Soluciones, week: number, reto: string, id: string) {
	const lista = todas[String(week)]?.[reto] ?? [];
	return withLista(
		todas,
		week,
		reto,
		lista.map((item) => ({ ...item, mejor: item.id === id ? !item.mejor : false })),
	);
}

export function mejorDe(todas: Soluciones, week: number, reto: string) {
	return (todas[String(week)]?.[reto] ?? []).find((item) => item.mejor) ?? null;
}

/** Todas las votadas de la semana, con el reto al que responden. */
export function destacadasOf(todas: Soluciones, week: number) {
	return Object.entries(todas[String(week)] ?? {})
		.flatMap(([reto, lista]) =>
			lista.filter((item) => item.votada).map((solucion) => ({ reto, solucion })),
		)
		.sort((a, b) => b.solucion.at - a.solucion.at);
}

/**
 * El muro de la portada: lo que la comunidad ha elegido esta semana. Primero las
 * coronadas, que ganan su reto; luego las votadas por creativas, las nuevas antes.
 */
export function muroOf(todas: Soluciones, week: number, max: number) {
	return Object.entries(todas[String(week)] ?? {})
		.flatMap(([reto, lista]) =>
			lista
				.filter((item) => item.mejor || item.votada)
				.map((solucion) => ({ reto, solucion })),
		)
		.sort((a, b) => {
			if (a.solucion.mejor !== b.solucion.mejor) return a.solucion.mejor ? -1 : 1;
			return b.solucion.at - a.solucion.at;
		})
		.slice(0, max);
}

/** Cuánto lleva elegido la semana, para la línea de debajo del muro. */
export function muroTotal(todas: Soluciones, week: number) {
	return Object.values(todas[String(week)] ?? {}).reduce(
		(suma, lista) => suma + lista.filter((item) => item.mejor || item.votada).length,
		0,
	);
}
