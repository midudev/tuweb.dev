import { all, get, run, transaction } from './client';

/**
 * Lo que la gente comparte entre sí: chat, destacadas, retos, consejos,
 * escaparate y el ranking del Snake. Cada consulta entra por un índice de
 * schema.ts; la caducidad y los topes los aplica maintenance.ts.
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// ── Chat ────────────────────────────────────────────────────────────────────

export type Room = 'irc' | 'anon';

export const CHAT_TTL_MS: Record<Room, number> = {
	// El canal guarda el día; el anónimo, diez minutos y se acabó.
	irc: DAY,
	anon: 10 * MINUTE,
};

/** Lo que se devuelve de una vez: basta para rellenar la pantalla. */
const CHAT_PAGE = 100;

export interface ChatMessage {
	id: number;
	author: string;
	body: string;
	at: number;
	mine?: boolean;
}

export function isRoom(value: unknown): value is Room {
	return value === 'irc' || value === 'anon';
}

/** Lo posterior a `since`, o lo último si es la primera vez. */
export function chatSince(room: Room, since: number, now = Date.now()) {
	if (since > 0) {
		return all<ChatMessage & { userId: number | null }>(
			`SELECT id, author, body, created_at AS at, user_id AS userId FROM chat_messages
			 WHERE room = ? AND id > ? AND expires_at > ? ORDER BY id LIMIT ${CHAT_PAGE}`,
			room,
			since,
			now,
		);
	}
	return all<ChatMessage & { userId: number | null }>(
		`SELECT * FROM (
			SELECT id, author, body, created_at AS at, user_id AS userId FROM chat_messages
			WHERE room = ? AND expires_at > ? ORDER BY id DESC LIMIT ${CHAT_PAGE}
		) ORDER BY id`,
		room,
		now,
	);
}

export function postChat(room: Room, userId: number | null, author: string, body: string, now = Date.now()) {
	return get<ChatMessage>(
		`INSERT INTO chat_messages (room, user_id, author, body, created_at, expires_at)
		 VALUES (?, ?, ?, ?, ?, ?)
		 RETURNING id, author, body, created_at AS at`,
		room,
		userId,
		author,
		body,
		now,
		now + CHAT_TTL_MS[room],
	);
}

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

export function myHighlightVotes(userId: number) {
	return all<{ id: number }>('SELECT feature_id AS id FROM highlight_votes WHERE user_id = ?', userId).map(
		(row) => row.id,
	);
}

export function isShippedFeature(id: number) {
	return get("SELECT 1 AS ok FROM features WHERE id = ? AND status = 'shipped'", id) !== null;
}

/** Pone o quita el voto. Devuelve si queda votada y cuántos votos lleva. */
export function toggleHighlightVote(featureId: number, userId: number, now = Date.now()) {
	return transaction(() => {
		const removed = run('DELETE FROM highlight_votes WHERE feature_id = ? AND user_id = ?', featureId, userId);
		const voted = Number(removed.changes) === 0;
		if (voted) {
			run('INSERT INTO highlight_votes (feature_id, user_id, created_at) VALUES (?, ?, ?)', featureId, userId, now);
		}
		const { n } = get<{ n: number }>('SELECT count(*) AS n FROM highlight_votes WHERE feature_id = ?', featureId)!;
		return { voted, votes: n };
	});
}

export function highlightComments(featureId: number, userId: number | null) {
	return all<Omit<HighlightComment, 'mine'> & { userId: number }>(
		`SELECT id, feature_id AS idea, alias, body AS text, created_at AS at, user_id AS userId
		 FROM highlight_comments WHERE feature_id = ? ORDER BY id DESC LIMIT 300`,
		featureId,
	).map(({ userId: author, ...comment }) => ({ ...comment, mine: author === userId }));
}

export function addHighlightComment(featureId: number, userId: number, alias: string, text: string, now = Date.now()) {
	return get<Omit<HighlightComment, 'mine'>>(
		`INSERT INTO highlight_comments (feature_id, user_id, alias, body, created_at) VALUES (?, ?, ?, ?, ?)
		 RETURNING id, feature_id AS idea, alias, body AS text, created_at AS at`,
		featureId,
		userId,
		alias,
		text,
		now,
	);
}

