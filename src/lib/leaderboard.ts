/**
 * El ranking: quién ha empujado más esta web y qué ideas pidió más gente.
 *
 * No hay votos ni tabla nueva: se cuenta solo con lo que ya guarda la base.
 * Cada ventana que cierra reordena el ranking sola, sin que nadie toque nada.
 *
 * Cómo puntúa una idea, según hasta dónde llegó:
 *   - pasa el filtro de la IA .................. 1 punto
 *   - además gana su ventana ................... 5 puntos más
 *   - y además acaba publicada en una versión ... 10 puntos más
 *
 * Las descartadas no restan y las de la ventana abierta todavía no puntúan:
 * están en juego hasta que la ventana cierre.
 */
import { all } from './db/client';

/** Lo que suma cada cosa. Está escrito en la página, así que sale de aquí. */
export const POINTS = { idea: 1, win: 5, shipped: 10 } as const;

/** Se enseña el ranking de los primeros; el resto se resume en una línea. */
export const MAX_ROWS = 50;

/** Las ideas más repetidas que se listan debajo del ranking. */
export const MAX_IDEAS = 6;

export interface RankRow {
	/** El puesto. Con los mismos puntos se comparte puesto. */
	position: number;
	login: string;
	/** Ideas que pasaron el filtro de la IA, ganasen o no. */
	ideas: number;
	/** Las de la ventana abierta: cuentan cuando cierre. */
	pending: number;
	discarded: number;
	/** Ideas que ganaron su ventana. */
	wins: number;
	/** De esas, las que acabaron publicadas. */
	shipped: number;
	points: number;
	/** La primera idea que mandó: desempata a favor de quien llegó antes. */
	firstAt: string;
	me: boolean;
}

export interface TopIdea {
	id: number;
	title: string;
	summary: string;
	/** Cuánta gente pidió lo mismo en aquella ventana. */
	people: number;
	won: boolean;
	shipped: boolean;
}

interface PromptRow {
	userId: number;
	login: string;
	pending: number;
	discarded: number;
	kept: number;
	wins: number;
	firstAt: string;
}

interface ShippedRow {
	userId: number;
	shipped: number;
}

interface ClusterRow {
	id: number;
	title: string;
	summary: string;
	people: number;
	isWinner: number;
	shipped: number;
}

export function getLeaderboardData(userId?: number) {
	// 'pending' es la ventana abierta; 'grouped' y 'selected' ya pasaron el
	// filtro, y 'selected' es además la que ganó.
	const people = all<PromptRow>(
		`SELECT u.id AS userId, u.login,
			sum(CASE WHEN p.status = 'pending' THEN 1 ELSE 0 END) AS pending,
			sum(CASE WHEN p.status = 'discarded' THEN 1 ELSE 0 END) AS discarded,
			sum(CASE WHEN p.status IN ('grouped', 'selected') THEN 1 ELSE 0 END) AS kept,
			sum(CASE WHEN p.status = 'selected' THEN 1 ELSE 0 END) AS wins,
			min(p.created_at) AS firstAt
		 FROM prompts p
		 JOIN users u ON u.id = p.user_id
		 GROUP BY u.id`,
	);

	// Una idea ganadora acaba publicada cuando la funcionalidad de su ventana
	// llega a 'shipped'. Se cuentan versiones, no ideas: si dos personas pidieron
	// lo mismo, las dos se llevan esa versión.
	const shippedRows = all<ShippedRow>(
		`SELECT p.user_id AS userId, count(DISTINCT f.id) AS shipped
		 FROM prompts p
		 JOIN clusters c ON c.id = p.cluster_id AND c.is_winner = 1
		 JOIN features f ON f.cycle_id = c.cycle_id AND f.status = 'shipped'
		 GROUP BY p.user_id`,
	);
	const shippedByUser = new Map(shippedRows.map((row) => [row.userId, row.shipped]));

	const scored = people.map((row) => {
		const shipped = shippedByUser.get(row.userId) ?? 0;
		return {
			login: row.login,
			ideas: row.kept,
			pending: row.pending,
			discarded: row.discarded,
			wins: row.wins,
			shipped,
			points: row.kept * POINTS.idea + row.wins * POINTS.win + shipped * POINTS.shipped,
			firstAt: row.firstAt,
			me: userId !== undefined && row.userId === userId,
		};
	});

	// Manda el puntaje; luego las ganadas, luego las ideas que pasaron y, si aun
	// así empatan, quien llegó antes.
	scored.sort(
		(a, b) =>
			b.points - a.points ||
			b.shipped - a.shipped ||
			b.wins - a.wins ||
			b.ideas - a.ideas ||
			a.firstAt.localeCompare(b.firstAt),
	);

	let position = 0;
	let previous: number | null = null;
	const ranked: RankRow[] = scored.map((row, index) => {
		// Mismos puntos, mismo puesto: el siguiente distinto se salta los empatados.
		if (previous === null || row.points !== previous) position = index + 1;
		previous = row.points;
		return { ...row, position };
	});

	const rows = ranked.slice(0, MAX_ROWS);
	// Si quien mira se ha quedado fuera del corte, se le enseña su fila aparte.
	const me = ranked.find((row) => row.me) ?? null;

	const clusters = all<ClusterRow>(
		`SELECT c.id, c.title, c.summary, c.prompt_count AS people, c.is_winner AS isWinner,
			(SELECT count(*) FROM features f
			 WHERE f.cycle_id = c.cycle_id AND f.status = 'shipped' AND c.is_winner = 1) AS shipped
		 FROM clusters c
		 ORDER BY c.prompt_count DESC, c.id DESC
		 LIMIT ?`,
		MAX_IDEAS,
	);

	const ideas: TopIdea[] = clusters.map((row) => ({
		id: row.id,
		title: row.title,
		summary: row.summary,
		people: row.people,
		won: row.isWinner === 1,
		shipped: row.shipped > 0,
	}));

	return {
		rows,
		ideas,
		me: me && !rows.includes(me) ? me : null,
		totals: {
			people: ranked.length,
			ideas: scored.reduce((sum, row) => sum + row.ideas, 0),
			wins: scored.reduce((sum, row) => sum + row.wins, 0),
			shipped: scored.reduce((sum, row) => sum + row.shipped, 0),
		},
		truncated: Math.max(0, ranked.length - rows.length),
	};
}
