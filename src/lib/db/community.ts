import { all, get } from './client';

/**
 * Lo que la gente compartió entre sí: destacadas, retos, consejos, escaparate
 * y el ranking del Snake. El experimento está parado, así que solo se lee: lo
 * que había al cerrarlo se congela en ficheros estáticos (src/pages/api).
 *
 * Nadie tiene sesión en la web archivada, de ahí que nada sea «mine».
 *
 * El chat no entra: el canal guardaba el día y el anónimo diez minutos, y
 * congelarlo dejaría para siempre lo que se escribió para borrarse.
 */

// ── Destacadas ──────────────────────────────────────────────────────────────

export interface HighlightComment {
	id: number;
	idea: number;
	alias: string;
	text: string;
	at: number;
	mine: boolean;
}

/** Votos y comentarios por idea publicada, en una pasada cada uno. */
export function highlightCounts() {
	const votes = all<{ id: number; n: number }>(
		'SELECT feature_id AS id, count(*) AS n FROM highlight_votes GROUP BY feature_id',
	);
	const comments = all<{ id: number; n: number }>(
		'SELECT feature_id AS id, count(*) AS n FROM highlight_comments GROUP BY feature_id',
	);
	return {
		votes: Object.fromEntries(votes.map((row) => [row.id, row.n])),
		comments: Object.fromEntries(comments.map((row) => [row.id, row.n])),
	};
}

export function shippedFeatureIds() {
	return all<{ id: number }>("SELECT id FROM features WHERE status = 'shipped' ORDER BY id").map((row) => row.id);
}

export function highlightComments(featureId: number): HighlightComment[] {
	return all<Omit<HighlightComment, 'mine'>>(
		`SELECT id, feature_id AS idea, alias, body AS text, created_at AS at
		 FROM highlight_comments WHERE feature_id = ? ORDER BY id DESC LIMIT 300`,
		featureId,
	).map((comment) => ({ ...comment, mine: false }));
}

// ── Retos semanales ─────────────────────────────────────────────────────────

export interface SharedReto {
	id: number;
	title: string;
	detail: string;
	tema: string;
	nivel: string;
	at: number;
	author: string;
	mine: boolean;
}

/** La última semana en la que alguien propuso un reto, si hubo alguna. */
export function lastRetoWeek() {
	return get<{ week: number | null }>('SELECT max(week) AS week FROM challenges')?.week ?? null;
}

export function retosOfWeek(week: number): SharedReto[] {
	return all<Omit<SharedReto, 'mine'>>(
		`SELECT c.id, c.title, c.detail, c.tema, c.nivel, c.created_at AS at, u.login AS author
		 FROM challenges c JOIN users u ON u.id = c.user_id
		 WHERE c.week = ? ORDER BY c.id`,
		week,
	).map((reto) => ({ ...reto, mine: false }));
}

// ── Consejos ────────────────────────────────────────────────────────────────

export interface SharedTip {
	id: number;
	category: string;
	title: string;
	detail: string;
	at: number;
	author: string;
	mine: boolean;
}

export function sharedTips(limit = 200): SharedTip[] {
	return all<Omit<SharedTip, 'mine'>>(
		`SELECT t.id, t.category, t.title, t.detail, t.created_at AS at, u.login AS author
		 FROM tips t JOIN users u ON u.id = t.user_id ORDER BY t.id DESC LIMIT ?`,
		limit,
	).map((tip) => ({ ...tip, mine: false }));
}

// ── Escaparate ──────────────────────────────────────────────────────────────

export interface SharedProject {
	id: number;
	name: string;
	url: string;
	pitch: string;
	tag: string;
	at: number;
	author: string;
	mine: boolean;
}

export function sharedProjects(limit = 100): SharedProject[] {
	return all<Omit<SharedProject, 'mine'>>(
		`SELECT s.id, s.name, s.url, s.pitch, s.tag, s.created_at AS at, u.login AS author
		 FROM showcase s JOIN users u ON u.id = s.user_id ORDER BY s.id DESC LIMIT ?`,
		limit,
	).map((project) => ({ ...project, mine: false }));
}

// ── Ranking del Snake ───────────────────────────────────────────────────────

export interface SnakeScore {
	name: string;
	points: number;
	at: number;
	mine: boolean;
}

/** modo:ritmo, los mismos que el juego (Minigame.astro). */
export const SNAKE_MODES = ['paredes', 'tunel'].flatMap((modo) =>
	['calma', 'normal', 'nervio'].map((ritmo) => `${modo}:${ritmo}`),
);

export function snakeTop(mode: string, limit = 10): SnakeScore[] {
	return all<Omit<SnakeScore, 'mine'>>(
		`SELECT u.login AS name, s.points, s.created_at AS at
		 FROM snake_scores s JOIN users u ON u.id = s.user_id
		 WHERE s.mode = ? ORDER BY s.points DESC, s.created_at LIMIT ?`,
		mode,
		limit,
	).map((score) => ({ ...score, mine: false }));
}
