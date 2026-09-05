/*
 * Los votos de la ventana: cuáles de las ideas que hay encima de la mesa te
 * gustaría que ganaran. Como el escaparate o las tareas, no hay servidor
 * detrás: el voto se queda en el navegador de quien lo da. Sirve para ordenar
 * lo que lees y para tener clara tu apuesta antes de que cierre la ventana.
 *
 * Los votos van atados a la ventana en la que se dieron. Cuando abre otra, las
 * ideas son otras y la cuenta empieza de cero sola.
 */

/** Tres votos por ventana: si valieran todas, no valdría ninguna. */
export const MAX_VOTES = 3;

export const VOTES_KEY = 'tuweb:votos';
const ORDER_KEY = 'tuweb:votos-orden';

/** Cómo se lee la lista: por lo que has votado o por hora de llegada. */
export type Order = 'votos' | 'hora';

export interface Votes {
	/** La ventana a la que pertenecen, por su hora de apertura. */
	window: string;
	/** Las ideas votadas, en el orden en que se votaron. */
	ids: number[];
}

export function emptyVotes(window: string): Votes {
	return { window, ids: [] };
}

/**
 * Lo guardado, puesto en limpio. Vale para lo que sale del localStorage, que
 * puede venir tocado a mano o de una versión anterior: si no cuadra la ventana,
 * o si dentro hay cualquier cosa, se empieza de cero.
 */
export function toVotes(raw: unknown, window: string): Votes {
	if (!raw || typeof raw !== 'object') return emptyVotes(window);

	const saved = raw as Partial<Votes>;
	if (saved.window !== window) return emptyVotes(window);

	// Los ids son los de la base: enteros y positivos, lo demás no es un voto.
	const ids = Array.isArray(saved.ids)
		? saved.ids.filter((id) => Number.isInteger(id) && id > 0)
		: [];

	return { window, ids: [...new Set(ids)].slice(0, MAX_VOTES) };
}

export function readVotes(window: string): Votes {
	try {
		const saved = localStorage.getItem(VOTES_KEY);
		return saved ? toVotes(JSON.parse(saved) as unknown, window) : emptyVotes(window);
	} catch {
		// Sin almacenamiento, o con basura dentro: se vota igual, dura la visita.
		return emptyVotes(window);
	}
}

export function saveVotes(votes: Votes) {
	try {
		if (votes.ids.length === 0) localStorage.removeItem(VOTES_KEY);
		else localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
	} catch {
		// Si no deja guardar, los votos duran lo que dure la página abierta.
	}
}

/**
 * Vota o quita el voto. Devuelve el motivo cuando no cabe: quitar siempre se
 * puede, poner solo mientras queden votos.
 */
export function toggleVote(votes: Votes, id: number): Votes | string {
	if (votes.ids.includes(id)) {
		return { ...votes, ids: votes.ids.filter((item) => item !== id) };
	}

	if (votes.ids.length >= MAX_VOTES) {
		return `Ya has repartido tus ${MAX_VOTES} votos. Quita uno para mover el voto.`;
	}

	return { ...votes, ids: [...votes.ids, id] };
}

/** Una idea puede irse de la ventana —editada o descartada— con tu voto puesto. */
export function keepAlive(votes: Votes, alive: number[]): Votes {
	const ids = votes.ids.filter((id) => alive.includes(id));
	return ids.length === votes.ids.length ? votes : { ...votes, ids };
}

export function votesText(used: number) {
	const left = Math.max(0, MAX_VOTES - used);

	if (used === 0) return `Tienes ${MAX_VOTES} votos para esta ventana.`;
	if (left === 0) return `Has repartido tus ${MAX_VOTES} votos. Quita uno para mover el voto.`;

	return `${used} ${used === 1 ? 'idea votada' : 'ideas votadas'} · te ${
		left === 1 ? 'queda 1 voto' : `quedan ${left} votos`
	}.`;
}

export function isOrder(value: unknown): value is Order {
	return value === 'votos' || value === 'hora';
}

export function readOrder(): Order {
	try {
		const saved = localStorage.getItem(ORDER_KEY);
		return isOrder(saved) ? saved : 'votos';
	} catch {
		return 'votos';
	}
}

export function saveOrder(order: Order) {
	try {
		localStorage.setItem(ORDER_KEY, order);
	} catch {
		// Igual que los votos: sin almacenamiento se queda en esta visita.
	}
}