export function deleteHighlightComment(id: number, userId: number) {
	return Number(run('DELETE FROM highlight_comments WHERE id = ? AND user_id = ?', id, userId).changes) > 0;
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

export function retosOfWeek(week: number, userId: number | null) {
	return all<Omit<SharedReto, 'mine'> & { userId: number }>(
		`SELECT c.id, c.title, c.detail, c.tema, c.nivel, c.created_at AS at, u.login AS author, c.user_id AS userId
		 FROM challenges c JOIN users u ON u.id = c.user_id
		 WHERE c.week = ? ORDER BY c.id`,
		week,
	).map(({ userId: author, ...reto }) => ({ ...reto, mine: author === userId }));
}

export function countRetos(week: number, userId?: number) {
	return userId === undefined
		? get<{ n: number }>('SELECT count(*) AS n FROM challenges WHERE week = ?', week)!.n
		: get<{ n: number }>('SELECT count(*) AS n FROM challenges WHERE user_id = ? AND week = ?', userId, week)!.n;
}

export function addReto(
	userId: number,
	week: number,
	reto: { title: string; detail: string; tema: string; nivel: string },
	expiresAt: number,
	now = Date.now(),
) {
	return get<{ id: number }>(
		`INSERT INTO challenges (user_id, week, title, detail, tema, nivel, created_at, expires_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
		userId,
		week,
		reto.title,
		reto.detail,
		reto.tema,
		reto.nivel,
		now,
		expiresAt,
	);
}

export function deleteReto(id: number, userId: number) {
	return Number(run('DELETE FROM challenges WHERE id = ? AND user_id = ?', id, userId).changes) > 0;
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

export function sharedTips(userId: number | null, limit = 200) {
	return all<Omit<SharedTip, 'mine'> & { userId: number }>(
		`SELECT t.id, t.category, t.title, t.detail, t.created_at AS at, u.login AS author, t.user_id AS userId
		 FROM tips t JOIN users u ON u.id = t.user_id ORDER BY t.id DESC LIMIT ?`,
		limit,
	).map(({ userId: author, ...tip }) => ({ ...tip, mine: author === userId }));
}

export function countTips(userId: number) {
	return get<{ n: number }>('SELECT count(*) AS n FROM tips WHERE user_id = ?', userId)!.n;
}

export function addTip(userId: number, tip: { category: string; title: string; detail: string }, now = Date.now()) {
	return get<{ id: number }>(
		'INSERT INTO tips (user_id, category, title, detail, created_at) VALUES (?, ?, ?, ?, ?) RETURNING id',
		userId,
		tip.category,
		tip.title,
		tip.detail,
		now,
	);
}

export function deleteTip(id: number, userId: number) {
	return Number(run('DELETE FROM tips WHERE id = ? AND user_id = ?', id, userId).changes) > 0;
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

export function sharedProjects(userId: number | null, limit = 100) {
	return all<Omit<SharedProject, 'mine'> & { userId: number }>(
		`SELECT s.id, s.name, s.url, s.pitch, s.tag, s.created_at AS at, u.login AS author, s.user_id AS userId
		 FROM showcase s JOIN users u ON u.id = s.user_id ORDER BY s.id DESC LIMIT ?`,
		limit,
	).map(({ userId: author, ...project }) => ({ ...project, mine: author === userId }));
}

export function countProjects(userId: number) {
	return get<{ n: number }>('SELECT count(*) AS n FROM showcase WHERE user_id = ?', userId)!.n;
}

export function addProject(
	userId: number,
	project: { name: string; url: string; pitch: string; tag: string },
	now = Date.now(),
) {
	return get<{ id: number }>(
		'INSERT INTO showcase (user_id, name, url, pitch, tag, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
		userId,
		project.name,
		project.url,
		project.pitch,
		project.tag,
		now,
	);
}

export function deleteProject(id: number, userId: number) {
	return Number(run('DELETE FROM showcase WHERE id = ? AND user_id = ?', id, userId).changes) > 0;
}

// ── Ranking del Snake ───────────────────────────────────────────────────────

export interface SnakeScore {
	name: string;
	points: number;
	at: number;
	mine: boolean;
}

export function snakeTop(mode: string, userId: number | null, limit = 10) {
	return all<Omit<SnakeScore, 'mine'> & { userId: number }>(
		`SELECT u.login AS name, s.points, s.created_at AS at, s.user_id AS userId
		 FROM snake_scores s JOIN users u ON u.id = s.user_id
		 WHERE s.mode = ? ORDER BY s.points DESC, s.created_at LIMIT ?`,
		mode,
		limit,
	).map(({ userId: author, ...score }) => ({ ...score, mine: author === userId }));
}

/** Guarda la marca solo si mejora la anterior de esa persona en ese modo. */
export function submitSnakeScore(mode: string, userId: number, points: number, now = Date.now()) {
	const row = get<{ points: number }>(
		`INSERT INTO snake_scores (mode, user_id, points, created_at) VALUES (?, ?, ?, ?)
		 ON CONFLICT (mode, user_id) DO UPDATE SET points = excluded.points, created_at = excluded.created_at
		 WHERE excluded.points > snake_scores.points
		 RETURNING points`,
		mode,
		userId,
		points,
		now,
	);
	return { improved: row !== null };
}
